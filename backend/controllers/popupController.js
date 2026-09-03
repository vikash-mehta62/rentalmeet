const PlatformSettings = require('../models/PlatformSettings');
const { uploadToStorage, deleteFromStorage } = require('../config/storage');

// @desc    Get active popup banner for Home page (Public)
// @route   GET /api/popup
// @access  Public
exports.getPublicPopup = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    const popup = settings?.homePopup;
    if (!popup || !popup.isActive || (!popup.imageUrl && !popup.title && !popup.description)) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    const popupObj = popup.toObject ? popup.toObject() : { ...popup };
    popupObj.updatedAt = settings.updatedAt || new Date();

    return res.status(200).json({
      success: true,
      data: popupObj
    });
  } catch (error) {
    console.error('Error in getPublicPopup:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching popup'
    });
  }
};

// @desc    Get popup banner settings for Admin
// @route   GET /api/popup/admin
// @access  Private/Admin
exports.getAdminPopup = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    const popup = settings?.homePopup ? (settings.homePopup.toObject ? settings.homePopup.toObject() : { ...settings.homePopup }) : {
      title: '',
      description: '',
      link: '',
      buttonText: 'Explore Now',
      imageUrl: '',
      isActive: false
    };

    popup.updatedAt = settings.updatedAt || new Date();

    return res.status(200).json({
      success: true,
      data: popup
    });
  } catch (error) {
    console.error('Error in getAdminPopup:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching popup details'
    });
  }
};

// @desc    Create or update popup banner (Admin)
// @route   POST /api/popup/admin
// @access  Private/Admin
exports.saveAdminPopup = async (req, res) => {
  try {
    const { title, description, link, buttonText, isActive, removeImage } = req.body;
    const settings = await PlatformSettings.getSettings();

    if (!settings.homePopup) {
      settings.homePopup = {};
    }

    if (title !== undefined) settings.homePopup.title = title.trim();
    if (description !== undefined) settings.homePopup.description = description.trim();
    if (link !== undefined) settings.homePopup.link = link.trim();
    if (buttonText !== undefined) settings.homePopup.buttonText = buttonText.trim() || 'Explore Now';
    
    if (isActive !== undefined) {
      settings.homePopup.isActive = isActive === 'true' || isActive === true;
    }

    // Handle Image Removal
    if (removeImage === 'true' || removeImage === true) {
      if (settings.homePopup.publicId) {
        try {
          await deleteFromStorage(settings.homePopup.publicId);
        } catch (e) {
          console.warn('Could not delete previous image from storage:', e.message);
        }
      }
      settings.homePopup.imageUrl = '';
      settings.homePopup.publicId = '';
    }

    // Handle New Image Upload
    if (req.file) {
      if (settings.homePopup.publicId) {
        try {
          await deleteFromStorage(settings.homePopup.publicId);
        } catch (e) {
          console.warn('Could not delete previous image from storage:', e.message);
        }
      }
      const result = await uploadToStorage(req.file.buffer, 'popup-banners');
      settings.homePopup.imageUrl = result.secure_url;
      settings.homePopup.publicId = result.public_id;
    }

    settings.markModified('homePopup');
    await settings.save();

    const returnData = settings.homePopup.toObject ? settings.homePopup.toObject() : { ...settings.homePopup };
    returnData.updatedAt = settings.updatedAt || new Date();

    return res.status(200).json({
      success: true,
      message: 'Home popup banner updated successfully',
      data: returnData
    });
  } catch (error) {
    console.error('Error in saveAdminPopup:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error saving popup'
    });
  }
};

// @desc    Delete / Reset popup banner
// @route   DELETE /api/popup/admin
// @access  Private/Admin
exports.deleteAdminPopup = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    if (settings.homePopup?.publicId) {
      try {
        await deleteFromStorage(settings.homePopup.publicId);
      } catch (e) {
        console.warn('Could not delete image from storage:', e.message);
      }
    }
    settings.homePopup = {
      title: '',
      description: '',
      link: '',
      buttonText: 'Explore Now',
      imageUrl: '',
      publicId: '',
      isActive: false
    };
    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Popup banner reset successfully'
    });
  } catch (error) {
    console.error('Error in deleteAdminPopup:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting popup'
    });
  }
};
