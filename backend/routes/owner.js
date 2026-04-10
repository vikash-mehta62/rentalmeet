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
    venue.status = 'pending';
    venue.rejectionReason = undefined;
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

module.exports = router;
