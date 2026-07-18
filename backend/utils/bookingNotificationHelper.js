const { sendBookingEmail } = require('./emailService');
const pushService = require('./pushNotificationService');

const detectBookingType = (booking, bookingType) => {
  if (bookingType) return bookingType;
  return booking?.venue ? 'venue' : 'service';
};

const populateBookingForNotifications = async (booking, bookingType) => {
  if (!booking || typeof booking.populate !== 'function') return booking;

  if (bookingType === 'venue') {
    await booking.populate([
      {
        path: 'venue',
        select: 'businessName location sku images owner',
        populate: { path: 'owner', select: 'name email phone' }
      },
      { path: 'customer', select: 'name email phone' }
    ]);
    return booking;
  }

  await booking.populate([
    { path: 'service', select: 'title category companyName city state availability confirmationHours' },
    { path: 'vendor', select: 'name email phone companyName' },
    { path: 'customer', select: 'name email phone' }
  ]);
  return booking;
};

const sendBookingNotifications = async (booking, eventType, options = {}) => {
  const bookingType = detectBookingType(booking, options.bookingType);
  const populated = options.populate === false
    ? booking
    : await populateBookingForNotifications(booking, bookingType);

  if (options.email !== false) {
    try {
      await sendBookingEmail(populated, eventType);
    } catch (error) {
      console.error(`[BOOKING_NOTIFY] Failed to send ${bookingType} ${eventType} email:`, error.message);
    }
  }

  if (options.push !== false) {
    try {
      await pushService.sendBookingPushNotification(populated, eventType);
    } catch (error) {
      console.error(`[BOOKING_NOTIFY] Failed to send ${bookingType} ${eventType} push:`, error.message);
    }
  }

  return populated;
};

module.exports = {
  populateBookingForNotifications,
  sendBookingNotifications
};
