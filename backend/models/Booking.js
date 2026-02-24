const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  commission: {
    type: Number,
    required: true
  },
  ownerEarnings: {
    type: Number,
    required: true
  },
  commissionRate: {
    type: Number,
    default: 15
  },
  // Selected amenities and services
  selectedAmenities: {
    basic: [{
      name: String,
      type: String,
      rate: Number
    }],
    beverages: [{
      name: String,
      ratePerUnit: Number,
      brand: String
    }],
    refreshmentFood: [{
      name: String,
      ratePerPlate: Number,
      items: String
    }],
    lunchThalis: [{
      type: String,
      ratePerPlate: Number,
      numberOfItems: Number,
      itemNames: String
    }],
    additional: [{
      name: String,
      type: String,
      charges: Number
    }]
  },
  // Price breakdown
  priceBreakdown: {
    basePrice: Number,
    amenitiesTotal: Number,
    subtotal: Number,
    gst: Number,
    total: Number
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
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto calculate commission and owner earnings
bookingSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('commissionRate')) {
    this.commission = (this.amount * this.commissionRate) / 100;
    this.ownerEarnings = this.amount - this.commission;
  }
  next();
});

bookingSchema.index({ venue: 1, bookingDate: 1 });
bookingSchema.index({ customer: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
