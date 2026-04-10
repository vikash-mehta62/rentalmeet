const cron = require('node-cron');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const User = require('../models/User');

/**
 * Process refund via Razorpay — refund goes back to original payment source
 * (UPI → UPI, card → card, netbanking → bank account, wallet → wallet)
 * Razorpay handles routing automatically via payment_id
 */
const processRefund = async (booking) => {
  if (!booking.paymentDetails?.razorpay_payment_id) {
    return { success: false, reason: 'No Razorpay payment ID found' };
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Full refund to original payment source
    const refund = await razorpay.payments.refund(
      booking.paymentDetails.razorpay_payment_id,
      {
        amount: Math.round(booking.amount * 100), // convert to paise
        speed: 'normal', // normal = 5-7 days, optimum = instant if supported
        notes: {
          bookingNumber: booking.bookingNumber,
          reason: 'Auto-cancelled: owner did not confirm within the required time'
        }
      }
    );

    return { success: true, refundId: refund.id, speed: refund.speed };
  } catch (err) {
    console.error(`[CRON] Razorpay refund failed for booking ${booking.bookingNumber}:`, err.message);
    return { success: false, reason: err.message };
  }
};

/**
 * Runs every minute — auto-cancel pending bookings past their confirmation deadline
 * and trigger full refund to original payment source
 */
const startAutoCancelCron = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      const expiredBookings = await Booking.find({
        status: 'pending',
        confirmationDeadline: { $lte: now }
      }).populate('venue', 'businessName availability');

      if (expiredBookings.length === 0) return;

      console.log(`[CRON] ${expiredBookings.length} expired booking(s) to auto-cancel`);

      for (const booking of expiredBookings) {
        let refundResult = { success: false, reason: 'Payment not completed' };

        if (booking.paymentStatus === 'paid') {
          refundResult = await processRefund(booking);
        }
        // If paymentStatus is 'pending' — no money was captured, nothing to refund

        booking.status = 'cancelled';
        booking.cancellationReason = 'Auto-cancelled: owner did not confirm within the required time';

        booking.refundDetails = {
          refundAmount: booking.paymentStatus === 'paid' ? booking.amount : 0,
          refundStatus: booking.paymentStatus !== 'paid'
            ? 'pending'                                          // no payment, no refund needed
            : refundResult.success ? 'processed' : 'failed',   // paid → refund attempted
          refundId: refundResult.refundId || null,
          refundedAt: refundResult.success ? new Date() : null,
          refundReason: 'Auto-cancel: owner confirmation timeout'
        };

        // Only update paymentStatus if refund actually went through
        if (booking.paymentStatus === 'paid' && refundResult.success) {
          booking.paymentStatus = 'refunded';
        }
        // If refund failed, keep paymentStatus = 'paid' so admin can retry manually

        await booking.save();

        console.log(
          `[CRON] Cancelled ${booking.bookingNumber} | ` +
          `Payment: ${booking.paymentStatus} | ` +
          `Refund: ${refundResult.success ? refundResult.refundId : refundResult.reason}`
        );
      }
    } catch (err) {
      console.error('[CRON] Auto-cancel cron error:', err.message);
    }
  });

  console.log('[CRON] Auto-cancel cron started (every minute)');
};

/**
 * Runs daily at midnight — permanently delete accounts soft-deleted 30+ days ago
 */
const startAutoDeleteCron = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      const result = await User.deleteMany({
        isDeleted: true,
        deletedAt: { $lte: cutoff }
      });

      if (result.deletedCount > 0) {
        console.log(`[CRON] Permanently deleted ${result.deletedCount} user account(s) (30-day rule)`);
      }
    } catch (err) {
      console.error('[CRON] Auto-delete cron error:', err.message);
    }
  });
  console.log('[CRON] Auto-delete cron started (daily midnight)');
};

module.exports = { startAutoCancelCron, startAutoDeleteCron };
