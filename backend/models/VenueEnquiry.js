const mongoose = require('mongoose');

const venueEnquirySchema = new mongoose.Schema({
  enquiryNumber: {
    type: String,
    unique: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    company: String,
    address: String,
    gstin: String,
    eventType: String,
    guestCount: Number,
    specialRequirements: String
  },
  bookingDetails: {
    date: { type: Date, required: true },
    bookingDate: String,
    startTime: { type: String, required: true },
    endTime: String,
    duration: { type: String, required: true },
    bookingType: String,
    guests: Number,
    purpose: String,
    specialRequests: String
  },
  selectedAmenities: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ basic: [], beverages: [], refreshmentFood: [], lunchThalis: [], additional: [] })
  },
  priceBreakdown: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },
  estimatedAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'converted', 'cancelled'],
    default: 'pending'
  },
  convertedBookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  notes: String
}, {
  timestamps: true
});

// Auto generate enquiry number
venueEnquirySchema.pre('save', async function(next) {
  if (!this.enquiryNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    this.enquiryNumber = `ENQ-${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('VenueEnquiry', venueEnquirySchema);
