const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPlans,
  getOwnerSubscriptionStatus,
  createSubscriptionOrder,
  verifySubscriptionPayment
} = require('../controllers/subscriptionController');

// Public: view all subscription plans
router.get('/plans', getPlans);

// Private (Owner only)
router.get('/my-status', protect, authorize('owner'), getOwnerSubscriptionStatus);
router.post('/create-order', protect, authorize('owner'), createSubscriptionOrder);
router.post('/verify', protect, authorize('owner'), verifySubscriptionPayment);

module.exports = router;
