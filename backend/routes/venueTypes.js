const express = require('express');
const router = express.Router();
const {
  getVenueTypes,
  getAllVenueTypes,
  createVenueType,
  updateVenueType,
  deleteVenueType,
  seedVenueTypes
} = require('../controllers/venueTypeController');
const { protect, authorize, checkPermission } = require('../middleware/auth');

// Public routes
router.get('/', getVenueTypes);

// Admin routes
router.get('/admin', protect, authorize('admin'), checkPermission('venueTypes'), getAllVenueTypes);
router.post('/admin', protect, authorize('admin'), checkPermission('venueTypes'), createVenueType);
router.post('/admin/seed', protect, authorize('admin'), checkPermission('venueTypes'), seedVenueTypes);
router.put('/admin/:id', protect, authorize('admin'), checkPermission('venueTypes'), updateVenueType);
router.delete('/admin/:id', protect, authorize('admin'), checkPermission('venueTypes'), deleteVenueType);

module.exports = router;
