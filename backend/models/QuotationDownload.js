const mongoose = require('mongoose');

const quotationDownloadSchema = new mongoose.Schema({
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    enum: ['download', 'print'],
    default: 'download'
  },
  quotationNumber: String,
  totalAmount: Number,

  // Full venue snapshot
  venueSnapshot: {
    businessName: String,
    sku: String,
    city: String,
    state: String,
    address: String,
    capacity: Number
  },

  // Customer details snapshot
  customerSnapshot: {
    name: String,
    email: String,
    phone: String,
    eventType: String,
    guestCount: Number,
    specialRequirements: String
  },

  // Booking details snapshot
  bookingSnapshot: {
    date: String,
    startTime: String,
    endTime: String,
    duration: String,
    bookingType: String
  },

  // Full price breakdown snapshot
  priceSnapshot: {
    basePrice: Number,
    amenitiesTotal: Number,
    subtotal: Number,
    gst: Number,
    platformFee: Number,
    platformFeeGST: Number,
    discount: Number,
    grandTotal: Number
  },

  downloadedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('QuotationDownload', quotationDownloadSchema);
