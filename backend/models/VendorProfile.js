const mongoose = require('mongoose');

const vendorProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // Basic Info
  basicInfo: {
    fullName:        { type: String },
    primaryMobile:   { type: String },
    secondaryMobile: { type: String },
    role:            { type: String, enum: ['owner', 'manager', 'representative'], default: 'owner' }
  },

  // Business Info
  businessInfo: {
    companyName:     { type: String },
    brandName:       { type: String },
    experienceYears: { type: Number, default: 0 },
    category:        { type: String },
    description:     { type: String },
    specialization:  { type: String }
  },

  // Address
  address: {
    officeAddress:    { type: String },
    state:            { type: String },
    city:             { type: String },
    area:             { type: String },
    village:          { type: String },
    pincode:          { type: String },
    serviceableAreas: [{ type: String }]
  },

  // Online Presence
  online: {
    website:   { type: String },
    instagram: { type: String },
    facebook:  { type: String }
  },

  // Pricing
  pricing: {
    startingPrice:     { type: Number },
    minimumOrderPrice: { type: Number },
    packages: [{
      serviceName: String,
      rate:        Number,
      unit:        String,
      quantity:    Number
    }]
  },

  // Portfolio
  portfolio: {
    featuredImage:     { type: String },
    serviceImages:     [{ type: String }],
    videoLinks:        [{ type: String }],
    previousWorkLinks: [{ type: String }]
  },

  // Business Documents
  businessDocs: {
    registrationCertificate: String,
    msme:         String,
    gst:          String,
    pan:          String,
    tradeLicense: String,
    fssai:        String
  },

  // Owner Documents
  ownerDocs: {
    aadhaarFront: String,
    aadhaarBack:  String,
    pan:          String,
    selfie:       String
  },

  // Bank Details
  bankDetails: {
    accountHolderName: String,
    accountNumber:     String,
    ifsc:              String,
    bankName:          String,
    branchName:        String,
    accountType:       { type: String, enum: ['savings', 'current'], default: 'savings' },
    upiId:             String,
    proof:             String
  },

  // Availability
  availability: [{
    day:         { type: String },
    isAvailable: { type: Boolean, default: true },
    startTime:   { type: String },
    endTime:     { type: String }
  }],
  publicHoliday: {
    isAvailable: { type: Boolean, default: false },
    startTime:   String,
    endTime:     String
  },

  // Booking Policy
  bookingPolicy: {
    advanceBooking: { type: String, enum: ['same-day', '24h', '48h', '1week', 'custom'], default: '24h' }
  },

  termsAccepted: { type: Boolean, default: false },

  // Approval
  status:          { type: String, enum: ['incomplete', 'pending', 'approved', 'rejected'], default: 'incomplete' },
  rejectionReason: { type: String },
  submittedAt:     { type: Date },
  approvedAt:      { type: Date },

  // Onboarding step tracker
  onboardingStep: { type: Number, default: 0 } // 0=not started, 1-8=steps, 9=submitted
}, { timestamps: true });

module.exports = mongoose.model('VendorProfile', vendorProfileSchema);
