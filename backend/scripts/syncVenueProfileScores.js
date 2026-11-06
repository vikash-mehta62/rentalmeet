const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Venue = require('../models/Venue');

async function syncAllVenues() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not found in env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    const venues = await Venue.find({});
    console.log(`Found ${venues.length} venues in database.`);

    let verifiedCount = 0;
    let infoCount = 0;
    let noPriceCount = 0;

    for (const venue of venues) {
      const vObj = venue.toObject();
      const { profileCompletion, isVerified } = Venue.calculateProfileCompletion(vObj);

      const p = vObj.pricing || {};
      const hasPricing = Boolean(
        (p.perHour && (Number(p.perHour.weekday) > 0 || Number(p.perHour.weekend) > 0)) ||
        (p.halfDay && (Number(p.halfDay.weekday) > 0 || Number(p.halfDay.weekend) > 0)) ||
        (p.fullDay && (Number(p.fullDay.weekday) > 0 || Number(p.fullDay.weekend) > 0)) ||
        (p.onlyRent?.hourly?.rate > 0 || p.onlyRent?.halfDay?.rate > 0 || p.onlyRent?.fullDay?.rate > 0) ||
        (p.rentWithAmenities?.hourly?.rate > 0 || p.rentWithAmenities?.halfDay?.rate > 0 || p.rentWithAmenities?.fullDay?.rate > 0) ||
        (p.perPax && Object.values(p.perPax).some(pkg => Number(pkg?.rate) > 0)) ||
        (Number(vObj.startingPrice) > 0)
      );

      if (!hasPricing) noPriceCount++;
      if (isVerified) verifiedCount++;
      else infoCount++;

      await Venue.findByIdAndUpdate(venue._id, {
        $set: {
          profileCompletion,
          isVerified
        }
      });

      console.log(`- [${venue.businessName || 'Unnamed'}] (City: ${venue.location?.city || 'N/A'}): Pricing: ${hasPricing ? 'YES' : 'NO'}, Score: ${profileCompletion}%, Status: ${isVerified ? 'VERIFIED' : 'INFO'}`);
    }

    console.log('\n=== SYNC SUMMARY ===');
    console.log(`Total Venues: ${venues.length}`);
    console.log(`Verified (Score >= 70% & Pricing Present): ${verifiedCount}`);
    console.log(`Info Mode (Incomplete or No Pricing): ${infoCount}`);
    console.log(`Venues with Missing Pricing: ${noPriceCount}`);

    await mongoose.disconnect();
    console.log('MongoDB disconnected. Done!');
  } catch (err) {
    console.error('Error running sync:', err);
    process.exit(1);
  }
}

syncAllVenues();
