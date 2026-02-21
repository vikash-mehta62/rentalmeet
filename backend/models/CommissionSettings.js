const mongoose = require('mongoose');

const commissionSettingsSchema = new mongoose.Schema({
  commissionRate: {
    type: Number,
    required: true,
    default: 15,
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

module.exports = mongoose.model('CommissionSettings', commissionSettingsSchema);
