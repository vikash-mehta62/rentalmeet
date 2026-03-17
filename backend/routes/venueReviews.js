const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  getVenueReviews,
  createVenueReview,
  updateVenueReview,
  deleteVenueReview,
  markReviewHelpful,
  getMyReview
} = require('../controllers/venueReviewController');

// Public routes
router.get('/:venueId/reviews', getVenueReviews);

// Protected routes
router.post('/:venueId/reviews', protect, upload.array('images', 5), createVenueReview);
router.get('/:venueId/reviews/my-review', protect, getMyReview);
router.put('/:venueId/reviews/:reviewId', protect, upload.array('images', 5), updateVenueReview);
router.delete('/:venueId/reviews/:reviewId', protect, deleteVenueReview);
router.post('/:venueId/reviews/:reviewId/helpful', protect, markReviewHelpful);

module.exports = router;
