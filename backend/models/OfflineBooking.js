const mongoose = require('mongoose');
const Counter = require('./Counter');

const paymentRecordSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Cheque', 'Bank Transfer', 'Other'],
    required: true,
    default: 'Cash'
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  transactionReference: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  balanceBefore: {
    type: Number,
    default: 0
  },
  balanceAfter: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const offlineBookingSchema = new mongoose.Schema({
  // Unique offline booking identifier, e.g., "OB-26-0001"
  bookingId: {
    type: String,
    unique: true,
    index: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
    index: true
  },
  venueName: {
    type: String,
    trim: true
  },
  hallName: {
    type: String,
    trim: true,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Customer Details
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },

  // Event Details
  eventDate: {
    type: Date,
    required: true,
    index: true
  },
  eventSlot: {
    type: String,
    enum: ['Morning', 'Evening', 'Full Day'],
    required: true
  },
  eventType: {
    type: String,
    enum: ['Wedding', 'Birthday', 'Anniversary', 'Reception', 'Corporate', 'Other'],
    required: true,
    default: 'Wedding'
  },
  customEventType: {
    type: String,
    trim: true,
    default: ''
  },
  guestCount: {
    type: Number,
    min: 0,
    default: null
  },
  startTime: {
    type: String,
    trim: true,
    default: ''
  },
  endTime: {
    type: String,
    trim: true,
    default: ''
  },

  // Additional Details
  foodPackage: {
    type: String,
    trim: true,
    default: ''
  },
  decorationRequirements: {
    type: String,
    trim: true,
    default: ''
  },
  specialRequests: {
    type: String,
    trim: true,
    default: ''
  },
  idProofType: {
    type: String,
    enum: ['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving License', 'Other', '', null],
    default: null
  },
  idProofNumber: {
    type: String,
    trim: true,
    default: ''
  },

  // Financial Details
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  advanceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceDue: {
    type: Number,
    default: 0,
    min: 0
  },
  expectedFinalPaymentDate: {
    type: Date,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Paid'],
    default: 'Pending',
    index: true
  },
  payments: [paymentRecordSchema],

  // Booking Status
  bookingStatus: {
    type: String,
    enum: ['Tentative', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Confirmed',
    index: true
  },
  cancellationReason: {
    type: String,
    trim: true,
    default: ''
  },
  cancelledAt: {
    type: Date,
    default: null
  },

  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Helper static to generate distinct Offline Booking ID
offlineBookingSchema.statics.generateBookingId = async function() {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const counterId = `OFFLINE_BOOKING_${currentYear}`;
  const seq = await Counter.getNextSequence(counterId);
  const paddedSeq = String(seq).padStart(5, '0');
  return `OB-${currentYear}-${paddedSeq}`;
};

// Helper static to generate distinct Receipt Number
offlineBookingSchema.statics.generateReceiptNumber = async function() {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const counterId = `OFFLINE_RECEIPT_${currentYear}`;
  const seq = await Counter.getNextSequence(counterId);
  const paddedSeq = String(seq).padStart(5, '0');
  return `REC-OB-${currentYear}-${paddedSeq}`;
};

// Method to recalculate financial totals
offlineBookingSchema.methods.recalculateFinances = function() {
  const sumPaid = (this.payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  this.totalPaid = Math.max(0, sumPaid);
  this.balanceDue = Math.max(0, (this.totalAmount || 0) - this.totalPaid);

  if (this.totalPaid === 0) {
    this.paymentStatus = 'Pending';
  } else if (this.balanceDue === 0) {
    this.paymentStatus = 'Paid';
  } else {
    this.paymentStatus = 'Partially Paid';
  }
};

// Pre-save hook: auto-generate bookingId if missing and sync finances
offlineBookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    this.bookingId = await this.constructor.generateBookingId();
  }
  this.recalculateFinances();
  next();
});

// Compound indexes for optimal queries
offlineBookingSchema.index({ venue: 1, eventDate: 1, eventSlot: 1, bookingStatus: 1 });
offlineBookingSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('OfflineBooking', offlineBookingSchema);
