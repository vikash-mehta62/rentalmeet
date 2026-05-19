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


// Expense routes
router.get('/expenses', protect, authorize('admin'), checkPermission('expenses'), async (req, res) => {
  try {
    const Expense = require('../models/Expense');
    const { dateFilter, fyYear, from, to } = req.query;

    let dateMatch = {};
    if (dateFilter === 'fy' && fyYear) {
      const y = parseInt(fyYear);
      dateMatch = { expenseDate: { $gte: new Date(`${y}-04-01T00:00:00`), $lte: new Date(`${y + 1}-03-31T23:59:59`) } };
    } else if (dateFilter === 'custom' && from && to) {
      dateMatch = { expenseDate: { $gte: new Date(from + 'T00:00:00'), $lte: new Date(to + 'T23:59:59') } };
    }

    const expenses = await Expense.find(dateMatch)
      .populate('createdBy', 'name email role')
      .sort('-expenseDate');

    const totalExpenditure = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    res.json({ success: true, expenses, summary: { totalExpenditure, totalRecords: expenses.length } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/expenses', protect, authorize('admin'), checkPermission('expenses'), async (req, res) => {
  try {
    const Expense = require('../models/Expense');
    const { head, subHead, amount, remark, expenseDate } = req.body;
    if (!head?.trim()) return res.status(400).json({ success: false, message: 'Head is required' });
    if (amount === undefined || amount === null || Number(amount) < 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    const expense = await Expense.create({
      head: head.trim(),
      subHead: (subHead || '').trim(),
      amount: Number(amount),
      remark: (remark || '').trim(),
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      createdBy: req.user.id
    });
    const populated = await Expense.findById(expense._id).populate('createdBy', 'name email role');
    res.status(201).json({ success: true, message: 'Expense added', expense: populated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/expenses/:id', protect, authorize('admin'), checkPermission('expenses'), async (req, res) => {
  try {
    const Expense = require('../models/Expense');
    const { head, subHead, amount, remark, expenseDate } = req.body;
    if (!head?.trim()) return res.status(400).json({ success: false, message: 'Head is required' });
    if (amount === undefined || amount === null || Number(amount) < 0)
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { head: head.trim(), subHead: (subHead || '').trim(), amount: Number(amount), remark: (remark || '').trim(), expenseDate: expenseDate ? new Date(expenseDate) : new Date() },
      { new: true }
    ).populate('createdBy', 'name email role');
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, expense });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/expenses/:id', protect, authorize('admin'), checkPermission('expenses'), async (req, res) => {
  try {
    const Expense = require('../models/Expense');
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Expense Heads CRUD
router.get('/expense-heads', protect, authorize('admin'), checkPermission('expenses'), async (req, res) => {
  try {
    const ExpenseHead = require('../models/ExpenseHead');
    const heads = await ExpenseHead.find().sort('name');
    res.json({ success: true, heads });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/expense-heads', protect, authorize('admin'), checkPermission('expenses'), async (req, res) => {
  try {
    const ExpenseHead = require('../models/ExpenseHead');
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Head name is required' });
    const head = await ExpenseHead.create({ name: name.trim(), createdBy: req.user.id });
    res.status(201).json({ success: true, head });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'Head already exists' });
    res.status(500).json({ success: false, message: e.message });
  }
});

router.delete('/expense-heads/:id', protect, authorize('admin'), checkPermission('expenses'), async (req, res) => {
  try {
    const ExpenseHead = require('../models/ExpenseHead');
    await ExpenseHead.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Liabilities ───────────────────────────────────────────────────────────
router.get('/liabilities', protect, authorize('admin'), checkPermission('expenses'), async (req, res) => {
  try {
    const Liability = require('../models/Liability');
    const { dateFilter, fyYear, from, to } = req.query;
    let dateMatch = {};
    if (dateFilter === 'fy' && fyYear) {
      const y = parseInt(fyYear);
      dateMatch = { createdAt: { $gte: new Date(`${y}-04-01T00:00:00`), $lte: new Date(`${y + 1}-03-31T23:59:59`) } };
    } else if (dateFilter === 'custom' && from && to) {
      dateMatch = { createdAt: { $gte: new Date(from + 'T00:00:00'), $lte: new Date(to + 'T23:59:59') } };
    }
    const liabilities = await Liability.find(dateMatch).populate('createdBy', 'name email role').sort('-createdAt');
    const totalAmount = liabilities.reduce((s, l) => s + (l.totalAmount || 0), 0);
    const totalPaid = liabilities.reduce((s, l) => s + (l.paidAmount || 0), 0);
    const totalPending = totalAmount - totalPaid;
    res.json({ success: true, liabilities, summary: { totalAmount, totalPaid, totalPending, totalRecords: liabilities.length } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/liabilities', protect, authorize('admin'), checkPermission('expenses'), async (req, res) => {
  try {
    const Liability = require('../models/Liability');
    const { title, totalAmount, paidAmount, payByDate, remark } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' });
    if (!totalAmount || Number(totalAmount) < 0) return res.status(400).json({ success: false, message: 'Valid total amount required' });
    const liability = await Liability.create({
      title: title.trim(), totalAmount: Number(totalAmount),
      paidAmount: Number(paidAmount || 0), payByDate: payByDate ? new Date(payByDate) : null,
      remark: (remark || '').trim(), createdBy: req.user.id
    });
    const populated = await Liability.findById(liability._id).populate('createdBy', 'name email role');
    res.status(201).json({ success: true, liability: populated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/liabilities/:id', protect, authorize('admin'), checkPermission('expenses'), async (req, res) => {
  try {
    const Liability = require('../models/Liability');
    const { title, totalAmount, paidAmount, payByDate, remark } = req.body;
    const liability = await Liability.findById(req.params.id);
    if (!liability) return res.status(404).json({ success: false, message: 'Not found' });
    // Support full edit or just paidAmount update
    const newTotal = totalAmount !== undefined ? Number(totalAmount) : liability.totalAmount;
    const paid = Number(paidAmount !== undefined ? paidAmount : liability.paidAmount);
    if (paid < 0) return res.status(400).json({ success: false, message: 'Paid amount cannot be negative' });
    if (paid > newTotal) return res.status(400).json({ success: false, message: `Paid amount cannot exceed total amount (₹${newTotal.toLocaleString('en-IN')})` });
    if (title !== undefined) liability.title = title.trim();
    if (totalAmount !== undefined) liability.totalAmount = newTotal;
    liability.paidAmount = paid;
    if (payByDate !== undefined) liability.payByDate = payByDate ? new Date(payByDate) : null;
    if (remark !== undefined) liability.remark = (remark || '').trim();
    await liability.save();
    await liability.populate('createdBy', 'name email role');
    res.json({ success: true, liability });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/liabilities/:id', protect, authorize('admin'), checkPermission('expenses'), async (req, res) => {
  try {
    const Liability = require('../models/Liability');
    await Liability.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

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

// Admin: Get all cancellations
router.get('/cancellations', protect, authorize('admin'), async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const { type, from, to } = req.query;
    const match = { status: 'cancelled' };
    if (type && type !== 'all') match.cancellationType = type;
    if (from && to) match.updatedAt = { $gte: new Date(from + 'T00:00:00'), $lte: new Date(to + 'T23:59:59') };
    const cancellations = await Booking.find(match)
      .populate('venue', 'businessName location sku')
      .populate('customer', 'name email phone')
      .populate('cancelledBy', 'name role')
      .sort('-updatedAt');
    res.json({ success: true, cancellations });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Admin: Cancel a booking with Razorpay refund
router.put('/bookings/:id/cancel', protect, authorize('admin'), async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const Booking = require('../models/Booking');
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!['pending', 'confirmed'].includes(booking.status))
      return res.status(400).json({ success: false, message: 'Booking cannot be cancelled' });

    console.log(`\n[ADMIN-CANCEL] ── Admin Cancel ──────────────────────────`);
    console.log(`[ADMIN-CANCEL] Booking   : ${booking.bookingNumber}`);
    console.log(`[ADMIN-CANCEL] PayStatus : ${booking.paymentStatus}`);
    console.log(`[ADMIN-CANCEL] PaymentID : ${booking.paymentDetails?.razorpay_payment_id ?? 'NONE'}`);
    console.log(`[ADMIN-CANCEL] RZP Key   : ${process.env.RAZORPAY_KEY_ID}`);

    const refundAmount = booking.paymentLedger?.totalPaid || booking.amount;
    let refundResult = { success: false, reason: 'Payment not made' };

    if (booking.paymentStatus === 'paid' && refundAmount > 0 && booking.paymentDetails?.razorpay_payment_id) {
      try {
        const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        const refund = await razorpay.payments.refund(booking.paymentDetails.razorpay_payment_id, {
          amount: Math.round(refundAmount * 100), speed: 'normal',
          notes: { bookingNumber: booking.bookingNumber, reason: reason || 'Cancelled by admin' }
        });
        console.log(`[ADMIN-CANCEL] ✅ Refund OK — ${refund.id}`);
        refundResult = { success: true, refundId: refund.id };
      } catch (err) {
        console.error(`[ADMIN-CANCEL] ❌ Refund failed: ${err.error?.description || err.message}`);
        refundResult = { success: false, reason: err.error?.description || err.message };
      }
    } else {
      console.log(`[ADMIN-CANCEL] ⏭️  No refund — payStatus:${booking.paymentStatus} amount:${refundAmount}`);
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by admin';
    booking.cancelledBy = req.user.id;
    booking.cancelledByRole = 'admin';
    booking.cancellationType = 'manual';
    booking.refundDetails = {
      refundAmount,
      refundStatus: booking.paymentStatus !== 'paid' ? 'pending' : refundResult.success ? 'processed' : 'failed',
      refundId: refundResult.refundId || null,
      refundedAt: refundResult.success ? new Date() : null,
      refundReason: 'Full refund — cancelled by admin'
    };
    if (refundResult.success) booking.paymentStatus = 'refunded';
    if (!booking.paymentLedger) booking.paymentLedger = { transactions: [], adjustments: [] };
    if (refundResult.success) {
      booking.paymentLedger.transactions.push({
        txnId: refundResult.refundId, type: 'refund', amount: refundAmount,
        status: 'completed', note: 'Full refund — cancelled by admin',
        performedBy: req.user.id, date: new Date()
      });
    }
    await booking.save();
    console.log(`[ADMIN-CANCEL] ✅ Done — refundStatus:${booking.refundDetails.refundStatus}\n`);
    res.json({ success: true, message: 'Booking cancelled', refundProcessed: refundResult.success, refundFailReason: !refundResult.success ? refundResult.reason : undefined, booking });
  } catch (e) {
    console.error(`[ADMIN-CANCEL] 💥`, e);
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

// ── Vendor Management ────────────────────────────────────────────────────────
const VendorService = require('../models/VendorService');
const VendorProfile = require('../models/VendorProfile');

// Get all vendors
router.get('/vendors', protect, authorize('admin'), checkPermission('vendorServices'), async (req, res) => {
  try {
    const vendors = await require('../models/User').find({ role: 'vendor' })
      .select('-password').sort('-createdAt');
    // Attach profile + service counts
    const result = await Promise.all(vendors.map(async v => {
      const profile = await VendorProfile.findOne({ user: v._id }).select('status onboardingStep businessInfo');
      const serviceCount = await VendorService.countDocuments({ vendor: v._id });
      const pendingCount = await VendorService.countDocuments({ vendor: v._id, status: 'pending' });
      return { ...v.toObject(), profile, serviceCount, pendingCount };
    }));
    res.json({ success: true, vendors: result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Get vendor profile
router.get('/vendors/:id/profile', protect, authorize('admin'), checkPermission('vendorServices'), async (req, res) => {
  try {
    const profile = await VendorProfile.findOne({ user: req.params.id });
    const vendor = await require('../models/User').findById(req.params.id).select('-password');
    res.json({ success: true, vendor, profile });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Get vendor services
router.get('/vendors/:id/services', protect, authorize('admin'), checkPermission('vendorServices'), async (req, res) => {
  try {
    const services = await VendorService.find({ vendor: req.params.id }).sort('-createdAt');
    res.json({ success: true, services });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Approve vendor profile
router.put('/vendors/:id/approve', protect, authorize('admin'), checkPermission('vendorServices'), async (req, res) => {
  try {
    const profile = await VendorProfile.findOneAndUpdate(
      { user: req.params.id }, { status: 'approved', approvedAt: new Date() }, { new: true }
    );
    res.json({ success: true, profile, message: 'Vendor approved' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Reject vendor profile
router.put('/vendors/:id/reject', protect, authorize('admin'), checkPermission('vendorServices'), async (req, res) => {
  try {
    const { reason } = req.body;
    const profile = await VendorProfile.findOneAndUpdate(
      { user: req.params.id }, { status: 'rejected', rejectionReason: reason }, { new: true }
    );
    res.json({ success: true, profile, message: 'Vendor rejected' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Approve service
router.put('/vendor-services/:id/approve', protect, authorize('admin'), checkPermission('vendorServices'), async (req, res) => {
  try {
    const svc = await VendorService.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', rejectionReason: undefined },
      { new: true }
    ).populate('vendor', 'name email');
    res.json({ success: true, service: svc, message: 'Service approved' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Reject service (with history)
router.put('/vendor-services/:id/reject', protect, authorize('admin'), checkPermission('vendorServices'), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ success: false, message: 'Rejection reason required' });
    const svc = await VendorService.findById(req.params.id);
    if (!svc) return res.status(404).json({ success: false, message: 'Service not found' });
    svc.status = 'rejected';
    svc.rejectionReason = reason;
    if (!svc.rejectionHistory) svc.rejectionHistory = [];
    svc.rejectionHistory.push({ reason, rejectedAt: new Date(), rejectedBy: req.user?.id });
    await svc.save();
    res.json({ success: true, service: svc, message: 'Service rejected' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Get all pending services
router.get('/vendor-services/pending', protect, authorize('admin'), checkPermission('vendorServices'), async (req, res) => {
  try {
    const services = await VendorService.find({ status: 'pending' })
      .populate('vendor', 'name email companyName vendorCategory')
      .sort('-createdAt');
    res.json({ success: true, services });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Get ALL services (with optional status filter)
router.get('/vendor-services', protect, authorize('admin'), checkPermission('vendorServices'), async (req, res) => {
  try {
    const { status } = req.query;
    const query = status && status !== 'all' ? { status } : {};
    const services = await VendorService.find(query)
      .populate('vendor', 'name email phone companyName vendorCategory')
      .sort('-createdAt');
    res.json({ success: true, services });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Service Coupons (admin) ──────────────────────────────────────────────────
router.get('/service-coupons', protect, authorize('admin'), checkPermission('vendorCoupons'), async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    const coupons = await Coupon.find({ $or: [{ service: { $exists: true, $ne: null } }, { service: null, venue: null }] })
      .populate('service', 'title category')
      .populate('serviceVendor', 'name email')
      .sort('-createdAt');
    res.json({ success: true, coupons });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.post('/service-coupons', protect, authorize('admin'), checkPermission('vendorCoupons'), async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    const Counter = require('../models/Counter');
    const { serviceId, code, discountType, discountValue, maxDiscount, minBookingAmount, maxUses, expiryDate } = req.body;
    const year = new Date().getFullYear();
    const seq = await Counter.getNextSequence(`quotation_${year}`);
    const quotationNumber = `QT-${year}-${seq.toString().padStart(6, '0')}`;
    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      service: serviceId || null, venue: null,
      discountType, discountValue: Number(discountValue),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      minBookingAmount: minBookingAmount ? Number(minBookingAmount) : 0,
      maxUses: maxUses ? Number(maxUses) : null,
      expiryDate: expiryDate || null, quotationNumber
    });
    res.json({ success: true, coupon });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/service-coupons/:id/toggle', protect, authorize('admin'), checkPermission('vendorCoupons'), async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Not found' });
    coupon.isActive = !coupon.isActive;
    coupon.deactivatedAt = coupon.isActive ? null : new Date();
    await coupon.save();
    res.json({ success: true, coupon });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/service-coupons/:id', protect, authorize('admin'), checkPermission('vendorCoupons'), async (req, res) => {
  try {
    const Coupon = require('../models/Coupon');
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Service Quotation Downloads (admin) ─────────────────────────────────────
router.get('/service-quotation-downloads', protect, authorize('admin'), checkPermission('serviceQuotations'), async (req, res) => {
  try {
    const ServiceQuotationDownload = require('../models/ServiceQuotationDownload');
    const records = await ServiceQuotationDownload.find()
      .populate('vendor', 'name email companyName')
      .sort('-downloadedAt');
    res.json({ success: true, total: records.length, records });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── Service Bookings (admin) ─────────────────────────────────────────────────
router.get('/service-bookings', protect, authorize('admin'), checkPermission('serviceBookings'), async (req, res) => {
  try {
    const ServiceBooking = require('../models/ServiceBooking');
    const { status, search } = req.query;
    const baseFilter = { bookingNumber: { $exists: true, $ne: null, $not: /^SQ-/i } };
    const filter = { ...baseFilter };
    if (status && status !== 'all') filter.status = status;
    let bookings = await ServiceBooking.find(filter)
      .populate('service', 'title category city state')
      .populate('vendor', 'name email companyName')
      .sort('-createdAt');
    if (search) {
      const q = search.toLowerCase();
      bookings = bookings.filter(b =>
        b.bookingNumber?.toLowerCase().includes(q) ||
        b.customerInfo?.name?.toLowerCase().includes(q) ||
        b.customerInfo?.email?.toLowerCase().includes(q) ||
        b.serviceSnapshot?.title?.toLowerCase().includes(q) ||
        b.vendor?.name?.toLowerCase().includes(q)
      );
    }
    const stats = {
      total:     await ServiceBooking.countDocuments(baseFilter),
      enquiry:   await ServiceBooking.countDocuments({ ...baseFilter, status: 'enquiry' }),
      confirmed: await ServiceBooking.countDocuments({ ...baseFilter, status: 'confirmed' }),
      cancelled: await ServiceBooking.countDocuments({ ...baseFilter, status: 'cancelled' }),
      downloaded: await ServiceBooking.countDocuments({ ...baseFilter, downloadedAt: { $exists: true, $ne: null } }),
    };
    res.json({ success: true, bookings, stats });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Vendor Service Payments (admin)
router.get('/vendor-payments', protect, authorize('admin'), checkPermission('vendorPayments'), async (req, res) => {
  try {
    const ServiceBooking = require('../models/ServiceBooking');
    const { paymentStatus = 'paid', search } = req.query;

    const filter = {
      bookingNumber: { $exists: true, $ne: null, $not: /^SQ-/i }
    };
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;

    let payments = await ServiceBooking.find(filter)
      .populate('service', 'title category city state')
      .populate('vendor', 'name email companyName phone')
      .sort('-createdAt');

    if (search) {
      const q = search.toLowerCase();
      payments = payments.filter(p =>
        p.bookingNumber?.toLowerCase().includes(q) ||
        p.customerInfo?.name?.toLowerCase().includes(q) ||
        p.customerInfo?.email?.toLowerCase().includes(q) ||
        p.serviceSnapshot?.title?.toLowerCase().includes(q) ||
        p.vendor?.name?.toLowerCase().includes(q) ||
        p.vendor?.companyName?.toLowerCase().includes(q) ||
        p.paymentDetails?.razorpay_payment_id?.toLowerCase().includes(q)
      );
    }

    const mapped = payments.map((p) => {
      const total = Number(p.pricing?.total ?? p.amount ?? 0);
      const platformFee = Number(p.pricing?.platformFee ?? 0);
      const platformFeeGST = Number(p.pricing?.platformFeeGST ?? 0);
      const vendorPayout = Math.max(total - platformFee - platformFeeGST, 0);
      return {
        ...p.toObject(),
        paymentMeta: { total, platformFee, platformFeeGST, vendorPayout }
      };
    });

    const stats = mapped.reduce((acc, p) => {
      const status = p.paymentStatus || 'pending';
      const total = p.paymentMeta.total || 0;
      const payout = p.paymentMeta.vendorPayout || 0;
      acc.total += 1;
      if (status === 'paid') {
        acc.paid += 1;
        acc.paidAmount += total;
        acc.vendorPayout += payout;
      } else if (status === 'failed') {
        acc.failed += 1;
        acc.failedAmount += total;
      } else {
        acc.pending += 1;
        acc.pendingAmount += total;
      }
      return acc;
    }, {
      total: 0,
      paid: 0,
      pending: 0,
      failed: 0,
      paidAmount: 0,
      pendingAmount: 0,
      failedAmount: 0,
      vendorPayout: 0
    });

    res.json({ success: true, payments: mapped, stats });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/service-bookings/:id/status', protect, authorize('admin'), checkPermission('serviceBookings'), async (req, res) => {
  try {
    const ServiceBooking = require('../models/ServiceBooking');
    const { status } = req.body;
    const booking = await ServiceBooking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, booking });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
