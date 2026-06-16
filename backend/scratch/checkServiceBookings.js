const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const User = require('../models/User');
const ServiceBooking = require('../models/ServiceBooking');

async function checkServiceBookings() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const bookings = await ServiceBooking.find({}).populate('vendor', 'name email');
    console.log(`Total service bookings: ${bookings.length}`);

    bookings.forEach(b => {
      console.log({
        bookingNumber: b.bookingNumber,
        status: b.status,
        paymentStatus: b.paymentStatus,
        amount: b.amount,
        pricing: b.pricing,
        coupon: b.coupon,
        settlementStatus: b.settlementStatus,
        settlementDetails: b.settlementDetails
      });
      console.log('---');
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

checkServiceBookings();
