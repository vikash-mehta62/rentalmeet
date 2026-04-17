const mongoose = require('mongoose');

const termsConditionsSchema = new mongoose.Schema({
  bookingTerms: [{
    point: { type: String, required: true },
    order: { type: Number, required: true }
  }],
  cancellationPolicy: {
    type: String,
    default: 'Full refund if cancelled 48 hours before booking date, 50% refund if cancelled 24 hours before, no refund for same-day cancellations.'
  },
  paymentTerms: {
    type: String,
    default: 'Payment to be made after venue owner confirmation through RentalMeet platform.'
  },
  quotationValidity: {
    type: Number,
    default: 7
  },
  venueOnboardingTerms: {
    type: String,
    default: `RentalMeet Venue Owner Agreement

1. Commission Agreement
• I agree to pay RentalMeet platform service fee on all confirmed bookings
• Platform fee will be deducted before payout
• Payouts processed within 24-48 hours after event completion

2. Venue Standards
• Maintain venue as described in listing
• Provide all promised amenities and facilities
• Ensure venue is clean and ready before each booking

3. Booking Management
• Respond to booking requests within 2 hours
• Honor confirmed bookings
• Update calendar regularly

4. Legal Compliance
• Have all necessary permits and licenses
• Comply with fire safety and building regulations
• Maintain adequate insurance coverage`
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('TermsConditions', termsConditionsSchema);
