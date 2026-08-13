const express = require('express');
const {
  applyAmbassador,
  getAmbassadorDashboard,
  getAmbassadorVenues,
  getAmbassadorEarnings,
  requestPayout,
  getPayoutHistory,
  getAmbassadorLeaderboard,
  getAmbassadorProfile,
  updateAmbassadorProfile,
  getAmbassadorBookings
} = require('../controllers/ambassadorController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/apply', applyAmbassador);
router.get('/leaderboard', getAmbassadorLeaderboard);

// Protected routes (Ambassador only)
router.use(protect);

router.get('/dashboard', authorize('ambassador', 'admin'), getAmbassadorDashboard);
router.get('/venues', authorize('ambassador', 'admin'), getAmbassadorVenues);
router.get('/bookings', authorize('ambassador', 'admin'), getAmbassadorBookings);
router.get('/earnings', authorize('ambassador', 'admin'), getAmbassadorEarnings);
router.post('/payouts', authorize('ambassador'), requestPayout);
router.post('/payouts/request', authorize('ambassador'), requestPayout);
router.get('/payouts', authorize('ambassador', 'admin'), getPayoutHistory);
router.get('/profile', authorize('ambassador', 'admin'), getAmbassadorProfile);
router.put('/profile', authorize('ambassador'), updateAmbassadorProfile);

module.exports = router;
