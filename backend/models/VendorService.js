const mongoose = require('mongoose');

const vendorServiceSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Step 1 — Contact Info
  contactInfo: {
    fullName:        String,
    primaryMobile:   String,
    secondaryMobile: String,
    role:            { type: String, enum: ['owner', 'manager', 'representative'], default: 'owner' }
  },

  // Step 2 — Business Info
  title:           { type: String, required: true, trim: true },
  category:        { type: String, required: true },
  companyName:     String,
  brandName:       String,
  experienceYears: Number,
  description:     String,
  specialization:  [String],
  tags:            [String],

  // Step 3 — Address
  officeAddress:    String,
  state:            String,
  city:             String,
  area:             String,
  village:          String,
  pincode:          String,
  serviceableAreas: [String],
  website:          String,
  instagram:        String,
  facebook:         String,

  // Step 4 — Pricing
  startingPrice:     Number,
  minimumOrderPrice: Number,
  packages: [{
    sno:      Number,
    name:     String,
    price:    Number,
    unit:     String,
    minQty:   { type: Number, default: 1 },
    maxQty:   { type: Number, default: null }
  }],

  // Step 5 — Portfolio
  featuredImage:     String,
  images:            [String],
  videoLinks:        [String],
  previousWorkLinks: [String],

  // Step 6 — Documents
  businessDocs: {
    registrationCertificate: String,
    msme:         String,
    gst:          String,
    pan:          String,
    tradeLicense: String,
    fssai:        String
  },
  ownerDocs: {
    aadhaarFront: String,
    aadhaarBack:  String,
    pan:          String,
    selfie:       String
  },

  // Step 7 — Bank
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

  // Step 8 — Availability
  availability: [{
    day:         String,
    isAvailable: { type: Boolean, default: true },
    startTime:   String,
    endTime:     String
  }],
  publicHoliday: {
    isAvailable: { type: Boolean, default: false },
    startTime:   String,
    endTime:     String
  },
  advanceBooking: {
    type: String,
    enum: ['same-day', '24h', '48h', '1week', 'custom'],
    default: '24h'
  },
  customAdvanceDays: Number,

  // Confirmation deadline hours
  confirmationHours: {
    type: Number,
    default: 3,
    min: 1,
    max: 3
  },

  // Terms
  termsAccepted: { type: Boolean, default: false },

  // Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'suspended', 'resubmitted'],
    default: 'draft'
  },
  rejectionReason: String,
  rejectionHistory: [{
    reason:     String,
    rejectedAt: { type: Date, default: Date.now },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  resubmittedAt: Date,
  currentStep:     { type: Number, default: 1 },

  // Stats
  totalEnquiries: { type: Number, default: 0 },
  totalBookings:  { type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },

  // Owner-blocked dates
  blockedDates: [{
    date:   { type: Date, required: true },
    reason: { type: String, default: 'Blocked by vendor' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('VendorService', vendorServiceSchema);
