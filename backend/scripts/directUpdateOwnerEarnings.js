const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Booking = require('../models/Booking');

async function directUpdateOwnerEarnings() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI or MONGODB_URI not found in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all paid bookings
    const paidBookings = await Booking.find({ paymentStatus: 'paid' })
      .select('_id bookingNumber amount priceBreakdown')
      .lean();

    console.log(`📊 Found ${paidBookings.length} PAID bookings\n`);

    let updated = 0;

    // Direct MongoDB update - bypasses Mongoose middleware
    for (const booking of paidBookings) {
      // Calculate owner earnings
      let ownerEarnings = 0;

      if (booking.priceBreakdown?.platformFeeTotal !== undefined) {
        ownerEarnings = (booking.amount || 0) - (booking.priceBreakdown.platformFeeTotal || 0);
      } else if (booking.priceBreakdown?.subtotal) {
        ownerEarnings = booking.priceBreakdown.subtotal;
      } else {
        ownerEarnings = booking.amount || 0;
      }

      ownerEarnings = Math.max(0, Math.round(ownerEarnings));

      // Direct update using updateOne (bypasses pre-save hook)
      const result = await Booking.updateOne(
        { _id: booking._id },
        { $set: { ownerEarnings: ownerEarnings } }
      );

      if (result.modifiedCount > 0) {
        updated++;
        console.log(`✓ ${booking.bookingNumber}`);
        console.log(`  Amount: ₹${booking.amount}`);
        console.log(`  Platform Fee: ₹${booking.priceBreakdown?.platformFeeTotal || 0}`);
        console.log(`  Owner Earnings: ₹${ownerEarnings}\n`);
      }
    }

    console.log(`\n✅ Direct Update Complete!`);
    console.log(`   Updated: ${updated} bookings`);

    // Verify
    console.log('\n🔍 Verifying...');
    const verifyBookings = await Booking.find({ paymentStatus: 'paid' })
      .select('bookingNumber ownerEarnings')
      .lean();
    
    console.log(`\nPaid Bookings After Update:`);
    let total = 0;
    verifyBookings.forEach((b, i) => {
      console.log(`${i + 1}. ${b.bookingNumber}: ₹${b.ownerEarnings || 0}`);
      total += (b.ownerEarnings || 0);
    });
    
    console.log(`\n💰 Total Owner Earnings: ₹${total}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

directUpdateOwnerEarnings();
