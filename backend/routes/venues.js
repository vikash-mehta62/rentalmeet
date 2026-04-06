const express = require('express');
const {
  createVenue,
  getVenues,
  getVenue,
  getVenueBySKU,
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

// Public: get valid coupons for a venue
router.get('/:id/coupons', getVenueCoupons);

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

module.exports = router;
