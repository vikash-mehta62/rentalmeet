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

// Auto-generate separate booking and quotation numbers
serviceBookingSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Counter = require('./Counter');
      const year = new Date().getFullYear();
      if (!this.bookingNumber) {
        const bookingSeq = await Counter.getNextSequence(`service_booking_order_${year}`);
        this.bookingNumber = `SVC-ORD-${year}-${String(bookingSeq).padStart(4, '0')}`;
      }
      if (!this.quotationNumber) {
        const quotationSeq = await Counter.getNextSequence(`service_booking_quote_${year}`);
        this.quotationNumber = `SVC-QTN-${year}-${String(quotationSeq).padStart(6, '0')}`;
      }
    } catch (e) {
      const year = new Date().getFullYear();
      if (!this.bookingNumber) this.bookingNumber = `SVC-ORD-${year}-${Date.now().toString().slice(-6)}`;
      if (!this.quotationNumber) this.quotationNumber = `SVC-QTN-${year}-${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);
