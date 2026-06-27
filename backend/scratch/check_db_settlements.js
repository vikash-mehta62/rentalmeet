const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Booking = require('../models/Booking');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rentalmeet');
    console.log('Connected to MongoDB');

    const bookingNumbers = [
      'MPBPL26VN000085',
      'MPBPL26VN000083',
      'MPBPL26VN000076',
      'MPBPL26VN000075'
    ];

    const bookings = await Booking.find({ bookingNumber: { $in: bookingNumbers } });
    console.log(`Found ${bookings.length} bookings:`);

    bookings.forEach(b => {
      console.log({
        bookingNumber: b.bookingNumber,
        status: b.status,
        paymentStatus: b.paymentStatus,
        settlementStatus: b.settlementStatus,
        settlementDetails: b.settlementDetails
      });
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
