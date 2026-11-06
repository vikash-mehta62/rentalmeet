const mongoose = require('mongoose');
const crypto = require('crypto');
const OfflineBooking = require('../models/OfflineBooking');
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const User = require('../models/User');

// Helper: check slot conflict between two bookings
const doSlotsConflict = (slotA, slotB) => {
  if (slotA === 'Full Day' || slotB === 'Full Day') return true;
  return slotA === slotB;
};

// Helper: get start and end of day in UTC / local
const getDayRange = (dateInput) => {
  const d = new Date(dateInput);
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @route   GET /api/offline-bookings/lookup-customer
// @desc    Check if a customer exists by 10-digit mobile number
// @access  Private (Owner / Admin)
exports.lookupCustomer = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phone.trim().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit phone number' });
    }

    const customer = await User.findOne({
      phone: { $regex: new RegExp(cleanPhone + '$') },
      role: 'customer'
    }).select('name email phone');

    if (!customer) {
      return res.json({
        success: true,
        exists: false,
        customer: null
      });
    }

    return res.json({
      success: true,
      exists: true,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email && !customer.email.includes('@offline.rentalmeet.local') ? customer.email : '',
        phone: customer.phone
      }
    });
  } catch (error) {
    console.error('Error looking up customer:', error);
    res.status(500).json({ success: false, message: 'Failed to look up customer', error: error.message });
  }
};

// @route   POST /api/offline-bookings/check-availability
// @desc    Check if venue is available on a specific date and slot
// @access  Private (Owner / Admin)
exports.checkAvailability = async (req, res) => {
  try {
    const { venueId, eventDate, eventSlot, excludeBookingId } = req.body;

    if (!venueId || !eventDate || !eventSlot) {
      return res.status(400).json({
        success: false,
        message: 'venueId, eventDate, and eventSlot are required'
      });
    }

    const { start, end } = getDayRange(eventDate);

    // 1. Check Offline Bookings
    const offlineQuery = {
      venue: venueId,
      eventDate: { $gte: start, $lte: end },
      bookingStatus: { $in: ['Confirmed', 'Tentative'] }
    };
    if (excludeBookingId) {
      offlineQuery._id = { $ne: excludeBookingId };
    }

    const conflictingOffline = await OfflineBooking.find(offlineQuery);
    const hasOfflineConflict = conflictingOffline.some(b => doSlotsConflict(b.eventSlot, eventSlot));

    if (hasOfflineConflict) {
      return res.json({
        success: true,
        available: false,
        conflictType: 'OFFLINE_BOOKING',
        message: `This venue already has an offline booking on this date for slot: ${eventSlot}`
      });
    }

    // 2. Check Online Bookings
    const conflictingOnline = await Booking.find({
      venue: venueId,
      bookingDate: { $gte: start, $lte: end },
      status: { $in: ['confirmed', 'pending'] }
    });

    if (conflictingOnline.length > 0) {
      return res.json({
        success: true,
        available: false,
        conflictType: 'ONLINE_BOOKING',
        message: `This venue is already booked online on this date`
      });
    }

    return res.json({
      success: true,
      available: true,
      message: 'Venue is available for booking'
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ success: false, message: 'Failed to check availability', error: error.message });
  }
};

