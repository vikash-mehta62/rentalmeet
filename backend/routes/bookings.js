const express = require('express');
const {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getBookings)
  .post(authorize('customer'), createBooking);

router.get('/:id', getBooking);
router.put('/:id/status', authorize('owner', 'admin'), updateBookingStatus);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
