const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Booking = require('../models/Booking');

async function forceRecalculateAllVenueEarnings() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI or MONGODB_URI not found in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const paidBookings = await Booking.find({ paymentStatus: 'paid' });
    console.log(`📊 Found ${paidBookings.length} paid venue bookings to process.\n`);

    let updatedCount = 0;

    for (const booking of paidBookings) {
      if (booking.priceBreakdown) {
        const subtotal = booking.priceBreakdown.subtotal || 0;
        const gst = booking.priceBreakdown.gst || 0;
        const discount = booking.priceBreakdown.discount || 0;
        const newEarnings = Math.round(Math.max(0, subtotal + gst - discount));

        const oldEarnings = booking.ownerEarnings;
        booking.ownerEarnings = newEarnings;

        if (booking.settlementDetails) {
          booking.settlementDetails.amount = newEarnings;
          
          if (booking.settlementDetails.remarks && booking.settlementDetails.remarks.includes('Payout of ₹')) {
            booking.settlementDetails.remarks = booking.settlementDetails.remarks.replace(
              /Payout of ₹[\d,.]+/,
              `Payout of ₹${newEarnings.toFixed(2)}`
            );
          }
        }

        if (oldEarnings !== newEarnings) {
          console.log(`🔄 Updating ${booking.bookingNumber}:`);
          console.log(`   Subtotal: ₹${subtotal}, GST: ₹${gst}, Discount: ₹${discount}`);
          console.log(`   Old Earnings: ₹${oldEarnings} ➔ New Earnings: ₹${newEarnings}`);
          updatedCount++;
        }

        await booking.save();
      }
    }

    console.log(`\n✅ Finished updating venue earnings. Updated: ${updatedCount} bookings.`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

forceRecalculateAllVenueEarnings();
