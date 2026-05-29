const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    unique: true,
    required: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  bookingType: {
    type: String,
    enum: ['hourly', 'halfday', 'fullday'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  // Selected amenities and services
  selectedAmenities: {
    basic: [{
      name: { type: String },
      type: { type: String },
      rate: { type: Number },
      rateType: { type: String },
      quantity: { type: Number, default: 1 },
      total: { type: Number }
    }],
    beverages: [{
      name: { type: String },
      ratePerUnit: { type: Number },
      brand: { type: String },
      quantity: { type: Number, default: 1 },
      total: { type: Number }
    }],
    refreshmentFood: [{
      name: { type: String },
      ratePerPlate: { type: Number },
      items: { type: String },
      quantity: { type: Number, default: 1 },
      total: { type: Number }
    }],
    lunchThalis: [{
      thaliType: { type: String },
      category: { type: String },
      ratePerPlate: { type: Number },
      numberOfItems: { type: Number },
      itemNames: { type: String },
      quantity: { type: Number, default: 1 },
      total: { type: Number }
    }],
    additional: [{
      name: { type: String },
      type: { type: String },
      charges: { type: Number },
      quantity: { type: Number, default: 1 },
      total: { type: Number }
    }]
  },
  amenitiesTotal: {
    type: Number,
    default: 0
  },
  // Price breakdown
  priceBreakdown: {
    basePrice: Number,
    amenitiesTotal: Number,
    subtotal: Number,
    // Venue GST
    venueCGST: Number,
    venueCGSTRate: Number,
    venueSGST: Number,
    venueSGSTRate: Number,
    gst: Number,          // venueCGST + venueSGST (combined, for backward compat)
    gstRate: Number,      // combined rate
    // Platform Fee
    platformFee: Number,
    platformFeeRate: Number,
    platformFeeCGST: Number,
    platformFeeCGSTRate: Number,
    platformFeeSGST: Number,
    platformFeeSGSTRate: Number,
    platformFeeGST: Number,   // platformFeeCGST + platformFeeSGST
    platformFeeTotal: Number, // platformFee + platformFeeGST
    // Discount & Total
    discount: Number,
    couponCode: String,
    total: Number
  },
  // Coupon applied
  coupon: {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    code: String,
    discountAmount: Number
  },
  
  // New: Venue Invoice Data (Invoice 1)
  venueInvoice: {
    invoiceNumber: String,
    amount: Number,           // Base booking amount
    cgst: Number,            // Venue CGST amount
    cgstRate: Number,        // Venue CGST rate (%)
    sgst: Number,            // Venue SGST amount
    sgstRate: Number,        // Venue SGST rate (%)
    total: Number,           // Venue total with GST
    hsnCode: {
      type: String,
      default: '9973'        // HSN for venue rental service
    }
  },
  
  // New: Platform Invoice Data (Invoice 2)
  platformInvoice: {
    invoiceNumber: String,
    platformFee: Number,      // Platform fee amount
    platformFeeRate: Number,  // Platform fee rate (%)
    cgst: Number,            // Platform CGST amount
    cgstRate: Number,        // Platform CGST rate (%)
    sgst: Number,            // Platform SGST amount
    sgstRate: Number,        // Platform SGST rate (%)
    total: Number,           // Platform total with GST
    hsnCode: {
      type: String,
      default: '999799'      // HSN for platform service
    }
  },
  
  // New: GST Settings Snapshot (at time of booking)
  gstSettingsSnapshot: {
    venueCGST: Number,
    venueSGST: Number,
    venueHSN: String,
    platformFeePercentage: Number,
    platformCGST: Number,
    platformSGST: Number
  },
  // Customer details
  customerDetails: {
    name: String,
    email: String,
    phone: String,
    eventType: String,
    guestCount: Number,
    specialRequirements: String,
    gstNumber: String,
    companyName: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentId: String,
  paymentDetails: {
    razorpay_order_id: String,
    razorpay_payment_id: String,
    razorpay_signature: String,
    paidAt: Date
  },
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Who initiated the cancellation
  cancelledByRole: {
    type: String,
    enum: ['customer', 'owner', 'vendor', 'admin', 'system'],
    default: null
  },
  // How it was cancelled
  cancellationType: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'manual'
  },
  // Auto-cancel deadline: set at booking creation based on venue's confirmationHours
  confirmationDeadline: {
    type: Date
  },
  // Track if owner already used "Approve Soon" (one-time only)
  approveSoonUsed: {
    type: Boolean,
    default: false
  },
  // Refund tracking
  refundDetails: {
    refundId: String,
    refundAmount: Number,
    refundStatus: { type: String, enum: ['pending', 'processed', 'failed'] },
    refundedAt: Date,
    refundReason: String
  },

  // ── Payment Ledger ────────────────────────────────────────────────────────
  // Tracks every rupee: what was due, what was paid, what is pending/refundable
  paymentLedger: {
    // Running totals (auto-updated)
    totalDue:     { type: Number, default: 0 },  // Current booking amount
    totalPaid:    { type: Number, default: 0 },  // Sum of all successful payments
    amountDue:    { type: Number, default: 0 },  // totalDue - totalPaid  (>0 = customer owes)
    refundDue:    { type: Number, default: 0 },  // totalPaid - totalDue  (>0 = we owe customer)

    // Full transaction history
    transactions: [{
      txnId:      { type: String },              // Razorpay / manual ref
      type:       { type: String, enum: ['payment', 'refund', 'adjustment', 'manual_payment', 'manual_refund'] },
      amount:     { type: Number },              // +ve for payment, -ve for refund
      status:     { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
      note:       { type: String },              // reason / description
      performedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who did it
      date:       { type: Date, default: Date.now }
    }],

    // Price change history (every time booking amount changes)
    adjustments: [{
      oldAmount:  { type: Number },
      newAmount:  { type: Number },
      difference: { type: Number },              // newAmount - oldAmount (+ve = more due, -ve = refund due)
      reason:     { type: String },              // 'modification', 'coupon', 'admin_adjustment'
      performedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      date:       { type: Date, default: Date.now }
    }]
  }
}, {
  timestamps: true
});

// Auto adjust earnings when saving (commission disabled by default)
bookingSchema.pre('save', function(next) {
  if (this.commissionRate && this.commissionRate > 0) {
    this.commission = (this.amount * this.commissionRate) / 100;
    this.ownerEarnings = this.amount - this.commission;
  } else {
    this.commission = 0;
    if (this.priceBreakdown && typeof this.priceBreakdown.subtotal === 'number') {
      this.ownerEarnings = this.priceBreakdown.subtotal;
    } else if (typeof this.ownerEarnings !== 'number' || isNaN(this.ownerEarnings)) {
      this.ownerEarnings = this.amount;
    }
  }

  // ── Sync paymentLedger totals ──────────────────────────────────────────
  if (!this.paymentLedger) this.paymentLedger = {};
  this.paymentLedger.totalDue = this.amount || 0;

  // Sum all completed payment/manual_payment transactions
  const paid = (this.paymentLedger.transactions || [])
    .filter(t => ['payment', 'manual_payment'].includes(t.type) && t.status === 'completed')
    .reduce((s, t) => s + (t.amount || 0), 0);

  // Sum all completed refund transactions
  const refunded = (this.paymentLedger.transactions || [])
    .filter(t => ['refund', 'manual_refund'].includes(t.type) && t.status === 'completed')
    .reduce((s, t) => s + (t.amount || 0), 0);

  this.paymentLedger.totalPaid = paid - refunded;
  const balance = this.paymentLedger.totalDue - this.paymentLedger.totalPaid;
  this.paymentLedger.amountDue  = balance > 0 ? balance : 0;
  this.paymentLedger.refundDue  = balance < 0 ? Math.abs(balance) : 0;

  next();
});

bookingSchema.index({ venue: 1, bookingDate: 1 });
bookingSchema.index({ customer: 1 });
bookingSchema.index({ status: 1 });

// Helper method to generate invoice numbers
bookingSchema.methods.generateInvoiceNumbers = function() {
  const bookingId = this.bookingNumber || this._id.toString().slice(-8).toUpperCase();
  this.venueInvoice.invoiceNumber = `VEN-${bookingId}`;
  this.platformInvoice.invoiceNumber = `PLT-${bookingId}`;
};

// Helper method to calculate GST invoices
bookingSchema.methods.calculateGSTInvoices = function(gstSettings) {
  const baseAmount = this.priceBreakdown?.subtotal || this.amount;
  
  // Venue Invoice Calculation
  this.venueInvoice = {
    invoiceNumber: this.venueInvoice?.invoiceNumber || `VEN-${this.bookingNumber}`,
    amount: baseAmount,
    cgstRate: gstSettings.venueCGST,
    cgst: (baseAmount * gstSettings.venueCGST) / 100,
    sgstRate: gstSettings.venueSGST,
    sgst: (baseAmount * gstSettings.venueSGST) / 100,
    hsnCode: gstSettings.venueHSN || '9973'
  };
  this.venueInvoice.total = this.venueInvoice.amount + this.venueInvoice.cgst + this.venueInvoice.sgst;
  
  // Platform Invoice Calculation
  const platformFee = (baseAmount * gstSettings.platformFeePercentage) / 100;
  this.platformInvoice = {
    invoiceNumber: this.platformInvoice?.invoiceNumber || `PLT-${this.bookingNumber}`,
    platformFeeRate: gstSettings.platformFeePercentage,
    platformFee: platformFee,
    cgstRate: gstSettings.platformCGST,
    cgst: (platformFee * gstSettings.platformCGST) / 100,
    sgstRate: gstSettings.platformSGST,
    sgst: (platformFee * gstSettings.platformSGST) / 100,
    hsnCode: '999799'
  };
  this.platformInvoice.total = this.platformInvoice.platformFee + this.platformInvoice.cgst + this.platformInvoice.sgst;
  
  // Save GST settings snapshot
  this.gstSettingsSnapshot = {
    venueCGST: gstSettings.venueCGST,
    venueSGST: gstSettings.venueSGST,
    venueHSN: gstSettings.venueHSN,
    platformFeePercentage: gstSettings.platformFeePercentage,
    platformCGST: gstSettings.platformCGST,
    platformSGST: gstSettings.platformSGST
  };
  
  // Update total amount
  this.amount = this.venueInvoice.total + this.platformInvoice.total;
  
  return {
    venueInvoice: this.venueInvoice,
    platformInvoice: this.platformInvoice,
    customerPays: this.amount
  };
};

module.exports = mongoose.model('Booking', bookingSchema);
