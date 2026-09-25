const express = require('express');
const {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  approveSoon,
  modifyBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');

const router = express.Router();

// Public: get booked dates for a venue by SKU
router.get('/booked-dates/:sku', async (req, res) => {
  try {
    const venue = await Venue.findOne({ sku: req.params.sku }).select('_id blockedDates');
    if (!venue) return res.json({ success: true, dates: [] });

    const bookings = await Booking.find({
      venue: venue._id,
      status: { $in: ['confirmed', 'pending'] }
    }).select('bookingDate');

    const bookedDates = bookings.map(b => b.bookingDate);
    const blockedDates = (venue.blockedDates || []).map(b => b.date);

    res.json({ success: true, dates: [...bookedDates, ...blockedDates] });
  } catch (e) {
    res.json({ success: false, dates: [] });
  }
});

router.use(protect);

// Customer: Get my venue draft enquiries
router.get('/venue-enquiries/my', async (req, res) => {
  try {
    const VenueEnquiry = require('../models/VenueEnquiry');
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const query = userEmail 
      ? { $or: [{ customer: req.user._id }, { 'customerDetails.email': new RegExp(`^${userEmail}$`, 'i') }] }
      : { customer: req.user._id };

    const enquiries = await VenueEnquiry.find(query)
      .populate('venue', 'businessName sku images location pricing availability')
      .sort('-createdAt');
    res.json({ success: true, enquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.route('/')
  .get(getBookings)
  .post(createBooking); // Remove authorize - any logged in user can book

router.get('/:id', getBooking);
router.put('/:id/status', authorize('owner', 'admin'), updateBookingStatus);
router.put('/:id/modify', modifyBooking);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/approve-soon', authorize('owner', 'admin'), approveSoon);

module.exports = router;
