const mongoose = require('mongoose');

const utmSchema = new mongoose.Schema({
  source:   { type: String, default: null },
  medium:   { type: String, default: null },
  campaign: { type: String, default: null },
  content:  { type: String, default: null },
  term:     { type: String, default: null },
}, { _id: false });

const visitLogSchema = new mongoose.Schema({
  visitId: {
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  userRole: {
    type: String,
    enum: ['guest', 'customer', 'owner', 'vendor', 'admin', 'subadmin', 'employee', 'ambassador'],
    default: 'guest',
    index: true,
  },
  userName: {
    type: String,
    default: null,
  },
  userEmail: {
    type: String,
    default: null,
  },
  path: {
    type: String,
    required: true,
    index: true,
  },
  pageTitle: {
    type: String,
    default: '',
  },
  ip: {
    type: String,
    default: 'Unknown',
  },
  country: {
    type: String,
    default: 'India',
    index: true,
  },
  state: {
    type: String,
    default: 'Unknown State',
    index: true,
  },
  city: {
    type: String,
    default: 'Unknown City',
    index: true,
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'desktop',
    index: true,
  },
  browser: {
    type: String,
    default: 'Other',
    index: true,
  },
  os: {
    type: String,
    default: 'Other',
    index: true,
  },
  referrer: {
    type: String,
    default: 'Direct',
  },
  isBot: {
    type: Boolean,
    default: false,
    index: true,
  },
  botName: {
    type: String,
    default: null,
  },
  firstTouch: utmSchema,
  lastTouch:  utmSchema,
  durationSeconds: {
    type: Number,
    default: 0,
  },
  lastReportedActiveSeconds: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

visitLogSchema.index({ createdAt: -1 });
visitLogSchema.index({ country: 1, state: 1, city: 1 });
visitLogSchema.index({ path: 1, createdAt: -1 });

module.exports = mongoose.model('VisitLog', visitLogSchema);
