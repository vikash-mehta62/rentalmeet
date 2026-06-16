require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');

async function checkVenueEarnings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check completed bookings
    const completedBookings = await Booking.find({ status: 'completed' })
      .populate('venue', 'businessName')
      .select('bookingNumber venue amount ownerEarnings status priceBreakdown');
    
    console.log(`📊 Completed Bookings: ${completedBookings.length}\n`);
    
    if (completedBookings.length === 0) {
      console.log('⚠️  No completed bookings found!');
      console.log('📌 To populate venue earnings:');
      console.log('   1. Go to Owner/Admin bookings page');
      console.log('   2. Mark a booking as "completed" (must be after event date/time)');
      console.log('   3. The venue totalEarnings will automatically update\n');
    } else {
      completedBookings.forEach(b => {
        console.log(`✓ ${b.bookingNumber}`);
        console.log(`  Venue: ${b.venue?.businessName || 'N/A'}`);
        console.log(`  Amount: ₹${b.amount}`);
        console.log(`  Owner Earnings: ₹${b.ownerEarnings}`);
        console.log(`  Platform Fee Total: ₹${b.priceBreakdown?.platformFeeTotal || 0}\n`);
      });
    }

    // Check venues
    const venues = await Venue.find({}).select('businessName totalEarnings totalBookings rating');
    console.log(`\n📍 Venues with Earnings:\n`);
    venues.forEach(v => {
      if (v.totalEarnings > 0 || v.totalBookings > 0) {
        console.log(`✓ ${v.businessName}`);
        console.log(`  Total Bookings: ${v.totalBookings}`);
        console.log(`  Total Earnings: ₹${v.totalEarnings}`);
        console.log(`  Rating: ${v.rating || 'N/A'}\n`);
      }
    });

    const venuesWithZeroEarnings = venues.filter(v => v.totalEarnings === 0 && v.totalBookings === 0);
    if (venuesWithZeroEarnings.length > 0) {
      console.log(`\n⚠️  ${venuesWithZeroEarnings.length} venues have zero earnings (no completed bookings yet)\n`);
    }

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkVenueEarnings();
