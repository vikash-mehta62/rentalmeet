const express = require('express');
const { getAuthImages } = require('../controllers/authImagesController');
const { getPublicPopup, getAdminPopup, saveAdminPopup, deleteAdminPopup } = require('../controllers/popupController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// GET /api/auth-images
router.get('/', getAuthImages);

// Popup routes via /api/auth-images/popup
router.get('/popup', getPublicPopup);
router.get('/popup/admin', protect, authorize('admin', 'subadmin'), getAdminPopup);
router.post('/popup/admin', protect, authorize('admin', 'subadmin'), upload.single('image'), saveAdminPopup);
router.delete('/popup/admin', protect, authorize('admin', 'subadmin'), deleteAdminPopup);

module.exports = router;