// @route   POST /api/offline-bookings
// @desc    Create a new offline booking
// @access  Private (Owner / Admin)
exports.createOfflineBooking = async (req, res) => {
  try {
    const {
      venue: venueId,
      hallName,
      customerPhone,
      customerName,
      customerEmail,
      eventDate,
      eventSlot,
      eventType,
      customEventType,
      guestCount,
      startTime,
      endTime,
      foodPackage,
      decorationRequirements,
      specialRequests,
      idProofType,
      idProofNumber,
      totalAmount,
      advanceAmount,
      paymentMode,
      paymentDate,
      expectedFinalPaymentDate,
      transactionReference,
      bookingStatus,
      notes
    } = req.body;

    // Basic Validation
    if (!venueId || !customerPhone || !customerName || !eventDate || !eventSlot || !eventType || totalAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all mandatory fields (venue, customer phone, name, event date, slot, type, total amount)'
      });
    }

    const numTotal = Number(totalAmount);
    const numAdvance = Number(advanceAmount) || 0;

    if (isNaN(numTotal) || numTotal <= 0) {
      return res.status(400).json({ success: false, message: 'Total booking amount must be a positive number' });
    }
    if (numAdvance < 0 || numAdvance > numTotal) {
      return res.status(400).json({ success: false, message: 'Advance amount cannot be negative or greater than total amount' });
    }

    // Verify Venue Ownership (if owner)
    const venueDoc = await Venue.findById(venueId);
    if (!venueDoc) {
      return res.status(404).json({ success: false, message: 'Venue not found' });
    }

    if (req.user.role === 'owner' && venueDoc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to book for this venue' });
    }

    // Check Availability Conflict
    const { start, end } = getDayRange(eventDate);
    const existingOffline = await OfflineBooking.find({
      venue: venueId,
      eventDate: { $gte: start, $lte: end },
      bookingStatus: { $in: ['Confirmed', 'Tentative'] }
    });
    if (existingOffline.some(b => doSlotsConflict(b.eventSlot, eventSlot))) {
      return res.status(400).json({
        success: false,
        message: `Date and slot conflict: Venue is already booked offline for ${eventSlot} on this date.`
      });
    }

    const existingOnline = await Booking.find({
      venue: venueId,
      bookingDate: { $gte: start, $lte: end },
      status: { $in: ['confirmed', 'pending'] }
    });
    if (existingOnline.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Date conflict: Venue already has an active online booking on this date.'
      });
    }

    // Customer Handling
    const cleanPhone = customerPhone.trim().replace(/\D/g, '').slice(-10);
    let customerDoc = await User.findOne({
      phone: { $regex: new RegExp(cleanPhone + '$') },
      role: 'customer'
    });

    if (!customerDoc) {
      // Auto-register new customer
      const fallbackEmail = customerEmail && customerEmail.trim()
        ? customerEmail.trim().toLowerCase()
        : `offline_${cleanPhone}@rentalmeet.local`;

      // Check if fallback email happens to exist
      let userEmail = fallbackEmail;
      const emailExists = await User.findOne({ email: userEmail, role: 'customer' });
      if (emailExists) {
        userEmail = `offline_${cleanPhone}_${Date.now()}@rentalmeet.local`;
      }

      const randomPassword = crypto.randomBytes(8).toString('hex') + 'A1!';
      customerDoc = await User.create({
        name: customerName.trim(),
        phone: cleanPhone,
        email: userEmail,
        role: 'customer',
        password: randomPassword,
        isOfflineCreated: true,
        registrationSource: 'OFFLINE_BOOKING',
        registeredByVenue: venueDoc._id,
        registeredByVenueName: venueDoc.businessName
      });
    }

    // Build Payments Array if Advance is received
    const paymentsList = [];
    if (numAdvance > 0) {
      const receiptNo = await OfflineBooking.generateReceiptNumber();
      paymentsList.push({
        receiptNumber: receiptNo,
        amount: numAdvance,
        paymentMode: paymentMode || 'Cash',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        transactionReference: transactionReference || '',
        notes: 'Initial Advance Payment',
        recordedBy: req.user._id,
        balanceBefore: numTotal,
        balanceAfter: numTotal - numAdvance,
        createdAt: new Date()
      });
    }

    const newBooking = new OfflineBooking({
      venue: venueDoc._id,
      venueName: venueDoc.businessName,
      hallName: hallName || '',
      owner: venueDoc.owner,
      createdBy: req.user._id,
      customer: customerDoc._id,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : '',
      eventDate: new Date(eventDate),
      eventSlot,
      eventType,
      customEventType: eventType === 'Other' ? (customEventType || '') : '',
      guestCount: guestCount ? Number(guestCount) : null,
      startTime: startTime || '',
      endTime: endTime || '',
      foodPackage: foodPackage || '',
      decorationRequirements: decorationRequirements || '',
      specialRequests: specialRequests || '',
      idProofType: idProofType || null,
      idProofNumber: idProofNumber || '',
      totalAmount: numTotal,
      advanceAmount: numAdvance,
      expectedFinalPaymentDate: expectedFinalPaymentDate ? new Date(expectedFinalPaymentDate) : null,
      bookingStatus: bookingStatus || 'Confirmed',
      payments: paymentsList,
      notes: notes || ''
    });

    await newBooking.save();

    return res.status(201).json({
      success: true,
      message: 'Offline booking created successfully',
      booking: newBooking
    });
  } catch (error) {
    console.error('Error creating offline booking:', error);
    res.status(500).json({ success: false, message: 'Failed to create offline booking', error: error.message });
  }
};

