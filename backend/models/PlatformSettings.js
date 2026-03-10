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
    default: 'percentage'
  },
  platformFeeValue: {
    type: Number,
    required: true,
    default: 5,
    min: 0
  },
  
  // Commission Settings
  commissionRate: {
    type: Number,
    required: true,
    default: 0,
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
      platformFeeType: 'percentage',
      platformFeeValue: 5,
      commissionRate: 0
    });
  }
  return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
