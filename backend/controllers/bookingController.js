const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const Counter = require('../models/Counter');
const Coupon = require('../models/Coupon');
const PlatformSettings = require('../models/PlatformSettings');
const { getCityCode, getStateCode } = require('../utils/cityCodes');
const { calculateVenueConfirmationDeadline } = require('../utils/confirmationDeadline');
const { calculateVenueBookingPrice, calculateVenueOwnerPayout, numberOr } = require('../utils/venuePricing');

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

const getCapacityLimit = (capacity) => {
  const text = String(capacity || '').trim();
  if (!text || text.toLowerCase().includes('more than')) return null;
  const values = text.match(/\d+/g)?.map(Number).filter(Number.isFinite) || [];
  return values.length ? Math.max(...values) : null;
};

const getSnapshotPlatformFeeConfig = (priceBreakdown = {}) => {
  const feeType = priceBreakdown.platformFeeType === 'fixed' ? 'fixed' : 'percentage';
  const fallbackValue = priceBreakdown.platformFeeValue !== undefined
    ? priceBreakdown.platformFeeValue
    : (priceBreakdown.platformFeeRate ?? priceBreakdown.platformFeePercentage);

  return {
    source: priceBreakdown.platformFeeSource || 'snapshot',
    type: feeType,
    value: numberOr(fallbackValue, feeType === 'percentage' ? 5 : 0),
    cgstRate: numberOr(priceBreakdown.platformFeeCGSTRate, 9),
    sgstRate: numberOr(priceBreakdown.platformFeeSGSTRate, 9)
  };
};

