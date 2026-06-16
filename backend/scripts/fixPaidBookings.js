const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Booking = require('../models/Booking');

async function fixPaidBookings() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI or MONGODB_URI not found in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const paidBookings = await Booking.find({
      paymentStatus: 'paid'
    }).lean();

    console.log(`📊 Found ${paidBookings.length} PAID bookings to update\n`);

    let updated = 0;
    let skipped = 0;

    for (const booking of paidBookings) {
      const pb = booking.priceBreakdown || {};

      const totalPaid = Number(
        booking.amount ||
        pb.total ||
        0
      );

      const platformFee = Number(pb.platformFee || 0);
      const platformFeeGST = Number(pb.platformFeeGST || 0);

      const platformFeeTotal = Number(
        pb.platformFeeTotal ||
        platformFee + platformFeeGST
      );

      const ownerEarnings = Math.round(
        Math.max(0, totalPaid - platformFeeTotal)
      );

      const oldOwnerEarnings = Number(booking.ownerEarnings || 0);
      const oldSettlementAmount = Number(booking.settlementDetails?.amount || 0);

      const updateData = {
        ownerEarnings
      };

      if (booking.settlementDetails) {
        updateData['settlementDetails.amount'] = ownerEarnings;

        if (
          booking.settlementDetails.remarks &&
          booking.settlementDetails.remarks.includes('Payout of ₹')
        ) {
          updateData['settlementDetails.remarks'] =
            booking.settlementDetails.remarks.replace(
              /Payout of ₹[\d,.]+/,
              `Payout of ₹${ownerEarnings.toFixed(2)}`
            );
        }
      }

      const needsUpdate =
        oldOwnerEarnings !== ownerEarnings ||
        (booking.settlementDetails && oldSettlementAmount !== ownerEarnings);

      if (needsUpdate) {
        await Booking.updateOne(
          { _id: booking._id },
          { $set: updateData }
        );

        updated++;

        console.log(`✓ ${booking.bookingNumber}`);
        console.log(`  Total Paid: ₹${totalPaid}`);
        console.log(`  Platform Fee: ₹${platformFee}`);
        console.log(`  Platform GST: ₹${platformFeeGST}`);
        console.log(`  Platform Total: ₹${platformFeeTotal}`);
        console.log(`  Old Owner Earnings: ₹${oldOwnerEarnings}`);
        console.log(`  New Owner Earnings: ₹${ownerEarnings}`);
        console.log(`  Old Settlement Amount: ₹${oldSettlementAmount}`);
        console.log(`  New Settlement Amount: ₹${booking.settlementDetails ? ownerEarnings : 0}\n`);
      } else {
        skipped++;

        console.log(`- ${booking.bookingNumber} skipped`);
        console.log(`  Already correct: ₹${ownerEarnings}\n`);
      }
    }

    console.log(`\n✅ Fix Complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);

    console.log('\n🔍 Verifying with fresh query...');

    const verifyBookings = await Booking.find({ paymentStatus: 'paid' })
      .select('bookingNumber amount ownerEarnings settlementDetails.amount priceBreakdown.platformFeeTotal')
      .lean();

    console.log(`\nPaid Bookings in Database:`);

    verifyBookings.forEach((b, i) => {
      console.log(
        `${i + 1}. ${b.bookingNumber}: amount=₹${b.amount || 0}, platformFeeTotal=₹${b.priceBreakdown?.platformFeeTotal || 0}, ownerEarnings=₹${b.ownerEarnings || 0}, settlementAmount=₹${b.settlementDetails?.amount || 0}`
      );
    });

    const totalOwnerEarnings = verifyBookings.reduce(
      (sum, b) => sum + Number(b.ownerEarnings || 0),
      0
    );

    console.log(`\n💰 Total Owner Earnings (verified): ₹${totalOwnerEarnings}`);

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
}

fixPaidBookings();