// @route   GET /api/offline-bookings
// @desc    Get offline bookings with pagination, search & filters
// @access  Private (Owner / Admin)
exports.getOfflineBookings = async (req, res) => {
  try {
    const {
      search,
      venue,
      bookingStatus,
      paymentStatus,
      paymentMode,
      dateFilter,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Role-based scope
    if (req.user.role === 'owner') {
      const ownerVenues = await Venue.find({ owner: req.user._id }).select('_id');
      const venueIds = ownerVenues.map(v => v._id);
      query.venue = { $in: venueIds };
    }

    if (venue) {
      query.venue = venue;
    }

    // Search query
    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { bookingId: { $regex: s, $options: 'i' } },
        { customerName: { $regex: s, $options: 'i' } },
        { customerPhone: { $regex: s, $options: 'i' } },
        { venueName: { $regex: s, $options: 'i' } }
      ];
    }

    // Status filters
    if (bookingStatus && bookingStatus !== 'all') {
      query.bookingStatus = bookingStatus;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      if (paymentStatus === 'Overdue') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query.expectedFinalPaymentDate = { $lt: today };
        query.balanceDue = { $gt: 0 };
        query.bookingStatus = { $ne: 'Cancelled' };
      } else {
        query.paymentStatus = paymentStatus;
      }
    }

    if (paymentMode && paymentMode !== 'all') {
      query['payments.paymentMode'] = paymentMode;
    }

    // Date Filters
    const now = new Date();
    if (dateFilter) {
      if (dateFilter === 'today') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        query.eventDate = { $gte: start, $lte: end };
      } else if (dateFilter === 'this_week') {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        firstDay.setHours(0, 0, 0, 0);
        const lastDay = new Date(firstDay);
        lastDay.setDate(lastDay.getDate() + 6);
        lastDay.setHours(23, 59, 59, 999);
        query.eventDate = { $gte: firstDay, $lte: lastDay };
      } else if (dateFilter === 'this_month') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        query.eventDate = { $gte: firstDay, $lte: lastDay };
      } else if (dateFilter === 'this_year') {
        const firstDay = new Date(now.getFullYear(), 0, 1);
        const lastDay = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        query.eventDate = { $gte: firstDay, $lte: lastDay };
      } else if (dateFilter === 'upcoming') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        query.eventDate = { $gte: start };
        query.bookingStatus = { $nin: ['Completed', 'Cancelled'] };
      } else if (dateFilter === 'past') {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        query.eventDate = { $lt: start };
      }
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.eventDate = { $gte: start, $lte: end };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, totalCount] = await Promise.all([
      OfflineBooking.find(query)
        .populate('venue', 'businessName location images')
        .populate('customer', 'name phone email')
        .sort({ eventDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      OfflineBooking.countDocuments(query)
    ]);

    res.json({
      success: true,
      bookings,
      pagination: {
        totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching offline bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch offline bookings', error: error.message });
  }
};

// @route   GET /api/offline-bookings/stats
// @desc    Get dashboard statistics for offline bookings
// @access  Private (Owner / Admin)
exports.getOfflineStats = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'owner') {
      const ownerVenues = await Venue.find({ owner: req.user._id }).select('_id');
      query.venue = { $in: ownerVenues.map(v => v._id) };
    }

    const allBookings = await OfflineBooking.find(query);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Filter sets
    const nonCancelled = allBookings.filter(b => b.bookingStatus !== 'Cancelled');
    const cancelled = allBookings.filter(b => b.bookingStatus === 'Cancelled');
    const completed = allBookings.filter(b => b.bookingStatus === 'Completed');
    const upcoming = allBookings.filter(b => {
      const ed = new Date(b.eventDate);
      return ed >= todayStart && b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'Completed';
    });

    const todayBookings = allBookings.filter(b => {
      const cd = new Date(b.createdAt);
      return cd >= todayStart && cd <= todayEnd;
    });

    const thisMonthBookings = allBookings.filter(b => {
      const cd = new Date(b.createdAt);
      return cd >= monthStart && cd <= monthEnd;
    });

    // Financial calculations
    const totalBookingValue = nonCancelled.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalAmountCollected = nonCancelled.reduce((sum, b) => sum + (b.totalPaid || 0), 0);
    const totalAdvanceCollected = nonCancelled.reduce((sum, b) => sum + (b.advanceAmount || 0), 0);
    const totalBalanceDue = nonCancelled.reduce((sum, b) => sum + (b.balanceDue || 0), 0);

    const fullyPaidCount = nonCancelled.filter(b => b.paymentStatus === 'Paid').length;
    const partiallyPaidCount = nonCancelled.filter(b => b.paymentStatus === 'Partially Paid').length;
    const pendingPaymentCount = nonCancelled.filter(b => b.paymentStatus === 'Pending').length;

    // Overdue amounts (balance due > 0 and expectedFinalPaymentDate < today)
    const overdueBookings = nonCancelled.filter(b => {
      if (!b.expectedFinalPaymentDate || b.balanceDue <= 0) return false;
      return new Date(b.expectedFinalPaymentDate) < todayStart;
    });
    const overdueAmount = overdueBookings.reduce((sum, b) => sum + b.balanceDue, 0);

    // Payment Mode Summary
    const paymentModeSummary = { Cash: 0, UPI: 0, Cheque: 0, 'Bank Transfer': 0, Other: 0 };
    nonCancelled.forEach(b => {
      (b.payments || []).forEach(p => {
        const mode = p.paymentMode || 'Other';
        if (paymentModeSummary[mode] !== undefined) {
          paymentModeSummary[mode] += Number(p.amount) || 0;
        } else {
          paymentModeSummary.Other += Number(p.amount) || 0;
        }
      });
    });

    return res.json({
      success: true,
      stats: {
        // Booking Counts
        totalBookings: allBookings.length,
        todayBookings: todayBookings.length,
        thisMonthBookings: thisMonthBookings.length,
        upcomingEvents: upcoming.length,
        completedEvents: completed.length,
        cancelledBookings: cancelled.length,

        // Financial
        totalBookingValue,
        totalAmountCollected,
        totalAdvanceCollected,
        totalBalanceDue,
        fullyPaidCount,
        partiallyPaidCount,
        pendingPaymentCount,
        overdueCount: overdueBookings.length,
        overdueAmount,

        // Payment Modes
        paymentModeSummary
      }
    });
  } catch (error) {
    console.error('Error calculating offline stats:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate stats', error: error.message });
  }
};

