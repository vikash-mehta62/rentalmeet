const mongoose = require('mongoose');

const utmSchema = new mongoose.Schema({
  source:   { type: String, default: null },
  medium:   { type: String, default: null },
  campaign: { type: String, default: null },
  content:  { type: String, default: null },
  term:     { type: String, default: null },
}, { _id: false });

const sessionLogSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
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
    default: 'guest',
  },
  userName: {
    type: String,
    default: null,
  },
  userEmail: {
    type: String,
    default: null,
  },
  landingPage: {
    type: String,
    required: true,
  },
  exitPage: {
    type: String,
    default: '',
  },
  pageViewsCount: {
    type: Number,
    default: 1,
  },
  eventsCount: {
    type: Number,
    default: 0,
  },
  totalDurationSeconds: {
    type: Number,
    default: 0,
  },
  isBounce: {
    type: Boolean,
    default: true,
    index: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
    index: true,
  },
  lastActiveTime: {
    type: Date,
    default: Date.now,
    index: true,
  },
  endTime: {
    type: Date,
    default: null,
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
    default: 'desktop',
    index: true,
  },
  browser: {
    type: String,
    default: 'Other',
  },
  os: {
    type: String,
    default: 'Other',
  },
  isBot: {
    type: Boolean,
    default: false,
    index: true,
  },
  firstTouch: utmSchema,
  lastTouch:  utmSchema,
}, { timestamps: true });

sessionLogSchema.index({ lastActiveTime: -1 });
sessionLogSchema.index({ startTime: -1 });

module.exports = mongoose.model('SessionLog', sessionLogSchema);
