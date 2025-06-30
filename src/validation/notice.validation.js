const { body, param, query, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Validation rules for creating a notice
const validateNotice = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Notice title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Notice content is required')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Summary cannot exceed 500 characters'),
  
  body('type')
    .isIn(['announcement', 'academic', 'administrative', 'event', 'emergency', 'maintenance', 'other'])
    .withMessage('Invalid notice type'),
  
  body('category')
    .isIn(['undergraduate', 'graduate', 'faculty', 'staff', 'all'])
    .withMessage('Invalid category'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived', 'expired'])
    .withMessage('Invalid status'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'restricted'])
    .withMessage('Invalid visibility setting'),
  
  body('publishDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid publish date format')
    .custom((value) => {
      // Allow today as valid, only reject if before today
      const inputDate = new Date(value);
      const now = new Date();
      // Set both to midnight for date-only comparison
      inputDate.setHours(0,0,0,0);
      now.setHours(0,0,0,0);
      if (inputDate < now) {
        throw new Error('Publish date cannot be in the past');
      }
      return true;
    }),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date format')
    .custom((value, { req }) => {
      if (req.body.publishDate && new Date(value) <= new Date(req.body.publishDate)) {
        throw new Error('Expiry date must be after publish date');
      }
      return true;
    }),
  
  body('effectiveDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid effective date format')
    .custom((value, { req }) => {
      if (req.body.publishDate && new Date(value) < new Date(req.body.publishDate)) {
        throw new Error('Effective date cannot be before publish date');
      }
      return true;
    }),
  
  body('targetAudience.departments')
    .optional()
    .isArray()
    .withMessage('Departments must be an array'),
  
  body('targetAudience.departments.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department name cannot be empty'),
  
  body('targetAudience.roles')
    .optional()
    .isArray()
    .withMessage('Roles must be an array'),
  
  body('targetAudience.roles.*')
    .optional()
    .isIn(['admin', 'faculty', 'staff', 'student'])
    .withMessage('Invalid role in target audience'),
  
  body('targetAudience.specificUsers')
    .optional()
    .isArray()
    .withMessage('Specific users must be an array'),
  
  body('targetAudience.specificUsers.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID in specific users'),
  
  body('targetAudience.yearLevels')
    .optional()
    .isArray()
    .withMessage('Year levels must be an array'),
  
  body('targetAudience.yearLevels.*')
    .optional()
    .isIn(['first', 'second', 'third', 'fourth', 'fifth', 'graduate'])
    .withMessage('Invalid year level'),
  
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  
  body('attachments.*.name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Attachment name is required'),
  
  body('attachments.*.url')
    .optional()
    .isURL()
    .withMessage('Invalid attachment URL'),
  
  body('attachments.*.type')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Attachment type is required'),
  
  body('attachments.*.size')
    .optional()
    .isNumeric()
    .withMessage('Attachment size must be a number'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('images.*.url')
    .optional()
    .isURL()
    .withMessage('Invalid image URL'),
  
  body('images.*.alt')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Image alt text cannot exceed 100 characters'),
  
  body('images.*.caption')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Image caption cannot exceed 200 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tag cannot exceed 50 characters'),
  
  body('relatedNotices')
    .optional()
    .isArray()
    .withMessage('Related notices must be an array'),
  
  body('relatedNotices.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid related notice ID'),
  
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Invalid contact email'),
  
  body('contactInfo.phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Invalid phone number format'),
  
  body('contactInfo.office')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Office location cannot exceed 100 characters'),
  
  body('contactInfo.website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),
  
  body('location.building')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Building name cannot exceed 100 characters'),
  
  body('location.room')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Room number cannot exceed 50 characters'),
  
  body('location.address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address cannot exceed 200 characters'),
  
  body('settings.allowComments')
    .optional()
    .isBoolean()
    .withMessage('Allow comments must be a boolean'),
  
  body('settings.requireAcknowledgement')
    .optional()
    .isBoolean()
    .withMessage('Require acknowledgement must be a boolean'),
  
  body('settings.sendNotification')
    .optional()
    .isBoolean()
    .withMessage('Send notification must be a boolean'),
  
  body('settings.pinToTop')
    .optional()
    .isBoolean()
    .withMessage('Pin to top must be a boolean'),
  
  body('settings.featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  handleValidationErrors
];

// Validation rules for updating a notice
const validateNoticeUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notice ID'),
  
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Notice title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Notice content cannot be empty')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  
  body('summary')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Summary cannot exceed 500 characters'),
  
  body('type')
    .optional()
    .isIn(['announcement', 'academic', 'administrative', 'event', 'emergency', 'maintenance', 'other'])
    .withMessage('Invalid notice type'),
  
  body('category')
    .optional()
    .isIn(['undergraduate', 'graduate', 'faculty', 'staff', 'all'])
    .withMessage('Invalid category'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived', 'expired'])
    .withMessage('Invalid status'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'restricted'])
    .withMessage('Invalid visibility setting'),
  
  body('publishDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid publish date format'),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiry date format'),
  
  body('effectiveDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid effective date format'),
  
  handleValidationErrors
];

// Validation rules for notice ID parameter
const validateNoticeId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notice ID'),
  
  handleValidationErrors
];

// Validation rules for notice queries
const validateNoticeQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('type')
    .optional()
    .isIn(['announcement', 'academic', 'administrative', 'event', 'emergency', 'maintenance', 'other'])
    .withMessage('Invalid notice type'),
  
  query('category')
    .optional()
    .isIn(['undergraduate', 'graduate', 'faculty', 'staff', 'all'])
    .withMessage('Invalid category'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived', 'expired'])
    .withMessage('Invalid status'),
  
  query('author')
    .optional()
    .isMongoId()
    .withMessage('Invalid author ID'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Search term must be at least 2 characters'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  query('pinned')
    .optional()
    .isBoolean()
    .withMessage('Pinned must be a boolean'),
  
  handleValidationErrors
];

// Validation rules for adding comments
const validateComment = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notice ID'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  
  handleValidationErrors
];

// Validation rules for updating comments
const validateCommentUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notice ID'),
  
  param('commentId')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  
  handleValidationErrors
];

// Validation rules for comment ID
const validateCommentId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notice ID'),
  
  param('commentId')
    .isMongoId()
    .withMessage('Invalid comment ID'),
  
  handleValidationErrors
];

// Validation rules for engagement actions (like, bookmark)
const validateEngagementAction = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notice ID'),
  
  handleValidationErrors
];

// Validation rules for bulk operations
const validateBulkOperation = [
  body('noticeIds')
    .isArray({ min: 1 })
    .withMessage('Notice IDs must be a non-empty array'),
  
  body('noticeIds.*')
    .isMongoId()
    .withMessage('Invalid notice ID in array'),
  
  body('action')
    .isIn(['publish', 'archive', 'delete', 'pin', 'unpin', 'feature', 'unfeature'])
    .withMessage('Invalid bulk action'),
  
  handleValidationErrors
];

// Validation rules for notice statistics
const validateStatisticsQuery = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notice ID'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  
  handleValidationErrors
];

module.exports = {
  validateNotice,
  validateNoticeUpdate,
  validateNoticeId,
  validateNoticeQuery,
  validateComment,
  validateCommentUpdate,
  validateCommentId,
  validateEngagementAction,
  validateBulkOperation,
  validateStatisticsQuery,
  handleValidationErrors
}; 