// @route   GET /api/offline-bookings/:id
// @desc    Get single offline booking
// @access  Private (Owner / Admin)
exports.getOfflineBookingById = async (req, res) => {
  try {
    const booking = await OfflineBooking.findById(req.params.id)
      .populate('venue', 'businessName location images owner')
      .populate('customer', 'name phone email address')
      .populate('createdBy', 'name email role')
      .populate('payments.recordedBy', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Offline booking not found' });
    }

    if (req.user.role === 'owner' && booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error('Error getting offline booking:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking', error: error.message });
  }
};

// @route   PUT /api/offline-bookings/:id
// @desc    Update offline booking details
// @access  Private (Owner / Admin)
exports.updateOfflineBooking = async (req, res) => {
  try {
    const booking = await OfflineBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Offline booking not found' });
    }

    if (req.user.role === 'owner' && booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this booking' });
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      eventDate,
      eventSlot,
      eventType,
      customEventType,
      guestCount,
      startTime,
      endTime,
      foodPackage,
      decorationRequirements,
      specialRequests,
      idProofType,
      idProofNumber,
      totalAmount,
      expectedFinalPaymentDate,
      bookingStatus,
      notes
    } = req.body;

    // If date or slot changed, check conflict
    if ((eventDate && new Date(eventDate).getTime() !== new Date(booking.eventDate).getTime()) ||
        (eventSlot && eventSlot !== booking.eventSlot)) {
      const targetDate = eventDate ? new Date(eventDate) : booking.eventDate;
      const targetSlot = eventSlot || booking.eventSlot;
      const { start, end } = getDayRange(targetDate);

      const conflictOffline = await OfflineBooking.find({
        _id: { $ne: booking._id },
        venue: booking.venue,
        eventDate: { $gte: start, $lte: end },
        bookingStatus: { $in: ['Confirmed', 'Tentative'] }
      });

      if (conflictOffline.some(b => doSlotsConflict(b.eventSlot, targetSlot))) {
        return res.status(400).json({
          success: false,
          message: `Slot conflict: Venue is already booked offline for ${targetSlot} on this date.`
        });
      }

      const conflictOnline = await Booking.find({
        venue: booking.venue,
        bookingDate: { $gte: start, $lte: end },
        status: { $in: ['confirmed', 'pending'] }
      });
      if (conflictOnline.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Date conflict: Venue already has an active online booking on this date.'
        });
      }

      booking.eventDate = targetDate;
      booking.eventSlot = targetSlot;
    }

    if (customerName) booking.customerName = customerName.trim();
    if (customerPhone) booking.customerPhone = customerPhone.trim();
    if (customerEmail !== undefined) booking.customerEmail = customerEmail.trim().toLowerCase();
    if (eventType) booking.eventType = eventType;
    if (customEventType !== undefined) booking.customEventType = customEventType;
    if (guestCount !== undefined) booking.guestCount = guestCount ? Number(guestCount) : null;
    if (startTime !== undefined) booking.startTime = startTime;
    if (endTime !== undefined) booking.endTime = endTime;
    if (foodPackage !== undefined) booking.foodPackage = foodPackage;
    if (decorationRequirements !== undefined) booking.decorationRequirements = decorationRequirements;
    if (specialRequests !== undefined) booking.specialRequests = specialRequests;
    if (idProofType !== undefined) booking.idProofType = idProofType || null;
    if (idProofNumber !== undefined) booking.idProofNumber = idProofNumber;
    if (expectedFinalPaymentDate !== undefined) {
      booking.expectedFinalPaymentDate = expectedFinalPaymentDate ? new Date(expectedFinalPaymentDate) : null;
    }
    if (bookingStatus) booking.bookingStatus = bookingStatus;
    if (notes !== undefined) booking.notes = notes;

    if (totalAmount !== undefined && Number(totalAmount) >= 0) {
      booking.totalAmount = Number(totalAmount);
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Offline booking updated successfully',
      booking
    });
  } catch (error) {
    console.error('Error updating offline booking:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking', error: error.message });
  }
};

