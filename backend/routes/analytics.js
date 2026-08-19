const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

// Rate limiter for public analytics tracking endpoints (max 300 requests per 15 minutes per IP)
const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { success: false, message: 'Too many analytics tracking requests, rate limit exceeded.' }
});

// Public Tracking Endpoints
router.post('/track-visit', trackingLimiter, analyticsController.trackVisit);
router.post('/track-duration', trackingLimiter, analyticsController.trackDuration);
router.post('/track-event', trackingLimiter, analyticsController.trackEvent);

// Admin Reporting Endpoint (Protected: Admin or Subadmin with analytics permission)
router.get(
  '/admin/stats',
  protect,
  authorize('admin', 'subadmin'),
  analyticsController.getAnalyticsStats
);

module.exports = router;
