const multer = require('multer');
const path = require('path');

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/pdf', 'application/octet-stream',
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
  ];
  const allowedExts = /\.(jpeg|jpg|png|pdf|webp|mp4|webm|ogg|mov)$/i;

  const mimeOk = allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
  const extOk  = allowedExts.test(path.extname(file.originalname)) || file.originalname === 'selfie.jpg' || !path.extname(file.originalname);

  if (mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only images, videos (MP4, WebM, MOV), and PDF files are allowed'));
  }
};

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter
});

module.exports = { upload };
