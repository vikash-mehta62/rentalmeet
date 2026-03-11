const express = require('express');
const router = express.Router();
const { uploadToCloudinary } = require('../config/cloudinary');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// @desc    Upload file to Cloudinary
// @route   POST /api/upload
router.post('/', protect, (req, res, next) => {
  // Skip multer if content-type is application/json (base64)
  if (req.headers['content-type']?.includes('application/json')) {
    return next();
  }
  upload.single('file')(req, res, next);
}, async (req, res) => {
  try {
    let buffer;
    let folder = req.body.folder || 'general';

    // Case 1: File uploaded as multipart/form-data (binary)
    if (req.file) {
      buffer = req.file.buffer;
    }
    // Case 2: Base64 string sent in JSON body
    else if (req.body.file && typeof req.body.file === 'string' && req.body.file.startsWith('data:')) {
      const base64Data = req.body.file.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Send either multipart file or base64 string.'
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, folder);

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

// @desc    Upload image to Cloudinary (alternative endpoint)
// @route   POST /api/upload/image
router.post('/image', protect, (req, res, next) => {
  // Skip multer if content-type is application/json (base64)
  if (req.headers['content-type']?.includes('application/json')) {
    return next();
  }
  upload.single('image')(req, res, next);
}, async (req, res) => {
  try {
    let buffer;
    let folder = req.body.folder || 'images';

    // Case 1: File uploaded as multipart/form-data (binary)
    if (req.file) {
      buffer = req.file.buffer;
    }
    // Case 2: Base64 string sent in JSON body
    else if (req.body.file) {
      const base64Data = req.body.file.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    }
    // Case 3: Direct base64 in image field
    else if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:')) {
      const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded. Send either multipart file or base64 string.'
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, folder);

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image'
    });
  }
});

// @desc    Upload multiple images to Cloudinary
// @route   POST /api/upload/images
router.post('/images', protect, upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const folder = req.body.folder || 'images';
    
    // Upload all images to Cloudinary
    const uploadPromises = req.files.map(file => 
      uploadToCloudinary(file.buffer, folder)
    );
    
    const results = await Promise.all(uploadPromises);
    
    const images = results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id
    }));

    res.json({
      success: true,
      images
    });
  } catch (error) {
    console.error('Multiple images upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images'
    });
  }
});

// @desc    Upload document to Cloudinary (PDF, DOC, etc.)
// @route   POST /api/upload/document
router.post('/document', protect, (req, res, next) => {
  // Skip multer if content-type is application/json (base64)
  if (req.headers['content-type']?.includes('application/json')) {
    return next();
  }
  upload.single('document')(req, res, next);
}, async (req, res) => {
  try {
    let buffer;
    let folder = req.body.folder || 'documents';

    // Case 1: File uploaded as multipart/form-data (binary)
    if (req.file) {
      buffer = req.file.buffer;
    }
    // Case 2: Base64 string sent in JSON body
    else if (req.body.file) {
      const base64Data = req.body.file.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    }
    // Case 3: Direct base64 in document field
    else if (req.body.document && typeof req.body.document === 'string' && req.body.document.startsWith('data:')) {
      const base64Data = req.body.document.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'No document uploaded. Send either multipart file or base64 string.'
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, folder);

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload document'
    });
  }
});

module.exports = router;
