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
    enum: ['Veg', 'Non Veg', 'Both'],
    default: 'Veg',
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  capacity: {
    type: String,
    required: true,
    enum: [
      '10-20', '20-30', '30-40', '40-50', '50-100', '100-200', '200-300',
      '300-400', '400-500', '500-600', '600-700', '700-800', '800-1000',
      '1000-1500', '1500-2000', 'More than 2000'
    ]
  },
  areaSqft: {
    type: Number,
    required: true
  },
  
  // STEP 2: Location
  location: {
    address: { type: String, required: true },
    landmark: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    village: { type: String }, // Optional field
    area: { type: String, required: true },
    pincode: { type: String, required: true },
    googleMapLink: { type: String, required: true },
    parkingAvailability: {
      type: String,
      enum: ['Free', 'Paid', 'Limited', 'None'],
      required: true
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
        type: String,
        enum: [
          'North Indian Thali',
          'Punjabi Thali',
          'Non-Veg Thali',
          'South Indian Thali',
          'Gujarati Thali',
          'Rajasthani Thali',
          'Bengali Thali',
          'Maharashtrian Thali',
          'Kashmiri Thali',
          'Simple/Daily Thali',
          'Protein-Packed Thali',
          'Festive/Banquet Thali'
        ],
        required: true
      },
      available: Boolean,
      categories: [{
        category: {
          type: String,
          enum: ['Regular Thali', 'Special Thali', 'Maharaja Thali'],
          required: true
        },
        ratePerPlate: { type: Number, required: true },
        numberOfItems: { type: Number, required: true },
        itemNames: { type: String, required: true }
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
    }
  },
  
  // Custom Platform Fee (Optional - if not set, uses default from PlatformSettings)
  customPlatformFee: {
    enabled: {
      type: Boolean,
      default: false
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
    availableDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    advanceBookingRule: {
      type: String,
      enum: ['Same day allowed', '24 hours in advance', '48 hours in advance', '1 week in advance']
    },
    blackoutDates: [{
      date: Date,
      reason: String
    }],
    confirmationHours: {
      type: Number,
      default: 3,
      min: 1,
      max: 3
    }
  },
  
  // STEP 5: Photos
  images: [{
    url: String,
    category: {
      type: String,
      enum: ['Featured', 'Exterior', 'Interior', 'Amenities', 'Additional']
    },
    isFeatured: Boolean,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // STEP 6: Owner Documents
  ownerInfo: {
    fullName: String,
    email: String,
    mobile: String,
    alternatePhone: String,
    role: {
      type: String,
      enum: ['Owner', 'Manager', 'Representative']
    },
    hasGST: {
      type: Boolean,
      default: false
    },
    gstNumber: String
  },
  documents: {
    idProof: {
      type: { type: String, enum: ['Aadhaar', 'PAN'] },
      number: String,
      frontUrl: String,
      backUrl: String
    },
    selfieUrl: String,
    businessProof: {
      type: {
        type: String,
        enum: [
          'Business Regd. Certificate', 'GST Certificate', 'Trade License',
          'Certificate of Incorporation', 'Partnership Deed', 'Udyog Aadhar', 'Other'
        ]
      },
      documentUrl: String,
      otherSpecify: String
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
    bankProofPublicId: String
  },
  
  // STEP 7: Terms & Conditions
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
    enum: ['pending', 'approved', 'rejected', 'suspended', 'resubmitted'],
    default: 'pending'
  },
  rejectionReason: String,
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

// Pre-save hook to generate SKU
venueSchema.pre('save', async function(next) {
  // Only generate SKU if it's a new document or businessName/city changed
  if (this.isNew || this.isModified('businessName') || this.isModified('location.city')) {
    const baseSKU = generateSKU(this.businessName, this.location.city);
    this.sku = await ensureUniqueSKU(baseSKU);
  }
  next();
});

// Indexes for better performance
venueSchema.index({ owner: 1 });
venueSchema.index({ status: 1 });
venueSchema.index({ 'location.city': 1 });
venueSchema.index({ venueType: 1 });
venueSchema.index({ foodType: 1 });
venueSchema.index({ sku: 1 });

module.exports = mongoose.model('Venue', venueSchema);
