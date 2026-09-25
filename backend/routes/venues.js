const express = require('express');
const {
  createVenue,
  getVenues,
  getVenue,
  getVenueBySKU,
  getVenueForEdit,
  updateVenue,
  deleteVenue,
  uploadImages,
  getMyVenues,
  getLocations,
  getPublicPlatformSettings
} = require('../controllers/venueController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { getVenueCoupons } = require('../controllers/couponController');

const router = express.Router();

router.route('/')
  .get(getVenues)
  .post(protect, authorize('owner', 'ambassador', 'admin'), createVenue);

router.get('/my-venues', protect, authorize('owner', 'ambassador'), getMyVenues);

// Locations endpoint
router.get('/locations/all', getLocations);

// Public platform settings endpoint (for booking calculations)
router.get('/platform-settings/public', getPublicPlatformSettings);

// SKU route must come before :id route
router.get('/sku/:sku', getVenueBySKU);

// Public: Generate a new sequential quotation number (must be before /:id)
router.get('/generate-quotation-number', async (req, res) => {
  try {
    const Counter = require('../models/Counter');
    const year = new Date().getFullYear();
    const counterId = `quotation_${year}`;
    const seq = await Counter.getNextSequence(counterId);
    const quotationNumber = `QT-${year}-${seq.toString().padStart(6, '0')}`;
    res.json({ success: true, quotationNumber });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public: get valid coupons for a venue
router.get('/:id/coupons', getVenueCoupons);

// Edit route — full data with decrypted bank details (owner/admin only)
router.get('/:id/edit', protect, getVenueForEdit);

router.route('/:id')
  .get(getVenue)
  .put(protect, authorize('owner', 'ambassador', 'admin'), updateVenue)
  .delete(protect, authorize('owner', 'admin'), deleteVenue);

router.post('/:id/images', 
  protect, 
  authorize('owner', 'ambassador', 'admin'), 
  upload.array('images', 20), 
  uploadImages
);

// Public: Record quotation download (customer downloads quotation PDF)
router.post('/:venueId/quotation-download', async (req, res) => {
  try {
    const QuotationDownload = require('../models/QuotationDownload');
    const {
      quotationNumber, action, totalAmount,
      venueSnapshot, customerSnapshot, bookingSnapshot, priceSnapshot
    } = req.body;

    const record = await QuotationDownload.create({
      venue: req.params.venueId,
      customer: req.user?._id || null,
      quotationNumber,
      action: action || 'download',
      totalAmount,
      venueSnapshot,
      customerSnapshot,
      bookingSnapshot,
      priceSnapshot
    });

    res.status(201).json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/venues/sku/:sku/enquiry
// @desc    Submit off-hours venue booking enquiry / draft
router.post('/sku/:sku/enquiry', optionalAuth, async (req, res) => {
  try {
    const Venue = require('../models/Venue');
    const VenueEnquiry = require('../models/VenueEnquiry');
    const User = require('../models/User');

    const venue = await Venue.findOne({ sku: req.params.sku });
    if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });

    const {
      customerDetails,
      bookingDetails,
      selectedAmenities,
      priceBreakdown,
      estimatedAmount,
      notes,
      customerId
    } = req.body;

    if (!customerDetails || !customerDetails.name || !customerDetails.email || !customerDetails.phone) {
      return res.status(400).json({ success: false, message: 'Customer name, email and phone are required' });
    }

    const rawDate = bookingDetails?.date || bookingDetails?.bookingDate;
    const startTime = bookingDetails?.startTime;
    const duration = bookingDetails?.duration || bookingDetails?.bookingType;

    if (!rawDate || !startTime || !duration) {
      return res.status(400).json({ success: false, message: 'Booking date, start time and duration are required' });
    }

    const parsedDate = new Date(rawDate);
    const dateString = typeof rawDate === 'string' ? rawDate : parsedDate.toISOString().split('T')[0];

    // Determine customer User ID if authenticated or matching user exists
    let customerUserId = customerId || req.user?._id || null;
    if (!customerUserId && customerDetails.email) {
      const existingUser = await User.findOne({ email: customerDetails.email.toLowerCase().trim() });
      if (existingUser) customerUserId = existingUser._id;
    }

    const enquiry = await VenueEnquiry.create({
      venue: venue._id,
      customer: customerUserId,
      customerDetails: {
        name: customerDetails.name,
        email: customerDetails.email,
        phone: customerDetails.phone,
        company: customerDetails.company || '',
        address: customerDetails.address || '',
        gstin: customerDetails.gstin || '',
        eventType: customerDetails.eventType || bookingDetails?.purpose || '',
        guestCount: customerDetails.guestCount || bookingDetails?.guests || 1,
        specialRequirements: customerDetails.specialRequirements || notes || ''
      },
      bookingDetails: {
        date: parsedDate,
        bookingDate: dateString,
        startTime: startTime,
        endTime: bookingDetails?.endTime || '',
        duration: String(duration),
        bookingType: bookingDetails?.bookingType || '',
        guests: customerDetails.guestCount || bookingDetails?.guests || 1,
        purpose: customerDetails.eventType || bookingDetails?.purpose || '',
        specialRequests: customerDetails.specialRequirements || notes || ''
      },
      selectedAmenities: selectedAmenities || { basic: [], beverages: [], refreshmentFood: [], lunchThalis: [], additional: [] },
      priceBreakdown: priceBreakdown || {},
      estimatedAmount: estimatedAmount || priceBreakdown?.total || 0,
      notes: notes || customerDetails.specialRequirements || '',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully! Venue team will review and you can convert this to booking during active hours.',
      enquiry
    });
  } catch (err) {
    console.error('Error submitting venue enquiry:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/venues/enquiry/:id
// @desc    Get venue enquiry by ID to autofill draft in booking form
router.get('/enquiry/:id', async (req, res) => {
  try {
    const VenueEnquiry = require('../models/VenueEnquiry');
    const enquiry = await VenueEnquiry.findById(req.params.id).populate('venue', 'businessName sku images location pricing availability');
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

    res.json({ success: true, enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

