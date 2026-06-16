const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const User = require('../models/User');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');

async function listBookings() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const bookings = await Booking.find({ paymentStatus: 'paid' }).populate('venue');
    console.log(`Total paid bookings: ${bookings.length}`);

    bookings.forEach(b => {
      console.log(`Booking #${b.bookingNumber}`);
      console.log(`  Status: ${b.status}`);
      console.log(`  Amount: ${b.amount}`);
      console.log(`  OwnerEarnings: ${b.ownerEarnings}`);
      console.log(`  PlatformFeeTotal: ${b.priceBreakdown?.platformFeeTotal}`);
      console.log(`  PlatformFee: ${b.priceBreakdown?.platformFee}`);
      console.log(`  PlatformFeeGST: ${b.priceBreakdown?.platformFeeGST}`);
      console.log(`  Venue CGST/SGST: ${b.priceBreakdown?.gst}`);
      console.log(`  Subtotal: ${b.priceBreakdown?.subtotal}`);
      console.log(`  Discount: ${b.priceBreakdown?.discount}`);
      console.log(`  SettlementStatus: ${b.settlementStatus}`);
      console.log('---');
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

listBookings();
