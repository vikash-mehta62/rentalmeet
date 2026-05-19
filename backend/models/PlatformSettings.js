const mongoose = require('mongoose');

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
  
  // Legacy fields (kept for backward compatibility)
  gstRate: {
    type: Number,
    default: 18
  },
  platformFeeValue: {
    type: Number,
    default: 5
  },
  commissionRate: {
    type: Number,
    default: 0
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
      gstRate: 18, platformFeeValue: 5, commissionRate: 0,
      gstInvoiceSignature: null, platformInvoiceSignature: null,
      serviceCGST: 9, serviceSGST: 9, serviceHSN: '',
      servicePlatformFee: 5, servicePlatformCGST: 9, servicePlatformSGST: 9, serviceCategoryRates: []
    });
  }
  return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
