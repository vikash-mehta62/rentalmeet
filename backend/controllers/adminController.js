const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const CommissionSettings = require('../models/CommissionSettings');
const { sendVenueApprovalEmail, sendVenueRejectionEmail } = require('../utils/emailService');
const User = require('../models/User');

// @desc    Get pending venues
// @route   GET /api/admin/venues/pending
exports.getPendingVenues = async (req, res) => {
  try {
    const venues = await Venue.find({ status: 'pending' })
      .populate('owner', 'name email phone')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: venues.length,
      venues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Approve venue
// @route   PUT /api/admin/venues/:id/approve
exports.approveVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id).populate('owner');
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    venue.status = 'approved';
    venue.verificationTimeline.listingActivation = new Date();
    await venue.save();
    
    // Send approval email
    await sendVenueApprovalEmail(venue.owner.email, venue.businessName);
    
    res.json({
      success: true,
      message: 'Venue approved successfully',
      venue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reject venue
// @route   PUT /api/admin/venues/:id/reject
exports.rejectVenue = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const venue = await Venue.findById(req.params.id).populate('owner');
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    venue.status = 'rejected';
    venue.rejectionReason = reason;
    await venue.save();
    
    // Send rejection email
    await sendVenueRejectionEmail(venue.owner.email, venue.businessName, reason);
    
    res.json({
      success: true,
      message: 'Venue rejected',
      venue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Suspend venue
// @route   PUT /api/admin/venues/:id/suspend
exports.suspendVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    venue.status = 'suspended';
    await venue.save();
    
    res.json({
      success: true,
      message: 'Venue suspended',
      venue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get commission settings
// @route   GET /api/admin/commission
exports.getCommissionSettings = async (req, res) => {
  try {
    let settings = await CommissionSettings.findOne().sort('-createdAt');
    
    if (!settings) {
      settings = await CommissionSettings.create({ commissionRate: 15 });
    }
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update commission rate
// @route   PUT /api/admin/commission
exports.updateCommissionRate = async (req, res) => {
  try {
    const { commissionRate } = req.body;
    
    const settings = await CommissionSettings.create({
      commissionRate,
      updatedBy: req.user.id
    });
    
    res.json({
      success: true,
      message: 'Commission rate updated',
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get earnings report
// @route   GET /api/admin/earnings
exports.getEarningsReport = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'completed' });
    
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.amount, 0);
    const totalCommission = bookings.reduce((sum, booking) => sum + booking.commission, 0);
    const totalOwnerEarnings = bookings.reduce((sum, booking) => sum + booking.ownerEarnings, 0);
    
    res.json({
      success: true,
      report: {
        totalBookings: bookings.length,
        totalRevenue,
        totalCommission,
        totalOwnerEarnings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalVenues = await Venue.countDocuments();
    const pendingVenues = await Venue.countDocuments({ status: 'pending' });
    const approvedVenues = await Venue.countDocuments({ status: 'approved' });
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalBookings = await Booking.countDocuments();
    
    res.json({
      success: true,
      stats: {
        totalVenues,
        pendingVenues,
        approvedVenues,
        totalOwners,
        totalCustomers,
        totalBookings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
