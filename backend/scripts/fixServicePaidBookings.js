const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const ServiceBooking = require('../models/ServiceBooking');
const { settleBooking } = require('../utils/settlementHelper');

async function fixServicePaidBookings() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI or MONGODB_URI not found in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find all service bookings that are completed and paid
    const bookingsToSettle = await ServiceBooking.find({
      status: 'completed',
      paymentStatus: 'paid'
    });

    console.log(`📊 Found ${bookingsToSettle.length} completed & paid service bookings to process.\n`);

    for (const booking of bookingsToSettle) {
      console.log(`⏳ Resetting and recalculating settlement for ${booking.bookingNumber}...`);
      try {
        // Reset status to allow recalculation
        booking.settlementStatus = 'unsettled';
        booking.settlementDetails = undefined;
        await booking.save();

        const updatedBooking = await settleBooking(booking._id, 'service');
        console.log(`✅ Settled ${booking.bookingNumber}. Status: ${updatedBooking.settlementStatus}, Amount: ₹${updatedBooking.settlementDetails?.amount}`);
      } catch (err) {
        console.error(`❌ Failed to settle ${booking.bookingNumber}:`, err.message);
      }
      console.log('--------------------------------------------------\n');
    }

    // Print final verification status of all completed and paid service bookings
    const completedPaid = await ServiceBooking.find({
      status: 'completed',
      paymentStatus: 'paid'
    }).populate('vendor', 'name email');

    console.log('\n📊 VERIFICATION OF ALL COMPLETED & PAID SERVICE BOOKINGS:');
    completedPaid.forEach((b, i) => {
      console.log(`${i + 1}. Booking: ${b.bookingNumber}`);
      console.log(`   Vendor: ${b.vendor?.name} (${b.vendor?.email})`);
      console.log(`   Total Paid: ₹${b.pricing?.total || b.amount}`);
      console.log(`   Coupon: ${b.coupon?.code || 'None'} (Vendor Sponsored: ${b.coupon?.isVendorSponsored ?? 'N/A'}, Discount: ₹${b.coupon?.discountAmount || 0})`);
      console.log(`   Settlement Status: ${b.settlementStatus}`);
      console.log(`   Settlement Details:`, JSON.stringify(b.settlementDetails));
      console.log('--------------------------------------------------');
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ General Error:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

fixServicePaidBookings();
