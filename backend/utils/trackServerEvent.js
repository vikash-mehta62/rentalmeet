const crypto = require('crypto');
const AnalyticsEvent = require('../models/AnalyticsEvent');

/**
 * Server-Side Conversion Event Logger
 * Idempotently logs conversion events (like payment_success, booking_confirmed) from trusted backend handlers.
 */
async function trackServerEvent({
  eventName,
  eventCategory = 'conversion',
  sourceEventId, // e.g. Razorpay Payment ID or Booking Number (Idempotency Key)
  sessionId = 'server_session',
  visitorId = 'server_visitor',
  userId = null,
  eventData = {},
  path = '/api/payment'
}) {
  try {
    if (sourceEventId) {
      const existing = await AnalyticsEvent.findOne({ sourceEventId });
      if (existing) {
        console.log(`[Analytics] Server event ${eventName} already logged for ${sourceEventId}`);
        return existing;
      }
    }

    const eventId = `srv_evt_${crypto.randomBytes(12).toString('hex')}`;
    const eventRecord = await AnalyticsEvent.create({
      eventId,
      sessionId,
      visitorId,
      user: userId,
      eventName,
      eventCategory,
      eventSource: 'server_webhook',
      sourceEventId,
      eventData,
      path,
      isBot: false
    });

    console.log(`[Analytics] Server conversion event logged: ${eventName} (${sourceEventId})`);
    return eventRecord;
  } catch (err) {
    console.error('[Analytics] Failed to track server event:', err.message);
    return null;
  }
}

module.exports = { trackServerEvent };
