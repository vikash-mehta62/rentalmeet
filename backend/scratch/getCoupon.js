const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const Coupon = require('../models/Coupon');

async function getCoupon() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const coupon = await Coupon.findOne({ code: 'A2' });
    console.log('Coupon A2 details:', JSON.stringify(coupon, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

getCoupon();
