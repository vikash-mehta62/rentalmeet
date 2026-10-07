const mongoose = require('mongoose');

// Helper function to generate SKU
const generateSKU = (businessName, city) => {
  // Convert to lowercase and remove special characters
  const cleanName = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30); // Limit length
  
  const cleanCity = city
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 15);
  
  return `${cleanName}-${cleanCity}`;
};

// Helper function to ensure unique SKU
const ensureUniqueSKU = async (baseSKU) => {
  let sku = baseSKU;
  let counter = 1;
  
  // Check if SKU exists
  while (await mongoose.model('Venue').findOne({ sku })) {
    // Add random suffix if duplicate
    const randomSuffix = Math.floor(Math.random() * 9999);
    sku = `${baseSKU}-${randomSuffix}`;
    counter++;
    
    // Safety check - max 10 attempts
    if (counter > 10) {
      sku = `${baseSKU}-${Date.now()}`;
      break;
    }
  }
  
  return sku;
};

const venueSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Ambassador who listed the venue (if listed via Ambassador Program)
  ambassador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  addedByAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  listingSource: {
    type: String,
    enum: ['owner', 'ambassador', 'admin'],
    default: 'owner'
  },
  ambassadorListingApprovedAt: {
    type: Date
  },
  ambassadorProfitShareExpiresAt: {
    type: Date
  },
  
  // SKU for URL-friendly unique identifier
  sku: {
    type: String,
    unique: true,
    sparse: true, // Allow null temporarily, will be set by pre-save hook
    index: true
  },
  
  // STEP 1: Basic Information
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  venueType: [{
    type: String,
    required: true,
    trim: true
    // No enum - accepts any venue type name from VenueType collection
  }],
  foodType: {
    type: String,
    enum: ['Veg', 'Non Veg', 'Non-Veg', 'Both'],
    default: 'Veg',
    trim: true
  },
  description: {
    type: String,
    default: '',
    maxlength: 1000
  },
  capacity: {
    type: String,
    required: true,
    enum: [
      'Up to 10',
      '10-25',
      '25–50',
      '25-50',
      '50–100',
      '50-100',
      '100–150',
      '100-150',
      '150–200',
      '150-200',
      '200-300',
      '300-400',
      '400-500',
      '500-700',
      '700-1000',
      '1000-1500',
      '1500-2000',
      '2000+',
      '10-20',
      '20-30',
      '30-40',
      '40-50',
      '100-200',
      '500-600',
      '600-700',
      '700-800',
      '800-1000',
      'More than 2000'
    ]
  },
  areaSqft: {
    type: Number,
    required: true
  },
  yearEstablished: {
    type: String,
    default: ''
  },
  floor: {
    type: String,
    default: 'Ground Floor'
  },
  seatingArrangements: [{
    type: String
  }],
  servicesAvailable: [{
    type: String
  }],
  rulesAndPolicies: {
    foodPolicy: { type: String, default: 'Both Allowed' },
    outsideVendors: { type: String, default: 'Allowed' },
    decoration: { type: String, default: 'Allowed' },
    musicNoise: { type: String, default: 'Restricted' },
    alcohol: { type: String, default: 'Not Allowed' },
    pets: { type: String, default: 'Not Allowed' }
  },
  cancellationPolicy: {
    policyType: { type: String, default: 'Flexible' },
    customNoticeDays: { type: Number, default: 7 },
    customRefundPercent: { type: Number, default: 50 },
    moreThanDays: { type: Number, default: 15 },
    moreThanDaysRefund: { type: Number, default: 100 },
    withinDays: { type: Number, default: 7 },
    withinDaysRefund: { type: Number, default: 50 },
    withinHours: { type: Number, default: 24 },
    withinHoursRefund: { type: Number, default: 20 },
    noShowRefund: { type: Number, default: 0 }
  },
  taxSettings: {
    taxType: { type: String, enum: ['GST Included', 'GST Extra', 'GST Not Applicable'], default: 'GST Included' },
    gstRate: { type: Number, default: 18 }
  },
  
  // STEP 2: Location
  location: {
    address: { type: String, required: true },
    landmark: { type: String, default: '' },
    state: { type: String, required: true },
    city: { type: String, required: true },
    village: { type: String }, // Optional field
    area: { type: String, default: '' },
    pincode: { type: String, default: '' },
    googleMapLink: { type: String, default: '' },
    parkingAvailability: {
      type: String,
      enum: ['Free', 'Paid', 'Limited', 'None'],
      default: 'None'
    },
    parkingDetails: {
      type: { type: String, enum: ['Free', 'Paid', 'Limited', 'None'], default: 'None' },
      carsCapacity: { type: Number, default: 0 },
      twoWheelerCapacity: { type: Number, default: 0 },
      carCharges: { type: Number, default: 0 },
      twoWheelerCharges: { type: Number, default: 0 }
    },
    nearestBusAuto: String,
    nearestMetroTrain: String
  },
  
  // STEP 3: Amenities
  amenities: {
    basic: [{
      name: String,
      available: Boolean,
      type: { type: String, enum: ['Included', 'Paid'] },
      rate: Number,
      rateType: { type: String, enum: ['Fixed', 'Per Use'], default: 'Fixed' },
      // Null/undefined means unlimited
      maxQuantity: { type: Number, min: 1, default: null }
    }],
    beverages: [{
      name: String,
      available: Boolean,
      ratePerUnit: Number,
      brand: String
    }],
    refreshmentFood: [{
      name: String,
      available: Boolean,
      ratePerPlate: Number,
      items: String
    }],
    lunchThalis: [{
      thaliType: {
        type: String
      },
      available: Boolean,
      categories: [{
        category: {
          type: String
        },
        ratePerPlate: { type: Number },
        numberOfItems: { type: Number },
        itemNames: { type: String }
      }]
    }],
    kitchenAccess: {
      available: Boolean,
      type: { type: String, enum: ['Included', 'Paid'] },
      charges: Number
    },
    diningArea: {
      available: Boolean,
      type: { type: String, enum: ['Included', 'Paid'] },
      charges: Number
    },
    additional: [{
      name: String,
      available: Boolean,
      type: { type: String, enum: ['Included', 'Paid'] },
      charges: Number
    }]
  },
  
  // STEP 4: Pricing & Availability
  pricing: {
    enabledOptions: {
      perHour: { type: Boolean, default: true },
      halfDay: { type: Boolean, default: false },
      fullDay: { type: Boolean, default: false }
    },
    perHour: {
      weekday: Number,
      weekend: Number
    },
    halfDay: {
      weekday: Number,
      weekend: Number
    },
    fullDay: {
      weekday: Number,
      weekend: Number
    },
    extraHourRate: {
      weekday: Number,
      weekend: Number
    },
    selectedPricingModels: [{ type: String }],
    onlyRent: {
      hourly: {
        rate: { type: Number, default: 0 },
        extraPerHour: { type: Number, default: 0 }
      },
      halfDay: {
        rate: { type: Number, default: 0 },
        extraPerHour: { type: Number, default: 0 }
      },
      fullDay: {
        rate: { type: Number, default: 0 },
        extraPerHour: { type: Number, default: 0 }
      }
    },
    rentWithAmenities: {
      hourly: {
        rate: { type: Number, default: 0 },
        extraPerHour: { type: Number, default: 0 }
      },
      halfDay: {
        rate: { type: Number, default: 0 },
        extraPerHour: { type: Number, default: 0 }
      },
      fullDay: {
        rate: { type: Number, default: 0 },
        extraPerHour: { type: Number, default: 0 }
      }
    },
    perPax: {
      withoutFood: {
        rate: { type: Number, default: 0 },
        minPax: { type: Number, default: 1 }
      },
      breakfastOnly: {
        rate: { type: Number, default: 0 },
        minPax: { type: Number, default: 1 }
      },
      breakfastLunch: {
        rate: { type: Number, default: 0 },
        minPax: { type: Number, default: 1 }
      },
      lunchOnly: {
        rate: { type: Number, default: 0 },
        minPax: { type: Number, default: 1 }
      },
      dinnerOnly: {
        rate: { type: Number, default: 0 },
        minPax: { type: Number, default: 1 }
      },
      allMeals: {
        rate: { type: Number, default: 0 },
        minPax: { type: Number, default: 1 }
      }
    }
  },
  
  // Custom Platform Fee (Optional - if not set, uses default from PlatformSettings)
  customPlatformFee: {
    enabled: {
      type: Boolean,
      default: false
    },
    feeType: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'percentage'
    },
    feeValue: {
      type: Number,
      default: 5,
      min: 0
    },
    platformCGSTRate: {
      type: Number,
      default: 9,
      min: 0,
      max: 100
    },
    platformSGSTRate: {
      type: Number,
      default: 9,
      min: 0,
      max: 100
    },
    percentage: {
      type: Number,
      default: 5,
      min: 0,
      max: 100
    }
  },
  
  // Custom GST Rate (Optional - if not set, uses default from PlatformSettings)
  customGST: {
    enabled: {
      type: Boolean,
      default: false
    },
    cgstRate: {
      type: Number,
      default: 9,
      min: 0,
      max: 100
    },
    sgstRate: {
      type: Number,
      default: 9,
      min: 0,
      max: 100
    },
    hsnCode: {
      type: String,
      default: ''
    },
    rate: {
      type: Number,
      default: 18,
      min: 0,
      max: 100
    }
  },
  
  availability: {
    openingTime: String,
    closingTime: String,
    // Dedicated online booking acceptance window
    onlineBookingSchedule: {
      enabled: { type: Boolean, default: false },
      openingTime: { type: String, default: '06:00' },
      closingTime: { type: String, default: '02:00' }
    },
    availableDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    advanceBookingRule: {
      type: String,
      default: '1 Day'
    },
    blackoutDates: [{
      date: Date,
      reason: String
    }],
    confirmationHours: {
      type: Number,
      default: 3,
      min: 0.5,
      max: 3
    }
  },
  
  // STEP 5: Photos
  images: [{
    url: String,
    category: {
      type: String,
      enum: [
        'Featured',
        'Exterior',
        'Interior',
        'Amenities',
        'Additional',
        'Front / Entrance',
        'Front/Entrance',
        'Main Hall / Space',
        'Main Hall',
        'Seating Area',
        'Parking',
        'Facilities',
        'Outdoor Area',
        'Other'
      ]
    },
    isFeatured: Boolean,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // STEP 6: Owner & Authorized Documents
  ownerInfo: {
    fullName: String,
    email: String,
    mobile: String,
    alternatePhone: String,
    role: String,
    hasGST: {
      type: Boolean,
      default: false
    },
    gstNumber: String,
    gstCertificateUrl: String,
    gstCertificatePublicId: String,
    // Booking Authorised Person details
    authorisedPerson: {
      name: String,
      fullName: String,
      email: String,
      phone: String,
      mobile: String,
      alternatePhone: String,
      designation: String,
      role: String
    }
  },
  documents: {
    idProof: {
      type: { type: String, default: 'Both' },
      number: String,
      frontUrl: String,
      backUrl: String,
      aadhaarNumber: String,
      aadhaarFrontUrl: String,
      aadhaarBackUrl: String,
      aadhaarFrontPublicId: String,
      aadhaarBackPublicId: String,
      panNumber: String,
      panUrl: String,
      panPublicId: String,
      gstDocUrl: String,
      gstDocPublicId: String
    },
    selfieUrl: String,
    selfiePublicId: String,
    businessProof: {
      type: { type: String },
      documentUrl: String,
      publicId: String,
      otherSpecify: String
    },
    propertyProof: {
      type: { type: String },
      documentUrl: String,
      publicId: String,
      otherSpecify: String
    },
    applicableCertificates: {
      type: { type: String },
      documentUrl: String,
      publicId: String,
      otherSpecify: String
    },
    fireNOC: {
      url: String,
      publicId: String
    },
    fssai: {
      url: String,
      publicId: String
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String, // Will be encrypted
    ifscCode: String,
    bankName: String,
    branchName: String,
    accountType: {
      type: String,
      enum: ['Savings', 'Current']
    },
    bankProofUrl: String,
    bankProofPublicId: String,
    razorpayAccountId: String,
    linkedAccountId: String,
    razorpayAccountStatus: String,
    razorpayAccountCreatedAt: Date,
    razorpayAccountSyncedAt: Date
  },
  
  // Social Media & Video Links (Tab 8)
  socialLinks: {
    instagram: { type: String, default: '' },
    facebook: { type: String, default: '' },
    youtube: [{ type: String }],
    website: { type: String, default: '' }
  },

  // Catering Facility (Tab 4)
  cateringFacility: {
    available: { type: Boolean, default: false },
    outsideCateringAllowed: { type: Boolean, default: true },
    beverages: [{
      name: String,
      available: Boolean,
      ratePerUnit: Number
    }],
    breakfast: [{
      name: String,
      available: Boolean,
      ratePerPlate: Number,
      items: String
    }],
    lunchDinner: [{
      name: String,
      available: Boolean,
      foodType: { type: String, enum: ['Veg', 'Non-Veg', 'Both'] },
      ratePerPlate: Number,
      items: String
    }]
  },

  // Additional Facilities (Tab 5)
  additionalFacilities: [{
    name: String,
    available: Boolean,
    type: { type: String, enum: ['Included', 'Paid'], default: 'Included' },
    charges: { type: Number, default: 0 },
    description: String
  }],
  
  // STEP 7 / Tab 10: Terms & Conditions
  termsAccepted: {
    type: Boolean,
    required: true
  },
  termsAcceptedDate: {
    type: Date,
    default: Date.now
  },
  
  // Status & Verification
  status: {
    type: String,
    enum: ['pending', 'provisional', 'approved', 'rejected', 'suspended', 'resubmitted'],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  profileCompletion: {
    type: Number,
    default: 45
  },
  onboardingPhase: {
    type: Number,
    default: 1
  },
  isProvisional: {
    type: Boolean,
    default: false
  },
  rejectionReason: String,
  suspensionReason: String,
  statusReason: String,
  rejectionHistory: [{
    reason:      { type: String },
    rejectedAt:  { type: Date, default: Date.now },
    rejectedBy:  { type: require('mongoose').Schema.Types.ObjectId, ref: 'User' }
  }],
  verificationTimeline: {
    applicationReview: Date,
    documentVerification: Date,
    siteVisit: Date,
    listingActivation: Date
  },

  // Audit Status History
  statusHistory: [{
    action: { type: String },
    status: { type: String },
    isActive: { type: Boolean },
    isBookingStopped: { type: Boolean },
    reason: { type: String },
    changedBy: {
      userId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
      email: { type: String },
      role: { type: String }
    },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],

  // Stop Booking / Allow Booking toggle (Admin control)
  // Default: isBookingStopped: false (booking is allowed by default)
  isBookingStopped: {
    type: Boolean,
    default: false
  },
  stopBookingReason: {
    type: String,
    default: ''
  },
  stoppedBookingAt: {
    type: Date
  },

  // Owner-controlled active/inactive toggle
  isActive: {
    type: Boolean,
    default: true
  },

  // Manually blocked dates (owner blocks specific dates)
  blockedDates: [{
    date: { type: Date, required: true },
    reason: { type: String, default: 'Blocked by owner' }
  }],
  
  // Stats
  totalBookings: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  }
  
}, {
  timestamps: true
});

// Helper to calculate profile completion score (0-100%) and verification status
const calculateVenueProfileCompletion = (venue = {}) => {
  let score = 0;
  if (venue.businessName) score += 5;
  if (venue.venueType && (Array.isArray(venue.venueType) ? venue.venueType.length > 0 : Boolean(venue.venueType))) score += 5;
  if (venue.capacity) score += 5;
  if (venue.foodType) score += 5;

  if (venue.location?.address) score += 5;
  if (venue.location?.city) score += 5;
  if (venue.location?.pincode && venue.location.pincode !== '000000') score += 5;

  const p = venue.pricing || {};
  const hasPricing = (
    (p.perHour && (Number(p.perHour.weekday) > 0 || Number(p.perHour.weekend) > 0)) ||
    (p.halfDay && (Number(p.halfDay.weekday) > 0 || Number(p.halfDay.weekend) > 0)) ||
    (p.fullDay && (Number(p.fullDay.weekday) > 0 || Number(p.fullDay.weekend) > 0)) ||
    (p.onlyRent?.hourly?.rate > 0 || p.onlyRent?.halfDay?.rate > 0 || p.onlyRent?.fullDay?.rate > 0) ||
    (p.rentWithAmenities?.hourly?.rate > 0 || p.rentWithAmenities?.halfDay?.rate > 0 || p.rentWithAmenities?.fullDay?.rate > 0) ||
    (p.perPax && Object.values(p.perPax).some(pkg => Number(pkg?.rate) > 0))
  );
  if (hasPricing) score += 15;

  const imgCount = venue.images?.length || 0;
  if (imgCount >= 1) score += 5;
  if (imgCount >= 3) score += 5;
  if (imgCount >= 5) score += 5;

  if (venue.documents?.verified) {
    score += 35;
  } else {
    if (venue.bankDetails?.accountNumber || venue.bankDetails?.ifscCode) score += 10;
    if (venue.documents?.idProof?.number || venue.documents?.idProof?.frontUrl || venue.documents?.businessProof?.documentUrl) score += 10;
    if (venue.description && venue.description.length > 40) score += 5;
    if (venue.amenities?.basic?.some(a => a.available) || venue.additionalFacilities?.length > 0) score += 5;
    if (venue.cateringFacility?.available || venue.socialLinks?.website || venue.socialLinks?.instagram) score += 5;
  }

  const profileCompletion = Math.min(100, Math.max(0, score));
  const isVerified = Boolean(profileCompletion >= 70 || venue.documents?.verified);

  return { profileCompletion, isVerified };
};

venueSchema.statics.calculateProfileCompletion = calculateVenueProfileCompletion;

venueSchema.pre('save', async function (next) {
  // Generate SKU if new or name/city changed
  if (this.isNew || this.isModified('businessName') || this.isModified('location.city')) {
    const baseSKU = generateSKU(this.businessName, this.location.city);
    this.sku = await ensureUniqueSKU(baseSKU);
  }

  // Calculate profile completion score (0-100%) and verified flag automatically
  try {
    const { profileCompletion, isVerified } = calculateVenueProfileCompletion(this);
    this.profileCompletion = profileCompletion;
    this.isVerified = isVerified;
  } catch (compErr) {
    // Non-blocking
  }

  next();
});

// Automatic calculation on findOneAndUpdate / findByIdAndUpdate
venueSchema.pre('findOneAndUpdate', async function (next) {
  try {
    const update = this.getUpdate();
    if (!update) return next();

    const docToUpdate = update.$set ? { ...update.$set } : { ...update };
    const existing = await this.model.findOne(this.getQuery()).lean();
    if (existing) {
      const merged = { ...existing, ...docToUpdate };
      if (docToUpdate.location) merged.location = { ...existing.location, ...docToUpdate.location };
      if (docToUpdate.pricing) merged.pricing = { ...existing.pricing, ...docToUpdate.pricing };
      if (docToUpdate.documents) merged.documents = { ...existing.documents, ...docToUpdate.documents };
      if (docToUpdate.bankDetails) merged.bankDetails = { ...existing.bankDetails, ...docToUpdate.bankDetails };

      const { profileCompletion, isVerified } = calculateVenueProfileCompletion(merged);
      if (update.$set) {
        update.$set.profileCompletion = profileCompletion;
        update.$set.isVerified = isVerified;
      } else {
        update.profileCompletion = profileCompletion;
        update.isVerified = isVerified;
      }
    }
  } catch (err) {
    // Non-blocking
  }
  next();
});

// Indexes for better performance
venueSchema.index({ owner: 1 });
venueSchema.index({ status: 1 });
venueSchema.index({ 'location.city': 1 });
venueSchema.index({ venueType: 1 });
venueSchema.index({ foodType: 1 });

module.exports = mongoose.model('Venue', venueSchema);
