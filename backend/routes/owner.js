const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const {
  createCoupon,
  getOwnerCoupons,
  getCouponUsage,
  updateCoupon,
  deleteCoupon,
  recordDownload,
  getOwnerDownloads
} = require('../controllers/couponController');

// All routes require authentication and owner role
router.use(protect);
router.use(authorize('owner'));

// @route   GET /api/owner/dashboard
// @desc    Get owner dashboard stats
// @access  Private (Owner)
router.get('/dashboard', async (req, res) => {
  try {
    const venues = await Venue.find({ owner: req.user._id });
    const venueIds = venues.map(v => v._id);
    
    // Get bookings for owner's venues
    const bookings = await Booking.find({ venue: { $in: venueIds } })
      .populate('venue', 'businessName location sku images')
      .populate('customer', 'name email phone')
      .sort('-createdAt')
      .limit(10);
    
    const stats = {
      totalVenues: venues.length,
      approvedVenues: venues.filter(v => v.status === 'approved').length,
      pendingVenues: venues.filter(v => v.status === 'pending').length,
      rejectedVenues: venues.filter(v => v.status === 'rejected').length,
      totalEarnings: venues.reduce((sum, v) => sum + (v.totalEarnings || 0), 0),
      totalBookings: venues.reduce((sum, v) => sum + (v.totalBookings || 0), 0),
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
    };

    res.json({
      success: true,
      stats,
      recentVenues: venues.slice(0, 5),
      recentBookings: bookings
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// @route   GET /api/owner/venues
// @desc    Get all venues for logged-in owner
// @access  Private (Owner)
router.get('/venues', async (req, res) => {
  try {
    const venues = await Venue.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: venues.length,
      venues
    });
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching venues'
    });
  }
});

// @route   GET /api/owner/venues/:id
// @desc    Get single venue (only if owned by user)
// @access  Private (Owner)
router.get('/venues/:id', async (req, res) => {
  try {
    const venue = await Venue.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found or unauthorized'
      });
    }

    res.json({
      success: true,
      venue
    });
  } catch (error) {
    console.error('Get venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching venue'
    });
  }
});

// @route   PUT /api/owner/venues/:id
// @desc    Update venue (only if owned by user)
// @access  Private (Owner)
router.put('/venues/:id', async (req, res) => {
  try {
    let venue = await Venue.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found or unauthorized'
      });
    }

    // Don't allow updating status
    delete req.body.status;
    delete req.body.owner;

    // Encrypt bank account number only if it's a plain (unencrypted) value
    // Encrypted values start with 'U2FsdGVk' (base64 CryptoJS prefix)
    if (req.body.bankDetails?.accountNumber &&
        !req.body.bankDetails.accountNumber.startsWith('U2FsdGVk')) {
      const { encrypt } = require('../utils/encryption');
      req.body.bankDetails.accountNumber = encrypt(req.body.bankDetails.accountNumber);
    }

    venue = await Venue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Venue updated successfully',
      venue
    });
  } catch (error) {
    console.error('Update venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating venue'
    });
  }
});

// @route   DELETE /api/owner/venues/:id
// @desc    Delete venue (only if owned by user)
// @access  Private (Owner)
router.delete('/venues/:id', async (req, res) => {
  try {
    const venue = await Venue.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found or unauthorized'
      });
    }

    await venue.deleteOne();

    res.json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    console.error('Delete venue error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting venue'
    });
  }
});

// ─── Coupon Routes ────────────────────────────────────────────────────────────
router.post('/coupons', createCoupon);
router.get('/coupons', getOwnerCoupons);
router.get('/coupons/:id', getCouponUsage);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);
router.post('/coupons/:id/download', recordDownload);
router.get('/coupon-downloads', getOwnerDownloads);

