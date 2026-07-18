const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');
const Device = require('../models/Device');
const NotificationTopic = require('../models/NotificationTopic');
const User = require('../models/User');
const pushService = require('../utils/pushNotificationService');

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a specific notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register or update FCM device token (Public, optional token auth)
// @route   POST /api/notifications/register-device
// @access  Public
exports.registerDeviceToken = async (req, res) => {
  try {
    const { deviceId, fcmToken, platform } = req.body;

    if (!deviceId || !fcmToken) {
      return res.status(400).json({ success: false, message: 'deviceId and fcmToken are required' });
    }

    // Try optional JWT auth to see if user is logged in
    let userId = null;
    let role = 'guest';

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          userId = user._id;
          role = user.role;
        }
      } catch (err) {
        // Token invalid, register as guest
      }
    }

    const device = await pushService.registerDevice({
      deviceId,
      fcmToken,
      platform,
      userId,
      role
    });

    res.status(200).json({
      success: true,
      message: 'Device registered successfully',
      device
    });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Disassociate device token on logout
// @route   POST /api/notifications/device/logout
// @access  Public
exports.logoutDeviceToken = async (req, res) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ success: false, message: 'deviceId is required' });
    }

    await pushService.logoutDevice(deviceId);

    res.status(200).json({
      success: true,
      message: 'Device logged out successfully (unlinked from user)'
    });
  } catch (error) {
    console.error('Device logout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics / counts for push targets
// @route   GET /api/notifications/admin/counts
// @access  Private (Admin/Subadmin)
exports.getAdminCounts = async (req, res) => {
  try {
    const [totalDevices, vendors, owners, customers, guests, topicsCount] = await Promise.all([
      Device.countDocuments(),
      Device.countDocuments({ role: 'vendor' }),
      Device.countDocuments({ role: 'owner' }),
      Device.countDocuments({ role: 'customer' }),
      Device.countDocuments({ role: 'guest' }),
      NotificationTopic.countDocuments()
    ]);

    res.json({
      success: true,
      counts: {
        totalDevices,
        vendors,
        owners,
        customers,
        guests,
        topicsCount
      }
    });
  } catch (error) {
    console.error('Error fetching admin counts:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send manual push notification to a target group/topic
// @route   POST /api/notifications/send-manual
// @access  Private (Admin/Subadmin)
exports.sendManualNotification = async (req, res) => {
  try {
    const { targetType, targetTopic, title, body, link, imageUrl } = req.body;

    if (!title || !body || !targetType) {
      return res.status(400).json({ success: false, message: 'targetType, title and body are required' });
    }

    const payloadData = {
      ...(link && { link }),
      targetType
    };

    let result = { success: false, reason: 'Unknown target type' };

    if (targetType === 'all') {
      result = await pushService.sendPushToAll(title, body, 'system', payloadData, imageUrl);
    } else if (['vendor', 'owner', 'customer'].includes(targetType)) {
      result = await pushService.sendPushToRole(targetType, title, body, 'system', payloadData, imageUrl);
    } else if (targetType === 'topic') {
      if (!targetTopic) {
        return res.status(400).json({ success: false, message: 'targetTopic slug is required when targetType is topic' });
      }
      result = await pushService.sendPushToTopic(targetTopic, title, body, payloadData, imageUrl);
    }

    // Save manual push notification log in DB history
    const logData = {
      targetType,
      targetTopic: targetType === 'topic' ? targetTopic : undefined,
      link,
      successCount: result.successCount || 0,
      failureCount: result.failureCount || 0
    };

    await Notification.create({
      title,
      body,
      imageUrl: imageUrl || '',
      type: 'manual',
      userId: null,
      role: 'admin',
      isForGuest: targetType === 'all',
      data: logData
    });

    const sent = result.success !== false;
    res.status(sent ? 200 : 400).json({
      success: sent,
      message: sent
        ? 'Manual notification sent successfully'
        : (result.reason || result.error || 'Manual notification could not be sent'),
      result
    });
  } catch (error) {
    console.error('Error sending manual notification:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get manual notification history logs
// @route   GET /api/notifications/manual-history
// @access  Private (Admin/Subadmin)
exports.getManualHistory = async (req, res) => {
  try {
    const history = await Notification.find({ type: 'manual' })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching manual history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all topics with populated subscriber counts
// @route   GET /api/notifications/topics
// @access  Private (Admin/Subadmin)
exports.getTopics = async (req, res) => {
  try {
    const topics = await NotificationTopic.find().sort({ createdAt: -1 });

    const topicsWithCounts = await Promise.all(
      topics.map(async (topic) => {
        const subscriberCount = await Device.countDocuments({ topics: topic.slug });
        return {
          ...topic.toObject(),
          subscriberCount
        };
      })
    );

    res.json({
      success: true,
      topics: topicsWithCounts
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new topic
// @route   POST /api/notifications/topics
// @access  Private (Admin/Subadmin)
exports.createTopic = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Topic name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existingTopic = await NotificationTopic.findOne({ slug });
    if (existingTopic) {
      return res.status(400).json({ success: false, message: 'Topic already exists (name is too similar)' });
    }

    const topic = await NotificationTopic.create({
      name,
      slug,
      description: description || ''
    });

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      topic
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a topic
// @route   DELETE /api/notifications/topics/:id
// @access  Private (Admin/Subadmin)
exports.deleteTopic = async (req, res) => {
  try {
    const topic = await NotificationTopic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    // Unsubscribe all devices locally and in Firebase
    const devices = await Device.find({ topics: topic.slug });
    const tokens = devices.map(d => d.fcmToken).filter(Boolean);

    if (tokens.length > 0) {
      await firebase.unsubscribeFromTopic(tokens, topic.slug);
      await Device.updateMany(
        { topics: topic.slug },
        { $pull: { topics: topic.slug } }
      );
    }

    await topic.deleteOne();

    res.json({
      success: true,
      message: 'Topic deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get list of users in a topic or all users to add
// @route   GET /api/notifications/topics/:slug/subscribers
// @access  Private (Admin/Subadmin)
exports.getTopicSubscribers = async (req, res) => {
  try {
    const { slug } = req.params;

    // Devices subscribed to this topic
    const devices = await Device.find({ topics: slug })
      .populate('userId', 'name email phone role');

    // Filter out duplicates and guests to list users
    const subscribers = [];
    const seenUserIds = new Set();

    devices.forEach(d => {
      if (d.userId && d.userId._id) {
        const uid = d.userId._id.toString();
        if (!seenUserIds.has(uid)) {
          seenUserIds.add(uid);
          subscribers.push(d.userId);
        }
      }
    });

    // Also get all other users so admin can select and add them
    const allUsers = await User.find({
      isDeleted: false,
      _id: { $nin: Array.from(seenUserIds) }
    }).select('name email phone role').limit(100);

    res.json({
      success: true,
      subscribers,
      availableUsers: allUsers
    });
  } catch (error) {
    console.error('Error fetching topic subscribers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Subscribe a user (and all their devices) to a topic
// @route   POST /api/notifications/topics/:slug/subscribe
// @access  Private (Admin/Subadmin)
exports.subscribeToTopic = async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const result = await pushService.subscribeUsersToTopic([userId], slug);

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }

    res.json({
      success: true,
      message: 'User subscribed to topic successfully'
    });
  } catch (error) {
    console.error('Error subscribing user to topic:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Unsubscribe a user (and all their devices) from a topic
// @route   POST /api/notifications/topics/:slug/unsubscribe
// @access  Private (Admin/Subadmin)
exports.unsubscribeFromTopic = async (req, res) => {
  try {
    const { slug } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const result = await pushService.unsubscribeUsersFromTopic([userId], slug);

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.error });
    }

    res.json({
      success: true,
      message: 'User unsubscribed from topic successfully'
    });
  } catch (error) {
    console.error('Error unsubscribing user from topic:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
