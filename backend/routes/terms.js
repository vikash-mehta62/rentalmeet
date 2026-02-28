const express = require('express');
const TermsConditions = require('../models/TermsConditions');

const router = express.Router();

// @desc    Get current terms and conditions (public)
// @route   GET /api/terms
router.get('/', async (req, res) => {
  try {
    let terms = await TermsConditions.findOne().sort('-createdAt');
    
    // Return default terms if none exist
    if (!terms) {
      terms = {
        bookingTerms: [
          { point: 'This quotation is valid for 7 days from the date of issue.', order: 1 },
          { point: 'This is a booking request and not a confirmed booking. Final confirmation subject to venue owner approval.', order: 2 },
          { point: 'Payment to be made after venue owner confirmation through RentalMeet platform.', order: 3 },
          { point: 'Cancellation policy: Full refund if cancelled 48 hours before booking date, 50% refund if cancelled 24 hours before, no refund for same-day cancellations.', order: 4 },
          { point: 'Customer is responsible for any damages to the venue property during the event.', order: 5 }
        ],
        cancellationPolicy: 'Full refund if cancelled 48 hours before booking date, 50% refund if cancelled 24 hours before, no refund for same-day cancellations.',
        paymentTerms: 'Payment to be made after venue owner confirmation through RentalMeet platform.',
        quotationValidity: 7
      };
    }
    
    res.json({
      success: true,
      terms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
