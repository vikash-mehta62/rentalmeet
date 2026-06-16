const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const ServiceBooking = require('../models/ServiceBooking');
const VendorProfile = require('../models/VendorProfile');

async function inspectServiceBookings() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI or MONGODB_URI not found in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const serviceBookings = await ServiceBooking.find()
      .populate('vendor', 'name email')
      .lean();

    console.log(`📊 Found ${serviceBookings.length} total service bookings:\n`);

    for (let i = 0; i < serviceBookings.length; i++) {
      const b = serviceBookings[i];
      console.log(`${i + 1}. Booking Number: ${b.bookingNumber}`);
      console.log(`   Status: ${b.status} | Payment: ${b.paymentStatus} | Settlement: ${b.settlementStatus}`);
      console.log(`   Amount: ₹${b.amount}`);
      console.log(`   Pricing:`, JSON.stringify(b.pricing));
      console.log(`   Coupon:`, JSON.stringify(b.coupon));
      console.log(`   Vendor: ${b.vendor?.name} (${b.vendor?.email})`);
      
      if (b.vendor) {
        const profile = await VendorProfile.findOne({ user: b.vendor._id }).lean();
        console.log(`   Bank Details:`, JSON.stringify(profile?.bankDetails));
      }
      
      console.log(`   Settlement Details:`, JSON.stringify(b.settlementDetails));
      console.log('--------------------------------------------------\n');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

inspectServiceBookings();
