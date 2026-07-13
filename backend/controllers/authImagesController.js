const AuthImage = require('../models/AuthImage');
const { uploadToStorage, deleteFromStorage } = require('../config/storage');

// @desc    Upload or update auth image
// @route   POST /api/admin/auth-images
// @access  Private/Admin
exports.uploadAuthImage = async (req, res) => {
  try {
    const { role, type } = req.body;

    if (!role || !type) {
      return res.status(400).json({
        success: false,
        message: 'Role and type are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const result = await uploadToStorage(req.file.buffer, 'auth-images');

    let authImage = await AuthImage.findOne({ role, type });

    if (authImage) {
      if (authImage.publicId) {
        await deleteFromStorage(authImage.publicId);
      }
      authImage.imageUrl = result.secure_url;
      authImage.publicId = result.public_id;
      await authImage.save();
    } else {
      authImage = await AuthImage.create({
        role,
        type,
        imageUrl: result.secure_url,
        publicId: result.public_id
      });
    }

    res.status(200).json({
      success: true,
      data: authImage
    });
  } catch (error) {
    console.error('Error in uploadAuthImage:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all auth images
// @route   GET /api/auth-images
// @access  Public
exports.getAuthImages = async (req, res) => {
  try {
    const images = await AuthImage.find({});
    
    // Convert array to an object keyed by roleType (e.g., customerLogin)
    const formattedImages = {};
    images.forEach(img => {
      const key = `${img.role}${img.type}`;
      formattedImages[key] = img.imageUrl;
    });

    res.status(200).json({
      success: true,
      data: formattedImages
    });
  } catch (error) {
    console.error('Error in getAuthImages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
