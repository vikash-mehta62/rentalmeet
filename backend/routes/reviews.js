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
const { protect, authorize, checkPermission } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Public routes
router.get('/', getReviews);

// Admin routes
router.get('/admin', protect, authorize('admin'), checkPermission('reviews'), getAllReviews);
router.post('/admin', protect, authorize('admin'), checkPermission('reviews'), upload.single('profileImage'), createReview);
router.post('/admin/seed', protect, authorize('admin'), checkPermission('reviews'), seedReviews);
router.put('/admin/:id', protect, authorize('admin'), checkPermission('reviews'), upload.single('profileImage'), updateReview);
router.delete('/admin/:id', protect, authorize('admin'), checkPermission('reviews'), deleteReview);

module.exports = router;
