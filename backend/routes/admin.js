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

// ── Payment Ledger endpoints ──────────────────────────────────────────────
// Admin: record a manual payment (cash/cheque/bank transfer)
router.post('/bookings/:id/ledger/payment', protect, authorize('admin'), async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const { amount, note, txnId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount required' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (!booking.paymentLedger) booking.paymentLedger = { transactions: [], adjustments: [] };
    if (!booking.paymentLedger.transactions) booking.paymentLedger.transactions = [];

    booking.paymentLedger.transactions.push({
      txnId: txnId || `MANUAL-${Date.now()}`,
      type: 'manual_payment',
      amount: Number(amount),
      status: 'completed',
      note: note || 'Manual payment recorded by admin',
      performedBy: req.user.id,
      date: new Date()
    });

    // Update paymentStatus if fully paid
    const totalPaid = booking.paymentLedger.transactions
      .filter(t => ['payment', 'manual_payment'].includes(t.type) && t.status === 'completed')
      .reduce((s, t) => s + t.amount, 0);
    if (totalPaid >= booking.amount) booking.paymentStatus = 'paid';

    await booking.save();
    res.json({ success: true, message: 'Payment recorded', booking });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Admin: record a manual refund
router.post('/bookings/:id/ledger/refund', protect, authorize('admin'), async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const { amount, note, txnId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Valid amount required' });

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (!booking.paymentLedger) booking.paymentLedger = { transactions: [], adjustments: [] };
    if (!booking.paymentLedger.transactions) booking.paymentLedger.transactions = [];

    booking.paymentLedger.transactions.push({
      txnId: txnId || `REFUND-${Date.now()}`,
      type: 'manual_refund',
      amount: Number(amount),
      status: 'completed',
      note: note || 'Refund processed by admin',
      performedBy: req.user.id,
      date: new Date()
    });

    booking.paymentStatus = 'refunded';
    // Also update legacy refundDetails
    booking.refundDetails = {
      refundId: txnId || `REFUND-${Date.now()}`,
      refundAmount: Number(amount),
      refundStatus: 'processed',
      refundedAt: new Date(),
      refundReason: note || 'Refund processed by admin'
    };

    await booking.save();
    res.json({ success: true, message: 'Refund recorded', booking });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

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

// Admin: Get all coupons (with optional venue filter)
router.get('/coupons', protect, authorize('admin'), async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    const filter = {};
    if (req.query.venueId) filter.venue = req.query.venueId;
    const coupons = await Coupon.find(filter)
      .populate('venue', 'businessName location sku')
      .populate('owner', 'name email')
      .sort('-createdAt');
    res.json({ success: true, coupons });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
