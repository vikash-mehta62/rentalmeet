const express = require('express');
const router = express.Router();
const { uploadToCloudinary } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// @desc    Upload file to Cloudinary
// @route   POST /api/upload
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const folder = req.body.folder || 'general';
    
    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, folder);

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
});

module.exports = router;
