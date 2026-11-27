const express = require('express');
const router = express.Router();
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const {
  getVenueMediaProfile,
  getVenuePosts,
  createMediaPost,
  toggleLikePost,
  addComment,
  toggleSavePost,
  recordPostView,
  toggleFollowVenue,
  getOwnerMediaAnalytics,
  reportMediaPost
} = require('../controllers/mediaProfileController');

// Public / Semi-public (with optional auth for like/save status)
router.get('/venue/:idOrSku', optionalAuth, getVenueMediaProfile);
router.get('/venue/:idOrSku/posts', optionalAuth, getVenuePosts);
router.post('/posts/:postId/view', optionalAuth, recordPostView);
router.post('/posts/:postId/report', optionalAuth, reportMediaPost);

// Interaction endpoints (Logged-in users / customers / owners)
router.post('/posts/:postId/like', protect, toggleLikePost);
router.post('/posts/:postId/comment', protect, addComment);
router.post('/posts/:postId/save', protect, toggleSavePost);
router.post('/venue/:venueId/follow', protect, toggleFollowVenue);

// Owner-only endpoints
router.post('/posts', protect, authorize('owner'), createMediaPost);
router.get('/owner/analytics', protect, authorize('owner'), getOwnerMediaAnalytics);

module.exports = router;
