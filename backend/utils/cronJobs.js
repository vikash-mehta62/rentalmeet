const cron = require('node-cron');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const User = require('../models/User');
const {
  calculateVenueConfirmationDeadline,
  calculateServiceConfirmationDeadline
} = require('./confirmationDeadline');
const { normalizeRefundAttempt } = require('./refundHelper');

/**
 * Process refund via Razorpay — refund goes back to original payment source
 * (UPI → UPI, card → card, netbanking → bank account, wallet → wallet)
 * Razorpay handles routing automatically via payment_id
 */
const processRefund = async (booking) => {
  if (!booking.paymentDetails?.razorpay_payment_id) {
    console.log(`[CRON-REFUND] ⚠️  No payment ID for booking ${booking.bookingNumber}`);
    return { success: false, reason: 'No Razorpay payment ID found' };
  }

  const refundAmt = booking.amount || booking.pricing?.total || 0;

  console.log(`[CRON-REFUND] 🔄 Processing refund for ${booking.bookingNumber}`);
  console.log(`[CRON-REFUND] Payment ID : ${booking.paymentDetails.razorpay_payment_id}`);
  console.log(`[CRON-REFUND] Amount     : ₹${refundAmt} (${Math.round(refundAmt * 100)} paise)`);
  console.log(`[CRON-REFUND] RZP Key    : ${process.env.RAZORPAY_KEY_ID}`);

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const refund = await razorpay.payments.refund(
      booking.paymentDetails.razorpay_payment_id,
      {
        amount: Math.round(refundAmt * 100),
        speed: 'normal',
        notes: {
          bookingNumber: booking.bookingNumber,
          reason: 'Auto-cancelled: owner did not confirm within the required time'
        }
      }
    );

    console.log(`[CRON-REFUND] ✅ Success — refund ID: ${refund.id} | speed: ${refund.speed}`);
    return { success: true, ...normalizeRefundAttempt(refund, 'Auto-cancelled: confirmation timeout'), speed: refund.speed };
  } catch (err) {
    console.error(`[CRON-REFUND] ❌ Failed for ${booking.bookingNumber}:`);
    console.error(`[CRON-REFUND]    Code   : ${err.error?.code || err.statusCode || 'N/A'}`);
    console.error(`[CRON-REFUND]    Message: ${err.error?.description || err.message}`);
    return { success: false, reason: err.error?.description || err.message };
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
      })
      .populate({
        path: 'venue',
        select: 'businessName availability owner',
        populate: { path: 'owner', select: 'name email phone' }
      })
      .populate('customer', 'name email phone');

      if (expiredBookings.length > 0) {
        console.log(`[CRON] ${expiredBookings.length} expired booking(s) to auto-cancel`);

        for (const booking of expiredBookings) {
          if (booking.createdAt) {
            const workingHoursDeadline = calculateVenueConfirmationDeadline(
              booking.venue?.availability,
              booking.venue?.availability?.confirmationHours,
              booking.createdAt
            );

            if (
              workingHoursDeadline > now &&
              (!booking.confirmationDeadline || workingHoursDeadline > booking.confirmationDeadline)
            ) {
              booking.confirmationDeadline = workingHoursDeadline;
              await booking.save();
              console.log(`[CRON] Extended ${booking.bookingNumber} to working-hour deadline ${workingHoursDeadline.toISOString()}`);
              continue;
            }
          }

          let refundResult = { success: false, reason: 'Payment not completed' };

          if (booking.paymentStatus === 'paid') {
            refundResult = await processRefund(booking);
          }
          // If paymentStatus is 'pending' — no money was captured, nothing to refund

          booking.status = 'cancelled';
          booking.cancellationReason = 'Auto-cancelled: owner did not confirm within the required time';
          booking.cancelledByRole = 'system';
          booking.cancellationType = 'auto';

          booking.refundDetails = {
            refundAmount: booking.paymentStatus === 'paid' ? booking.amount : 0,
            refundStatus: booking.paymentStatus !== 'paid'
              ? 'pending'                                          // no payment, no refund needed
              : refundResult.success ? refundResult.refundStatus : 'failed',   // paid -> refund attempted
            refundId: refundResult.refundId || null,
            refundedAt: refundResult.success ? refundResult.refundedAt : null,
            refundReason: 'Auto-cancel: owner confirmation timeout'
          };

          // Only update paymentStatus if refund actually went through
          if (booking.paymentStatus === 'paid' && refundResult.success && refundResult.refundStatus === 'processed') {
            booking.paymentStatus = 'refunded';
          }
          if (refundResult.success) {
            if (!booking.paymentLedger) booking.paymentLedger = { transactions: [], adjustments: [] };
            if (!booking.paymentLedger.transactions) booking.paymentLedger.transactions = [];
            const existingRefundTxn = booking.paymentLedger.transactions.find((txn) => txn.txnId === refundResult.refundId);
            if (existingRefundTxn) {
              existingRefundTxn.status = refundResult.ledgerStatus;
              existingRefundTxn.amount = booking.amount || 0;
              existingRefundTxn.note = 'Auto-cancel: owner confirmation timeout';
            } else {
              booking.paymentLedger.transactions.push({
                txnId: refundResult.refundId,
                type: 'refund',
                amount: booking.amount || 0,
                status: refundResult.ledgerStatus,
                note: 'Auto-cancel: owner confirmation timeout',
                date: new Date()
              });
            }
          }
          // If refund failed, keep paymentStatus = 'paid' so admin can retry manually

          await booking.save();

          // Send email notification
          try {
            const { sendBookingEmail } = require('./emailService');
            await sendBookingEmail(booking, 'cancelled');
          } catch (emailErr) {
            console.error('[CRON] Failed to send auto-cancel email:', emailErr.message);
          }

          console.log(
            `[CRON] Cancelled ${booking.bookingNumber} | ` +
            `Payment: ${booking.paymentStatus} | ` +
            `Refund: ${refundResult.success ? refundResult.refundId : refundResult.reason}`
          );
        }
      }

      const ServiceBooking = require('../models/ServiceBooking');
      const expiredServices = await ServiceBooking.find({
        status: 'pending',
        confirmationDeadline: { $lte: now }
      }).populate('service', 'title availability confirmationHours');

      if (expiredServices.length > 0) {
        console.log(`[CRON] ${expiredServices.length} expired service booking(s) to auto-cancel`);

        for (const booking of expiredServices) {
          const deadlineBase = booking.paymentDetails?.paidAt || booking.createdAt;
          if (deadlineBase) {
            const workingHoursDeadline = calculateServiceConfirmationDeadline(
              booking.service,
              booking.service?.confirmationHours,
              deadlineBase
            );

            if (
              workingHoursDeadline > now &&
              (!booking.confirmationDeadline || workingHoursDeadline > booking.confirmationDeadline)
            ) {
              booking.confirmationDeadline = workingHoursDeadline;
              await booking.save();
              console.log(`[CRON] Extended Service Booking ${booking.bookingNumber} to working-hour deadline ${workingHoursDeadline.toISOString()}`);
              continue;
            }
          }

          let refundResult = { success: false, reason: 'Payment not completed' };

          if (booking.paymentStatus === 'paid') {
            refundResult = await processRefund(booking);
          }

          booking.status = 'cancelled';
          booking.cancellationReason = 'Auto-cancelled: vendor did not confirm within the required time';
          booking.cancelledByRole = 'system';
          booking.cancellationType = 'auto';

          booking.refundDetails = {
            refundAmount: booking.paymentStatus === 'paid' ? (booking.amount || booking.pricing?.total || 0) : 0,
            refundStatus: booking.paymentStatus !== 'paid'
              ? 'pending'
              : refundResult.success ? refundResult.refundStatus : 'failed',
            refundId: refundResult.refundId || null,
            refundedAt: refundResult.success ? refundResult.refundedAt : null,
            refundReason: 'Auto-cancel: vendor confirmation timeout'
          };

          if (booking.paymentStatus === 'paid' && refundResult.success && refundResult.refundStatus === 'processed') {
            booking.paymentStatus = 'refunded';
          }

          await booking.save();

          console.log(
            `[CRON] Cancelled Service Booking ${booking.bookingNumber} | ` +
            `Payment: ${booking.paymentStatus} | ` +
            `Refund: ${refundResult.success ? refundResult.refundId : refundResult.reason}`
          );
        }
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
