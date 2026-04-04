const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { amount, bookingId } = req.body;

    // Initialize Razorpay with credentials
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Create order options
    const options = {
      amount: Math.round(amount * 100), // Amount in paise (must be integer)
      currency: 'INR',
      receipt: `BK${Date.now().toString().slice(-10)}`, // Max 40 chars
      notes: {
        bookingId: bookingId
      }
    };

    // Create order
    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId
    } = req.body;

    // Create signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    // Verify signature
    if (razorpay_signature === expectedSign) {
      // Payment is verified
      // Update booking with payment details
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          paymentStatus: 'paid',
          paymentDetails: {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            paidAt: new Date()
          }
        },
        { new: true }
      );

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        booking
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};
