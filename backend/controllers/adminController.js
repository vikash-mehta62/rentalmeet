const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const CommissionSettings = require('../models/CommissionSettings');
const TermsConditions = require('../models/TermsConditions');
const { sendVenueApprovalEmail, sendVenueRejectionEmail } = require('../utils/emailService');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard-stats
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const totalVenues = await Venue.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    // Get pending counts
    const pendingVenues = await Venue.countDocuments({ status: 'pending' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    
    // Get active users by role
    const activeOwners = await User.countDocuments({ role: 'owner' });
    const activeCustomers = await User.countDocuments({ role: 'customer' });
    
    // Calculate total revenue (sum of all booking amounts)
    const revenueData = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
    
    res.json({
      success: true,
      stats: {
        totalVenues,
        totalUsers,
        totalBookings,
        totalRevenue,
        pendingVenues,
        pendingBookings,
        activeOwners,
        activeCustomers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

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
    // TODO: Enable in production
    // await sendVenueApprovalEmail(venue.owner.email, venue.businessName);
    
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
    // TODO: Enable in production
    // await sendVenueRejectionEmail(venue.owner.email, venue.businessName, reason);
    
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

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deactivating admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify admin user status'
      });
    }
    
    user.isActive = isActive;
    await user.save();
    
    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('venue', 'businessName location images owner')
      .populate('customer', 'name email phone')
      .populate({
        path: 'venue',
        populate: {
          path: 'owner',
          select: 'name email phone'
        }
      })
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single booking
// @route   GET /api/admin/bookings/:id
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('venue', 'businessName location images owner')
      .populate('customer', 'name email phone')
      .populate({
        path: 'venue',
        populate: {
          path: 'owner',
          select: 'name email phone'
        }
      });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all payments
// @route   GET /api/admin/payments
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Booking.find({ paymentStatus: { $exists: true } })
      .populate('venue', 'businessName location owner')
      .populate('customer', 'name email phone')
      .populate({
        path: 'venue',
        populate: {
          path: 'owner',
          select: 'name email phone'
        }
      })
      .sort('-createdAt');
    
    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single payment
// @route   GET /api/admin/payments/:id
exports.getPayment = async (req, res) => {
  try {
    const payment = await Booking.findById(req.params.id)
      .populate('venue', 'businessName location owner')
      .populate('customer', 'name email phone')
      .populate({
        path: 'venue',
        populate: {
          path: 'owner',
          select: 'name email phone'
        }
      });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get reports and analytics
// @route   GET /api/admin/reports
exports.getReports = async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    
    // Calculate date range
    let startDate = new Date();
    switch (range) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }
    
    // Revenue data
    const paidBookings = await Booking.find({
      paymentStatus: 'paid',
      createdAt: { $gte: startDate }
    });
    
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalCommission = paidBookings.reduce((sum, b) => sum + (b.commission || 0), 0);
    const ownerEarnings = paidBookings.reduce((sum, b) => sum + (b.ownerEarnings || 0), 0);
    const averageBooking = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0;
    
    // Bookings data
    const allBookings = await Booking.find({ createdAt: { $gte: startDate } });
    const bookingsStats = {
      total: allBookings.length,
      completed: allBookings.filter(b => b.status === 'completed').length,
      confirmed: allBookings.filter(b => b.status === 'confirmed').length,
      pending: allBookings.filter(b => b.status === 'pending').length,
      cancelled: allBookings.filter(b => b.status === 'cancelled').length
    };
    
    // Venues data
    const totalVenues = await Venue.countDocuments();
    const approvedVenues = await Venue.countDocuments({ status: 'approved' });
    const pendingVenues = await Venue.countDocuments({ status: 'pending' });
    const avgBookingsPerVenue = approvedVenues > 0 ? Math.round(allBookings.length / approvedVenues) : 0;
    
    // Users data
    const totalUsers = await User.countDocuments();
    const customers = await User.countDocuments({ role: 'customer' });
    const owners = await User.countDocuments({ role: 'owner' });
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Payment status breakdown
    const paidPayments = await Booking.find({ 
      paymentStatus: 'paid',
      createdAt: { $gte: startDate }
    });
    const pendingPayments = await Booking.find({ 
      paymentStatus: 'pending',
      createdAt: { $gte: startDate }
    });
    const failedPayments = await Booking.find({ 
      paymentStatus: 'failed',
      createdAt: { $gte: startDate }
    });
    const refundedPayments = await Booking.find({ 
      paymentStatus: 'refunded',
      createdAt: { $gte: startDate }
    });
    
    res.json({
      success: true,
      reports: {
        revenue: {
          total: totalRevenue,
          commission: totalCommission,
          ownerEarnings,
          average: Math.round(averageBooking)
        },
        bookings: bookingsStats,
        venues: {
          total: totalVenues,
          approved: approvedVenues,
          pending: pendingVenues,
          avgBookings: avgBookingsPerVenue
        },
        users: {
          total: totalUsers,
          customers,
          owners,
          active: activeUsers
        },
        payments: {
          paid: paidPayments.length,
          paidAmount: paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
          pending: pendingPayments.length,
          pendingAmount: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
          failed: failedPayments.length,
          failedAmount: failedPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
          refunded: refundedPayments.length,
          refundedAmount: refundedPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Get terms and conditions
// @route   GET /api/admin/terms
exports.getTermsConditions = async (req, res) => {
  try {
    let terms = await TermsConditions.findOne().sort('-createdAt');
    
    // Create default terms if none exist
    if (!terms) {
      terms = await TermsConditions.create({
        bookingTerms: [
          { point: 'This quotation is valid for 7 days from the date of issue.', order: 1 },
          { point: 'This is a booking request and not a confirmed booking. Final confirmation subject to venue owner approval.', order: 2 },
          { point: 'Payment to be made after venue owner confirmation through RentalMeet platform.', order: 3 },
          { point: 'Cancellation policy: Full refund if cancelled 48 hours before booking date, 50% refund if cancelled 24 hours before, no refund for same-day cancellations.', order: 4 },
          { point: 'Customer is responsible for any damages to the venue property during the event.', order: 5 }
        ],
        cancellationPolicy: 'Full refund if cancelled 48 hours before booking date, 50% refund if cancelled 24 hours before, no refund for same-day cancellations.',
        paymentTerms: 'Payment to be made after venue owner confirmation through RentalMeet platform.',
        quotationValidity: 7
      });
    }
    
    res.json({
      success: true,
      terms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update terms and conditions
// @route   PUT /api/admin/terms
exports.updateTermsConditions = async (req, res) => {
  try {
    const { bookingTerms, cancellationPolicy, paymentTerms, quotationValidity } = req.body;
    
    const terms = await TermsConditions.create({
      bookingTerms,
      cancellationPolicy,
      paymentTerms,
      quotationValidity,
      updatedBy: req.user.id
    });
    
    res.json({
      success: true,
      message: 'Terms and conditions updated successfully',
      terms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
