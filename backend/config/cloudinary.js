const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (fileBuffer, folder) => {
  try {
    const folderPath = process.env.CLOUDINARY_FOLDER 
      ? `${process.env.CLOUDINARY_FOLDER}/${folder}` 
      : `rentalmeet/${folder}`;
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          resource_type: 'auto',
          transformation: [
            { width: 1920, height: 1080, crop: 'limit' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(new Error('Image upload failed'));
          } else {
            resolve(result);
          }
        }
      );
      
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new Error('Image upload failed');
  }
};

module.exports = { cloudinary, uploadToCloudinary };
