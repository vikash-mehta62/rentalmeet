const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Create Razorpay order
router.post('/create-order', protect, createOrder);

// Verify payment
router.post('/verify', protect, verifyPayment);

module.exports = router;
