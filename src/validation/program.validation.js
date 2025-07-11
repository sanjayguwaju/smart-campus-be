const { body, param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validation.middleware');

// Validation for program creation
const validateProgramCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Program name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Program name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-&]+$/)
    .withMessage('Program name can only contain letters, spaces, hyphens, and ampersands'),
  
  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .isMongoId()
    .withMessage('Invalid department ID format'),
  
  body('level')
    .notEmpty()
    .withMessage('Program level is required')
    .isIn(['Undergraduate', 'Postgraduate'])
    .withMessage('Program level must be either "Undergraduate" or "Postgraduate"'),
  
  body('duration')
    .trim()
    .notEmpty()
    .withMessage('Duration is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Duration must be between 2 and 50 characters'),
  
  body('semesters')
    .notEmpty()
    .withMessage('Number of semesters is required')
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of semesters must be between 1 and 20'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].trim().length === 0 || value[i].length > 100) {
            throw new Error('Each prerequisite must be a non-empty string with maximum 100 characters');
          }
        }
      }
      return true;
    }),
  
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL'),
  
  body('brochureUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Brochure URL must be a valid URL'),
  
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be either "draft", "published", or "archived"'),
  
  validateRequest
];

// Validation for program update
const validateProgramUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Program name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Program name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\-&]+$/)
    .withMessage('Program name can only contain letters, spaces, hyphens, and ampersands'),
  
  body('department')
    .optional()
    .notEmpty()
    .withMessage('Department cannot be empty')
    .isMongoId()
    .withMessage('Invalid department ID format'),
  
  body('level')
    .optional()
    .notEmpty()
    .withMessage('Program level cannot be empty')
    .isIn(['Undergraduate', 'Postgraduate'])
    .withMessage('Program level must be either "Undergraduate" or "Postgraduate"'),
  
  body('duration')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Duration cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Duration must be between 2 and 50 characters'),
  
  body('semesters')
    .optional()
    .notEmpty()
    .withMessage('Number of semesters cannot be empty')
    .isInt({ min: 1, max: 20 })
    .withMessage('Number of semesters must be between 1 and 20'),
  
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (let i = 0; i < value.length; i++) {
          if (typeof value[i] !== 'string' || value[i].trim().length === 0 || value[i].length > 100) {
            throw new Error('Each prerequisite must be a non-empty string with maximum 100 characters');
          }
        }
      }
      return true;
    }),
  
  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL'),
  
  body('brochureUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('Brochure URL must be a valid URL'),
  
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be either "draft", "published", or "archived"'),
  
  validateRequest
];

// Validation for program ID parameter
const validateProgramId = [
  param('id')
    .notEmpty()
    .withMessage('Program ID is required')
    .isMongoId()
    .withMessage('Invalid program ID format'),
  
  validateRequest
];

// Validation for department ID parameter
const validateDepartmentId = [
  param('departmentId')
    .notEmpty()
    .withMessage('Department ID is required')
    .isMongoId()
    .withMessage('Invalid department ID format'),
  
  validateRequest
];

// Validation for level parameter
const validateLevel = [
  param('level')
    .notEmpty()
    .withMessage('Level is required')
    .isIn(['Undergraduate', 'Postgraduate'])
    .withMessage('Level must be either "Undergraduate" or "Postgraduate"'),
  
  validateRequest
];

// Validation for program query parameters
const validateProgramQuery = [
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
  
  query('department')
    .optional()
    .isMongoId()
    .withMessage('Invalid department ID format'),
  
  query('level')
    .optional()
    .isIn(['Undergraduate', 'Postgraduate'])
    .withMessage('Level must be either "Undergraduate" or "Postgraduate"'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be either "draft", "published", or "archived"'),
  
  query('isPublished')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isPublished must be either "true" or "false"'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'level', 'duration', 'semesters', 'createdAt', 'updatedAt'])
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

// Validation for publish/unpublish
const validatePublishProgram = [
  param('id')
    .notEmpty()
    .withMessage('Program ID is required')
    .isMongoId()
    .withMessage('Invalid program ID format'),
  
  body('isPublished')
    .notEmpty()
    .withMessage('isPublished is required')
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  
  validateRequest
];

module.exports = {
  validateProgramCreation,
  validateProgramUpdate,
  validateProgramId,
  validateDepartmentId,
  validateLevel,
  validateProgramQuery,
  validateSearchQuery,
  validatePublishProgram,
}; 