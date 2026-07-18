const crypto = require('crypto');
const Booking = require('../models/Booking');
const ServiceBooking = require('../models/ServiceBooking');

const REFUND_STATUS_PRIORITY = {
  pending: 1,
  failed: 2,
  processed: 3
};

function mapRazorpayRefundStatus(status) {
  if (status === 'processed') return 'processed';
  if (status === 'failed') return 'failed';
  return 'pending';
}

function mapRefundLedgerStatus(refundStatus) {
  if (refundStatus === 'processed') return 'completed';
  if (refundStatus === 'failed') return 'failed';
  return 'pending';
}

function normalizeRefundAttempt(refund, fallbackReason = null) {
  const refundStatus = mapRazorpayRefundStatus(refund?.status);
  return {
    apiAccepted: Boolean(refund?.id),
    refundId: refund?.id || null,
    refundStatus,
    ledgerStatus: mapRefundLedgerStatus(refundStatus),
    refundedAt: refundStatus === 'processed' ? new Date() : null,
    refundAmount: typeof refund?.amount === 'number' ? refund.amount / 100 : null,
    reason: fallbackReason,
    rawStatus: refund?.status || null
  };
}

function shouldApplyRefundStatus(currentStatus, nextStatus) {
  if (!currentStatus) return true;
  return (REFUND_STATUS_PRIORITY[nextStatus] || 0) >= (REFUND_STATUS_PRIORITY[currentStatus] || 0);
}

function refundNotesToReason(notes, fallback) {
  if (!notes || typeof notes !== 'object') return fallback;
  return notes.reason || notes.comment || notes.bookingNumber || fallback;
}

function getRefundAmount(refund, fallbackAmount) {
  if (typeof refund?.amount === 'number') return refund.amount / 100;
  return Number(fallbackAmount || 0);
}

function updateVenueRefundLedger(booking, refund, refundAmount, refundStatus, note, performedBy) {
  if (!booking.paymentLedger) booking.paymentLedger = { transactions: [], adjustments: [] };
  if (!booking.paymentLedger.transactions) booking.paymentLedger.transactions = [];

  const ledgerStatus = mapRefundLedgerStatus(refundStatus);
  const txnId = refund?.id;
  if (!txnId) return;

  const existingTxn = booking.paymentLedger.transactions.find((txn) => txn.txnId === txnId);
  if (existingTxn) {
    existingTxn.type = 'refund';
    existingTxn.amount = refundAmount;
    existingTxn.status = ledgerStatus;
    existingTxn.note = note || existingTxn.note || 'Razorpay refund';
    existingTxn.date = new Date();
    return;
  }

  booking.paymentLedger.transactions.push({
    txnId,
    type: 'refund',
    amount: refundAmount,
    status: ledgerStatus,
    note: note || 'Razorpay refund',
    performedBy,
    date: new Date()
  });
}

function applyRefundToBooking(booking, refund, options = {}) {
  const currentStatus = booking.refundDetails?.refundStatus;
  const nextStatus = mapRazorpayRefundStatus(refund?.status || options.status);
  const refundAmount = getRefundAmount(refund, options.refundAmount || booking.refundDetails?.refundAmount);
  const refundReason = refundNotesToReason(refund?.notes, options.reason || booking.refundDetails?.refundReason || 'Razorpay refund');

  if (!shouldApplyRefundStatus(currentStatus, nextStatus)) {
    return { applied: false, refundStatus: currentStatus };
  }

  booking.refundDetails = {
    ...(booking.refundDetails || {}),
    refundId: refund?.id || booking.refundDetails?.refundId || null,
    refundAmount,
    refundStatus: nextStatus,
    refundedAt: nextStatus === 'processed' ? new Date() : (nextStatus === 'failed' ? null : booking.refundDetails?.refundedAt),
    refundReason
  };

  if (nextStatus === 'processed') {
    if (booking.status === 'cancelled' || options.fullRefund) {
      booking.paymentStatus = 'refunded';
    }
  } else if (nextStatus === 'failed' && booking.paymentStatus === 'refunded') {
    booking.paymentStatus = 'paid';
  }

  if (options.bookingType === 'venue') {
    updateVenueRefundLedger(booking, refund, refundAmount, nextStatus, refundReason, options.performedBy);
  }

  return { applied: true, refundStatus: nextStatus };
}

async function findBookingForRefund(refund, payment) {
  const refundId = refund?.id;
  const paymentId = refund?.payment_id || payment?.id;
  const bookingNumber = refund?.notes?.bookingNumber;

  const filters = [];
  if (refundId) filters.push({ 'refundDetails.refundId': refundId });
  if (paymentId) filters.push({ 'paymentDetails.razorpay_payment_id': paymentId });
  if (bookingNumber) filters.push({ bookingNumber });

  if (!filters.length) return null;

  const venueBooking = await Booking.findOne({ $or: filters });
  if (venueBooking) return { booking: venueBooking, bookingType: 'venue' };

  const serviceBooking = await ServiceBooking.findOne({ $or: filters });
  if (serviceBooking) return { booking: serviceBooking, bookingType: 'service' };

  return null;
}

async function handleRefundWebhook(payload, eventId) {
  const eventName = payload?.event;
  if (!['refund.created', 'refund.processed', 'refund.failed', 'refund.speed_changed'].includes(eventName)) {
    return { ignored: true, event: eventName };
  }

  const refund = payload?.payload?.refund?.entity;
  const payment = payload?.payload?.payment?.entity;
  if (!refund?.id) {
    return { ignored: true, reason: 'Missing refund entity', event: eventName };
  }

  const match = await findBookingForRefund(refund, payment);
  if (!match) {
    console.warn(`[RAZORPAY_WEBHOOK] No booking found for refund ${refund.id}, payment ${refund.payment_id || payment?.id || 'N/A'}, event ${eventName}`);
    return { ignored: true, reason: 'Booking not found', event: eventName, refundId: refund.id };
  }

  const statusFromEvent = eventName === 'refund.failed'
    ? 'failed'
    : eventName === 'refund.processed'
      ? 'processed'
      : refund.status;

  const result = applyRefundToBooking(match.booking, { ...refund, status: statusFromEvent }, {
    bookingType: match.bookingType,
    reason: `Razorpay webhook: ${eventName}`,
    fullRefund: payment?.refund_status === 'full',
    eventId
  });

  if (result.applied) {
    await match.booking.save();
  }

  return {
    ignored: false,
    applied: result.applied,
    bookingType: match.bookingType,
    bookingId: match.booking._id,
    bookingNumber: match.booking.bookingNumber,
    refundId: refund.id,
    refundStatus: result.refundStatus
  };
}

function verifyWebhookSignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(signature, 'utf8');
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

module.exports = {
  applyRefundToBooking,
  handleRefundWebhook,
  mapRazorpayRefundStatus,
  mapRefundLedgerStatus,
  normalizeRefundAttempt,
  verifyWebhookSignature
};