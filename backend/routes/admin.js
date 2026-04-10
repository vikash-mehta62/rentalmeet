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
  resetUserPassword,
  getAllBookings,
  getBooking,
  getAllPayments,
  getPayment,
  getVenueAnalytics,
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
// Admin: Get ALL venues (all statuses) — protected
router.get('/venues', protect, authorize('admin', 'subadmin'), checkPermission('venues'), async (req, res) => {
  try {
    const Venue = require('../models/Venue');
    const { status, limit = 1000 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;
    const venues = await Venue.find(query)
      .populate('owner', 'name email phone')
      .sort('-createdAt')
      .limit(parseInt(limit));
    res.json({ success: true, count: venues.length, venues });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});
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
router.put('/users/:id/reset-password', protect, authorize('admin'), checkPermission('users'), resetUserPassword);

// Booking routes
router.get('/bookings', protect, authorize('admin'), checkPermission('bookings'), getAllBookings);
router.get('/bookings/:id', protect, authorize('admin'), checkPermission('bookings'), getBooking);

// Payment routes
router.get('/payments/venue-analytics', protect, authorize('admin'), checkPermission('payments'), getVenueAnalytics);
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

// Admin: Get all coupons (global + venue-specific)
router.get('/coupons', protect, authorize('admin'), async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    const coupons = await Coupon.find({})
      .populate('venue', 'businessName location sku')
      .populate('owner', 'name email')
      .sort('-createdAt');
    res.json({ success: true, coupons });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Admin: Create global coupon
router.post('/coupons', protect, authorize('admin'), async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    const { code, discountType, discountValue, maxDiscount, minBookingAmount, maxUses, expiryDate } = req.body;
    if (!code || !discountType || !discountValue) {
      return res.status(400).json({ success: false, message: 'code, discountType and discountValue are required' });
    }
    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Coupon code already exists' });

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      venue: null,
      owner: null,
      discountType,
      discountValue: Number(discountValue),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      minBookingAmount: minBookingAmount ? Number(minBookingAmount) : 0,
      maxUses: maxUses ? Number(maxUses) : null,
      expiryDate: expiryDate || null,
      isActive: true
    });
    res.json({ success: true, coupon });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Admin: Toggle coupon active/inactive
router.put('/coupons/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Not found' });
    coupon.isActive = !coupon.isActive;
    coupon.deactivatedAt = coupon.isActive ? null : new Date();
    await coupon.save();
    res.json({ success: true, coupon });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Admin: Delete coupon
router.delete('/coupons/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Admin: Get all quotation downloads
router.get('/quotation-downloads', protect, authorize('admin'), async (req, res) => {
  try {
    const QuotationDownload = require('../models/QuotationDownload');
    const filter = {};
    if (req.query.venueId) filter.venue = req.query.venueId;

    const records = await QuotationDownload.find(filter)
      .populate('venue', 'businessName sku location')
      .populate('customer', 'name email phone')
      .sort('-downloadedAt');

    res.json({ success: true, total: records.length, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
