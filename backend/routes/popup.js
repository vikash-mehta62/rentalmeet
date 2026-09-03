const express = require('express');
const {
  getPublicPopup,
  getAdminPopup,
  saveAdminPopup,
  deleteAdminPopup
} = require('../controllers/popupController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Public route for Home page
router.get('/', getPublicPopup);

// Admin routes
router.get('/admin', protect, authorize('admin', 'subadmin'), getAdminPopup);
router.post('/admin', protect, authorize('admin', 'subadmin'), upload.single('image'), saveAdminPopup);
router.delete('/admin', protect, authorize('admin', 'subadmin'), deleteAdminPopup);

module.exports = router;
