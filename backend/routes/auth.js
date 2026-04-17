const express = require('express');
const { register, login, getMe, updateProfile, changePassword, deleteAccount, deactivateAccount, uploadKYC, employeeSelfUpdate } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);
router.put('/deactivate-account', protect, deactivateAccount);
router.post('/kyc-upload', protect, (req, res, next) => {
  upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'idProofBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }
    next();
  });
}, uploadKYC);
router.put('/employee-self-update', protect, employeeSelfUpdate);

module.exports = router;
