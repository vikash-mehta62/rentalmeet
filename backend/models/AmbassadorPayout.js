const mongoose = require('mongoose');

const ambassadorPayoutSchema = new mongoose.Schema({
  payoutNumber: {
    type: String,
    unique: true,
    required: true
  },
  ambassador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbassadorProfile',
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 100
  },
  payoutMethod: {
    type: String,
    enum: ['UPI', 'Bank Transfer'],
    required: true
  },
  payoutDetails: {
    upiId: String,
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    ifscCode: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending',
    index: true
  },
  transactionReference: String,
  rejectionReason: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('AmbassadorPayout', ambassadorPayoutSchema);
