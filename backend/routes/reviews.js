const express = require('express');
const router = express.Router();
const {
  getReviews,
  getAllReviews,
  createReview,
  updateReview,
  deleteReview,
  seedReviews
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Public routes
router.get('/', getReviews);

// Admin routes
router.get('/admin', protect, authorize('admin'), getAllReviews);
router.post('/admin', protect, authorize('admin'), upload.single('profileImage'), createReview);
router.post('/admin/seed', protect, authorize('admin'), seedReviews);
router.put('/admin/:id', protect, authorize('admin'), upload.single('profileImage'), updateReview);
router.delete('/admin/:id', protect, authorize('admin'), deleteReview);

module.exports = router;
