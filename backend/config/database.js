const mongoose = require('mongoose');
const configureMongoDns = require('./mongoDns');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  try {
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set');
    }

    configureMongoDns(mongoUri);
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    if (error.message.includes('querySrv')) {
      console.error('   SRV DNS lookup failed. Set MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8 or fix your local DNS resolver.');
    }
    throw error;
  }
};

module.exports = connectDB;
