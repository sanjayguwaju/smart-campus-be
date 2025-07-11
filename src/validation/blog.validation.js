const { body, param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validation.middleware');

// Validation for blog creation
const validateBlogCreation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Blog title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Blog title must be between 5 and 200 characters'),
  
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Slug must be between 3 and 100 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  
  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Blog content is required')
    .isLength({ min: 50, max: 50000 })
    .withMessage('Blog content must be between 50 and 50000 characters'),
  
  body('summary')
    .trim()
    .notEmpty()
    .withMessage('Blog summary is required')
    .isLength({ min: 20, max: 500 })
    .withMessage('Blog summary must be between 20 and 500 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].trim().length === 0 || value[i].length > 50) {
            throw new Error('Each tag must be a non-empty string with maximum 50 characters');
          }
        }
        if (value.length > 20) {
          throw new Error('Maximum 20 tags allowed');
        }
      }
      return true;
    }),
  
  body('coverImage')
    .optional()
    .trim()
    .isURL()
    .withMessage('Cover image must be a valid URL'),
  
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be either "draft", "published", or "archived"'),
  
  body('credits')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Credits must not exceed 500 characters'),
  
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].trim().length === 0) {
            throw new Error('Each attachment must be a non-empty string');
          }
        }
        if (value.length > 10) {
          throw new Error('Maximum 10 attachments allowed');
        }
      }
      return true;
    }),
  
  validateRequest
];

// Validation for blog update
const validateBlogUpdate = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Blog title cannot be empty')
    .isLength({ min: 5, max: 200 })
    .withMessage('Blog title must be between 5 and 200 characters'),
  
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Slug must be between 3 and 100 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  
  body('author')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Author cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Blog content cannot be empty')
    .isLength({ min: 50, max: 50000 })
    .withMessage('Blog content must be between 50 and 50000 characters'),
  
  body('summary')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Blog summary cannot be empty')
    .isLength({ min: 20, max: 500 })
    .withMessage('Blog summary must be between 20 and 500 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].trim().length === 0 || value[i].length > 50) {
            throw new Error('Each tag must be a non-empty string with maximum 50 characters');
          }
        }
        if (value.length > 20) {
          throw new Error('Maximum 20 tags allowed');
        }
      }
      return true;
    }),
  
  body('coverImage')
    .optional()
    .trim()
    .isURL()
    .withMessage('Cover image must be a valid URL'),
  
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be either "draft", "published", or "archived"'),
  
  body('credits')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Credits must not exceed 500 characters'),
  
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].trim().length === 0) {
            throw new Error('Each attachment must be a non-empty string');
          }
        }
        if (value.length > 10) {
          throw new Error('Maximum 10 attachments allowed');
        }
      }
      return true;
    }),
  
  validateRequest
];

// Validation for blog ID parameter
const validateBlogId = [
  param('id')
    .notEmpty()
    .withMessage('Blog ID is required')
    .isMongoId()
    .withMessage('Invalid blog ID format'),
  
  validateRequest
];

// Validation for blog slug parameter
const validateBlogSlug = [
  param('slug')
    .notEmpty()
    .withMessage('Blog slug is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Slug must be between 3 and 100 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  
  validateRequest
];

// Validation for author parameter
const validateAuthor = [
  param('author')
    .notEmpty()
    .withMessage('Author is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  validateRequest
];

// Validation for blog query parameters
const validateBlogQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('author')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Author name must be between 2 and 100 characters'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be either "draft", "published", or "archived"'),
  
  query('isPublished')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isPublished must be either "true" or "false"'),
  
  query('tags')
    .optional()
    .custom((value) => {
      if (value) {
        const tags = Array.isArray(value) ? value : [value];
        for (let i = 0; i < tags.length; i++) {
          if (typeof tags[i] !== 'string' || tags[i].trim().length === 0 || tags[i].length > 50) {
            throw new Error('Each tag must be a non-empty string with maximum 50 characters');
          }
        }
      }
      return true;
    }),
  
  query('sortBy')
    .optional()
    .isIn(['title', 'author', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
  
  validateRequest
];

// Validation for search query parameters
const validateSearchQuery = [
  query('q')
    .notEmpty()
    .withMessage('Search term is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  validateRequest
];

// Validation for tags query parameters
const validateTagsQuery = [
  query('tags')
    .notEmpty()
    .withMessage('Tags parameter is required')
    .custom((value) => {
      const tags = Array.isArray(value) ? value : [value];
      if (tags.length === 0) {
        throw new Error('At least one tag is required');
      }
      for (let i = 0; i < tags.length; i++) {
        if (typeof tags[i] !== 'string' || tags[i].trim().length === 0 || tags[i].length > 50) {
          throw new Error('Each tag must be a non-empty string with maximum 50 characters');
        }
      }
      return true;
    }),
  
  validateRequest
];

// Validation for recent blogs query parameters
const validateRecentBlogsQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20'),
  
  validateRequest
];

// Validation for popular tags query parameters
const validatePopularTagsQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  validateRequest
];

// Validation for publish/unpublish
const validatePublishBlog = [
  param('id')
    .notEmpty()
    .withMessage('Blog ID is required')
    .isMongoId()
    .withMessage('Invalid blog ID format'),
  
  body('isPublished')
    .notEmpty()
    .withMessage('isPublished is required')
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  
  validateRequest
];

module.exports = {
  validateBlogCreation,
  validateBlogUpdate,
  validateBlogId,
  validateBlogSlug,
  validateAuthor,
  validateBlogQuery,
  validateSearchQuery,
  validateTagsQuery,
  validateRecentBlogsQuery,
  validatePopularTagsQuery,
  validatePublishBlog,
}; 