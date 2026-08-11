const mongoose = require('mongoose');

const ambassadorProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Office ID assigned upon approval
  ambassadorId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  
  // Level & Badge
  assignedLevel: {
    type: String,
    enum: ['LV.1', 'LV.2', 'LV.3', 'LV.4'],
    default: 'LV.1'
  },
  badge: {
    type: String,
    enum: ['Bronze Explorer', 'Silver Champion', 'Gold Master', 'City Legend'],
    default: 'Bronze Explorer'
  },

  // PART A: Personal Information
  personalInfo: {
    fullName: { type: String, required: true, trim: true },
    parentName: { type: String, trim: true }, // Father / Mother Name
    dateOfBirth: { type: String }, // DD/MM/YYYY
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    mobileNumber: { type: String, required: true, trim: true },
    whatsAppNumber: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    aadhaarNumber: { type: String, trim: true },
    panNumber: { type: String, uppercase: true, trim: true }
  },

  // PART B: Address Details
  addressDetails: {
    currentAddress: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    areaCoverage: { type: String, required: true } // Area / Locality You Will Cover
  },

  // PART C: Professional Details
  professionalDetails: {
    currentOccupation: { type: String },
    companyName: { type: String },
    educationQualification: { type: String },
    workExperience: { type: String },
    salesMarketingExperience: { type: Boolean, default: false },
    digitalMarketingExperience: { type: Boolean, default: false }
  },

  // PART D: Ambassador Profile
  profileType: {
    type: String,
    enum: [
      'Venue Explorer (Part-Time)',
      'Venue Champion',
      'City Venue Partner',
      'Full-Time Venue Acquisition Partner'
    ],
    default: 'Venue Explorer (Part-Time)'
  },
  preferredWorkingArea: {
    cityCoverage: { type: String },
    districtCoverage: { type: String },
    stateCoverage: { type: String }
  },

  // PART E: Venue Network Information (contacts with)
  venueNetwork: {
    hotels: { type: Boolean, default: false },
    meetingRooms: { type: Boolean, default: false },
    conferenceHalls: { type: Boolean, default: false },
    trainingCentres: { type: Boolean, default: false },
    coachingInstitutes: { type: Boolean, default: false },
    banquetHalls: { type: Boolean, default: false },
    marriageGardens: { type: Boolean, default: false },
    farmHouses: { type: Boolean, default: false },
    coworkingSpaces: { type: Boolean, default: false },
    schoolsColleges: { type: Boolean, default: false }
  },

  // PART F: Expected Performance
  expectedPerformance: {
    venuesPerDay: { type: String },
    venuesPerMonth: { type: String },
    preferredWorkingTime: { type: String },
    preferredAreaCoverage: { type: String }
  },

  // PART G: Bank Details for Payment
  bankDetails: {
    accountHolderName: { type: String },
    bankName: { type: String },
    accountNumber: { type: String }, // Encrypted
    ifscCode: { type: String },
    upiId: { type: String }
  },

  // PART H: Referral Information
  referralInfo: {
    referredByAmbassadorId: { type: String },
    referralCode: { type: String }
  },

  // PART I: Document Upload
  documents: {
    passportPhoto: { type: String }, // S3 URL
    identityProof: { type: String }, // Front URL
    identityProofBack: { type: String }, // Back URL
    identityProofType: { type: String, enum: ['Aadhaar', 'PAN', 'Voter ID', 'Driving License', 'Passport'] },
    bankProof: { type: String }, // Passbook / Cheque / UPI screenshot
    addressProof: { type: String } // Optional
  },

  // PART J: Declaration
  declaration: {
    agreed: { type: Boolean, default: true },
    applicantSignatureName: { type: String },
    date: { type: Date, default: Date.now },
    place: { type: String }
  },

  // Office & Admin Status
  applicationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  cityPartnerCode: { type: String },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: { type: Date },
  rejectionReason: { type: String },

  // Earning & Performance Metrics
  walletBalance: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalVenuesSubmitted: { type: Number, default: 0 },
  totalVenuesApproved: { type: Number, default: 0 },
  totalVenuesRejected: { type: Number, default: 0 },
  
  // Challenge Streaks Tracking
  dailyStreak: {
    date: { type: String }, // YYYY-MM-DD
    approvedCount: { type: Number, default: 0 },
    bonusAwarded: { type: Boolean, default: false }
  },
  weeklyStreak: {
    weekStart: { type: String }, // YYYY-MM-DD
    approvedCount: { type: Number, default: 0 },
    bonusAwarded: { type: Boolean, default: false }
  },
  monthlyStreak: {
    month: { type: String }, // YYYY-MM
    approvedCount: { type: Number, default: 0 },
    bonusAwarded: { type: Boolean, default: false }
  }

}, {
  timestamps: true
});

module.exports = mongoose.model('AmbassadorProfile', ambassadorProfileSchema);
