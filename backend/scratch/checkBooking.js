const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const Booking = require('../models/Booking');

async function checkBooking() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const booking = await Booking.findOne({
      bookingNumber: 'MPBPL26VN000075'
    });

    if (!booking) {
      console.log('No booking found matching MPBPL26VN000075');
      return;
    }

    console.log({
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      amount: booking.amount,
      ownerEarnings: booking.ownerEarnings,
      priceBreakdown: booking.priceBreakdown,
      coupon: booking.coupon,
      settlementStatus: booking.settlementStatus,
      settlementDetails: booking.settlementDetails
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

checkBooking();
