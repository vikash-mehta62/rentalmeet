const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Booking = require('../models/Booking');

async function checkOwnerEarnings() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI or MONGODB_URI not found in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check all bookings with paid status
    const paidBookings = await Booking.find({ paymentStatus: 'paid' })
      .select('bookingNumber amount paymentStatus ownerEarnings priceBreakdown')
      .lean();

    console.log(`📊 Found ${paidBookings.length} PAID bookings:\n`);

    let totalOwnerEarnings = 0;

    paidBookings.forEach((b, i) => {
      const platformFeeTotal = b.priceBreakdown?.platformFeeTotal || 0;
      const expectedOwnerEarnings = (b.amount || 0) - platformFeeTotal;
      
      console.log(`${i + 1}. ${b.bookingNumber}`);
      console.log(`   Amount: ₹${b.amount}`);
      console.log(`   Platform Fee: ₹${platformFeeTotal}`);
      console.log(`   Owner Earnings (DB): ₹${b.ownerEarnings || 0}`);
      console.log(`   Expected: ₹${expectedOwnerEarnings}`);
      console.log(`   Status: ${b.ownerEarnings > 0 ? '✓ SET' : '✗ MISSING'}\n`);
      
      totalOwnerEarnings += (b.ownerEarnings || 0);
    });

    console.log(`\n💰 Total Owner Earnings from DB: ₹${totalOwnerEarnings}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOwnerEarnings();
