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
      bookingId,
      paidAmount  // actual amount paid in this transaction
    } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      // Record in ledger with actual paid amount
      if (!booking.paymentLedger) booking.paymentLedger = { transactions: [], adjustments: [] };
      if (!booking.paymentLedger.transactions) booking.paymentLedger.transactions = [];

      const txnAmount = paidAmount || booking.amount;
      booking.paymentLedger.transactions.push({
        txnId: razorpay_payment_id,
        type: 'payment',
        amount: txnAmount,
        status: 'completed',
        note: `Razorpay payment — Order: ${razorpay_order_id}`,
        date: new Date()
      });

      // Calculate total paid after this transaction
      const totalPaid = booking.paymentLedger.transactions
        .filter(t => ['payment', 'manual_payment'].includes(t.type) && t.status === 'completed')
        .reduce((s, t) => s + (t.amount || 0), 0);
      const totalRefunded = booking.paymentLedger.transactions
        .filter(t => ['refund', 'manual_refund'].includes(t.type) && t.status === 'completed')
        .reduce((s, t) => s + (t.amount || 0), 0);
      const netPaid = totalPaid - totalRefunded;

      // Mark as paid only if fully settled
      if (netPaid >= booking.amount) {
        booking.paymentStatus = 'paid';
      }
      booking.paymentDetails = { razorpay_order_id, razorpay_payment_id, razorpay_signature, paidAt: new Date() };

      await booking.save();
      res.json({ success: true, message: 'Payment verified successfully', booking });
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
};
