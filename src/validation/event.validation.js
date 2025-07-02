const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
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

// Event creation validation
const validateCreateEvent = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Event title is required')
    .isLength({ max: 100 })
    .withMessage('Event title cannot exceed 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Event description is required')
    .isLength({ max: 1000 })
    .withMessage('Event description cannot exceed 1000 characters'),
  
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  
  body('eventType')
    .isIn(['academic', 'cultural', 'sports', 'technical', 'social', 'workshop', 'seminar', 'conference', 'other'])
    .withMessage('Invalid event type'),
  
  body('category')
    .isIn(['student', 'faculty', 'admin', 'public', 'invitation-only'])
    .withMessage('Invalid event category'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .custom((value) => {
      const startDate = new Date(value);
      const now = new Date();
      if (startDate < now) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.startDate);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  
  body('location.venue')
    .trim()
    .notEmpty()
    .withMessage('Venue is required'),
  
  body('location.room')
    .optional()
    .trim(),
  
  body('location.building')
    .optional()
    .trim(),
  
  body('location.campus')
    .optional()
    .trim(),
  
  body('organizer')
    .isMongoId()
    .withMessage('Invalid organizer ID'),
  
  body('coOrganizers')
    .optional()
    .isArray()
    .withMessage('Co-organizers must be an array'),
  
  body('coOrganizers.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid co-organizer ID'),
  
  body('maxAttendees')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum attendees must be a positive integer'),
  
  body('registrationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Registration deadline must be a valid date')
    .custom((value, { req }) => {
      const deadline = new Date(value);
      const startDate = new Date(req.body.startDate);
      if (deadline >= startDate) {
        throw new Error('Registration deadline must be before start date');
      }
      return true;
    }),
  
  body('isRegistrationRequired')
    .optional()
    .isBoolean()
    .withMessage('isRegistrationRequired must be a boolean'),
  
  body('isRegistrationOpen')
    .optional()
    .isBoolean()
    .withMessage('isRegistrationOpen must be a boolean'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tag cannot exceed 50 characters'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('images.*.url')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  
  body('images.*.caption')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Image caption cannot exceed 100 characters'),
  
  body('images.*.isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean'),
  
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
    .withMessage('Attachment URL must be a valid URL'),
  
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Contact email must be a valid email address'),
  
  body('contactInfo.phone')
    .optional()
    .trim(),
  
  body('contactInfo.website')
    .optional()
    .isURL()
    .withMessage('Contact website must be a valid URL'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'cancelled', 'completed', 'postponed'])
    .withMessage('Invalid status'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'restricted'])
    .withMessage('Invalid visibility'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  body('highlights')
    .optional()
    .isArray()
    .withMessage('Highlights must be an array'),
  
  body('highlights.*')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Highlight cannot exceed 200 characters'),
  
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  
  body('requirements.*')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Requirement cannot exceed 200 characters'),
  
  body('benefits')
    .optional()
    .isArray()
    .withMessage('Benefits must be an array'),
  
  body('benefits.*')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Benefit cannot exceed 200 characters'),
  
  body('externalLinks')
    .optional()
    .isArray()
    .withMessage('External links must be an array'),
  
  body('externalLinks.*.title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('External link title is required'),
  
  body('externalLinks.*.url')
    .optional()
    .isURL()
    .withMessage('External link URL must be a valid URL'),
  
  body('externalLinks.*.description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('External link description cannot exceed 200 characters'),
  
  handleValidationErrors
];

// Event update validation
const validateUpdateEvent = [
  param('eventId')
    .isMongoId()
    .withMessage('Invalid event ID'),
  
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Event title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Event title cannot exceed 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Event description cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Event description cannot exceed 1000 characters'),
  
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  
  body('eventType')
    .optional()
    .isIn(['academic', 'cultural', 'sports', 'technical', 'social', 'workshop', 'seminar', 'conference', 'other'])
    .withMessage('Invalid event type'),
  
  body('category')
    .optional()
    .isIn(['student', 'faculty', 'admin', 'public', 'invitation-only'])
    .withMessage('Invalid event category'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.startDate) {
        const endDate = new Date(value);
        const startDate = new Date(req.body.startDate);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  
  body('startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  
  body('location.venue')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Venue cannot be empty'),
  
  body('location.room')
    .optional()
    .trim(),
  
  body('location.building')
    .optional()
    .trim(),
  
  body('location.campus')
    .optional()
    .trim(),
  
  body('organizer')
    .optional()
    .isMongoId()
    .withMessage('Invalid organizer ID'),
  
  body('coOrganizers')
    .optional()
    .isArray()
    .withMessage('Co-organizers must be an array'),
  
  body('coOrganizers.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid co-organizer ID'),
  
  body('maxAttendees')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum attendees must be a positive integer'),
  
  body('registrationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Registration deadline must be a valid date'),
  
  body('isRegistrationRequired')
    .optional()
    .isBoolean()
    .withMessage('isRegistrationRequired must be a boolean'),
  
  body('isRegistrationOpen')
    .optional()
    .isBoolean()
    .withMessage('isRegistrationOpen must be a boolean'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tag cannot exceed 50 characters'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'cancelled', 'completed', 'postponed'])
    .withMessage('Invalid status'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'restricted'])
    .withMessage('Invalid visibility'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  handleValidationErrors
];

// Event ID validation
const validateEventId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid event ID'),
  
  handleValidationErrors
];

// Event query validation
const validateEventQuery = [
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
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),
  
  query('eventType')
    .optional()
    .isIn(['academic', 'cultural', 'sports', 'technical', 'social', 'workshop', 'seminar', 'conference', 'other'])
    .withMessage('Invalid event type'),
  
  query('category')
    .optional()
    .isIn(['student', 'faculty', 'admin', 'public', 'invitation-only'])
    .withMessage('Invalid event category'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'cancelled', 'completed', 'postponed'])
    .withMessage('Invalid status'),
  
  query('visibility')
    .optional()
    .isIn(['public', 'private', 'restricted'])
    .withMessage('Invalid visibility'),
  
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  query('organizer')
    .optional()
    .isMongoId()
    .withMessage('Invalid organizer ID'),
  
  query('sortBy')
    .optional()
    .isIn(['title', 'startDate', 'endDate', 'createdAt', 'updatedAt', 'priority', 'featured'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  handleValidationErrors
];

// Event registration validation
const validateEventRegistration = [
  param('eventId')
    .isMongoId()
    .withMessage('Invalid event ID'),
  
  handleValidationErrors
];

// Event review validation
const validateEventReview = [
  param('id')
    .isMongoId()
    .withMessage('Invalid event ID'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Event attendance validation
const validateEventAttendance = [
  param('id')
    .isMongoId()
    .withMessage('Invalid event ID'),
  
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  handleValidationErrors
];

// Alias for validateCreateEvent
const validateEvent = validateCreateEvent;

// Alias for validateUpdateEvent
const validateEventUpdate = validateUpdateEvent;

module.exports = {
  validateCreateEvent,
  validateUpdateEvent,
  validateEvent,
  validateEventUpdate,
  validateEventId,
  validateEventQuery,
  validateEventRegistration,
  validateEventReview,
  validateEventAttendance,
  handleValidationErrors
}; 