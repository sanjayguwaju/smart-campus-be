const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * @param {Buffer|string} file - File buffer or file path
 * @param {Object} options - Upload options
 * @param {string} options.folder - Folder name in Cloudinary
 * @param {string} options.public_id - Public ID for the image
 * @param {Array} options.allowed_formats - Allowed image formats
 * @param {number} options.max_size - Maximum file size in bytes
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = async (file, options = {}) => {
  try {
    const {
      folder = 'smart-campus/events',
      public_id = null,
      allowed_formats = ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      max_size = 5 * 1024 * 1024 // 5MB
    } = options;

    // Validate file size
    if (file.size && file.size > max_size) {
      throw new Error(`File size exceeds maximum limit of ${max_size / (1024 * 1024)}MB`);
    }

    // Validate file format
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    if (!allowed_formats.includes(fileExtension)) {
      throw new Error(`File format not allowed. Allowed formats: ${allowed_formats.join(', ')}`);
    }

    // Upload options
    const uploadOptions = {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    if (public_id) {
      uploadOptions.public_id = public_id;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(file.path || file, uploadOptions);

    logger.info(`Image uploaded successfully: ${result.public_id}`);

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    logger.error('Error uploading image to Cloudinary:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} public_id - Public ID of the image
 * @returns {Promise<Object>} Deletion result
 */
const deleteImage = async (public_id) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    
    if (result.result === 'ok') {
      logger.info(`Image deleted successfully: ${public_id}`);
      return { success: true, message: 'Image deleted successfully' };
    } else {
      throw new Error('Failed to delete image');
    }
  } catch (error) {
    logger.error('Error deleting image from Cloudinary:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Update image in Cloudinary (delete old and upload new)
 * @param {string} old_public_id - Old image public ID
 * @param {Buffer|string} new_file - New file buffer or path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Update result
 */
const updateImage = async (old_public_id, new_file, options = {}) => {
  try {
    // Delete old image if it exists
    if (old_public_id) {
      await deleteImage(old_public_id);
    }

    // Upload new image
    const uploadResult = await uploadImage(new_file, options);

    return {
      success: true,
      url: uploadResult.url,
      public_id: uploadResult.public_id,
      message: 'Image updated successfully'
    };
  } catch (error) {
    logger.error('Error updating image:', error);
    throw new Error(`Failed to update image: ${error.message}`);
  }
};

/**
 * Generate image URL with transformations
 * @param {string} public_id - Public ID of the image
 * @param {Object} transformations - Cloudinary transformations
 * @returns {string} Transformed image URL
 */
const getImageUrl = (public_id, transformations = {}) => {
  try {
    return cloudinary.url(public_id, {
      secure: true,
      ...transformations
    });
  } catch (error) {
    logger.error('Error generating image URL:', error);
    throw new Error(`Failed to generate image URL: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  updateImage,
  getImageUrl
}; 