const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const Booking = require('../models/Booking');

async function fixSettlement() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const booking = await Booking.findOne({ bookingNumber: 'MPBPL26VN000075' });
    if (!booking) {
      console.log('Booking MPBPL26VN000075 not found.');
      return;
    }

    console.log('Original settlementDetails:', booking.settlementDetails);

    booking.settlementDetails.amount = 36680;
    booking.settlementDetails.remarks = '[SIMULATION] Payout of ₹36680.00 automatically settled to 1234567890 (VIkash, A/C: ...7890, IFSC: SBIN0001234).';

    await booking.save();
    console.log('Updated settlementDetails:', booking.settlementDetails);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
    console.log('DB connection closed');
  }
}

fixSettlement();
