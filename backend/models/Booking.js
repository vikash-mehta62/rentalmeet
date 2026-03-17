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
    gst: Number,
    gstRate: Number,
    platformFee: Number,
    discount: Number,
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
    specialRequirements: String
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
    // Prefer subtotal from priceBreakdown when available
    if (this.priceBreakdown && typeof this.priceBreakdown.subtotal === 'number') {
      this.ownerEarnings = this.priceBreakdown.subtotal;
    } else if (typeof this.ownerEarnings !== 'number' || isNaN(this.ownerEarnings)) {
      this.ownerEarnings = this.amount;
    }
  }
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
