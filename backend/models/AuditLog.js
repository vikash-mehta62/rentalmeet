const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'AUTH',
      'AMBASSADOR',
      'VENUE',
      'VENDOR',
      'USER',
      'EMPLOYEE',
      'SUBADMIN',
      'BOOKING',
      'PAYMENT',
      'COUPON',
      'SETTINGS',
      'SUBMISSION_ATTEMPT',
      'SYSTEM'
    ],
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'ATTEMPT', 'WARNING', 'INFO'],
    default: 'SUCCESS',
    index: true
  },
  performedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    role: { type: String },
    isSystem: { type: Boolean, default: false }
  },
  targetType: {
    type: String,
    index: true
  },
  targetId: {
    type: String,
    index: true
  },
  targetName: {
    type: String
  },
  previousState: {
    type: mongoose.Schema.Types.Mixed
  },
  newState: {
    type: mongoose.Schema.Types.Mixed
  },
  reason: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  errorMessage: {
    type: String
  },
  ipAddress: {
    type: String,
    index: true
  },
  userAgent: {
    type: String
  },
  requestPath: {
    type: String
  },
  requestMethod: {
    type: String
  }
}, {
  timestamps: true
});

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ category: 1, action: 1 });
auditLogSchema.index({ 'performedBy.userId': 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
