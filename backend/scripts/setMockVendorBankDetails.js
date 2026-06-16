const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const VendorProfile = require('../models/VendorProfile');

async function setMockVendorBankDetails() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGO_URI or MONGODB_URI not found in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const vendors = await User.find({ role: 'vendor' });
    console.log(`Found ${vendors.length} vendors.`);

    for (const vendor of vendors) {
      let profile = await VendorProfile.findOne({ user: vendor._id });
      if (!profile) {
        profile = new VendorProfile({ user: vendor._id });
      }
      
      profile.bankDetails = {
        accountHolderName: vendor.name || 'Mock Vendor Holder',
        accountNumber: '123456789012',
        ifsc: 'SBIN0001234',
        bankName: 'State Bank of India',
        branchName: 'Main Branch',
        accountType: 'savings'
      };
      profile.status = 'approved';
      
      await profile.save();
      console.log(`✅ Updated bank details for vendor: ${vendor.name} (${vendor.email})`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setMockVendorBankDetails();
