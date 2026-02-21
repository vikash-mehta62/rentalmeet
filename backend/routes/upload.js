const express = require('express');
const router = express.Router();
const { cloudinary } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');

// @desc    Upload image to Cloudinary
// @route   POST /api/upload/image
// @access  Private
router.post('/image', protect, async (req, res) => {
  try {
    const { file, folder } = req.body;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Upload to Cloudinary
    const folderPath = `${process.env.CLOUDINARY_FOLDER}/${folder || 'uploads'}`;
    
    const result = await cloudinary.uploader.upload(file, {
      folder: folderPath,
      resource_type: 'auto',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    });

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed: ' + error.message
    });
  }
});

// @desc    Upload document to Cloudinary
// @route   POST /api/upload/document
// @access  Private
router.post('/document', protect, async (req, res) => {
  try {
    const { file, folder } = req.body;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Upload to Cloudinary
    const folderPath = `${process.env.CLOUDINARY_FOLDER}/${folder || 'documents'}`;
    
    const result = await cloudinary.uploader.upload(file, {
      folder: folderPath,
      resource_type: 'auto' // Allows PDF, images, etc.
    });

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      resourceType: result.resource_type
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed: ' + error.message
    });
  }
});

// @desc    Delete from Cloudinary
// @route   DELETE /api/upload/:publicId
// @access  Private
router.delete('/:publicId', protect, async (req, res) => {
  try {
    const publicId = req.params.publicId.replace(/--/g, '/');
    
    await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete failed: ' + error.message
    });
  }
});

module.exports = router;
