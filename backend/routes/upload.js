const express = require('express');
const router = express.Router();
const { uploadToStorage, deleteFromStorage } = require('../config/storage');
const { optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const parseDataUri = (value, fallbackPattern = /^data:[^;]+;base64,/) => {
  const match = typeof value === 'string'
    ? value.match(/^data:([^;]+);base64,(.+)$/)
    : null;

  if (match) {
    return {
      contentType: match[1],
      buffer: Buffer.from(match[2], 'base64')
    };
  }

  return {
    contentType: undefined,
    buffer: Buffer.from(String(value || '').replace(fallbackPattern, ''), 'base64')
  };
};

const sendUploadResponse = (res, result) => {
  res.json({
    success: true,
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    size: result.bytes,
    resourceType: result.resource_type,
    storage: result.storage || 's3'
  });
};

// @desc    Upload file to S3
// @route   POST /api/upload
router.post('/', optionalAuth, (req, res, next) => {
  // Skip multer if content-type is application/json (base64)
  if (req.headers['content-type']?.includes('application/json')) {
    return next();
  }
  upload.single('file')(req, res, next);
}, async (req, res) => {
  try {
    let buffer;
    let contentType;
    let originalName;
    let folder = req.body.folder || 'general';

    // Case 1: File uploaded as multipart/form-data (binary)
    if (req.file) {
      buffer = req.file.buffer;
      contentType = req.file.mimetype;
      originalName = req.file.originalname;
    }
    // Case 2: Base64 string sent in JSON body
    else if (req.body.file && typeof req.body.file === 'string' && req.body.file.startsWith('data:')) {
      const parsed = parseDataUri(req.body.file);
      buffer = parsed.buffer;
      contentType = parsed.contentType;
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Send either multipart file or base64 string.'
      });
    }

    const result = await uploadToStorage(buffer, folder, { contentType, originalName });
    sendUploadResponse(res, result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
});

// @desc    Upload image to S3 (alternative endpoint)
// @route   POST /api/upload/image
router.post('/image', optionalAuth, (req, res, next) => {
  // Skip multer if content-type is application/json (base64)
  if (req.headers['content-type']?.includes('application/json')) {
    return next();
  }
  upload.single('image')(req, res, next);
}, async (req, res) => {
  try {
    let buffer;
    let contentType;
    let originalName;
    let folder = req.body.folder || 'images';

    // Case 1: File uploaded as multipart/form-data (binary)
    if (req.file) {
      buffer = req.file.buffer;
      contentType = req.file.mimetype;
      originalName = req.file.originalname;
    }
    // Case 2: Base64 string sent in JSON body
    else if (req.body.file) {
      const parsed = parseDataUri(req.body.file, /^data:image\/\w+;base64,/);
      buffer = parsed.buffer;
      contentType = parsed.contentType;
    }
    // Case 3: Direct base64 in image field
    else if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:')) {
      const parsed = parseDataUri(req.body.image, /^data:image\/\w+;base64,/);
      buffer = parsed.buffer;
      contentType = parsed.contentType;
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded. Send either multipart file or base64 string.'
      });
    }

    const result = await uploadToStorage(buffer, folder, { contentType, originalName });
    sendUploadResponse(res, result);
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image'
    });
  }
});

// @desc    Upload multiple images to S3
// @route   POST /api/upload/images
router.post('/images', optionalAuth, upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    const folder = req.body.folder || 'images';
    
    // Upload all images to S3
    const uploadPromises = req.files.map(file =>
      uploadToStorage(file.buffer, folder, {
        contentType: file.mimetype,
        originalName: file.originalname
      })
    );
    
    const results = await Promise.all(uploadPromises);
    
    const images = results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      storage: result.storage || 's3'
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

// @desc    Upload document to S3 (PDF, DOC, etc.)
// @route   POST /api/upload/document
router.post('/document', optionalAuth, (req, res, next) => {
  // Skip multer if content-type is application/json (base64)
  if (req.headers['content-type']?.includes('application/json')) {
    return next();
  }
  upload.single('document')(req, res, next);
}, async (req, res) => {
  try {
    let buffer;
    let contentType;
    let originalName;
    let folder = req.body.folder || 'documents';

    // Case 1: File uploaded as multipart/form-data (binary)
    if (req.file) {
      buffer = req.file.buffer;
      contentType = req.file.mimetype;
      originalName = req.file.originalname;
    }
    // Case 2: Base64 string sent in JSON body
    else if (req.body.file) {
      const parsed = parseDataUri(req.body.file);
      buffer = parsed.buffer;
      contentType = parsed.contentType;
    }
    // Case 3: Direct base64 in document field
    else if (req.body.document && typeof req.body.document === 'string' && req.body.document.startsWith('data:')) {
      const parsed = parseDataUri(req.body.document);
      buffer = parsed.buffer;
      contentType = parsed.contentType;
    }
    else {
      return res.status(400).json({
        success: false,
        message: 'No document uploaded. Send either multipart file or base64 string.'
      });
    }

    const result = await uploadToStorage(buffer, folder, { contentType, originalName });
    sendUploadResponse(res, result);
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload document'
    });
  }
});

// @desc    Delete uploaded file from configured storage
// @route   DELETE /api/upload/:publicId
router.delete('/:publicId', optionalAuth, async (req, res) => {
  try {
    const publicId = req.params.publicId.replace(/--/g, '/');
    await deleteFromStorage(publicId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete file'
    });
  }
});

module.exports = router;
