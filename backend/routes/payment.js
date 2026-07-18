const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, handleRazorpayWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Razorpay needs the raw JSON body for webhook signature verification.
router.post('/webhook/razorpay', express.raw({ type: 'application/json', limit: '1mb' }), handleRazorpayWebhook);

// Create Razorpay order
router.post('/create-order', protect, createOrder);

// Verify payment
router.post('/verify', protect, verifyPayment);

module.exports = router;
