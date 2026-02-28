const mongoose = require('mongoose');

const termsConditionsSchema = new mongoose.Schema({
  bookingTerms: [{
    point: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    }
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
    default: 7,
    description: 'Number of days quotation is valid'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TermsConditions', termsConditionsSchema);
