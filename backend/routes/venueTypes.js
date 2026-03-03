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
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getVenueTypes);

// Admin routes
router.get('/admin', protect, authorize('admin'), getAllVenueTypes);
router.post('/admin', protect, authorize('admin'), createVenueType);
router.post('/admin/seed', protect, authorize('admin'), seedVenueTypes);
router.put('/admin/:id', protect, authorize('admin'), updateVenueType);
router.delete('/admin/:id', protect, authorize('admin'), deleteVenueType);

module.exports = router;
