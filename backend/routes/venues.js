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
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { getVenueCoupons } = require('../controllers/couponController');

const router = express.Router();

router.route('/')
  .get(getVenues)
  .post(protect, authorize('owner', 'admin'), createVenue);

router.get('/my-venues', protect, authorize('owner'), getMyVenues);

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
  .put(protect, authorize('owner', 'admin'), updateVenue)
  .delete(protect, authorize('owner', 'admin'), deleteVenue);

router.post('/:id/images', 
  protect, 
  authorize('owner', 'admin'), 
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

module.exports = router;