// @route   POST /api/offline-bookings/:id/payments
// @desc    Record an additional payment for an offline booking
// @access  Private (Owner / Admin)
exports.recordPayment = async (req, res) => {
  try {
    const booking = await OfflineBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Offline booking not found' });
    }

    if (req.user.role === 'owner' && booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to record payment for this booking' });
    }

    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot record payment for a cancelled booking' });
    }

    const { amount, paymentMode, paymentDate, transactionReference, notes } = req.body;
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
    }

    if (numAmount > booking.balanceDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${numAmount}) exceeds the remaining balance due (₹${booking.balanceDue})`
      });
    }

    const receiptNumber = await OfflineBooking.generateReceiptNumber();
    const balanceBefore = booking.balanceDue;
    const balanceAfter = balanceBefore - numAmount;

    const newPayment = {
      receiptNumber,
      amount: numAmount,
      paymentMode: paymentMode || 'Cash',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      transactionReference: transactionReference || '',
      notes: notes || '',
      recordedBy: req.user._id,
      balanceBefore,
      balanceAfter,
      createdAt: new Date()
    };

    booking.payments.push(newPayment);
    await booking.save();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      receipt: newPayment,
      booking
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: 'Failed to record payment', error: error.message });
  }
};

// @route   POST /api/offline-bookings/:id/cancel
// @desc    Cancel an offline booking
// @access  Private (Owner / Admin)
exports.cancelOfflineBooking = async (req, res) => {
  try {
    const booking = await OfflineBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Offline booking not found' });
    }

    if (req.user.role === 'owner' && booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    const { cancellationReason } = req.body;
    booking.bookingStatus = 'Cancelled';
    booking.cancellationReason = cancellationReason || 'Cancelled by venue owner';
    booking.cancelledAt = new Date();

    await booking.save();

    res.json({
      success: true,
      message: 'Offline booking cancelled successfully. The calendar slot has been released.',
      booking
    });
  } catch (error) {
    console.error('Error cancelling offline booking:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking', error: error.message });
  }
};

// @route   GET /api/offline-bookings/reports/export
// @desc    Export booking records for CSV
// @access  Private (Owner / Admin)
exports.exportReports = async (req, res) => {
  try {
    const { venue, startDate, endDate, bookingStatus, paymentStatus } = req.query;
    const query = {};

    if (req.user.role === 'owner') {
      const ownerVenues = await Venue.find({ owner: req.user._id }).select('_id');
      query.venue = { $in: ownerVenues.map(v => v._id) };
    }
    if (venue) query.venue = venue;
    if (bookingStatus && bookingStatus !== 'all') query.bookingStatus = bookingStatus;
    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.eventDate = { $gte: start, $lte: end };
    }

    const bookings = await OfflineBooking.find(query).sort({ eventDate: -1 });

    // Format rows
    const rows = bookings.map(b => ({
      bookingId: b.bookingId,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      customerEmail: b.customerEmail || '',
      venueName: b.venueName,
      eventDate: b.eventDate ? b.eventDate.toISOString().split('T')[0] : '',
      eventSlot: b.eventSlot,
      eventType: b.eventType,
      guestCount: b.guestCount || '',
      totalAmount: b.totalAmount,
      totalPaid: b.totalPaid,
      balanceDue: b.balanceDue,
      paymentStatus: b.paymentStatus,
      bookingStatus: b.bookingStatus,
      createdAt: b.createdAt ? b.createdAt.toISOString().split('T')[0] : ''
    }));

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({ success: false, message: 'Failed to export reports', error: error.message });
  }
};
