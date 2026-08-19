const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  visitorId: {
    type: String,
    required: true,
    index: true,
  },
  visitId: {
    type: String,
    default: null,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  eventName: {
    type: String,
    required: true,
    index: true,
  },
  eventCategory: {
    type: String,
    enum: ['engagement', 'e-commerce', 'navigation', 'conversion'],
    default: 'engagement',
    index: true,
  },
  eventSource: {
    type: String,
    enum: ['client', 'server_webhook'],
    default: 'client',
  },
  sourceEventId: {
    type: String,
    default: null,
    sparse: true,
    unique: true, // Idempotency key for payment/booking webhook retries
  },
  eventData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  path: {
    type: String,
    default: '/',
  },
  isBot: {
    type: Boolean,
    default: false,
    index: true,
  },
}, { timestamps: true });

analyticsEventSchema.index({ createdAt: -1 });
analyticsEventSchema.index({ eventName: 1, createdAt: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
