const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    sparse: true // Allows existing users without userId
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  alternatePhone: {
    type: String
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'subadmin', 'customer', 'employee'],
    default: 'customer'
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  state: {
    type: String
  },
  pincode: {
    type: String
  },
  profilePicture: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // SubAdmin Permissions (only for subadmin role)
  permissions: {
    dashboard: { type: Boolean, default: false },
    heroSlides: { type: Boolean, default: false },
    venues: { type: Boolean, default: false },
    venueTypes: { type: Boolean, default: false },
    users: { type: Boolean, default: false },
    employees: { type: Boolean, default: false },
    subadmins: { type: Boolean, default: false },
    bookings: { type: Boolean, default: false },
    payments: { type: Boolean, default: false },
    reports: { type: Boolean, default: false },
    reviews: { type: Boolean, default: false },
    platformSettings: { type: Boolean, default: false },
    settings: { type: Boolean, default: false }
  },
  // Referral System
  referralCode: {
    type: String,
    unique: true,
    sparse: true // Allows null values to be non-unique
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referredByCode: {
    type: String
  },
  referralCount: {
    type: Number,
    default: 0
  },
  referrals: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Employee-specific fields
  employeeDetails: {
    title: {
      type: String,
      enum: ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'],
    },
    fatherOrHusbandName: {
      type: String
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    maritalStatus: {
      type: String,
      enum: ['Single', 'Married', 'Divorced', 'Widowed']
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    qualification: {
      tenth: {
        board: String,
        year: Number,
        percentage: Number,
        certificate: String // URL
      },
      twelfth: {
        board: String,
        year: Number,
        percentage: Number,
        certificate: String // URL
      },
      graduation: {
        degree: String,
        university: String,
        year: Number,
        percentage: Number,
        certificate: String // URL
      },
      postGraduation: {
        degree: String,
        university: String,
        year: Number,
        percentage: Number,
        certificate: String // URL
      }
    },
    photo: {
      type: String // URL
    },
    position: {
      type: String
    },
    department: {
      type: String
    },
    employmentType: {
      type: String,
      enum: ['Permanent', 'Contract'],
      default: 'Permanent'
    },
    salary: {
      type: Number // For permanent employees
    },
    contractDetails: {
      paymentType: {
        type: String,
        enum: ['perLead', 'overall']
      },
      amount: Number
    },
    joiningDate: {
      type: Date
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    previousExperience: {
      type: Number, // in years
      default: 0
    },
    documents: {
      aadhaarNumber: {
        type: String
      },
      aadhaarFront: {
        type: String // URL
      },
      aadhaarBack: {
        type: String // URL
      },
      panNumber: {
        type: String
      },
      panCard: {
        type: String // URL
      }
    },
    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      branchName: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate unique referral code
userSchema.methods.generateReferralCode = function() {
  const prefix = this.role === 'owner' ? 'OWN' : 
                 this.role === 'employee' ? 'EMP' :
                 this.role === 'subadmin' ? 'SUB' : 'USR';
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${randomStr}`;
};

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
