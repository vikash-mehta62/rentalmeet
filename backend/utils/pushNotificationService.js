const Device = require('../models/Device');
const Notification = require('../models/Notification');
const firebase = require('../config/firebase');

/**
 * Register or update a device token. Handles guest-to-user migration if userId is provided.
 */
const registerDevice = async ({ deviceId, fcmToken, platform, userId = null, role = 'guest' }) => {
  try {
    if (!deviceId || !fcmToken) {
      throw new Error('deviceId and fcmToken are required');
    }

    const updateData = {
      fcmToken,
      platform: platform || 'web'
    };

    if (userId) {
      updateData.userId = userId;
      updateData.role = role;
      updateData.isGuest = false;
    } else {
      updateData.userId = null;
      updateData.role = 'guest';
      updateData.isGuest = true;
    }

    const device = await Device.findOneAndUpdate(
      { deviceId },
      updateData,
      { new: true, upsert: true }
    );

    console.log(`[PUSH SERVICE] Device registered: ${deviceId} for userId: ${userId || 'guest'} (role: ${role})`);
    return device;
  } catch (error) {
    console.error('[PUSH SERVICE] Error registering device:', error.message);
    throw error;
  }
};

/**
 * Migrate guest device to logged in user on authentication
 */
const migrateGuestTokenToUser = async (userId, role, deviceId) => {
  try {
    if (!userId || !deviceId) return null;

    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        userId,
        role,
        isGuest: false
      },
      { new: true }
    );

    if (device) {
      console.log(`[PUSH SERVICE] Migrated guest device ${deviceId} to user ${userId} (${role})`);
    }
    return device;
  } catch (error) {
    console.error('[PUSH SERVICE] Error migrating guest device:', error.message);
    return null;
  }
};

/**
 * Reset device to guest state on logout
 */
const logoutDevice = async (deviceId) => {
  try {
    if (!deviceId) return null;

    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        userId: null,
        role: 'guest',
        isGuest: true
      },
      { new: true }
    );

    if (device) {
      console.log(`[PUSH SERVICE] Device ${deviceId} logged out (reset to guest)`);
    }
    return device;
  } catch (error) {
    console.error('[PUSH SERVICE] Error logging out device:', error.message);
    return null;
  }
};

/**
 * Create in-app notification in database
 */
const createInAppNotification = async ({ userId, role, isForGuest, title, body, imageUrl = '', type = 'system', data = {} }) => {
  try {
    const notification = await Notification.create({
      title,
      body,
      imageUrl,
      userId,
      role,
      isForGuest,
      type,
      data
    });
    return notification;
  } catch (error) {
    console.error('[PUSH SERVICE] Error creating in-app notification:', error.message);
    return null;
  }
};

/**
 * Send push & save in-app notification to a specific user
 */
