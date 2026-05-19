const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const ServiceBooking = require('../models/ServiceBooking');

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { amount, bookingId, bookingType } = req.body;
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const options = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `BK${Date.now().toString().slice(-10)}`,
      notes: { bookingId, bookingType: bookingType || 'venue' }
    };
    const order = await razorpay.orders.create(options);

    // Store amount on ServiceBooking for reference
    if (bookingType === 'service' && bookingId) {
      await ServiceBooking.findByIdAndUpdate(bookingId, { amount });
    }

    res.json({ success: true, order: { id: order.id, amount: order.amount, currency: order.currency } });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order', error: error.message });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, paidAmount, bookingType } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign.toString()).digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Handle ServiceBooking payment
    if (bookingType === 'service') {
      // New flow: verify payment first, create booking after verification
      if (!bookingId) {
        return res.json({
          success: true,
          message: 'Payment verified',
          payment: {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
          }
        });
      }

      // Backward compatibility: old flow where booking existed before payment
      const booking = await ServiceBooking.findById(bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Service booking not found' });
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      booking.paymentDetails = { razorpay_order_id, razorpay_payment_id, razorpay_signature, paidAt: new Date() };
      await booking.save();
      return res.json({ success: true, message: 'Payment verified', booking });
    }

    // Handle venue Booking payment (existing logic)
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Explicitly capture the payment so it can be refunded later if needed
    try {
      const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      console.log(`[PAYMENT] Payment status: ${payment.status} | captured: ${payment.captured}`);
      if (payment.status === 'authorized' && !payment.captured) {
        await razorpay.payments.capture(razorpay_payment_id, payment.amount, 'INR');
        console.log(`[PAYMENT] ✅ Payment captured: ${razorpay_payment_id}`);
      }
    } catch (captureErr) {
      // Non-fatal — log and continue. Payment may already be auto-captured.
      console.warn(`[PAYMENT] ⚠️  Capture attempt: ${captureErr.error?.description || captureErr.message}`);
    }

    if (!booking.paymentLedger) booking.paymentLedger = { transactions: [], adjustments: [] };
    if (!booking.paymentLedger.transactions) booking.paymentLedger.transactions = [];

    const txnAmount = paidAmount || booking.amount;
    booking.paymentLedger.transactions.push({
      txnId: razorpay_payment_id, type: 'payment', amount: txnAmount, status: 'completed',
      note: `Razorpay payment — Order: ${razorpay_order_id}`, date: new Date()
    });

    const totalPaid = booking.paymentLedger.transactions
      .filter(t => ['payment', 'manual_payment'].includes(t.type) && t.status === 'completed')
      .reduce((s, t) => s + (t.amount || 0), 0);
    const totalRefunded = booking.paymentLedger.transactions
      .filter(t => ['refund', 'manual_refund'].includes(t.type) && t.status === 'completed')
      .reduce((s, t) => s + (t.amount || 0), 0);

    if (totalPaid - totalRefunded >= booking.amount) booking.paymentStatus = 'paid';
    booking.paymentDetails = { razorpay_order_id, razorpay_payment_id, razorpay_signature, paidAt: new Date() };
    await booking.save();
    res.json({ success: true, message: 'Payment verified successfully', booking });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
};
