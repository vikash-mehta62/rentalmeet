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

// @desc    Update platform settings (GST, Platform Fee & Commission)
// @route   PUT /api/admin/platform-settings
exports.updatePlatformSettings = async (req, res) => {
  try {
    const PlatformSettings = require('../models/PlatformSettings');
    const { gstRate, platformFeeType, platformFeeValue, commissionRate } = req.body;
    
    // Find existing settings or create new
    let settings = await PlatformSettings.findOne();
    
    if (settings) {
      // Update existing document
      settings.gstRate = gstRate !== undefined ? gstRate : settings.gstRate;
      settings.platformFeeType = platformFeeType || settings.platformFeeType;
      settings.platformFeeValue = platformFeeValue !== undefined ? platformFeeValue : settings.platformFeeValue;
      settings.commissionRate = commissionRate !== undefined ? commissionRate : settings.commissionRate;
      settings.updatedBy = req.user.id;
      await settings.save();
    } else {
      // Create new document
      settings = await PlatformSettings.create({
        gstRate,
        platformFeeType,
        platformFeeValue,
        commissionRate,
        updatedBy: req.user.id
      });
    }
    
    res.json({
      success: true,
      message: 'Platform settings updated successfully',
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
      .populate('referredBy', 'name email')
      .populate('referrals.user', 'name email')
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
      statsVenue // Separate venue filter for stats
    } = req.query;

    // Build query for bookings
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (venue && venue !== 'all') {
      query.venue = venue;
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
      .populate('venue', 'businessName location images owner')
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

    // Calculate stats (filtered by statsVenue if provided)
    let statsQuery = {};
    if (statsVenue && statsVenue !== 'all') {
      statsQuery.venue = statsVenue;
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
    const platformFeeTotal = paidBookings.reduce((sum, b) => {
      const subtotal = b.priceBreakdown?.subtotal || 0;
      const gst = b.priceBreakdown?.gst || 0;
      const fee = (b.amount || 0) - subtotal - gst;
      return sum + (fee > 0 ? fee : 0);
    }, 0);
    
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
          platformFee: platformFeeTotal,
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
    const { address, phone, email, availability, socialMedia, filterSettings } = req.body;
    
    let settings = await ContactSettings.findOne();
    
    if (!settings) {
      // Create new if doesn't exist
      settings = await ContactSettings.create(req.body);
    } else {
      // Update existing
      if (address) settings.address = address;
      if (phone) settings.phone = phone;
      if (email) settings.email = email;
      if (availability) settings.availability = availability;
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

    res.json({
      success: true,
      count: employees.length,
      data: employees
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
    const { name, email, phone, alternatePhone, address, city, state, pincode, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Generate userId for employee
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
      isVerified: true // Auto-verify employees
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
    const { name, email, phone, alternatePhone, address, city, state, pincode, password } = req.body;

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

    await employee.save();

    const employeeData = employee.toObject();
    delete employeeData.password;

    res.json({
      success: true,
      data: employeeData,
      message: 'Employee updated successfully'
    });
  } catch (error) {
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
