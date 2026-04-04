const express = require('express');
const {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  approveSoon
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getBookings)
  .post(createBooking); // Remove authorize - any logged in user can book

router.get('/:id', getBooking);
router.put('/:id/status', authorize('owner', 'admin'), updateBookingStatus);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/approve-soon', authorize('owner', 'admin'), approveSoon);

module.exports = router;
