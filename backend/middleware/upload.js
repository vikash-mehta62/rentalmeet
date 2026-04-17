const multer = require('multer');
const path = require('path');

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/pdf', 'application/octet-stream'
  ];
  const allowedExts = /\.(jpeg|jpg|png|pdf|webp)$/i;

  const mimeOk = allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/');
  const extOk  = allowedExts.test(path.extname(file.originalname)) || file.originalname === 'selfie.jpg' || !path.extname(file.originalname);

  if (mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, JPG, PNG, WebP and PDF files are allowed'));
  }
};

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter
});

module.exports = { upload };
