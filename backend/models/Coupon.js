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
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  ]
}, { timestamps: true });

// Compound unique: same code can't be used twice for same venue
couponSchema.index({ code: 1, venue: 1 }, { unique: true });

module.exports = mongoose.model('Coupon', couponSchema);
