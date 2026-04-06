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

router.route('/')
  .get(getBookings)
  .post(createBooking); // Remove authorize - any logged in user can book

router.get('/:id', getBooking);
router.put('/:id/status', authorize('owner', 'admin'), updateBookingStatus);
router.put('/:id/modify', modifyBooking);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/approve-soon', authorize('owner', 'admin'), approveSoon);

module.exports = router;
