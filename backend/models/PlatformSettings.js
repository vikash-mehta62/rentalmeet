const mongoose = require('mongoose');

const DEFAULT_VENUE_COST_SLABS = [
  { label: 'Up to ₹10,000', minCost: 0, maxCost: 10000, feeType: 'percentage', feeValue: 5, cgst: 9, sgst: 9 },
  { label: '₹10,001 – ₹20,000', minCost: 10001, maxCost: 20000, feeType: 'percentage', feeValue: 5, cgst: 9, sgst: 9 },
  { label: '₹20,001 – ₹30,000', minCost: 20001, maxCost: 30000, feeType: 'percentage', feeValue: 5, cgst: 9, sgst: 9 },
  { label: '₹30,001 – ₹50,000', minCost: 30001, maxCost: 50000, feeType: 'percentage', feeValue: 5, cgst: 9, sgst: 9 },
  { label: '₹50,001 – ₹1,00,000', minCost: 50001, maxCost: 100000, feeType: 'percentage', feeValue: 5, cgst: 9, sgst: 9 },
  { label: '₹1,00,000 and above', minCost: 100001, maxCost: null, feeType: 'percentage', feeValue: 5, cgst: 9, sgst: 9 }
];

const platformSettingsSchema = new mongoose.Schema({
  // Venue GST Settings (for Venue Invoice)
  venueCGST: {
    type: Number,
    required: true,
    default: 9, // 9% CGST
    min: 0,
    max: 100
  },
  venueSGST: {
    type: Number,
    required: true,
    default: 9, // 9% SGST
    min: 0,
    max: 100
  },
  venueHSN: {
    type: String,
    default: ''
  },
  
  // Platform Fee Settings (for Platform Invoice)
  platformFeeType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'percentage'
  },
  platformFeePercentage: {
    type: Number,
    required: true,
    default: 5,
    min: 0,
    max: 100
  },
  platformCGST: {
    type: Number,
    required: true,
    default: 9, // 9% CGST on platform fee
    min: 0,
    max: 100
  },
  platformSGST: {
    type: Number,
    required: true,
    default: 9, // 9% SGST on platform fee
    min: 0,
    max: 100
  },
  
  // Signature Images
  gstInvoiceSignature: {
    type: String,
    default: null
  },
  platformInvoiceSignature: {
    type: String,
    default: null
  },

  // ── Vendor Service GST & Platform Fee ────────────────────────────────────
  // Default service settings (applies to all categories unless overridden)
  serviceCGST: { type: Number, default: 9, min: 0, max: 100 },
  serviceSGST: { type: Number, default: 9, min: 0, max: 100 },
  serviceHSN:  { type: String, default: '' },
  servicePlatformFee: { type: Number, default: 5, min: 0, max: 100 }, // % of service amount
  servicePlatformCGST: { type: Number, default: 9, min: 0, max: 100 },
  servicePlatformSGST: { type: Number, default: 9, min: 0, max: 100 },

  // Per-category overrides: [{ category: 'Catering & Food', cgst: 5, sgst: 5, platformFee: 3 }]
  serviceCategoryRates: [{
    category:    { type: String, required: true },
    cgst:        { type: Number, default: 9 },
    sgst:        { type: Number, default: 9 },
    platformFee: { type: Number, default: 5 },
    platformCGST: { type: Number, default: 9 },
    platformSGST: { type: Number, default: 9 },
    hsn:         { type: String, default: '' }
  }],

  // ── Venue Cost Slabs (Category-wise Platform Fee System) ───────────────
  venueCostSlabs: [{
    label:    { type: String, default: '' },
    minCost:  { type: Number, default: 0 },
    maxCost:  { type: Number, default: null }, // null means above / infinity
    feeType:  { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    feeValue: { type: Number, default: 5 },
    cgst:     { type: Number, default: 9 },
    sgst:     { type: Number, default: 9 }
  }],
  
  // Legacy fields (kept for backward compatibility)
  gstRate: {
    type: Number,
    default: 18
  },
  platformFeeValue: {
    type: Number,
    default: 5
  },
  
  // Home Page Promotional Popup Banner (1:1 Ratio)
  homePopup: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    link: { type: String, default: '' },
    buttonText: { type: String, default: 'Explore Now' },
    imageUrl: { type: String, default: '' },
    publicId: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
platformSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      venueCGST: 9, venueSGST: 9, venueHSN: '',
      platformFeeType: 'percentage', platformFeePercentage: 5,
      platformCGST: 9, platformSGST: 9,
      gstRate: 18, platformFeeValue: 5,
      gstInvoiceSignature: null, platformInvoiceSignature: null,
      serviceCGST: 9, serviceSGST: 9, serviceHSN: '',
      servicePlatformFee: 5, servicePlatformCGST: 9, servicePlatformSGST: 9, serviceCategoryRates: [],
      venueCostSlabs: DEFAULT_VENUE_COST_SLABS
    });
  } else if (!settings.venueCostSlabs || settings.venueCostSlabs.length === 0) {
    settings.venueCostSlabs = DEFAULT_VENUE_COST_SLABS;
    await settings.save();
  }
  return settings;
};

platformSettingsSchema.statics.DEFAULT_VENUE_COST_SLABS = DEFAULT_VENUE_COST_SLABS;

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
