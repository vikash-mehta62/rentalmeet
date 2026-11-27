const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subscriptionId: {
    type: String,
    unique: true,
    sparse: true
  },
  plan: {
    type: String,
    enum: ['starter', 'pro', 'business'],
    default: 'starter',
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['free', 'monthly', 'annual'],
    default: 'free'
  },
  amount: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
    index: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: null // null for Starter (Free Forever)
  },
  paymentDetails: {
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,
    paidAt: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'free'],
    default: 'free'
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  notificationSent7Days: {
    type: Boolean,
    default: false
  },
  notificationSent1Day: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

subscriptionSchema.index({ owner: 1, status: 1 });
subscriptionSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
