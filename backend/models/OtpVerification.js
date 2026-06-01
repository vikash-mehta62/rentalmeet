const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    trim: true,
    index: true
  },
  emailOtp: {
    type: String
  },
  phoneOtp: {
    type: String
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index: MongoDB will automatically remove expired documents
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OtpVerification', otpVerificationSchema);
