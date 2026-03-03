const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  // GST Settings
  gstRate: {
    type: Number,
    required: true,
    default: 18, // 18% GST
    min: 0,
    max: 100
  },
  
  // Platform Fee Settings
  platformFeeType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed'
  },
  platformFeeValue: {
    type: Number,
    required: true,
    default: 500, // ₹500 or 5%
    min: 0
  },
  
  // Commission Settings
  commissionRate: {
    type: Number,
    required: true,
    default: 15, // 15% commission
    min: 0,
    max: 100
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
      gstRate: 18,
      platformFeeType: 'fixed',
      platformFeeValue: 500,
      commissionRate: 15
    });
  }
  return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
