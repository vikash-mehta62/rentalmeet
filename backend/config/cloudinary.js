const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (file, folder) => {
  try {
    const folderPath = process.env.CLOUDINARY_FOLDER 
      ? `${process.env.CLOUDINARY_FOLDER}/${folder}` 
      : `rentalmeet/${folder}`;
      
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folderPath,
      resource_type: 'auto',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto:good' }
      ]
    });
    return result.secure_url;
  } catch (error) {
    throw new Error('Image upload failed');
  }
};

module.exports = { cloudinary, uploadToCloudinary };
