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
    const { 
      customPlatformFee, 
      customGST, 
      customCommission 
    } = req.body;
    
    const venue = await Venue.findById(req.params.id).populate('owner');
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    venue.status = 'approved';
    venue.verificationTimeline.listingActivation = new Date();
    venue.rejectionReason = undefined; // clear on approval
    
    // Set custom settings if provided
    if (customPlatformFee) {
      venue.customPlatformFee = customPlatformFee;
    }
    if (customGST) {
      venue.customGST = customGST;
    }
    if (customCommission) {
      venue.customCommission = customCommission;
    }
    
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
    if (!venue.rejectionHistory) venue.rejectionHistory = [];
    venue.rejectionHistory.push({ reason, rejectedAt: new Date(), rejectedBy: req.user?.id });
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
    const { reason } = req.body;
    
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    venue.status = 'suspended';
    venue.suspensionReason = reason;
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

// @desc    Activate/Reactivate venue (unsuspend)
// @route   PUT /api/admin/venues/:id/activate
exports.activateVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    // Change status to approved (reactivate)
    venue.status = 'approved';
    venue.suspensionReason = undefined; // Clear suspension reason
    await venue.save();
    
    res.json({
      success: true,
      message: 'Venue activated successfully',
      venue
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update venue custom settings (GST, Platform Fee, Commission)
// @route   PUT /api/admin/venues/:id/settings
exports.updateVenueSettings = async (req, res) => {
  try {
    const { 
      customPlatformFee, 
      customGST, 
      customCommission 
    } = req.body;
    
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    // Update custom settings
    if (customPlatformFee !== undefined) {
      venue.customPlatformFee = customPlatformFee;
    }
    if (customGST !== undefined) {
      venue.customGST = customGST;
    }
    if (customCommission !== undefined) {
      venue.customCommission = customCommission;
    }
    
    await venue.save();
    
    res.json({
      success: true,
      message: 'Venue settings updated successfully',
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
    res.json({
      success: true,
      settings: {
        commissionRate: 0
      },
      stats: {
        totalCommission: 0,
        totalBookings: 0,
        averageCommission: 0
      }
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
    res.json({
      success: true,
      message: 'Commission is disabled. Rate set to 0.',
      settings: { commissionRate: 0 }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get platform settings (GST, Platform Fee & Commission)
// @route   GET /api/admin/platform-settings
exports.getPlatformSettings = async (req, res) => {
  try {
    const PlatformSettings = require('../models/PlatformSettings');
    
    // Get current settings (only one document)
    const settings = await PlatformSettings.getSettings();
    
    // Add platformFeePercentage for frontend compatibility
    const settingsObj = settings.toObject();
    settingsObj.platformFeePercentage = settingsObj.platformFeeValue;
    
    res.json({
      success: true,
      settings: settingsObj
    });
  } catch (error) {
    console.error('Platform settings fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update platform settings (GST, Platform Fee & Commission)
// @route   PUT /api/admin/platform-settings
exports.updatePlatformSettings = async (req, res) => {
  try {
    const PlatformSettings = require('../models/PlatformSettings');
    const { uploadToCloudinary } = require('../config/cloudinary');
    const { 
      gstRate, platformFeeType, platformFeeValue, platformFeePercentage, commissionRate,
      venueCGST, venueSGST, venueHSN, platformCGST, platformSGST,
      // Service fields
      serviceCGST, serviceSGST, serviceHSN, servicePlatformFee, serviceCategoryRates
    } = req.body;
    
    const feeValue = platformFeeValue !== undefined ? platformFeeValue : platformFeePercentage;
    let settings = await PlatformSettings.findOne();
    
    if (settings) {
      settings.gstRate = gstRate !== undefined ? gstRate : settings.gstRate;
      settings.platformFeeType = platformFeeType || settings.platformFeeType;
      settings.platformFeeValue = feeValue !== undefined ? feeValue : settings.platformFeeValue;
      settings.platformFeePercentage = feeValue !== undefined ? feeValue : settings.platformFeePercentage;
      settings.commissionRate = commissionRate !== undefined ? commissionRate : settings.commissionRate;
      settings.venueCGST = venueCGST !== undefined ? venueCGST : settings.venueCGST;
      settings.venueSGST = venueSGST !== undefined ? venueSGST : settings.venueSGST;
      settings.venueHSN = venueHSN !== undefined ? venueHSN : settings.venueHSN;
      settings.platformCGST = platformCGST !== undefined ? platformCGST : settings.platformCGST;
      settings.platformSGST = platformSGST !== undefined ? platformSGST : settings.platformSGST;
      // Service settings
      if (serviceCGST !== undefined) settings.serviceCGST = serviceCGST;
      if (serviceSGST !== undefined) settings.serviceSGST = serviceSGST;
      if (serviceHSN !== undefined) settings.serviceHSN = serviceHSN;
      if (servicePlatformFee !== undefined) settings.servicePlatformFee = servicePlatformFee;
      if (serviceCategoryRates !== undefined) settings.serviceCategoryRates = typeof serviceCategoryRates === 'string' ? JSON.parse(serviceCategoryRates) : serviceCategoryRates;
      
      if (req.files) {
        if (req.files.gstInvoiceSignature?.[0]) {
          const result = await uploadToCloudinary(req.files.gstInvoiceSignature[0].buffer, 'signatures');
          settings.gstInvoiceSignature = result.secure_url;
        }
        if (req.files.platformInvoiceSignature?.[0]) {
          const result = await uploadToCloudinary(req.files.platformInvoiceSignature[0].buffer, 'signatures');
          settings.platformInvoiceSignature = result.secure_url;
        }
      }
      settings.updatedBy = req.user.id;
      await settings.save();
    } else {
      const newSettings = {
        gstRate: gstRate || 18, platformFeeType: platformFeeType || 'percentage',
        platformFeeValue: feeValue || 5, platformFeePercentage: feeValue || 5,
        commissionRate: commissionRate || 0,
        venueCGST: venueCGST || 9, venueSGST: venueSGST || 9, venueHSN: venueHSN || '',
        platformCGST: platformCGST || 9, platformSGST: platformSGST || 9,
        serviceCGST: serviceCGST || 9, serviceSGST: serviceSGST || 9,
        serviceHSN: serviceHSN || '', servicePlatformFee: servicePlatformFee || 5,
        serviceCategoryRates: serviceCategoryRates ? (typeof serviceCategoryRates === 'string' ? JSON.parse(serviceCategoryRates) : serviceCategoryRates) : [],
        updatedBy: req.user.id
      };
      if (req.files) {
        if (req.files.gstInvoiceSignature?.[0]) {
          const result = await uploadToCloudinary(req.files.gstInvoiceSignature[0].buffer, 'signatures');
          newSettings.gstInvoiceSignature = result.secure_url;
        }
        if (req.files.platformInvoiceSignature?.[0]) {
          const result = await uploadToCloudinary(req.files.platformInvoiceSignature[0].buffer, 'signatures');
          newSettings.platformInvoiceSignature = result.secure_url;
        }
      }
      settings = await PlatformSettings.create(newSettings);
    }
    
    res.json({ success: true, message: 'Platform settings updated successfully', settings });
  } catch (error) {
    console.error('Platform settings update error:', error);
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
    const QuotationDownload = require('../models/QuotationDownload');
    const ServiceBooking = require('../models/ServiceBooking');
    const totalVenues = await Venue.countDocuments();
    const pendingVenues = await Venue.countDocuments({ status: 'pending' });
    const approvedVenues = await Venue.countDocuments({ status: 'approved' });
    const totalUsers = await User.countDocuments();
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const totalQuotationDownloads = await QuotationDownload.countDocuments();
    const totalServiceBookings = await ServiceBooking.countDocuments();
    const serviceBookingEnquiries = await ServiceBooking.countDocuments({ status: 'enquiry' });

    const revenueData = await Booking.aggregate([
      { $match: { status: { $in: ['completed', 'confirmed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

    res.json({
      success: true,
      stats: {
        totalVenues, pendingVenues, approvedVenues,
        totalUsers, totalOwners, totalCustomers,
        totalBookings, pendingBookings, confirmedBookings, completedBookings,
        totalRevenue, totalQuotationDownloads,
        totalServiceBookings, serviceBookingEnquiries
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('referredBy', 'name email')
      .populate('referrals.user', 'name email')
      .sort('-createdAt');

    // Get booking counts per user in one query
    const bookingCounts = await Booking.aggregate([
      { $group: { _id: '$customer', count: { $sum: 1 } } }
    ]);
    const bookingCountMap = {};
    bookingCounts.forEach(b => {
      if (b._id) bookingCountMap[b._id.toString()] = b.count;
    });

    // Get venue counts per owner in one query
    const Venue = require('../models/Venue');
    const venueCounts = await Venue.aggregate([
      { $group: { _id: '$owner', count: { $sum: 1 } } }
    ]);
    const venueCountMap = {};
    venueCounts.forEach(v => {
      if (v._id) venueCountMap[v._id.toString()] = v.count;
    });

    const usersWithStats = users.map(u => {
      const obj = u.toObject();
      obj.bookingCount = bookingCountMap[u._id.toString()] || 0;
      obj.venueCount = venueCountMap[u._id.toString()] || 0;
      return obj;
    });

    res.json({
      success: true,
      count: usersWithStats.length,
      users: usersWithStats
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

// @desc    Admin reset user password
// @route   PUT /api/admin/users/:id/reset-password
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot reset admin password' });
    user.password = newPassword; // pre-save hook will hash it
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all bookings with pagination and filters
// @route   GET /api/admin/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      venue, 
      search,
      statsVenue, // Separate venue filter for stats
      venueType // Venue type filter
    } = req.query;

    // Build query for bookings
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (venue && venue !== 'all') {
      query.venue = venue;
    }
    
    // Venue type filter
    if (venueType && venueType !== 'all') {
      const venuesWithType = await Venue.find({
        venueType: venueType
      }).select('_id');
      
      if (query.venue) {
        // If venue is already filtered, combine with venue type
        query.venue = { $in: venuesWithType.map(v => v._id), $eq: query.venue };
      } else {
        query.venue = { $in: venuesWithType.map(v => v._id) };
      }
    }
    
    if (search) {
      // Search in customer name, email, or venue name
      const customers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const venues = await Venue.find({
        businessName: { $regex: search, $options: 'i' }
      }).select('_id');
      
      query.$or = [
        { customer: { $in: customers.map(c => c._id) } },
        { venue: { $in: venues.map(v => v._id) } }
      ];
    }

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(query);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalBookings / limit);
    
    // Fetch paginated bookings
    const bookings = await Booking.find(query)
      .populate('venue', 'businessName location images owner venueType')
      .populate('customer', 'name email phone')
      .populate({
        path: 'venue',
        populate: {
          path: 'owner',
          select: 'name email phone'
        }
      })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate stats (filtered by statsVenue and venueType if provided)
    let statsQuery = {};
    if (statsVenue && statsVenue !== 'all') {
      statsQuery.venue = statsVenue;
    }
    
    // Apply venue type filter to stats
    if (venueType && venueType !== 'all') {
      const venuesWithType = await Venue.find({
        venueType: venueType
      }).select('_id');
      
      if (statsQuery.venue) {
        // If statsVenue is already filtered, combine with venue type
        statsQuery.venue = { $in: venuesWithType.map(v => v._id), $eq: statsQuery.venue };
      } else {
        statsQuery.venue = { $in: venuesWithType.map(v => v._id) };
      }
    }

    const stats = {
      total: await Booking.countDocuments(statsQuery),
      pending: await Booking.countDocuments({ ...statsQuery, status: 'pending' }),
      confirmed: await Booking.countDocuments({ ...statsQuery, status: 'confirmed' }),
      completed: await Booking.countDocuments({ ...statsQuery, status: 'completed' }),
      cancelled: await Booking.countDocuments({ ...statsQuery, status: 'cancelled' })
    };
    
    res.json({
      success: true,
      count: bookings.length,
      totalBookings,
      totalPages,
      currentPage: parseInt(page),
      bookings,
      stats
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

// @desc    Get all payments with server-side filtering & stats
// @route   GET /api/admin/payments?status=&dateFilter=&from=&to=&fyYear=&year=&search=
exports.getAllPayments = async (req, res) => {
  try {
    const { status, dateFilter, from, to, fyYear, year, search } = req.query;

    // ── Build date range ──────────────────────────────────────────────────────
    let dateMatch = {};
    const now = new Date();

    if (dateFilter === 'today') {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end   = new Date(now); end.setHours(23, 59, 59, 999);
      dateMatch = { createdAt: { $gte: start, $lte: end } };
    } else if (dateFilter === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - 7); start.setHours(0,0,0,0);
      dateMatch = { createdAt: { $gte: start } };
    } else if (dateFilter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      dateMatch = { createdAt: { $gte: start, $lte: end } };
    } else if (dateFilter === 'year' && year) {
      const y = parseInt(year);
      dateMatch = { createdAt: { $gte: new Date(`${y}-01-01T00:00:00`), $lte: new Date(`${y}-12-31T23:59:59`) } };
    } else if (dateFilter === 'fy' && fyYear) {
      // fyYear = "2025" means Apr 2025 – Mar 2026
      const y = parseInt(fyYear);
      dateMatch = { createdAt: { $gte: new Date(`${y}-04-01T00:00:00`), $lte: new Date(`${y + 1}-03-31T23:59:59`) } };
    } else if (dateFilter === 'custom' && from && to) {
      dateMatch = { createdAt: { $gte: new Date(from + 'T00:00:00'), $lte: new Date(to + 'T23:59:59') } };
    }

    // ── Build filter ──────────────────────────────────────────────────────────
    const filter = { paymentStatus: { $exists: true }, ...dateMatch };
    if (status && status !== 'all') filter.paymentStatus = status;

    // ── Fetch ─────────────────────────────────────────────────────────────────
    let payments = await Booking.find(filter)
      .populate('venue', 'businessName location owner images')
      .populate('customer', 'name email phone')
      .populate({ path: 'venue', populate: { path: 'owner', select: 'name email phone' } })
      .sort('-createdAt');

    // ── Search filter (in-memory — name/email/paymentId) ─────────────────────
    if (search) {
      const q = search.toLowerCase();
      payments = payments.filter(p =>
        p.paymentDetails?.razorpay_payment_id?.toLowerCase().includes(q) ||
        p.paymentDetails?.razorpay_order_id?.toLowerCase().includes(q) ||
        p.customer?.name?.toLowerCase().includes(q) ||
        p.customer?.email?.toLowerCase().includes(q) ||
        p.venue?.businessName?.toLowerCase().includes(q) ||
        p.bookingNumber?.toLowerCase().includes(q)
      );
    }

    // ── Backfill ledger for old paid bookings ─────────────────────────────────
    const backfillPromises = [];
    for (const booking of payments) {
      const txns = booking.paymentLedger?.transactions || [];
      if (txns.length === 0) {
        if (!booking.paymentLedger) booking.paymentLedger = { transactions: [], adjustments: [] };
        if (!booking.paymentLedger.transactions) booking.paymentLedger.transactions = [];

        if ((booking.paymentStatus === 'paid' || booking.paymentStatus === 'refunded') && booking.paymentDetails?.razorpay_payment_id) {
          booking.paymentLedger.transactions.push({
            txnId: booking.paymentDetails.razorpay_payment_id,
            type: 'payment', amount: booking.amount, status: 'completed',
            note: `Razorpay — Order: ${booking.paymentDetails.razorpay_order_id || 'N/A'}`,
            date: booking.paymentDetails.paidAt || booking.updatedAt
          });
          if (booking.refundDetails?.refundAmount) {
            booking.paymentLedger.transactions.push({
              txnId: booking.refundDetails.refundId || `REFUND-${booking._id}`,
              type: 'refund', amount: booking.refundDetails.refundAmount,
              status: booking.refundDetails.refundStatus === 'processed' ? 'completed' : 'pending',
              note: booking.refundDetails.refundReason || 'Refund processed',
              date: booking.refundDetails.refundedAt || booking.updatedAt
            });
          }
        } else {
          booking.paymentLedger.transactions.push({
            txnId: `BOOKING-${booking._id}`, type: 'payment', amount: booking.amount,
            status: 'pending', note: `Booking created — ₹${(booking.amount || 0).toLocaleString()} due`,
            date: booking.createdAt
          });
        }
        booking.markModified('paymentLedger');
        backfillPromises.push(booking.save({ validateBeforeSave: false }));
      }
    }
    if (backfillPromises.length > 0) await Promise.all(backfillPromises);

    // ── Compute stats from filtered set ──────────────────────────────────────
    const stats = {
      total:         payments.length,
      paid:          payments.filter(p => p.paymentStatus === 'paid').length,
      pending:       payments.filter(p => p.paymentStatus === 'pending').length,
      failed:        payments.filter(p => p.paymentStatus === 'failed').length,
      refunded:      payments.filter(p => p.paymentStatus === 'refunded').length,
      totalRevenue:  payments.filter(p => p.paymentStatus === 'paid').reduce((s, p) => s + (p.amount || 0), 0),
      ownerEarnings: payments.filter(p => p.paymentStatus === 'paid').reduce((s, p) => s + (p.ownerEarnings || 0), 0),
    };

    res.set('Cache-Control', 'no-store');
    res.json({ success: true, count: payments.length, payments, stats });

  } catch (error) {
    console.error('getAllPayments error:', error);
    res.status(500).json({ success: false, message: error.message });
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

    // Backfill ledger if needed
    const txns = payment.paymentLedger?.transactions || [];
    const hasPaidTxn = txns.some(t => ['payment', 'manual_payment'].includes(t.type) && t.status === 'completed');
    if (!hasPaidTxn && payment.paymentStatus === 'paid' && payment.paymentDetails?.razorpay_payment_id) {
      if (!payment.paymentLedger) payment.paymentLedger = { transactions: [], adjustments: [] };
      if (!payment.paymentLedger.transactions) payment.paymentLedger.transactions = [];
      payment.paymentLedger.transactions.push({
        txnId: payment.paymentDetails.razorpay_payment_id,
        type: 'payment',
        amount: payment.amount,
        status: 'completed',
        note: `Razorpay — Order: ${payment.paymentDetails.razorpay_order_id || 'N/A'}`,
        date: payment.paymentDetails.paidAt || payment.updatedAt
      });
      payment.markModified('paymentLedger');
      await payment.save({ validateBeforeSave: false });
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
    const { range, startDate, endDate } = req.query;
    const VendorService = require('../models/VendorService');
    const ServiceBooking = require('../models/ServiceBooking');

    let queryStartDate, queryEndDate;
    if (startDate && endDate) {
      queryStartDate = new Date(startDate);
      queryEndDate = new Date(endDate);
    } else {
      queryEndDate = new Date();
      queryStartDate = new Date();
      switch (range) {
        case 'week':   queryStartDate.setDate(queryStartDate.getDate() - 7); break;
        case 'month':  queryStartDate.setMonth(queryStartDate.getMonth() - 1); break;
        case 'quarter':queryStartDate.setMonth(queryStartDate.getMonth() - 3); break;
        case 'year':   queryStartDate.setFullYear(queryStartDate.getFullYear() - 1); break;
        default:       queryStartDate = new Date(0);
      }
    }

    const dateFilter = { createdAt: { $gte: queryStartDate, $lte: queryEndDate } };

    // ── Venue Bookings ──────────────────────────────────────────────────────
    const allBookings = await Booking.find(dateFilter).populate('venue', 'businessName location owner').populate('customer', 'name email');
    const paidBookings = allBookings.filter(b => b.paymentStatus === 'paid');

    const totalRevenue = paidBookings.reduce((s, b) => s + (b.amount || 0), 0);
    const platformFeeTotal = paidBookings.reduce((s, b) => s + (b.priceBreakdown?.platformFeeTotal || 0), 0);
    const ownerEarnings = paidBookings.reduce((s, b) => s + (b.ownerEarnings || 0), 0);
    const venueGSTTotal = paidBookings.reduce((s, b) => s + (b.priceBreakdown?.gst || 0), 0);
    const discountTotal = paidBookings.reduce((s, b) => s + (b.priceBreakdown?.discount || 0), 0);

    // ── Service Bookings ────────────────────────────────────────────────────
    const allSvcBookings = await ServiceBooking.find(dateFilter).populate('vendor', 'name email').populate('service', 'title category');
    const paidSvcBookings = allSvcBookings.filter(b => b.paymentStatus === 'paid');
    const svcRevenue = paidSvcBookings.reduce((s, b) => s + (b.amount || 0), 0);

    // ── Users ───────────────────────────────────────────────────────────────
    const [totalUsers, customers, owners, vendors, newUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'owner' }),
      User.countDocuments({ role: 'vendor' }),
      User.countDocuments({ ...dateFilter })
    ]);

    // ── Venues ──────────────────────────────────────────────────────────────
    const [totalVenues, approvedVenues, pendingVenues, rejectedVenues] = await Promise.all([
      Venue.countDocuments(),
      Venue.countDocuments({ status: 'approved' }),
      Venue.countDocuments({ status: 'pending' }),
      Venue.countDocuments({ status: 'rejected' })
    ]);

    // ── Vendor Services ─────────────────────────────────────────────────────
    const [totalServices, approvedServices] = await Promise.all([
      VendorService.countDocuments(),
      VendorService.countDocuments({ status: 'approved' })
    ]);

    // ── Top Venues by Revenue ───────────────────────────────────────────────
    const venueRevenueMap = {};
    paidBookings.forEach(b => {
      const id = b.venue?._id?.toString();
      if (!id) return;
      if (!venueRevenueMap[id]) venueRevenueMap[id] = { name: b.venue.businessName, city: b.venue.location?.city, revenue: 0, bookings: 0 };
      venueRevenueMap[id].revenue += b.amount || 0;
      venueRevenueMap[id].bookings += 1;
    });
    const topVenues = Object.values(venueRevenueMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // ── Top Owners by Earnings ──────────────────────────────────────────────
    const ownerEarningsMap = {};
    paidBookings.forEach(b => {
      const ownerId = b.venue?.owner?.toString();
      if (!ownerId) return;
      if (!ownerEarningsMap[ownerId]) ownerEarningsMap[ownerId] = { earnings: 0, bookings: 0 };
      ownerEarningsMap[ownerId].earnings += b.ownerEarnings || 0;
      ownerEarningsMap[ownerId].bookings += 1;
    });
    const ownerIds = Object.keys(ownerEarningsMap);
    const ownerUsers = ownerIds.length ? await User.find({ _id: { $in: ownerIds } }, 'name email') : [];
    const topOwners = ownerUsers.map(u => ({
      name: u.name, email: u.email,
      earnings: ownerEarningsMap[u._id.toString()]?.earnings || 0,
      bookings: ownerEarningsMap[u._id.toString()]?.bookings || 0
    })).sort((a, b) => b.earnings - a.earnings).slice(0, 5);

    // ── Top Vendors by Service Revenue ─────────────────────────────────────
    const vendorRevenueMap = {};
    paidSvcBookings.forEach(b => {
      const id = b.vendor?._id?.toString();
      if (!id) return;
      if (!vendorRevenueMap[id]) vendorRevenueMap[id] = { name: b.vendor.name, email: b.vendor.email, revenue: 0, bookings: 0 };
      vendorRevenueMap[id].revenue += b.amount || 0;
      vendorRevenueMap[id].bookings += 1;
    });
    const topVendors = Object.values(vendorRevenueMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // ── Top Services by Revenue ─────────────────────────────────────────────
    const serviceRevenueMap = {};
    paidSvcBookings.forEach(b => {
      const id = b.service?._id?.toString();
      if (!id) return;
      if (!serviceRevenueMap[id]) serviceRevenueMap[id] = {
        title: b.service.title || b.serviceSnapshot?.title || 'Unknown',
        category: b.service.category || b.serviceSnapshot?.category || '',
        vendor: b.vendor?.name || '',
        revenue: 0, bookings: 0
      };
      serviceRevenueMap[id].revenue += b.amount || 0;
      serviceRevenueMap[id].bookings += 1;
    });
    const topServices = Object.values(serviceRevenueMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // ── Service Payment breakdown ───────────────────────────────────────────
    const svcPayGroups = { paid: 0, paidAmt: 0, pending: 0, pendingAmt: 0, failed: 0, failedAmt: 0 };
    allSvcBookings.forEach(b => {
      const a = b.amount || 0;
      if (b.paymentStatus === 'paid')    { svcPayGroups.paid++;    svcPayGroups.paidAmt += a; }
      if (b.paymentStatus === 'pending') { svcPayGroups.pending++; svcPayGroups.pendingAmt += a; }
      if (b.paymentStatus === 'failed')  { svcPayGroups.failed++;  svcPayGroups.failedAmt += a; }
    });

    // ── Service Bookings by status ──────────────────────────────────────────
    const svcByStatus = {
      total: allSvcBookings.length,
      enquiry: allSvcBookings.filter(b => b.status === 'enquiry').length,
      confirmed: allSvcBookings.filter(b => b.status === 'confirmed').length,
      cancelled: allSvcBookings.filter(b => b.status === 'cancelled').length,
      paid: paidSvcBookings.length
    };

    const paymentGroups = { paid: 0, paidAmt: 0, pending: 0, pendingAmt: 0, failed: 0, failedAmt: 0, refunded: 0, refundedAmt: 0 };
    allBookings.forEach(b => {
      const s = b.paymentStatus;
      const a = b.amount || 0;
      if (s === 'paid')     { paymentGroups.paid++;     paymentGroups.paidAmt += a; }
      if (s === 'pending')  { paymentGroups.pending++;  paymentGroups.pendingAmt += a; }
      if (s === 'failed')   { paymentGroups.failed++;   paymentGroups.failedAmt += a; }
      if (s === 'refunded') { paymentGroups.refunded++; paymentGroups.refundedAmt += (b.refundDetails?.refundAmount || a); }
    });

    res.json({
      success: true,
      reports: {
        revenue: {
          total: totalRevenue,
          platformFee: Math.round(platformFeeTotal),
          ownerEarnings: Math.round(ownerEarnings),
          venueGST: Math.round(venueGSTTotal),
          discountGiven: Math.round(discountTotal),
          serviceRevenue: svcRevenue,
          grandTotal: totalRevenue + svcRevenue,
          average: paidBookings.length > 0 ? Math.round(totalRevenue / paidBookings.length) : 0
        },
        bookings: {
          total: allBookings.length,
          completed: allBookings.filter(b => b.status === 'completed').length,
          confirmed: allBookings.filter(b => b.status === 'confirmed').length,
          pending: allBookings.filter(b => b.status === 'pending').length,
          cancelled: allBookings.filter(b => b.status === 'cancelled').length,
          serviceTotal: allSvcBookings.length,
          servicePaid: paidSvcBookings.length
        },
        venues: { total: totalVenues, approved: approvedVenues, pending: pendingVenues, rejected: rejectedVenues, avgBookings: approvedVenues > 0 ? Math.round(allBookings.length / approvedVenues) : 0 },
        users: { total: totalUsers, customers, owners, vendors, newInPeriod: newUsers },
        services: { total: totalServices, approved: approvedServices },
        payments: {
          paid: paymentGroups.paid, paidAmount: paymentGroups.paidAmt,
          pending: paymentGroups.pending, pendingAmount: paymentGroups.pendingAmt,
          failed: paymentGroups.failed, failedAmount: paymentGroups.failedAmt,
          refunded: paymentGroups.refunded, refundedAmount: paymentGroups.refundedAmt
        },
        topVenues,
        topOwners,
        topVendors,
        topServices,
        svcByStatus,
        svcPayments: {
          paid: svcPayGroups.paid, paidAmount: svcPayGroups.paidAmt,
          pending: svcPayGroups.pending, pendingAmount: svcPayGroups.pendingAmt,
          failed: svcPayGroups.failed, failedAmount: svcPayGroups.failedAmt
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    const { bookingTerms, cancellationPolicy, paymentTerms, quotationValidity, venueOnboardingTerms } = req.body;
    
    const terms = await TermsConditions.create({
      bookingTerms,
      cancellationPolicy,
      paymentTerms,
      quotationValidity,
      venueOnboardingTerms,
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

// Hero Slides Management
const HeroSlide = require('../models/HeroSlide');
const { uploadToCloudinary } = require('../config/cloudinary');

// @desc    Get all hero slides
// @route   GET /api/admin/hero-slides
exports.getAllHeroSlides = async (req, res) => {
  try {
    const slides = await HeroSlide.find().sort({ order: 1 });
    res.json({
      success: true,
      data: slides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create hero slide
// @route   POST /api/admin/hero-slides
exports.createHeroSlide = async (req, res) => {
  try {
    const { title, subtitle, description, buttonText, buttonLink, order } = req.body;

    console.log('Creating hero slide...');
    console.log('File received:', req.file ? 'Yes' : 'No');
    console.log('File details:', req.file ? { 
      fieldname: req.file.fieldname, 
      mimetype: req.file.mimetype, 
      size: req.file.size 
    } : 'N/A');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required'
      });
    }

    console.log('Uploading to Cloudinary...');
    // Upload to Cloudinary using buffer
    const result = await uploadToCloudinary(req.file.buffer, 'hero-slides');
    console.log('Upload successful:', result.secure_url);

    const slide = await HeroSlide.create({
      title,
      subtitle,
      description,
      image: result.secure_url,
      buttonText: buttonText || 'Browse Venues',
      buttonLink: buttonLink || '/venues',
      order: order || 0
    });

    console.log('Hero slide created:', slide._id);

    res.status(201).json({
      success: true,
      data: slide
    });
  } catch (error) {
    console.error('Error creating hero slide:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update hero slide
// @route   PUT /api/admin/hero-slides/:id
exports.updateHeroSlide = async (req, res) => {
  try {
    const { title, subtitle, description, buttonText, buttonLink, order, isActive } = req.body;
    
    const slide = await HeroSlide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Hero slide not found'
      });
    }

    // Update fields
    if (title) slide.title = title;
    if (subtitle !== undefined) slide.subtitle = subtitle;
    if (description !== undefined) slide.description = description;
    if (buttonText) slide.buttonText = buttonText;
    if (buttonLink) slide.buttonLink = buttonLink;
    if (order !== undefined) slide.order = order;
    if (isActive !== undefined) slide.isActive = isActive;

    // Update image if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'hero-slides');
      slide.image = result.secure_url;
    }

    await slide.save();

    res.json({
      success: true,
      data: slide
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete hero slide
// @route   DELETE /api/admin/hero-slides/:id
exports.deleteHeroSlide = async (req, res) => {
  try {
    const slide = await HeroSlide.findById(req.params.id);
    if (!slide) {
      return res.status(404).json({
        success: false,
        message: 'Hero slide not found'
      });
    }

    await slide.deleteOne();

    res.json({
      success: true,
      message: 'Hero slide deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get active hero slides (public)
// @route   GET /api/hero-slides
exports.getActiveHeroSlides = async (req, res) => {
  try {
    const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1 });
    res.json({
      success: true,
      data: slides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Contact Settings Management
const ContactSettings = require('../models/ContactSettings');

// @desc    Get contact settings
// @route   GET /api/admin/contact-settings
exports.getContactSettings = async (req, res) => {
  try {
    let settings = await ContactSettings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await ContactSettings.create({
        address: 'G-137, Gautam Nagar, Near Chokak Bridge, Bhopal',
        phone: '+91 8423796767',
        email: 'booking@rentalmeet.in',
        availability: '24/7 Available',
        filterSettings: {
          capacityMin: 10,
          capacityMax: 1000,
          priceMin: 1000,
          priceMax: 1000000
        }
      });
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update contact settings
// @route   PUT /api/admin/contact-settings
exports.updateContactSettings = async (req, res) => {
  try {
    const { address, address2, phone, phone2, email, email2, availability, socialMedia, filterSettings } = req.body;
    
    let settings = await ContactSettings.findOne();
    
    if (!settings) {
      // Create new if doesn't exist
      settings = await ContactSettings.create(req.body);
    } else {
      // Update existing
      if (address !== undefined) settings.address = address;
      if (address2 !== undefined) settings.address2 = address2;
      if (phone !== undefined) settings.phone = phone;
      if (phone2 !== undefined) settings.phone2 = phone2;
      if (email !== undefined) settings.email = email;
      if (email2 !== undefined) settings.email2 = email2;
      if (availability !== undefined) settings.availability = availability;
      if (socialMedia) settings.socialMedia = socialMedia;
      if (filterSettings) settings.filterSettings = filterSettings;
      
      await settings.save();
    }
    
    res.json({
      success: true,
      data: settings,
      message: 'Contact settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get contact settings (public)
// @route   GET /api/contact-settings
exports.getPublicContactSettings = async (req, res) => {
  try {
    let settings = await ContactSettings.findOne();
    
    if (!settings) {
      settings = {
        address: 'G-137, Gautam Nagar, Near Chokak Bridge, Bhopal',
        phone: '+91 8423796767',
        email: 'booking@rentalmeet.in',
        availability: '24/7 Available',
        socialMedia: {},
        filterSettings: {
          capacityMin: 10,
          capacityMax: 1000,
          priceMin: 1000,
          priceMax: 1000000
        }
      };
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Employee Management
const { generateUserId } = require('./authController');

// @desc    Get all employees
// @route   GET /api/admin/employees
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .populate('referredBy', 'name email userId')
      .populate({
        path: 'referrals.user',
        select: 'name email userId role'
      })
      .sort({ createdAt: -1 });

    const employeesWithEarnings = employees.map(emp => {
      const obj = emp.toObject();
      const details = obj.employeeDetails || {};
      if (details.employmentType === 'Permanent') {
        obj.earning = details.salary || 0;
      } else {
        obj.earning = details.contractDetails?.amount || 0;
      }
      return obj;
    });

    res.json({
      success: true,
      count: employeesWithEarnings.length,
      data: employeesWithEarnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create employee
// @route   POST /api/admin/employees
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, phone, alternatePhone, address, city, state, pincode, password, employeeDetails } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Generate userId for employee with EMP prefix
    const userId = await generateUserId('employee');

    // Create employee
    const employee = await User.create({
      userId,
      name,
      email,
      phone,
      alternatePhone,
      address,
      city,
      state,
      pincode,
      password,
      role: 'employee',
      isVerified: true, // Auto-verify employees
      employeeDetails: employeeDetails || {}
    });

    // Generate unique referral code for employee
    let newReferralCode;
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = employee.generateReferralCode();
      const existingCode = await User.findOne({ referralCode: newReferralCode });
      if (!existingCode) {
        isUnique = true;
      }
    }
    employee.referralCode = newReferralCode;
    await employee.save();

    // Remove password from response
    const employeeData = employee.toObject();
    delete employeeData.password;

    res.status(201).json({
      success: true,
      data: employeeData,
      message: 'Employee created successfully'
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/admin/employees/:id
exports.updateEmployee = async (req, res) => {
  try {
    const { name, email, phone, alternatePhone, address, city, state, pincode, password, employeeDetails } = req.body;

    const employee = await User.findById(req.params.id);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if email/phone is being changed and already exists
    if (email && email !== employee.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    if (phone && phone !== employee.phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: req.params.id } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone already in use'
        });
      }
    }

    // Update fields
    if (name) employee.name = name;
    if (email) employee.email = email;
    if (phone) employee.phone = phone;
    if (alternatePhone !== undefined) employee.alternatePhone = alternatePhone;
    if (address !== undefined) employee.address = address;
    if (city !== undefined) employee.city = city;
    if (state !== undefined) employee.state = state;
    if (pincode !== undefined) employee.pincode = pincode;
    if (password) employee.password = password; // Will be hashed by pre-save hook
    
    // Update employee details
    if (employeeDetails) {
      employee.employeeDetails = {
        ...employee.employeeDetails,
        ...employeeDetails
      };
    }

    await employee.save({ validateBeforeSave: false });

    const employeeData = employee.toObject();
    delete employeeData.password;

    res.json({
      success: true,
      data: employeeData,
      message: 'Employee updated successfully'
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/admin/employees/:id
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    await employee.deleteOne();

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle employee status
// @route   PUT /api/admin/employees/:id/status
exports.toggleEmployeeStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const employee = await User.findById(req.params.id);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    employee.isActive = isActive;
    await employee.save();

    res.json({
      success: true,
      data: employee,
      message: `Employee ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== SUBADMIN MANAGEMENT ====================

// @desc    Get all subadmins
// @route   GET /api/admin/subadmins
exports.getAllSubAdmins = async (req, res) => {
  try {
    const subadmins = await User.find({ role: 'subadmin' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: subadmins.length,
      data: subadmins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create subadmin
// @route   POST /api/admin/subadmins
exports.createSubAdmin = async (req, res) => {
  try {
    const { name, email, phone, alternatePhone, address, city, state, pincode, password, permissions } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Generate userId for subadmin with SUB prefix
    const userId = await generateUserId('subadmin');

    // Generate unique referral code
    const tempSubadmin = new User({ role: 'subadmin' });
    let newReferralCode;
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = tempSubadmin.generateReferralCode();
      const existingCode = await User.findOne({ referralCode: newReferralCode });
      if (!existingCode) {
        isUnique = true;
      }
    }

    // Create subadmin with all data including referral code (single save)
    const subadmin = await User.create({
      userId,
      name,
      email,
      phone,
      alternatePhone,
      address,
      city,
      state,
      pincode,
      password,
      role: 'subadmin',
      isActive: true,
      permissions: permissions || {},
      referralCode: newReferralCode
    });

    // Remove password from response
    const subadminData = subadmin.toObject();
    delete subadminData.password;

    res.status(201).json({
      success: true,
      data: subadminData,
      message: 'SubAdmin created successfully'
    });
  } catch (error) {
    console.error('Create subadmin error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update subadmin
// @route   PUT /api/admin/subadmins/:id
exports.updateSubAdmin = async (req, res) => {
  try {
    const { name, email, phone, alternatePhone, address, city, state, pincode, password, permissions } = req.body;

    // Find subadmin with password field
    const subadmin = await User.findById(req.params.id).select('+password');
    if (!subadmin || subadmin.role !== 'subadmin') {
      return res.status(404).json({
        success: false,
        message: 'SubAdmin not found'
      });
    }

    // Check if email/phone is being changed and already exists
    if (email && email !== subadmin.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    if (phone && phone !== subadmin.phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: req.params.id } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone already in use'
        });
      }
    }

    // Update fields
    if (name) subadmin.name = name;
    if (email) subadmin.email = email;
    if (phone) subadmin.phone = phone;
    if (alternatePhone !== undefined) subadmin.alternatePhone = alternatePhone;
    if (address !== undefined) subadmin.address = address;
    if (city !== undefined) subadmin.city = city;
    if (state !== undefined) subadmin.state = state;
    if (pincode !== undefined) subadmin.pincode = pincode;
    if (password && password.trim() !== '') subadmin.password = password; // Will be hashed by pre-save hook
    if (permissions !== undefined) subadmin.permissions = permissions;

    await subadmin.save();

    const subadminData = subadmin.toObject();
    delete subadminData.password;

    res.json({
      success: true,
      data: subadminData,
      message: 'SubAdmin updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete subadmin
// @route   DELETE /api/admin/subadmins/:id
exports.deleteSubAdmin = async (req, res) => {
  try {
    const subadmin = await User.findById(req.params.id);
    if (!subadmin || subadmin.role !== 'subadmin') {
      return res.status(404).json({
        success: false,
        message: 'SubAdmin not found'
      });
    }

    await subadmin.deleteOne();

    res.json({
      success: true,
      message: 'SubAdmin deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Toggle subadmin status
// @route   PUT /api/admin/subadmins/:id/status
exports.toggleSubAdminStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const subadmin = await User.findById(req.params.id);
    if (!subadmin || subadmin.role !== 'subadmin') {
      return res.status(404).json({
        success: false,
        message: 'SubAdmin not found'
      });
    }

    subadmin.isActive = isActive;
    await subadmin.save();

    res.json({
      success: true,
      data: subadmin,
      message: `SubAdmin ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get top venues performance analytics
// @route   GET /api/admin/payments/venue-analytics
exports.getVenueAnalytics = async (req, res) => {
  try {
    const { period = 'all' } = req.query;

    // Build date filter
    let dateMatch = {};
    const now = new Date();
    if (period === 'today') {
      const start = new Date(now); start.setHours(0,0,0,0);
      dateMatch = { createdAt: { $gte: start } };
    } else if (period === 'week') {
      const start = new Date(now); start.setDate(now.getDate() - 7);
      dateMatch = { createdAt: { $gte: start } };
    } else if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      dateMatch = { createdAt: { $gte: start } };
    } else if (period === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      dateMatch = { createdAt: { $gte: start } };
    }

    const topVenues = await Booking.aggregate([
      { $match: { ...dateMatch } },
      {
        $group: {
          _id: '$venue',
          totalBookings:  { $sum: 1 },
          totalRevenue:   { $sum: '$amount' },
          paidRevenue:    { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0] } },
          confirmedCount: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          pendingCount:   { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          ownerEarnings:  { $sum: '$ownerEarnings' },
          avgBookingValue:{ $avg: '$amount' },
        }
      },
      { $sort: { totalBookings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'venues',
          localField: '_id',
          foreignField: '_id',
          as: 'venue'
        }
      },
      { $unwind: { path: '$venue', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          totalBookings: 1,
          totalRevenue: 1,
          paidRevenue: 1,
          confirmedCount: 1,
          completedCount: 1,
          cancelledCount: 1,
          pendingCount: 1,
          ownerEarnings: 1,
          avgBookingValue: 1,
          'venue.businessName': 1,
          'venue.location.city': 1,
          'venue.location.area': 1,
          'venue.images': 1,
          'venue.status': 1,
        }
      }
    ]);

    // Overall summary
    const summary = await Booking.aggregate([
      { $match: { ...dateMatch } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue:  { $sum: '$amount' },
          paidRevenue:   { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0] } },
          uniqueVenues:  { $addToSet: '$venue' },
        }
      },
      {
        $project: {
          totalBookings: 1,
          totalRevenue: 1,
          paidRevenue: 1,
          uniqueVenueCount: { $size: '$uniqueVenues' }
        }
      }
    ]);

    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      topVenues,
      summary: summary[0] || { totalBookings: 0, totalRevenue: 0, paidRevenue: 0, uniqueVenueCount: 0 }
    });
  } catch (error) {
    console.error('Venue analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

