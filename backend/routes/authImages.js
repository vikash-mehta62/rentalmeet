const express = require('express');
const { getAuthImages } = require('../controllers/authImagesController');

const router = express.Router();

// GET /api/auth-images
router.get('/', getAuthImages);

module.exports = router;