// Owner: Get quotation downloads for their venues
router.get('/quotation-downloads', async (req, res) => {
  try {
    const QuotationDownload = require('../models/QuotationDownload');
    // Get all venues owned by this owner
    const ownerVenues = await Venue.find({ owner: req.user._id }).select('_id');
    const venueIds = ownerVenues.map(v => v._id);

    const filter = { venue: { $in: venueIds } };
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

// @route   PUT /api/owner/venues/:id/toggle-active
// @desc    Toggle venue isActive (enable/disable listing)
router.put('/venues/:id/toggle-active', async (req, res) => {
  try {
    const venue = await Venue.findOne({ _id: req.params.id, owner: req.user._id });
    if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });

    // Use client-sent currentIsActive if provided, else derive from DB
    const currentlyActive = req.body.currentIsActive !== undefined
      ? req.body.currentIsActive
      : venue.isActive !== false;

    venue.isActive = !currentlyActive;
    await venue.save();

    res.json({ success: true, isActive: venue.isActive, message: `Venue ${venue.isActive ? 'enabled' : 'disabled'} successfully` });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// @route   PUT /api/owner/venues/:id/resubmit
// @desc    Re-submit rejected venue for admin review
router.put('/venues/:id/resubmit', async (req, res) => {
  try {
    const venue = await Venue.findOne({ _id: req.params.id, owner: req.user._id });
    if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });
    if (venue.status !== 'rejected') return res.status(400).json({ success: false, message: 'Only rejected venues can be re-submitted' });
    venue.status = 'resubmitted';
    venue.resubmittedAt = new Date();
    // Keep rejectionReason so admin can see what was fixed
    await venue.save();
    res.json({ success: true, message: 'Venue re-submitted for review', venue });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// @route   POST /api/owner/venues/:id/blocked-dates
// @desc    Add a blocked date
router.post('/venues/:id/blocked-dates', async (req, res) => {
  try {
    const venue = await Venue.findOne({ _id: req.params.id, owner: req.user._id });
    if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });

    const { date, reason } = req.body;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    // Avoid duplicates
    const exists = venue.blockedDates.some(b => new Date(b.date).toDateString() === d.toDateString());
    if (exists) return res.status(400).json({ success: false, message: 'Date already blocked' });

    venue.blockedDates.push({ date: d, reason: reason || 'Blocked by owner' });
    await venue.save();

    res.json({ success: true, blockedDates: venue.blockedDates });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// @route   DELETE /api/owner/venues/:id/blocked-dates/:dateId
// @desc    Remove a blocked date
router.delete('/venues/:id/blocked-dates/:dateId', async (req, res) => {
  try {
    const venue = await Venue.findOne({ _id: req.params.id, owner: req.user._id });
    if (!venue) return res.status(404).json({ success: false, message: 'Venue not found' });

    venue.blockedDates = venue.blockedDates.filter(b => b._id.toString() !== req.params.dateId);
    await venue.save();

    res.json({ success: true, blockedDates: venue.blockedDates });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── Owner: Cancel booking with full refund ───────────────────────────────────
router.put('/bookings/:id/cancel', async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const { reason } = req.body;
    const venues = await Venue.find({ owner: req.user._id }).select('_id');
    const venueIds = venues.map(v => v._id.toString());

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!venueIds.includes(booking.venue.toString()))
      return res.status(403).json({ success: false, message: 'Not authorized' });
    if (!['pending', 'confirmed'].includes(booking.status))
      return res.status(400).json({ success: false, message: 'Booking cannot be cancelled' });

    console.log(`\n[OWNER-CANCEL] ── Owner Cancel ──────────────────────────`);
    console.log(`[OWNER-CANCEL] Booking   : ${booking.bookingNumber}`);
    console.log(`[OWNER-CANCEL] PayStatus : ${booking.paymentStatus}`);
    console.log(`[OWNER-CANCEL] PaymentID : ${booking.paymentDetails?.razorpay_payment_id ?? 'NONE'}`);
    console.log(`[OWNER-CANCEL] RZP Key   : ${process.env.RAZORPAY_KEY_ID}`);

    const refundAmount = booking.paymentLedger?.totalPaid || booking.amount;
    let refundResult = { success: false, reason: 'Payment not made' };

    if (booking.paymentStatus === 'paid' && refundAmount > 0 && booking.paymentDetails?.razorpay_payment_id) {
      try {
        const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        const refund = await razorpay.payments.refund(booking.paymentDetails.razorpay_payment_id, {
          amount: Math.round(refundAmount * 100),
          speed: 'normal',
          notes: { bookingNumber: booking.bookingNumber, reason: reason || 'Cancelled by venue owner' }
        });
        console.log(`[OWNER-CANCEL] ✅ Refund OK — ${refund.id}`);
        refundResult = { success: true, refundId: refund.id };
      } catch (err) {
        console.error(`[OWNER-CANCEL] ❌ Refund failed: ${err.error?.description || err.message}`);
        refundResult = { success: false, reason: err.error?.description || err.message };
      }
    } else {
      console.log(`[OWNER-CANCEL] ⏭️  No refund — payStatus:${booking.paymentStatus} amount:${refundAmount}`);
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by venue owner';
    booking.cancelledBy = req.user.id;
    booking.cancelledByRole = 'owner';
    booking.cancellationType = 'manual';
    booking.refundDetails = {
      refundAmount,
      refundStatus: booking.paymentStatus !== 'paid' ? 'pending' : refundResult.success ? 'processed' : 'failed',
      refundId: refundResult.refundId || null,
      refundedAt: refundResult.success ? new Date() : null,
      refundReason: 'Full refund — cancelled by venue owner'
    };
    if (refundResult.success) booking.paymentStatus = 'refunded';
    if (!booking.paymentLedger) booking.paymentLedger = { transactions: [], adjustments: [] };
    if (refundResult.success) {
      booking.paymentLedger.transactions.push({
        txnId: refundResult.refundId, type: 'refund', amount: refundAmount,
        status: 'completed', note: 'Full refund — cancelled by venue owner',
        performedBy: req.user.id, date: new Date()
      });
    }
    await booking.save();
    console.log(`[OWNER-CANCEL] ✅ Done — refundStatus:${booking.refundDetails.refundStatus}\n`);
    res.json({ success: true, message: 'Booking cancelled with full refund', refundProcessed: refundResult.success, refundFailReason: !refundResult.success ? refundResult.reason : undefined, booking });
  } catch (e) {
    console.error(`[OWNER-CANCEL] 💥`, e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ─── Owner: Get payments summary for their venues ────────────────────────────
router.get('/payments', async (req, res) => {
  try {
    const venues = await Venue.find({ owner: req.user._id }).select('_id businessName');
    const venueIds = venues.map(v => v._id);

    const { status, venueId, page = 1, limit = 20 } = req.query;
    const filter = { venue: { $in: venueIds } };
    if (status && status !== 'all') filter.paymentStatus = status;
    if (venueId) filter.venue = venueId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('venue', 'businessName sku location')
        .populate('customer', 'name email phone')
        .select('bookingNumber bookingDate amount paymentStatus paymentLedger paymentDetails status createdAt customerDetails venue customer priceBreakdown coupon')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(filter)
    ]);

    // Aggregate stats
    const allBookings = await Booking.find({ venue: { $in: venueIds } }).select('paymentStatus amount paymentLedger');
    const stats = {
      totalRevenue: allBookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + (b.paymentLedger?.totalPaid || b.amount || 0), 0),
      totalRefunded: allBookings.filter(b => b.paymentStatus === 'refunded').reduce((s, b) => s + (b.paymentLedger?.totalPaid || b.amount || 0), 0),
      paid: allBookings.filter(b => b.paymentStatus === 'paid').length,
      pending: allBookings.filter(b => b.paymentStatus === 'pending').length,
      refunded: allBookings.filter(b => b.paymentStatus === 'refunded').length,
    };

    res.json({ success: true, bookings, total, totalPages: Math.ceil(total / parseInt(limit)), stats, venues });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ─── Owner: Get cancellations for their venues ────────────────────────────────
router.get('/cancellations', async (req, res) => {
  try {
    const venues = await Venue.find({ owner: req.user._id }).select('_id');
    const venueIds = venues.map(v => v._id);
    const cancellations = await Booking.find({ venue: { $in: venueIds }, status: 'cancelled' })
      .populate('venue', 'businessName location sku')
      .populate('customer', 'name email phone')
      .populate('cancelledBy', 'name role')
      .sort('-updatedAt');
    res.json({ success: true, cancellations });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
