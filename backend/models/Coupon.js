const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: false,
    default: null
  },
  // For vendor service coupons
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorService',
    required: false,
    default: null
  },
  serviceVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  appliesTo: {
    type: String,
    enum: ['total', 'platformFee', 'amenities', 'baseAmount'],
    default: 'total',
    description: 'total = venue+amenities, platformFee = only platform fee, amenities = only amenities, baseAmount = only venue base price'
  },
  maxDiscount: {
    type: Number,
    default: null // cap for percentage discounts
  },
  minBookingAmount: {
    type: Number,
    default: 0
  },
  maxUses: {
    type: Number,
    default: null // null = unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  expiryDate: {
    type: Date,
    default: null // null = no expiry
  },
  isActive: {
    type: Boolean,
    default: true
  },
  activatedAt: {
    type: Date,
    default: Date.now // set when created (active by default)
  },
  deactivatedAt: {
    type: Date,
    default: null
  },
  usages: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
      discountAmount: { type: Number },
      usedAt: { type: Date, default: Date.now }
    }
  ],

  // Auto-generated quotation number (e.g. QT-2026-000001)
  quotationNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  // Download history with venue details snapshot
  downloads: [
    {
      downloadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      downloadedAt: { type: Date, default: Date.now },
      role: { type: String, enum: ['owner', 'admin', 'customer'] },
      venueSnapshot: {
        businessName: String,
        sku: String,
        city: String,
        state: String
      }
    }
  ]
}, { timestamps: true });

// Global coupons: unique by code. Venue-specific: unique by code+venue
couponSchema.index({ code: 1 }, { unique: true, sparse: false });

module.exports = mongoose.model('Coupon', couponSchema);
