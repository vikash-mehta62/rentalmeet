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
    default: null // URL to signature image for GST/Venue Invoice
  },
  platformInvoiceSignature: {
    type: String,
    default: null // URL to signature image for Platform Invoice
  },
  
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
      venueCGST: 9,
      venueSGST: 9,
      venueHSN: '',
      platformFeeType: 'percentage',
      platformFeePercentage: 5,
      platformCGST: 9,
      platformSGST: 9,
      gstRate: 18,
      platformFeeValue: 5,
      commissionRate: 0,
      gstInvoiceSignature: null,
      platformInvoiceSignature: null
    });
  }
  return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
