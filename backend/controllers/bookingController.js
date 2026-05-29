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
        const belowMin = amount < coupon.minBookingAmount;

        if (!expired && !limitReached && !belowMin) {
          // Determine applicable amount based on appliesTo
          const appliesTo = coupon.appliesTo || 'total';
          let applicableAmount = amount; // default: total
          if (appliesTo === 'platformFee') applicableAmount = priceBreakdown?.platformFeeTotal || 0;
          else if (appliesTo === 'amenities') applicableAmount = amenitiesTotal || 0;
          else if (appliesTo === 'baseAmount') applicableAmount = priceBreakdown?.basePrice || 0;

          if (coupon.discountType === 'percentage') {
            discountAmount = (applicableAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
          } else {
            discountAmount = Math.min(coupon.discountValue, applicableAmount);
          }
          discountAmount = Math.round(discountAmount);
          finalAmount = Math.max(1, amount - discountAmount); // minimum ₹1
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
      confirmationDeadline: new Date(Date.now() + (venueDetails.availability?.confirmationHours || 3) * 60 * 60 * 1000),
      selectedAmenities: selectedAmenities || { basic: [], beverages: [], refreshmentFood: [], lunchThalis: [], additional: [] },
      amenitiesTotal: amenitiesTotal || 0,
      priceBreakdown: { ...(priceBreakdown || {}), discount: discountAmount, couponCode: appliedCoupon ? appliedCoupon.code : null, total: finalAmount },
      customerDetails,
      ...(appliedCoupon && { coupon: { couponId: appliedCoupon._id, code: appliedCoupon.code, discountAmount } }),
      // Seed payment ledger with initial pending transaction
      paymentLedger: {
        totalDue: finalAmount,
        totalPaid: 0,
        amountDue: finalAmount,
        refundDue: 0,
        transactions: [{
          txnId: `BOOKING-${Date.now()}`,
          type: 'payment',
          amount: finalAmount,
          status: 'pending',
          note: `Booking created — ₹${finalAmount.toLocaleString()} due`,
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

    // For 'completed' status: validate that booking end time has passed
    if (status === 'completed') {
      const bookingDate = new Date(booking.bookingDate);
      const endTime = booking.endTime; // e.g. "19:30"
      
      if (endTime) {
        const [endH, endM] = endTime.split(':').map(Number);
        const bookingEnd = new Date(bookingDate);
        bookingEnd.setHours(endH, endM, 0, 0);
        
        if (new Date() < bookingEnd) {
          return res.status(400).json({
            success: false,
            message: `Booking can only be marked complete after ${endTime} on ${bookingDate.toDateString()}`
          });
        }
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
    const booking = await Booking.findById(req.params.id).populate('venue', 'owner');

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
    booking.confirmationDeadline = new Date(base.getTime() + 60 * 60 * 1000);
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
      amenitiesTotal,
      priceBreakdown,
      amount,
      customerDetails
    } = req.body;

    // ── Record price adjustment in ledger ──────────────────────────────────
    // Capture oldAmount BEFORE updating booking.amount
    const oldAmount = booking.amount;

    // Update fields if provided
    if (bookingDate) booking.bookingDate = bookingDate;
    if (startTime) booking.startTime = startTime;
    if (endTime) booking.endTime = endTime;
    if (bookingType) booking.bookingType = bookingType;
    if (selectedAmenities) booking.selectedAmenities = selectedAmenities;
    if (amenitiesTotal !== undefined) booking.amenitiesTotal = amenitiesTotal;
    if (priceBreakdown) booking.priceBreakdown = priceBreakdown;
    if (amount !== undefined) booking.amount = amount;
    if (customerDetails) booking.customerDetails = { ...booking.customerDetails, ...customerDetails };

    // Recalculate ownerEarnings from new subtotal (base + amenities, before platform fee)
    if (priceBreakdown?.subtotal) {
      booking.ownerEarnings = priceBreakdown.subtotal;
    }

    // paymentStatus must NOT change on modification — booking is still active
    // Only record the adjustment in ledger for tracking purposes
    if (amount !== undefined && amount !== oldAmount) {
      if (!booking.paymentLedger) booking.paymentLedger = { transactions: [], adjustments: [] };
      if (!booking.paymentLedger.adjustments) booking.paymentLedger.adjustments = [];
      if (!booking.paymentLedger.transactions) booking.paymentLedger.transactions = [];

      const diff = amount - oldAmount;
      booking.paymentLedger.adjustments.push({
        oldAmount,
        newAmount: amount,
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
