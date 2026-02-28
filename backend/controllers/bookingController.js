const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const CommissionSettings = require('../models/CommissionSettings');

// @desc    Create booking
// @route   POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { 
      venue, 
      bookingDate, 
      startTime, 
      endTime, 
      bookingType, 
      amount, 
      selectedAmenities,
      amenitiesTotal,
      priceBreakdown,
      customerDetails 
    } = req.body;
    
    // Get current commission rate (default 15%)
    const commissionSettings = await CommissionSettings.findOne().sort('-createdAt');
    const commissionRate = commissionSettings ? commissionSettings.commissionRate : 15;
    
    // Calculate commission and owner earnings
    const commission = (amount * commissionRate) / 100;
    const ownerEarnings = amount - commission;
    
    // Create booking
    const booking = await Booking.create({
      venue,
      customer: req.user.id,
      bookingDate,
      startTime,
      endTime,
      bookingType,
      amount,
      commission,
      ownerEarnings,
      commissionRate,
      selectedAmenities: selectedAmenities || {
        basic: [],
        beverages: [],
        refreshmentFood: [],
        lunchThalis: [],
        additional: []
      },
      amenitiesTotal: amenitiesTotal || 0,
      priceBreakdown: priceBreakdown || {},
      customerDetails
    });
    
    // Populate venue and customer details
    await booking.populate('venue', 'businessName location sku images');
    await booking.populate('customer', 'name email phone');
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
exports.getBookings = async (req, res) => {
  try {
    let query = {};
    
    // Filter by role
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'owner') {
      const venues = await Venue.find({ owner: req.user.id });
      const venueIds = venues.map(v => v._id);
      query.venue = { $in: venueIds };
    }
    
    const bookings = await Booking.find(query)
      .populate('venue', 'businessName location sku images')
      .populate('customer', 'name email phone')
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
// @route   GET /api/bookings/:id
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('venue')
      .populate('customer', 'name email phone');
    
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

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    booking.status = status;
    await booking.save();
    
    // Update venue stats if completed
    if (status === 'completed') {
      await Venue.findByIdAndUpdate(booking.venue, {
        $inc: {
          totalBookings: 1,
          totalEarnings: booking.ownerEarnings
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Booking status updated',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledBy = req.user.id;
    await booking.save();
    
    res.json({
      success: true,
      message: 'Booking cancelled',
      booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
