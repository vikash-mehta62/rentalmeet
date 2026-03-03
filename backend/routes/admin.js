const express = require('express');
const {
  getPendingVenues,
  approveVenue,
  rejectVenue,
  suspendVenue,
  activateVenue,
  updateVenueSettings,
  getCommissionSettings,
  updateCommissionRate,
  getPlatformSettings,
  updatePlatformSettings,
  getEarningsReport,
  getDashboardStats,
  getAllUsers,
  getUser,
  updateUserStatus,
  getAllBookings,
  getBooking,
  getAllPayments,
  getPayment,
  getReports,
  getTermsConditions,
  updateTermsConditions
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are admin only
router.use(protect);
router.use(authorize('admin'));

// Venue routes
router.get('/venues/pending', getPendingVenues);
router.put('/venues/:id/approve', approveVenue);
router.put('/venues/:id/reject', rejectVenue);
router.put('/venues/:id/suspend', suspendVenue);
router.put('/venues/:id/activate', activateVenue);
router.put('/venues/:id/settings', updateVenueSettings);

// User routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUser);
router.put('/users/:id/status', updateUserStatus);

// Booking routes
router.get('/bookings', getAllBookings);
router.get('/bookings/:id', getBooking);

// Payment routes
router.get('/payments', getAllPayments);
router.get('/payments/:id', getPayment);

// Commission routes
router.route('/commission')
  .get(getCommissionSettings)
  .put(updateCommissionRate);

// Platform Settings routes (GST & Platform Fee)
router.route('/platform-settings')
  .get(getPlatformSettings)
  .put(updatePlatformSettings);

// Terms & Conditions routes
router.route('/terms')
  .get(getTermsConditions)
  .put(updateTermsConditions);

// Reports and stats
router.get('/reports', getReports);
router.get('/earnings', getEarningsReport);
router.get('/stats', getDashboardStats);

module.exports = router;
