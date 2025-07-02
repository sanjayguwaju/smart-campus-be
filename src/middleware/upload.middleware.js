const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadImage, deleteImage } = require('../config/cloudinary.config');
const logger = require('../utils/logger');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

/**
 * Middleware for single image upload
 */
const uploadSingleImage = upload.single('image');

/**
 * Middleware for multiple image uploads
 */
const uploadMultipleImages = upload.array('images', 5); // Max 5 images

/**
 * Middleware to handle image upload and Cloudinary integration
 * @param {string} fieldName - Field name for the image
 * @param {Object} options - Upload options
 */
const handleImageUpload = (fieldName = 'image', options = {}) => {
  return async (req, res, next) => {
    try {
      // Use multer to handle file upload
      uploadSingleImage(req, res, async (err) => {
        if (err) {
          logger.error('Multer upload error:', err);
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        // Check if file was uploaded
        if (!req.file) {
          return next(); // No file uploaded, continue
        }

        try {
          // Upload to Cloudinary
          const cloudinaryResult = await uploadImage(req.file, {
            folder: options.folder || 'smart-campus/events',
            public_id: options.public_id,
            allowed_formats: options.allowed_formats || ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            max_size: options.max_size || 5 * 1024 * 1024
          });

          // Add Cloudinary result to request
          req.cloudinaryResult = cloudinaryResult;

          // Clean up local file
          fs.unlinkSync(req.file.path);

          next();
        } catch (cloudinaryError) {
          // Clean up local file on error
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }

          logger.error('Cloudinary upload error:', cloudinaryError);
          return res.status(400).json({
            success: false,
            message: cloudinaryError.message
          });
        }
      });
    } catch (error) {
      logger.error('Image upload middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during image upload'
      });
    }
  };
};

/**
 * Middleware to handle multiple image uploads
 * @param {Object} options - Upload options
 */
const handleMultipleImageUpload = (options = {}) => {
  return async (req, res, next) => {
    try {
      uploadMultipleImages(req, res, async (err) => {
        if (err) {
          logger.error('Multer multiple upload error:', err);
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        if (!req.files || req.files.length === 0) {
          return next(); // No files uploaded, continue
        }

        try {
          const cloudinaryResults = [];

          // Upload each file to Cloudinary
          for (const file of req.files) {
            const cloudinaryResult = await uploadImage(file, {
              folder: options.folder || 'smart-campus/events',
              allowed_formats: options.allowed_formats || ['jpg', 'jpeg', 'png', 'gif', 'webp'],
              max_size: options.max_size || 5 * 1024 * 1024
            });

            cloudinaryResults.push(cloudinaryResult);

            // Clean up local file
            fs.unlinkSync(file.path);
          }

          // Add Cloudinary results to request
          req.cloudinaryResults = cloudinaryResults;

          next();
        } catch (cloudinaryError) {
          // Clean up local files on error
          if (req.files) {
            req.files.forEach(file => {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            });
          }

          logger.error('Cloudinary multiple upload error:', cloudinaryError);
          return res.status(400).json({
            success: false,
            message: cloudinaryError.message
          });
        }
      });
    } catch (error) {
      logger.error('Multiple image upload middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during image upload'
      });
    }
  };
};

/**
 * Middleware to delete image from Cloudinary
 * @param {string} publicIdField - Field name containing the public ID
 */
const deleteImageFromCloudinary = (publicIdField = 'public_id') => {
  return async (req, res, next) => {
    try {
      const publicId = req.body[publicIdField] || req.params[publicIdField];

      if (publicId) {
        await deleteImage(publicId);
        logger.info(`Image deleted from Cloudinary: ${publicId}`);
      }

      next();
    } catch (error) {
      logger.error('Error deleting image from Cloudinary:', error);
      // Don't fail the request if image deletion fails
      next();
    }
  };
};

module.exports = {
  upload,
  uploadSingleImage,
  uploadMultipleImages,
  handleImageUpload,
  handleMultipleImageUpload,
  deleteImageFromCloudinary
}; 