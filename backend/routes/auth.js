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
router.post('/kyc-upload', protect, upload.fields([{ name: 'idProof', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]), uploadKYC);
router.put('/employee-self-update', protect, employeeSelfUpdate);

module.exports = router;
