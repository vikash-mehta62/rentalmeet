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
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Hero Slides routes (with explicit auth)
router.get('/hero-slides', protect, authorize('admin'), checkPermission('heroSlides'), getAllHeroSlides);
router.post('/hero-slides', protect, authorize('admin'), checkPermission('heroSlides'), upload.single('image'), createHeroSlide);
router.put('/hero-slides/:id', protect, authorize('admin'), checkPermission('heroSlides'), upload.single('image'), updateHeroSlide);
router.delete('/hero-slides/:id', protect, authorize('admin'), checkPermission('heroSlides'), deleteHeroSlide);

// Contact Settings routes
router.route('/contact-settings')
  .get(protect, authorize('admin'), checkPermission('settings'), getContactSettings)
  .put(protect, authorize('admin'), checkPermission('settings'), updateContactSettings);

// Employee Management routes
router.route('/employees')
  .get(protect, authorize('admin'), checkPermission('employees'), getAllEmployees)
  .post(protect, authorize('admin'), checkPermission('employees'), createEmployee);

router.route('/employees/:id')
  .put(protect, authorize('admin'), checkPermission('employees'), updateEmployee)
  .delete(protect, authorize('admin'), checkPermission('employees'), deleteEmployee);

router.put('/employees/:id/status', protect, authorize('admin'), checkPermission('employees'), toggleEmployeeStatus);

// SubAdmin Management routes (only main admin can manage subadmins)
router.route('/subadmins')
  .get(protect, authorize('admin'), getAllSubAdmins)
  .post(protect, authorize('admin'), createSubAdmin);

router.route('/subadmins/:id')
  .put(protect, authorize('admin'), updateSubAdmin)
  .delete(protect, authorize('admin'), deleteSubAdmin);

router.put('/subadmins/:id/status', protect, authorize('admin'), toggleSubAdminStatus);

// Venue routes
router.get('/venues/pending', protect, authorize('admin'), checkPermission('venues'), getPendingVenues);
router.put('/venues/:id/approve', protect, authorize('admin'), checkPermission('venues'), approveVenue);
router.put('/venues/:id/reject', protect, authorize('admin'), checkPermission('venues'), rejectVenue);
router.put('/venues/:id/suspend', protect, authorize('admin'), checkPermission('venues'), suspendVenue);
router.put('/venues/:id/activate', protect, authorize('admin'), checkPermission('venues'), activateVenue);
router.put('/venues/:id/settings', protect, authorize('admin'), checkPermission('venues'), updateVenueSettings);

// User routes
router.get('/users', protect, authorize('admin'), checkPermission('users'), getAllUsers);
router.get('/users/:id', protect, authorize('admin'), checkPermission('users'), getUser);
router.put('/users/:id/status', protect, authorize('admin'), checkPermission('users'), updateUserStatus);

// Booking routes
router.get('/bookings', protect, authorize('admin'), checkPermission('bookings'), getAllBookings);
router.get('/bookings/:id', protect, authorize('admin'), checkPermission('bookings'), getBooking);

// Payment routes
router.get('/payments', protect, authorize('admin'), checkPermission('payments'), getAllPayments);
router.get('/payments/:id', protect, authorize('admin'), checkPermission('payments'), getPayment);

// Commission routes (removed - no longer used)

// Platform Settings routes (GST & Platform Fee)
router.route('/platform-settings')
  .get(protect, authorize('admin'), checkPermission('platformSettings'), getPlatformSettings)
  .put(
    protect, 
    authorize('admin'), 
    checkPermission('platformSettings'), 
    upload.fields([
      { name: 'gstInvoiceSignature', maxCount: 1 },
      { name: 'platformInvoiceSignature', maxCount: 1 }
    ]),
    updatePlatformSettings
  );

// Terms & Conditions routes
router.route('/terms')
  .get(protect, authorize('admin'), checkPermission('settings'), getTermsConditions)
  .put(protect, authorize('admin'), checkPermission('settings'), updateTermsConditions);

// Reports and stats
router.get('/reports', protect, authorize('admin'), checkPermission('reports'), getReports);
router.get('/earnings', protect, authorize('admin'), checkPermission('reports'), getEarningsReport);
router.get('/stats', protect, authorize('admin'), checkPermission('dashboard'), getDashboardStats);

module.exports = router;
