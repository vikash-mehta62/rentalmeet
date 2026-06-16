const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Booking = require('../models/Booking');

async function backfillOwnerEarnings() {
  try {
    // Check if MONGO_URI or MONGODB_URI is loaded
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI or MONGODB_URI not found in .env file');
      console.log('Please check your .env file in the backend folder');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all bookings where ownerEarnings is missing or 0
    const bookings = await Booking.find({
      $or: [
        { ownerEarnings: { $exists: false } },
        { ownerEarnings: 0 },
        { ownerEarnings: null }
      ]
    });

    console.log(`\n📊 Found ${bookings.length} bookings to update\n`);

    let updated = 0;
    let skipped = 0;

    for (const booking of bookings) {
      let ownerEarnings = 0;

      // Simple logic: Owner Earnings = Total Amount - Platform Fee (incl. GST)
      if (booking.priceBreakdown?.platformFeeTotal) {
        ownerEarnings = (booking.amount || 0) - booking.priceBreakdown.platformFeeTotal;
      }
      // Fallback: Use subtotal if available
      else if (booking.priceBreakdown?.subtotal) {
        ownerEarnings = booking.priceBreakdown.subtotal;
      }
      // Final fallback: Use full amount
      else {
        ownerEarnings = booking.amount || 0;
      }

      if (ownerEarnings >= 0) {
        booking.ownerEarnings = Math.round(ownerEarnings);
        await booking.save({ validateBeforeSave: false });
        updated++;
        console.log(`✓ Booking ${booking.bookingNumber}: Amount ₹${booking.amount} - Platform Fee ₹${booking.priceBreakdown?.platformFeeTotal || 0} = Owner ₹${ownerEarnings.toFixed(2)}`);
      } else {
        skipped++;
        console.log(`⊗ Booking ${booking.bookingNumber}: Negative earnings (amount: ${booking.amount})`);
      }
    }

    console.log(`\n✅ Backfill Complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

backfillOwnerEarnings();