const getSnapshotVenueGSTConfig = (priceBreakdown = {}) => {
  const fallbackHalfRate = priceBreakdown.gstRate ? numberOr(priceBreakdown.gstRate, 0) / 2 : 0;
  const cgstRate = numberOr(priceBreakdown.venueCGSTRate, fallbackHalfRate);
  const sgstRate = numberOr(priceBreakdown.venueSGSTRate, fallbackHalfRate);
  return { cgstRate, sgstRate, totalRate: cgstRate + sgstRate, hsnCode: priceBreakdown.venueHSN || '9973' };
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

    // KYC validation — customers must have ID proof + selfie uploaded
    if (req.user.role === 'customer') {
      const User = require('../models/User');
      const customer = await User.findById(req.user.id).select('kyc gstNumber companyName');
      if (!customer?.kyc?.idProof || !customer?.kyc?.selfie) {
        return res.status(403).json({
          success: false,
          message: 'Profile incomplete. Please upload your ID proof and selfie to book a venue.',
          kycRequired: true
        });
      }
      // Attach customer GST/company to customerDetails if not already provided
      if (customer.gstNumber && !req.body.customerDetails?.gstNumber) {
        req.body.customerDetails = { ...(req.body.customerDetails || {}), gstNumber: customer.gstNumber };
      }
      if (customer.companyName && !req.body.customerDetails?.companyName) {
        req.body.customerDetails = { ...(req.body.customerDetails || {}), companyName: customer.companyName };
      }
    }

    const { 
      venue, 
      bookingDate, 
      startTime, 
      endTime, 
      bookingType, 
      amount: clientAmount, 
      selectedAmenities,
      priceBreakdown,
      customerDetails,
      couponCode,
      paymentDetails
    } = req.body;

    if (!paymentDetails || !paymentDetails.razorpay_order_id || !paymentDetails.razorpay_payment_id || !paymentDetails.razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment details are required to complete this booking.'
      });
    }

    const crypto = require('crypto');
    const sign = paymentDetails.razorpay_order_id + '|' + paymentDetails.razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (paymentDetails.razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }

    // Explicitly capture the payment so it can be refunded later if needed
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const payment = await razorpay.payments.fetch(paymentDetails.razorpay_payment_id);
      console.log(`[PAYMENT] Payment status: ${payment.status} | captured: ${payment.captured}`);
      if (payment.status === 'authorized' && !payment.captured) {
        await razorpay.payments.capture(paymentDetails.razorpay_payment_id, payment.amount, 'INR');
        console.log(`[PAYMENT] ✅ Payment captured: ${paymentDetails.razorpay_payment_id}`);
      }
    } catch (captureErr) {
      console.warn(`[PAYMENT] ⚠️  Capture attempt: ${captureErr.error?.description || captureErr.message}`);
    }
    
    console.log('=== BOOKING REQUEST DEBUG ===');
    console.log('Client Amount (Total):', clientAmount);
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

    const guestCount = Number(customerDetails?.guestCount);
    if (!Number.isFinite(guestCount) || guestCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid guest count is required'
      });
    }

    const capacityLimit = getCapacityLimit(venueDetails.capacity);
    if (capacityLimit && guestCount > capacityLimit) {
      return res.status(400).json({
        success: false,
        message: `Guest count cannot exceed venue capacity (${capacityLimit})`
      });
    }
    
    // Generate booking number
    const bookingNumber = await generateBookingNumber(venueDetails);
    console.log('Generated Booking Number:', bookingNumber);

    const settings = await PlatformSettings.getSettings();
    const serverPrice = calculateVenueBookingPrice({
      venue: venueDetails,
      settings,
      bookingDate,
      startTime,
      endTime,
      bookingType,
      selectedAmenities: selectedAmenities || {},
      durationHours: priceBreakdown?.durationHours
    });
    const preCouponAmount = serverPrice.total;
    console.log('Server Price Breakdown:', JSON.stringify(serverPrice, null, 2));
    
    // ── Coupon validation & application ──────────────────────────────────────
    let appliedCoupon = null;
    let discountAmount = 0;
    let finalAmount = preCouponAmount;

    if (couponCode) {
      // Try venue-specific coupon first, then global (venue: null)
      let coupon = await Coupon.findOne({
        code: couponCode.toUpperCase().trim(),
        venue,
        isActive: true
      });
      if (!coupon) {
        coupon = await Coupon.findOne({
          code: couponCode.toUpperCase().trim(),
          venue: null,
          isActive: true
        });
      }

      if (coupon) {
        const now = new Date();
        const expired = coupon.expiryDate && now > new Date(coupon.expiryDate);
        const limitReached = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
        const belowMin = preCouponAmount < coupon.minBookingAmount;

        if (!expired && !limitReached && !belowMin) {
          // Determine applicable amount based on appliesTo
          const appliesTo = coupon.appliesTo || 'total';
          let applicableAmount = preCouponAmount; // default: total
          if (appliesTo === 'platformFee') applicableAmount = serverPrice.platformFeeTotal || 0;
          else if (appliesTo === 'amenities') applicableAmount = serverPrice.amenitiesTotal || 0;
          else if (appliesTo === 'baseAmount') applicableAmount = serverPrice.basePrice || 0;

          if (coupon.discountType === 'percentage') {
            discountAmount = (applicableAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
          } else {
            discountAmount = Math.min(coupon.discountValue, applicableAmount);
          }
          discountAmount = Math.round(discountAmount);
          finalAmount = Math.max(1, preCouponAmount - discountAmount); // minimum Rs.1
          appliedCoupon = coupon;
        }
      }
    }

    const discountAppliesTo = appliedCoupon ? (appliedCoupon.appliesTo || 'total') : null;

    const ownerEarnings = calculateVenueOwnerPayout({
      amount: finalAmount,
      priceBreakdown: { ...serverPrice, discount: discountAmount, discountAppliesTo }
    });

    // Check if venue is already booked for this date
    if (bookingDate) {
      const targetDate = new Date(bookingDate);
      
      const startRange = new Date(targetDate);
      startRange.setDate(startRange.getDate() - 2);
      const endRange = new Date(targetDate);
      endRange.setDate(endRange.getDate() + 2);
      
      const existingBookings = await Booking.find({
        venue,
        bookingDate: { $gte: startRange, $lte: endRange },
        status: { $in: ['confirmed', 'pending'] }
      });
      
      const isAlreadyBooked = existingBookings.some(b => {
        const dbDate = new Date(b.bookingDate);
        const sameUTC = dbDate.getUTCFullYear() === targetDate.getUTCFullYear() &&
                        dbDate.getUTCMonth() === targetDate.getUTCMonth() &&
                        dbDate.getUTCDate() === targetDate.getUTCDate();
        const sameLocal = dbDate.getFullYear() === targetDate.getFullYear() &&
                          dbDate.getMonth() === targetDate.getMonth() &&
                          dbDate.getDate() === targetDate.getDate();
        return sameUTC || sameLocal;
      });
      
      if (isAlreadyBooked) {
        // Auto-refund
        try {
          const Razorpay = require('razorpay');
          const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
          await razorpay.payments.refund(paymentDetails.razorpay_payment_id, {
            amount: Math.round(finalAmount * 100),
            speed: 'normal',
            notes: {
              reason: 'Auto-refund: venue already booked for this date.'
            }
          });
          console.log(`[AUTO-REFUND] ✅ Refunded ₹${finalAmount} for payment ${paymentDetails.razorpay_payment_id} due to double booking.`);
        } catch (refundErr) {
          console.error('[AUTO-REFUND] ❌ Failed to auto-refund double booking payment:', refundErr.message);
        }

        return res.status(400).json({
          success: false,
          message: 'This venue was already booked on the selected date. Your payment has been automatically refunded.'
        });
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
      ownerEarnings,
      confirmationDeadline: calculateVenueConfirmationDeadline(
        venueDetails.availability,
        venueDetails.availability?.confirmationHours
      ),
      selectedAmenities: selectedAmenities || { basic: [], beverages: [], refreshmentFood: [], lunchThalis: [], additional: [] },
      amenitiesTotal: serverPrice.amenitiesTotal,
      priceBreakdown: { ...serverPrice, discount: discountAmount, discountAppliesTo, couponCode: appliedCoupon ? appliedCoupon.code : null, total: finalAmount },
      customerDetails,
      paymentStatus: 'paid',
      paymentDetails: {
        razorpay_order_id: paymentDetails.razorpay_order_id,
        razorpay_payment_id: paymentDetails.razorpay_payment_id,
        razorpay_signature: paymentDetails.razorpay_signature,
        paidAt: new Date()
      },
      ...(appliedCoupon && { 
        coupon: { 
          couponId: appliedCoupon._id, 
          code: appliedCoupon.code, 
          appliesTo: appliedCoupon.appliesTo || 'total',
          discountAmount,
          isOwnerSponsored: !!(appliedCoupon.venue || appliedCoupon.owner)
        } 
      }),
      paymentLedger: {
        totalDue: finalAmount,
        totalPaid: finalAmount,
        amountDue: 0,
        refundDue: 0,
        transactions: [{
          txnId: paymentDetails.razorpay_payment_id,
          type: 'payment',
          amount: finalAmount,
          status: 'completed',
          note: `Razorpay payment — Order: ${paymentDetails.razorpay_order_id}`,
          date: new Date()
        }],
        adjustments: []
      }
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
    
    // Populate venue (with owner) and customer details
    await booking.populate([
      {
        path: 'venue',
        select: 'businessName location sku images owner',
        populate: { path: 'owner', select: 'name email phone' }
      },
      {
        path: 'customer',
        select: 'name email phone'
      }
    ]);
    
    // Send email notification
    try {
      const { sendBookingEmail } = require('../utils/emailService');
      await sendBookingEmail(booking, 'created');
    } catch (emailErr) {
      console.error('Failed to send booking creation email:', emailErr.message);
    }
    
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
    const { status, search, page = 1, limit = 12 } = req.query;

    // Filter by role
    if (req.user.role === 'customer') {
      query.customer = req.user.id;
    } else if (req.user.role === 'owner') {
      const venues = await Venue.find({ owner: req.user.id });
      const venueIds = venues.map(v => v._id);
      query.venue = { $in: venueIds };
    }

    if (status && status !== 'all') query.status = status;

    if (search) {
      const User = require('../models/User');
      const customers = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const venues = await Venue.find({
        $or: [
          { businessName: { $regex: search, $options: 'i' } },
          { 'location.city': { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.$or = [
        { bookingNumber: { $regex: search, $options: 'i' } },
        { customer: { $in: customers.map(c => c._id) } },
        { venue: { $in: venues.map(v => v._id) } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('venue', 'businessName location sku images ownerInfo documents')
        .populate('customer', 'name email phone gstNumber companyName')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query)
    ]);

    // Stats (always full for this user)
    const baseQuery = {};
    if (req.user.role === 'customer') baseQuery.customer = req.user.id;
    else if (req.user.role === 'owner') {
      const allVenues = await Venue.find({ owner: req.user.id });
      baseQuery.venue = { $in: allVenues.map(v => v._id) };
    }
    const [totalAll, pending, confirmed, completed, cancelled] = await Promise.all([
      Booking.countDocuments(baseQuery),
      Booking.countDocuments({ ...baseQuery, status: 'pending' }),
      Booking.countDocuments({ ...baseQuery, status: 'confirmed' }),
      Booking.countDocuments({ ...baseQuery, status: 'completed' }),
      Booking.countDocuments({ ...baseQuery, status: 'cancelled' }),
    ]);

    res.json({
      success: true,
      count: bookings.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      bookings,
      stats: { total: totalAll, pending, confirmed, completed, cancelled }
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
      .populate('venue', 'businessName location sku images amenities pricing venueType capacity ownerInfo documents')
      .populate('customer', 'name email phone gstNumber companyName')
      .select('-paymentDetails.razorpay_signature');
    
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

    // Ownership check for owner
    if (req.user.role === 'owner') {
      const venue = await Venue.findById(booking.venue);
      if (!venue || venue.owner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update status for this booking'
        });
      }
    }

    // Validate status transitions
    const allowedTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    if (!allowedTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change booking status from ${booking.status} to ${status}`
      });
    }
    
    // Date/time validation for completing bookings
    if (status === 'completed') {
      // Parse booking end date/time
      const bookingEndDateTime = new Date(booking.bookingDate);
      
      // Add end time to the date
      if (booking.endTime) {
        const cleanStr = booking.endTime.trim().toUpperCase();
        const isPM = cleanStr.includes('PM');
        const isAM = cleanStr.includes('AM');
        const digitsOnly = cleanStr.replace(/[AP]M/, '').trim();
        const parts = digitsOnly.split(':');
        let hours = parseInt(parts[0], 10) || 0;
        let minutes = parseInt(parts[1], 10) || 0;
        
        if (isPM || isAM) {
          if (isPM && hours < 12) hours += 12;
          if (isAM && hours === 12) hours = 0;
        }
        bookingEndDateTime.setHours(hours, minutes, 0, 0);
      } else {
        // If no end time specified, set to end of day
        bookingEndDateTime.setHours(23, 59, 59, 999);
      }
      
      // Check if current time is after booking end time
      const now = new Date();
      if (now <= bookingEndDateTime) {
        return res.status(400).json({
          success: false,
          message: 'Booking can only be completed after the event end time'
        });
      }
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
      // Create Platform GST Liability
      try {
        const { createPlatformGSTLiability } = require('../utils/liabilityHelper');
        await createPlatformGSTLiability(booking, 'venue', req.user?.id);
      } catch (err) {
        console.error('Failed to create platform GST liability:', err);
      }

      // Trigger Automatic Settlement
      try {
        const { settleBooking } = require('../utils/settlementHelper');
        settleBooking(booking._id, 'venue').catch(err => {
          console.error(`[SETTLEMENT] Automatic venue settlement hook failed for ${booking.bookingNumber}:`, err);
        });
      } catch (settleErr) {
        console.error(`[SETTLEMENT] Failed to initialize settlement trigger for ${booking.bookingNumber}:`, settleErr);
      }
    }

    // Populate for email notification
    await booking.populate([
      {
        path: 'venue',
        select: 'businessName location sku images owner',
        populate: { path: 'owner', select: 'name email phone' }
      },
      {
        path: 'customer',
        select: 'name email phone'
      }
    ]);

    // Send email notification
    try {
      const { sendBookingEmail } = require('../utils/emailService');
      if (status === 'confirmed' || status === 'completed') {
        await sendBookingEmail(booking, status);
      }
    } catch (emailErr) {
      console.error('Failed to send status update email:', emailErr.message);
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

// @desc    Approve Soon - extend confirmation deadline by 1 hour (one-time only)
// @route   PUT /api/bookings/:id/approve-soon
exports.approveSoon = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('venue', 'owner availability');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.venue?.owner?.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending bookings can be extended' });
    }

    if (booking.approveSoonUsed) {
      return res.status(400).json({ success: false, message: 'Approve Soon can only be used once per booking' });
    }

    // Extend by 1 hour from current deadline (or now if already expired)
    const base = booking.confirmationDeadline && booking.confirmationDeadline > new Date()
      ? booking.confirmationDeadline
      : new Date();
    booking.confirmationDeadline = calculateVenueConfirmationDeadline(
      booking.venue?.availability,
      1,
      base
    );
    booking.approveSoonUsed = true;
    await booking.save();

    res.json({
      success: true,
      message: 'Confirmation deadline extended by 1 hour',
      confirmationDeadline: booking.confirmationDeadline
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Modify booking (date/time/amenities) - recalculates price
// @route   PUT /api/bookings/:id/modify
exports.modifyBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('venue');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only customer who made the booking can modify it
    if (booking.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this booking' });
    }

    booking.approveSoonUsed = true;
    await booking.save();

    res.json({
      success: true,
      message: 'Confirmation deadline extended by 1 hour',
      confirmationDeadline: booking.confirmationDeadline
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Modify booking (date/time/amenities) - recalculates price
// @route   PUT /api/bookings/:id/modify
exports.modifyBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('venue');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only customer who made the booking can modify it
    if (booking.customer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this booking' });
    }

    // Only pending bookings can be modified
    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending bookings can be modified' });
    }

    const {
      bookingDate,
      startTime,
      endTime,
      bookingType,
      selectedAmenities,
      customerDetails
    } = req.body;

    // Check if venue is already booked for the new date
    if (bookingDate) {
      const targetDate = new Date(bookingDate);
      const currentDate = new Date(booking.bookingDate);
      
      // Only check if the date actually changed
      const dateChanged = targetDate.getUTCFullYear() !== currentDate.getUTCFullYear() ||
                          targetDate.getUTCMonth() !== currentDate.getUTCMonth() ||
                          targetDate.getUTCDate() !== currentDate.getUTCDate();

      if (dateChanged) {
        // Query bookings within +/- 2 days of the target date to cover timezone differences
        const startRange = new Date(targetDate);
        startRange.setDate(startRange.getDate() - 2);
        const endRange = new Date(targetDate);
        endRange.setDate(endRange.getDate() + 2);
        
        const existingBookings = await Booking.find({
          _id: { $ne: booking._id }, // Exclude current booking
          venue: booking.venue._id,
          bookingDate: { $gte: startRange, $lte: endRange },
          status: { $in: ['confirmed', 'pending'] }
        });
        
        const isAlreadyBooked = existingBookings.some(b => {
          const dbDate = new Date(b.bookingDate);
          
          // Compare UTC date parts
          const sameUTC = dbDate.getUTCFullYear() === targetDate.getUTCFullYear() &&
                          dbDate.getUTCMonth() === targetDate.getUTCMonth() &&
                          dbDate.getUTCDate() === targetDate.getUTCDate();
                          
          // Compare local (server-side system) date parts
          const sameLocal = dbDate.getFullYear() === targetDate.getFullYear() &&
                            dbDate.getMonth() === targetDate.getMonth() &&
                            dbDate.getDate() === targetDate.getDate();
                            
          return sameUTC || sameLocal;
        });
        
        if (isAlreadyBooked) {
          return res.status(400).json({
            success: false,
            message: 'This venue is already booked for the selected date.'
          });
        }
      }
    }

    // ── Record price adjustment in ledger ──────────────────────────────────
    // Capture oldAmount BEFORE updating booking.amount
    const oldAmount = booking.amount;
    const existingPriceBreakdown = booking.priceBreakdown || {};
    const settings = await PlatformSettings.getSettings();
    const nextSelectedAmenities = selectedAmenities || booking.selectedAmenities || {};
    const recalculatedPrice = calculateVenueBookingPrice({
      venue: booking.venue,
      settings,
      bookingDate: bookingDate || booking.bookingDate,
      startTime: startTime || booking.startTime,
      endTime: endTime || booking.endTime,
      bookingType: bookingType || booking.bookingType,
      selectedAmenities: nextSelectedAmenities,
      durationHours: existingPriceBreakdown.durationHours,
      basePriceOverride: existingPriceBreakdown.basePrice,
      platformFeeConfig: getSnapshotPlatformFeeConfig(existingPriceBreakdown),
      venueGSTConfig: getSnapshotVenueGSTConfig(existingPriceBreakdown)
    });
    const discountAmount = numberOr(existingPriceBreakdown.discount ?? booking.coupon?.discountAmount, 0);
    const discountAppliesTo = existingPriceBreakdown.discountAppliesTo || booking.coupon?.appliesTo || null;
    const newAmount = Math.max(1, recalculatedPrice.total - discountAmount);

    // Update fields if provided
    if (bookingDate) booking.bookingDate = bookingDate;
    if (startTime) booking.startTime = startTime;
    if (endTime) booking.endTime = endTime;
    if (bookingType) booking.bookingType = bookingType;
    booking.selectedAmenities = nextSelectedAmenities;
    booking.amenitiesTotal = recalculatedPrice.amenitiesTotal;
    booking.priceBreakdown = {
      ...recalculatedPrice,
      discount: discountAmount,
      discountAppliesTo,
      couponCode: existingPriceBreakdown.couponCode || booking.coupon?.code || null,
      total: newAmount
    };
    booking.amount = newAmount;
    if (customerDetails) booking.customerDetails = { ...booking.customerDetails, ...customerDetails };

    booking.ownerEarnings = calculateVenueOwnerPayout({
      amount: newAmount,
      priceBreakdown: { ...recalculatedPrice, discount: discountAmount, discountAppliesTo }
    });

    // paymentStatus must NOT change on modification — booking is still active
    // Only record the adjustment in ledger for tracking purposes
    if (newAmount !== oldAmount) {
      if (!booking.paymentLedger) booking.paymentLedger = { transactions: [], adjustments: [] };
      if (!booking.paymentLedger.adjustments) booking.paymentLedger.adjustments = [];
      if (!booking.paymentLedger.transactions) booking.paymentLedger.transactions = [];

      const diff = newAmount - oldAmount;
      booking.paymentLedger.adjustments.push({
        oldAmount,
        newAmount,
        difference: diff,
        reason: 'modification',
        performedBy: req.user.id,
        date: new Date()
      });

      booking.paymentLedger.transactions.push({
        type: 'adjustment',
        amount: diff,
        status: 'completed',
        note: diff > 0
          ? `Booking modified — ₹${Math.abs(diff).toFixed(2)} additional amount due`
          : `Booking modified — ₹${Math.abs(diff).toFixed(2)} overpaid (will be settled after completion)`,
        performedBy: req.user.id,
        date: new Date()
      });
      // paymentStatus intentionally NOT changed — booking remains active
    }

    await booking.save();

    await booking.populate('venue', 'businessName location sku images');
    await booking.populate('customer', 'name email phone');

    res.json({
      success: true,
      message: 'Booking modified successfully',
      booking
    });
  } catch (error) {
    console.error('Booking modify error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
exports.cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const Razorpay = require('razorpay');

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    console.log(`\n[CANCEL] ── Booking Cancel Request ──────────────────────`);
    console.log(`[CANCEL] Booking     : ${booking.bookingNumber} (${booking._id})`);
    console.log(`[CANCEL] Status      : ${booking.status}`);
    console.log(`[CANCEL] PayStatus   : ${booking.paymentStatus}`);
    console.log(`[CANCEL] Amount      : ₹${booking.amount}`);
    console.log(`[CANCEL] LedgerPaid  : ₹${booking.paymentLedger?.totalPaid ?? 'N/A'}`);
    console.log(`[CANCEL] PaymentID   : ${booking.paymentDetails?.razorpay_payment_id ?? 'NONE'}`);
    console.log(`[CANCEL] OrderID     : ${booking.paymentDetails?.razorpay_order_id ?? 'NONE'}`);
    console.log(`[CANCEL] Requested by: ${req.user.role} (${req.user.id})`);
    console.log(`[CANCEL] Reason      : ${reason || '(none)'}`);

    if (!['pending', 'confirmed'].includes(booking.status)) {
      console.log(`[CANCEL] ❌ Cannot cancel — status is "${booking.status}"`);
      return res.status(400).json({ success: false, message: 'Booking cannot be cancelled in its current state' });
    }

    const role = req.user.role;
    const isCustomer = role === 'customer';

    if (isCustomer && booking.customer.toString() !== req.user.id) {
      console.log(`[CANCEL] ❌ Unauthorized — customer mismatch`);
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Refund policy
    const bookingDateTime = new Date(booking.bookingDate);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);
    console.log(`[CANCEL] BookingDate : ${bookingDateTime.toISOString()}`);
    console.log(`[CANCEL] HoursUntil  : ${hoursUntilBooking.toFixed(2)}h`);

    let refundAmount = 0;
    let refundEligible = false;
    let refundPolicy = '';

    if (isCustomer) {
      const totalPaid = booking.paymentLedger?.totalPaid || booking.amount;
      if (hoursUntilBooking >= 48) {
        refundEligible = true;
        refundAmount = totalPaid;
        refundPolicy = 'Full refund (cancelled 48+ hours before booking)';
      } else if (hoursUntilBooking >= 24) {
        refundEligible = true;
        refundAmount = Math.round(totalPaid * 0.5);
        refundPolicy = '50% refund (cancelled 24–48 hours before booking)';
      } else {
        refundEligible = false;
        refundAmount = 0;
        refundPolicy = 'No refund (cancelled less than 24 hours before booking)';
      }
    } else {
      refundEligible = true;
      refundAmount = booking.paymentLedger?.totalPaid || booking.amount;
      refundPolicy = 'Full refund (cancelled by venue owner/admin)';
    }

    console.log(`[CANCEL] Policy      : ${refundPolicy}`);
    console.log(`[CANCEL] RefundAmt   : ₹${refundAmount}`);
    console.log(`[CANCEL] Eligible    : ${refundEligible}`);

    // Process Razorpay refund
    let refundResult = { success: false, reason: 'No refund applicable' };

    if (refundEligible && booking.paymentStatus === 'paid' && refundAmount > 0) {
      if (!booking.paymentDetails?.razorpay_payment_id) {
        console.log(`[CANCEL] ⚠️  No razorpay_payment_id stored — cannot auto-refund`);
        refundResult = { success: false, reason: 'No Razorpay payment ID stored on booking' };
      } else {
        console.log(`[CANCEL] 🔄 Initiating Razorpay refund...`);
        console.log(`[CANCEL] RZP Key     : ${process.env.RAZORPAY_KEY_ID}`);
        console.log(`[CANCEL] Payment ID  : ${booking.paymentDetails.razorpay_payment_id}`);
        console.log(`[CANCEL] Refund paise: ${Math.round(refundAmount * 100)}`);
        try {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
          });

          // Fetch payment first to verify its status before attempting refund
          let payment;
          try {
            payment = await razorpay.payments.fetch(booking.paymentDetails.razorpay_payment_id);
            console.log(`[CANCEL] Payment status  : ${payment.status}`);
            console.log(`[CANCEL] Payment amount  : ${payment.amount} paise (₹${payment.amount / 100})`);
            console.log(`[CANCEL] Payment captured: ${payment.captured}`);
            console.log(`[CANCEL] Payment method  : ${payment.method}`);
            console.log(`[CANCEL] Payment key_id  : ${payment.key_id || 'N/A'}`);
          } catch (fetchErr) {
            console.error(`[CANCEL] ⚠️  Could not fetch payment: ${fetchErr.message}`);
          }

          // Guard: only refund if payment is captured
          if (payment && !payment.captured) {
            console.log(`[CANCEL] ⚠️  Payment not captured (status: ${payment.status}) — cannot refund`);
            refundResult = { success: false, reason: `Payment not captured (status: ${payment.status})` };
          } else {
            const refund = await razorpay.payments.refund(
              booking.paymentDetails.razorpay_payment_id,
              {
                amount: Math.round(refundAmount * 100),
                speed: 'normal',
                notes: { bookingNumber: booking.bookingNumber, reason: reason || refundPolicy }
              }
            );
            console.log(`[CANCEL] ✅ Refund success — ID: ${refund.id} | Speed: ${refund.speed}`);
            refundResult = { success: true, refundId: refund.id };
          }
        } catch (err) {
          console.error(`[CANCEL] ❌ Razorpay refund error:`);
          console.error(`[CANCEL]    Code   : ${err.error?.code || err.statusCode || 'N/A'}`);
          console.error(`[CANCEL]    Message: ${err.error?.description || err.message}`);
          console.error(`[CANCEL]    Field  : ${err.error?.field || 'N/A'}`);
          console.error(`[CANCEL]    Full   :`, JSON.stringify(err.error || err, null, 2));
          // Common causes:
          // BAD_REQUEST_ERROR "invalid request" → payment belongs to a different Razorpay key
          // BAD_REQUEST_ERROR "already refunded" → refund already processed
          // BAD_REQUEST_ERROR "amount greater than" → refund amount exceeds captured amount
          refundResult = { success: false, reason: err.error?.description || err.message };
        }
      }
    } else {
      console.log(`[CANCEL] ⏭️  Skipping refund — eligible:${refundEligible} payStatus:${booking.paymentStatus} amount:${refundAmount}`);
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || refundPolicy;
    booking.cancelledBy = req.user.id;
    booking.cancelledByRole = role;
    booking.cancellationType = 'manual';
    booking.refundDetails = {
      refundAmount,
      refundStatus: !refundEligible || booking.paymentStatus !== 'paid'
        ? 'pending'
        : refundResult.success ? 'processed' : 'failed',
      refundId: refundResult.refundId || null,
      refundedAt: refundResult.success ? new Date() : null,
      refundReason: refundPolicy
    };

    if (refundResult.success) booking.paymentStatus = 'refunded';

    if (!booking.paymentLedger) booking.paymentLedger = { transactions: [], adjustments: [] };
    if (refundResult.success) {
      booking.paymentLedger.transactions.push({
        txnId: refundResult.refundId, type: 'refund', amount: refundAmount,
        status: 'completed', note: refundPolicy, performedBy: req.user.id, date: new Date()
      });
    }

    await booking.save();
    console.log(`[CANCEL] ✅ Booking saved — status:cancelled refundStatus:${booking.refundDetails.refundStatus}`);
    console.log(`[CANCEL] ─────────────────────────────────────────────────\n`);

    // Populate for email notification
    try {
      await booking.populate([
        {
          path: 'venue',
          select: 'businessName location sku images owner',
          populate: { path: 'owner', select: 'name email phone' }
        },
        {
          path: 'customer',
          select: 'name email phone'
        }
      ]);
      const { sendBookingEmail } = require('../utils/emailService');
      await sendBookingEmail(booking, 'cancelled');
    } catch (emailErr) {
      console.error('Failed to send booking cancellation email:', emailErr.message);
    }

    res.json({
      success: true,
      message: 'Booking cancelled',
      refundEligible,
      refundAmount,
      refundPolicy,
      refundProcessed: refundResult.success,
      refundFailReason: !refundResult.success ? refundResult.reason : undefined,
      booking
    });
  } catch (error) {
    console.error(`[CANCEL] 💥 Unexpected error:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
};
