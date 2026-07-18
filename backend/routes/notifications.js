const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  registerDeviceToken,
  logoutDeviceToken,
  getAdminCounts,
  sendManualNotification,
  getManualHistory,
  getTopics,
  createTopic,
  deleteTopic,
  getTopicSubscribers,
  subscribeToTopic,
  unsubscribeFromTopic
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public Routes (Optional authentication/Guest support)
router.post('/register-device', registerDeviceToken);
router.post('/device/logout', logoutDeviceToken);

// User-Protected Routes (In-App notifications)
router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

// Admin/Subadmin-Protected Routes
router.get('/admin/counts', protect, authorize('admin'), getAdminCounts);
router.post('/send-manual', protect, authorize('admin'), sendManualNotification);
router.get('/manual-history', protect, authorize('admin'), getManualHistory);

// Topics Management (Admin/Subadmin)
router.get('/topics', protect, authorize('admin'), getTopics);
router.post('/topics', protect, authorize('admin'), createTopic);
router.delete('/topics/:id', protect, authorize('admin'), deleteTopic);
router.get('/topics/:slug/subscribers', protect, authorize('admin'), getTopicSubscribers);
router.post('/topics/:slug/subscribe', protect, authorize('admin'), subscribeToTopic);
router.post('/topics/:slug/unsubscribe', protect, authorize('admin'), unsubscribeFromTopic);

module.exports = router;
