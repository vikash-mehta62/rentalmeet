const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadToCloudinary } = require('../config/cloudinary');

// @route   POST /api/upload/image
// @desc    Upload image to Cloudinary
// @access  Public
router.post('/image', async (req, res) => {
  try {
    const { file, folder = 'general' } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if it's a base64 string
    if (file.startsWith('data:')) {
      // Upload base64 directly to Cloudinary
      const cloudinary = require('cloudinary').v2;
      
      const result = await cloudinary.uploader.upload(file, {
        folder: `rentalmeet/${folder}`,
        resource_type: 'auto'
      });

      return res.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type
      });
    }

    // If not base64, return error
    return res.status(400).json({
      success: false,
      message: 'Invalid file format. Expected base64 string.'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// @route   POST /api/upload/document
// @desc    Upload document to Cloudinary
// @access  Public
router.post('/document', async (req, res) => {
  try {
    const { file, folder = 'documents' } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Check if it's a base64 string
    if (file.startsWith('data:')) {
      // Upload base64 directly to Cloudinary
      const cloudinary = require('cloudinary').v2;
      
      const result = await cloudinary.uploader.upload(file, {
        folder: `rentalmeet/${folder}`,
        resource_type: 'auto'
      });

      return res.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type
      });
    }

    // If not base64, return error
    return res.status(400).json({
      success: false,
      message: 'Invalid file format. Expected base64 string.'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// @route   POST /api/upload
// @desc    Upload file to Cloudinary (generic)
// @access  Public
router.post('/', upload.single('file'), async (req, res) => {
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
      message: 'Error uploading file'
    });
  }
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete image from Cloudinary
// @access  Private
router.delete('/:publicId', protect, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    // Decode the publicId (replace -- with /)
    const decodedPublicId = publicId.replace(/--/g, '/');

    // Delete from Cloudinary
    const cloudinary = require('cloudinary').v2;
    const result = await cloudinary.uploader.destroy(decodedPublicId);

    if (result.result === 'ok' || result.result === 'not found') {
      return res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Failed to delete image'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

module.exports = router;