const sendPushToUser = async (userId, title, body, type = 'system', data = {}, imageUrl = '') => {
  try {
    // 1. Create In-App Notification
    await createInAppNotification({
      userId,
      title,
      body,
      imageUrl,
      type,
      data
    });

    // 2. Fetch User's Devices
    const devices = await Device.find({ userId });
    const tokens = devices.map(d => d.fcmToken).filter(Boolean);

    if (tokens.length > 0) {
      return await firebase.sendToTokens(tokens, { title, body, imageUrl, data });
    } else {
      console.log(`[PUSH SERVICE] No active device tokens found for user ${userId}`);
      return { success: false, reason: 'No tokens found' };
    }
  } catch (error) {
    console.error(`[PUSH SERVICE] Error sending push to user ${userId}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push & save in-app notifications to a group of users by role
 */
const sendPushToRole = async (role, title, body, type = 'system', data = {}, imageUrl = '') => {
  try {
    // 1. Create In-App Notification for tracking (broad role level)
    await createInAppNotification({
      role,
      title,
      body,
      imageUrl,
      type,
      data
    });

    // 2. Fetch Devices registered under this role
    const devices = await Device.find({ role });
    const tokens = devices.map(d => d.fcmToken).filter(Boolean);

    if (tokens.length > 0) {
      return await firebase.sendToTokens(tokens, { title, body, imageUrl, data });
    } else {
      console.log(`[PUSH SERVICE] No active device tokens found for role ${role}`);
      return { success: false, reason: 'No tokens found' };
    }
  } catch (error) {
    console.error(`[PUSH SERVICE] Error sending push to role ${role}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push & save in-app notification to all guests
 */
const sendPushToGuests = async (title, body, type = 'system', data = {}, imageUrl = '') => {
  try {
    await createInAppNotification({
      isForGuest: true,
      title,
      body,
      imageUrl,
      type,
      data
    });

    const devices = await Device.find({ isGuest: true });
    const tokens = devices.map(d => d.fcmToken).filter(Boolean);

    if (tokens.length > 0) {
      return await firebase.sendToTokens(tokens, { title, body, imageUrl, data });
    } else {
      console.log('[PUSH SERVICE] No active guest tokens found');
      return { success: false, reason: 'No tokens found' };
    }
  } catch (error) {
    console.error('[PUSH SERVICE] Error sending push to guests:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push to all registered devices (Both guests and users)
 */
const sendPushToAll = async (title, body, type = 'system', data = {}, imageUrl = '') => {
  try {
    await createInAppNotification({
      role: 'all',
      title,
      body,
      imageUrl,
      type,
      data
    });

    const devices = await Device.find({});
    const tokens = devices.map(d => d.fcmToken).filter(Boolean);

    if (tokens.length > 0) {
      return await firebase.sendToTokens(tokens, { title, body, imageUrl, data });
    } else {
      console.log('[PUSH SERVICE] No active device tokens found in system');
      return { success: false, reason: 'No tokens found' };
    }
  } catch (error) {
    console.error('[PUSH SERVICE] Error sending push to all:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Broadcast to a topic and sync in-app log
 */
const sendPushToTopic = async (topicSlug, title, body, data = {}, imageUrl = '') => {
  try {
    await createInAppNotification({
      role: `topic:${topicSlug}`,
      title,
      body,
      imageUrl,
      type: 'system',
      data
    });

    return await firebase.sendToTopic(topicSlug, { title, body, imageUrl, data });
  } catch (error) {
    console.error(`[PUSH SERVICE] Error sending push to topic ${topicSlug}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Handle subscription of tokens matching a list of user IDs to a topic slug
 */
const subscribeUsersToTopic = async (userIds, topicSlug) => {
  try {
    const devices = await Device.find({ userId: { $in: userIds } });
    const tokens = devices.map(d => d.fcmToken).filter(Boolean);
    
    if (tokens.length > 0) {
      await firebase.subscribeToTopic(tokens, topicSlug);
      // Update local devices record
      await Device.updateMany(
        { userId: { $in: userIds } },
        { $addToSet: { topics: topicSlug } }
      );
    }
    return { success: true };
  } catch (error) {
    console.error(`[PUSH SERVICE] Topic subscription error:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Handle unsubscription of users from a topic slug
 */
const unsubscribeUsersFromTopic = async (userIds, topicSlug) => {
  try {
    const devices = await Device.find({ userId: { $in: userIds } });
    const tokens = devices.map(d => d.fcmToken).filter(Boolean);
    
    if (tokens.length > 0) {
      await firebase.unsubscribeFromTopic(tokens, topicSlug);
      // Update local devices record
      await Device.updateMany(
        { userId: { $in: userIds } },
        { $pull: { topics: topicSlug } }
      );
    }
    return { success: true };
  } catch (error) {
    console.error(`[PUSH SERVICE] Topic unsubscription error:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notifications for booking status change events
 */
const sendBookingPushNotification = async (booking, event) => {
  try {
    if (!booking) return;

    const isServiceBooking = !booking.venue;
    const customerId = booking.customer?._id || booking.customer;
    const providerId = isServiceBooking
      ? (booking.vendor?._id || booking.vendor)
      : (booking.venue?.owner?._id || booking.venue?.owner);
    const bookingNum = booking.bookingNumber || booking.quotationNumber || booking._id?.toString()?.slice(-8)?.toUpperCase();
    const businessName = isServiceBooking
      ? (booking.service?.title || booking.serviceSnapshot?.title || booking.title || 'Service')
      : (booking.venue?.businessName || 'Venue');
    const reviewerLabel = isServiceBooking ? 'vendor' : 'owner';

    const payloadData = {
      bookingId: booking._id.toString(),
      bookingNumber: bookingNum,
      type: isServiceBooking ? 'service' : 'venue',
      link: isServiceBooking ? '/customer/service-bookings' : '/customer/bookings'
    };
    const providerPayloadData = {
      ...payloadData,
      link: isServiceBooking ? '/vendor/bookings' : '/owner/bookings'
    };

    const notifyCustomer = async (title, body) => {
      if (!customerId) return;
      await sendPushToUser(customerId, title, body, 'booking', payloadData);
    };

    const notifyProvider = async (title, body) => {
      if (!providerId) return;
      await sendPushToUser(providerId, title, body, 'booking', providerPayloadData);
    };

    switch (event) {
      case 'enquiry':
        await notifyCustomer(
          'Service Enquiry Received',
          `Your enquiry for "${businessName}" (Enquiry: #${bookingNum}) has been received.`
        );
        await notifyProvider(
          'New Service Enquiry',
          `You have received a new enquiry for "${businessName}" (Enquiry: #${bookingNum}).`
        );
        break;

      case 'created':
        await notifyCustomer(
          'Booking Initiated! 📅',
          `Your booking request for "${businessName}" (Booking: #${bookingNum}) is pending ${reviewerLabel} confirmation.`
        );
        await notifyProvider(
          'New Booking Request! 🔔',
          `You have received a new booking request for "${businessName}" (Booking: #${bookingNum}).`
        );
        break;

      case 'confirmed':
        await notifyCustomer(
          'Booking Confirmed! 🎉',
          `Great news! Your booking for "${businessName}" (Booking: #${bookingNum}) has been confirmed.`
        );
        await notifyProvider(
          'Booking Confirmed',
          `Booking #${bookingNum} for "${businessName}" has been confirmed.`
        );
        break;

      case 'completed':
        await notifyCustomer(
          'Booking Completed! Check-out Successful',
          `Thank you for using RentalMeet. Your booking for "${businessName}" (Booking: #${bookingNum}) is complete.`
        );
        await notifyProvider(
          'Booking Completed!',
          `The event for Booking #${bookingNum} has concluded successfully. Settlement will be initiated shortly.`
        );
        break;

      case 'cancelled': {
        const reason = booking.cancellationReason || 'Cancelled by user/admin';
        await notifyCustomer(
          'Booking Cancelled ❌',
          `Your booking for "${businessName}" (Booking: #${bookingNum}) was cancelled. Reason: ${reason}`
        );
        await notifyProvider(
          'Booking Cancelled ❌',
          `Booking #${bookingNum} for "${businessName}" was cancelled. Reason: ${reason}`
        );
        break;
      }

      case 'modified':
        await notifyCustomer(
          'Booking Modified ✏️',
          `Your booking #${bookingNum} details have been updated.`
        );
        await notifyProvider(
          'Booking Modified',
          `Booking #${bookingNum} for "${businessName}" has been updated.`
        );
        break;

      case 'approve_soon':
        await notifyCustomer(
          'Confirmation Window Extended ⏳',
          `The ${reviewerLabel} needs more time. The confirmation window for Booking #${bookingNum} has been extended.`
        );
        await notifyProvider(
          'Confirmation Window Extended',
          `You extended the confirmation window for Booking #${bookingNum}.`
        );
        break;

      default:
        console.log(`[PUSH SERVICE] Unknown booking event: ${event}`);
    }
  } catch (error) {
    console.error('[PUSH SERVICE] Error sending booking notification:', error.message);
  }
};

/**
 * Send push notification for booking payout settlements
 */
const sendSettlementPushNotification = async (booking, type, isSuccess, details = {}) => {
  try {
    if (!booking) return;

    let beneficiaryId = null;
    let businessName = '';
    const bookingNum = booking.bookingNumber;

    if (type === 'venue') {
      beneficiaryId = booking.venue?.owner?._id || booking.venue?.owner;
      businessName = booking.venue?.businessName || 'Venue';
    } else if (type === 'service') {
      beneficiaryId = booking.vendor?._id || booking.vendor;
      businessName = booking.service?.title || booking.serviceSnapshot?.title || booking.title || 'Service';
    }

    if (!beneficiaryId) return;

    const payloadData = {
      bookingId: booking._id.toString(),
      bookingNumber: bookingNum,
      settlementStatus: isSuccess ? 'settled' : 'failed'
    };

    if (isSuccess) {
      await sendPushToUser(
        beneficiaryId,
        'Payout Settlement Completed! 💰',
        `Your payout of ₹${details.amount} for Booking #${bookingNum} (${businessName}) has been processed and credited to your registered bank account.`,
        'settlement',
        payloadData
      );
    } else {
      await sendPushToUser(
        beneficiaryId,
        'Payout Settlement Failed ⚠️',
        `Payout of ₹${details.amount} for Booking #${bookingNum} failed. Reason: ${details.remarks || 'Incomplete bank details'}. Please update your profile bank details.`,
        'settlement',
        payloadData
      );
    }
  } catch (error) {
    console.error('[PUSH SERVICE] Error sending settlement notification:', error.message);
  }
};

module.exports = {
  registerDevice,
  migrateGuestTokenToUser,
  logoutDevice,
  createInAppNotification,
  sendPushToUser,
  sendPushToRole,
  sendPushToGuests,
  sendPushToAll,
  sendPushToTopic,
  subscribeUsersToTopic,
  unsubscribeUsersFromTopic,
  sendBookingPushNotification,
  sendSettlementPushNotification
};
