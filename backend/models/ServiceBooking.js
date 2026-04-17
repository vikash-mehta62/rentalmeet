const mongoose = require('mongoose');

const serviceBookingSchema = new mongoose.Schema({
  service:  { type: mongoose.Schema.Types.ObjectId, ref: 'VendorService', required: true },
  vendor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null if guest

  quotationNumber: { type: String }, // legacy
  bookingNumber:   { type: String },
  eventDate: { type: Date, required: true },

  // Customer snapshot
  customerInfo: {
    name:      String,
    email:     String,
    phone:     String,
    company:   String,
    eventName: String,
    notes:     String,
  },

  // Service snapshot
  serviceSnapshot: {
    title:       String,
    category:    String,
    companyName: String,
    city:        String,
    state:       String,
  },

  // Selected items
  items: [{
    name:     String,
    price:    Number,
    unit:     String,
    quantity: Number,
    amount:   Number,
  }],

  // Price breakdown
  pricing: {
    subtotal:       Number,
    serviceCGST:    Number,
    serviceSGST:    Number,
    cgstPct:        Number,
    sgstPct:        Number,
    platformFee:    Number,
    platformFeePct: Number,
    platformFeeGST: Number,
    total:          Number,
  },

  status: { type: String, enum: ['enquiry', 'confirmed', 'cancelled'], default: 'enquiry' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentDetails: { razorpay_order_id: String, razorpay_payment_id: String, razorpay_signature: String, paidAt: Date },
  amount: Number,
  coupon: { couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }, code: String, discountAmount: Number },
  downloadedAt: Date,
}, { timestamps: true });

// Auto-generate booking number using Counter (clean sequential: SB-YYYY-NNNN)
serviceBookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookingNumber) {
    try {
      const Counter = require('./Counter');
      const year = new Date().getFullYear();
      const seq = await Counter.getNextSequence(`service_booking_${year}`);
      this.bookingNumber = `SB-${year}-${String(seq).padStart(4, '0')}`;
      // also set quotationNumber for backward compat
      if (!this.quotationNumber) this.quotationNumber = this.bookingNumber;
    } catch (e) {
      const fallback = `SB-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      this.bookingNumber = fallback;
      if (!this.quotationNumber) this.quotationNumber = fallback;
    }
  }
  next();
});

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);
