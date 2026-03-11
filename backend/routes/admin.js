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
  updateTermsConditions,
  getAllHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  getContactSettings,
  updateContactSettings,
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  getAllSubAdmins,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  toggleSubAdminStatus
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Hero Slides routes (with explicit auth)
router.get('/hero-slides', protect, authorize('admin'), getAllHeroSlides);
router.post('/hero-slides', protect, authorize('admin'), upload.single('image'), createHeroSlide);
router.put('/hero-slides/:id', protect, authorize('admin'), upload.single('image'), updateHeroSlide);
router.delete('/hero-slides/:id', protect, authorize('admin'), deleteHeroSlide);

// Contact Settings routes
router.route('/contact-settings')
  .get(protect, authorize('admin'), getContactSettings)
  .put(protect, authorize('admin'), updateContactSettings);

// Employee Management routes
router.route('/employees')
  .get(protect, authorize('admin'), getAllEmployees)
  .post(protect, authorize('admin'), createEmployee);

router.route('/employees/:id')
  .put(protect, authorize('admin'), updateEmployee)
  .delete(protect, authorize('admin'), deleteEmployee);

router.put('/employees/:id/status', protect, authorize('admin'), toggleEmployeeStatus);

// SubAdmin Management routes (only main admin can manage subadmins)
router.route('/subadmins')
  .get(protect, authorize('admin'), getAllSubAdmins)
  .post(protect, authorize('admin'), createSubAdmin);

router.route('/subadmins/:id')
  .put(protect, authorize('admin'), updateSubAdmin)
  .delete(protect, authorize('admin'), deleteSubAdmin);

router.put('/subadmins/:id/status', protect, authorize('admin'), toggleSubAdminStatus);

// All other routes are admin only
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
