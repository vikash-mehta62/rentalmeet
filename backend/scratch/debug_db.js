require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const VenueReview = require('../models/VenueReview');

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const totalBookingsCount = await Booking.countDocuments();
    console.log('Total bookings in DB:', totalBookingsCount);

    const bookings = await Booking.find({});
    console.log('\n--- Bookings List ---');
    bookings.forEach(b => {
      console.log(`Booking #${b.bookingNumber} - Status: ${b.status}, PaymentStatus: ${b.paymentStatus}, VenueId: ${b.venue}, Amount: ${b.amount}, OwnerEarnings: ${b.ownerEarnings}`);
    });

    const reviews = await VenueReview.find({});
    console.log('\nTotal venue reviews in DB:', reviews.length);
    reviews.forEach(r => {
      console.log(`Review - Rating: ${r.rating}, VenueId: ${r.venue}`);
    });

    const venues = await Venue.find({});
    console.log('\n--- Venues List ---');
    venues.forEach(v => {
      console.log(`Venue: ${v.businessName} - ID: ${v._id}, totalBookings: ${v.totalBookings}, totalEarnings: ${v.totalEarnings}, rating: ${v.rating}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

debug();
