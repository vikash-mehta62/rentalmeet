const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const Counter = require('../models/Counter');
const Coupon = require('../models/Coupon');
const { getCityCode, getStateCode } = require('../utils/cityCodes');

// Helper function to generate booking number
// Format: STATE(2) + CITY(3) + YEAR(2) + VENUETYPE(2) + SERIAL(6)
// Example: MPBPL26MH000001 (Madhya Pradesh, Bhopal, 2026, Meeting Hall, Serial 1)
const generateBookingNumber = async (venue) => {
  const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits of year
  const stateCode = getStateCode(venue.location?.state); // 2-letter state code
  const cityCode = getCityCode(venue.location?.city); // 3-letter city code
  
  // Get venue type code (2 letters) from first venue type
  let venueTypeCode = 'VN'; // Default
  if (venue.venueTypes && venue.venueTypes.length > 0) {
    const VenueType = require('../models/VenueType');
    const venueType = await VenueType.findById(venue.venueTypes[0]);
    if (venueType && venueType.code) {
      venueTypeCode = venueType.code;
    }
  }
  
  // Create counter ID: booking_STATE_CITY_YEAR_VENUETYPE
  const counterId = `booking_${stateCode}_${cityCode}_${year}_${venueTypeCode}`;
  
  // Get next sequence number
  const sequence = await Counter.getNextSequence(counterId);
  
  // Format sequence with leading zeros (6 digits)
  const sequenceStr = sequence.toString().padStart(6, '0');
  
  // Generate booking number: STATE + CITY + YEAR + VENUETYPE + SERIAL
  const bookingNumber = `${stateCode}${cityCode}${year}${venueTypeCode}${sequenceStr}`;
  
  return bookingNumber;
};

// @desc    Create booking
// @route   POST /api/bookings
exports.createBooking = async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to create a booking'
      });
    }

    // Only customers and owners can create bookings (not admin)
    if (req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot create bookings'
      });
    }

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
      customerDetails,
      couponCode
    } = req.body;
    
    console.log('=== BOOKING REQUEST DEBUG ===');
    console.log('Amount (Total):', amount);
    console.log('Amenities Total:', amenitiesTotal);
    console.log('Selected Amenities:', JSON.stringify(selectedAmenities, null, 2));
    console.log('Price Breakdown:', JSON.stringify(priceBreakdown, null, 2));
    console.log('============================');
    
    // Get venue details first (needed for booking number and commission)
    const venueDetails = await Venue.findById(venue).populate('owner');
    
    if (!venueDetails) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    // Generate booking number
    const bookingNumber = await generateBookingNumber(venueDetails);
    console.log('Generated Booking Number:', bookingNumber);
    
    // Calculate owner earnings (no commission; only platform fee retained)
    let ownerEarnings = 0;
    try {
      // Prefer client-provided subtotal
      if (priceBreakdown?.subtotal) {
        ownerEarnings = priceBreakdown.subtotal;
      } else {
        // Fallback: reverse-calc subtotal from total using gstRate and platformFee if available
        const PlatformSettings = require('../models/PlatformSettings');
        const settings = await PlatformSettings.getSettings();
        const gstRate = priceBreakdown?.gstRate || settings.gstRate || 18;
        const platformFee = priceBreakdown?.platformFee || 0;
        ownerEarnings = (amount - platformFee) / (1 + gstRate / 100);
      }
    } catch (calcErr) {
      console.warn('Owner earnings calc fallback error:', calcErr?.message);
      ownerEarnings = amount;
    }
    
    // ── Coupon validation & application ──────────────────────────────────────
    let appliedCoupon = null;
    let discountAmount = 0;
    let finalAmount = amount;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        venue,
        isActive: true
      });

      if (coupon) {
        const now = new Date();
        const expired = coupon.expiryDate && now > new Date(coupon.expiryDate);
        const limitReached = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
        const belowMin = amount < coupon.minBookingAmount;

        if (!expired && !limitReached && !belowMin) {
          if (coupon.discountType === 'percentage') {
            discountAmount = (amount * coupon.discountValue) / 100;
            if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
          } else {
            discountAmount = Math.min(coupon.discountValue, amount);
          }
          discountAmount = Math.round(discountAmount);
          finalAmount = amount - discountAmount;
          appliedCoupon = coupon;
        }
      }
    }

    // Create booking
    const booking = await Booking.create({
      bookingNumber,
      venue,
      customer: req.user.id,
      bookingDate,
      startTime,
      endTime,
      bookingType,
      amount: finalAmount,
      commission: 0,
      ownerEarnings,
      commissionRate: 0,
      selectedAmenities: selectedAmenities || {
        basic: [],
        beverages: [],
        refreshmentFood: [],
        lunchThalis: [],
        additional: []
      },
      amenitiesTotal: amenitiesTotal || 0,
      priceBreakdown: { ...(priceBreakdown || {}), discount: discountAmount, total: finalAmount },
      customerDetails,
      ...(appliedCoupon && {
        coupon: {
          couponId: appliedCoupon._id,
          code: appliedCoupon.code,
          discountAmount
        }
      })
    });

    // Record coupon usage
    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, {
        $inc: { usedCount: 1 },
        $push: {
          usages: {
            user: req.user.id,
            booking: booking._id,
            discountAmount
          }
        }
      });
    }
    
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
