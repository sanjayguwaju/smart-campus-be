const { body, param, query, validationResult } = require('express-validator');
const { ResponseHandler } = require('../utils/responseHandler');

/**
 * Validation result handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    return ResponseHandler.validationError(res, formattedErrors);
  }
  next();
};

/**
 * Course creation validation
 */
const validateCourseCreation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ max: 100 })
    .withMessage('Course title cannot exceed 100 characters'),
  
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Course code is required')
    .isLength({ max: 20 })
    .withMessage('Course code cannot exceed 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Course code can only contain uppercase letters and numbers'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Course description is required')
    .isLength({ max: 1000 })
    .withMessage('Course description cannot exceed 1000 characters'),
  
  body('faculty')
    .isMongoId()
    .withMessage('Invalid faculty ID format'),
  
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required')
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),
  
  body('creditHours')
    .isInt({ min: 1, max: 6 })
    .withMessage('Credit hours must be between 1 and 6'),
  
  body('semester')
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be a number between 1 and 12'),
  
  body('semesterTerm')
    .optional()
    .isIn(['Fall', 'Spring', 'Summer', 'Winter'])
    .withMessage('Semester term must be Fall, Spring, Summer, or Winter'),
  
  body('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  
  body('maxStudents')
    .isInt({ min: 1, max: 200 })
    .withMessage('Maximum students must be between 1 and 200'),
  
  body('schedule.days')
    .optional()
    .isArray()
    .withMessage('Schedule days must be an array'),
  
  body('schedule.days.*')
    .optional()
    .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Invalid day of week'),
  
  body('schedule.startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('schedule.endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  
  body('schedule.room')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Room cannot exceed 50 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Each tag cannot exceed 30 characters'),
  
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array'),
  
  body('prerequisites.*')
    .optional()
    .isMongoId()
    .withMessage('Invalid prerequisite course ID format'),
  
  handleValidationErrors
];

/**
 * Course update validation
 */
const validateCourseUpdate = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course title cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Course title cannot exceed 100 characters'),
  
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course code cannot be empty')
    .isLength({ max: 20 })
    .withMessage('Course code cannot exceed 20 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Course code can only contain uppercase letters and numbers'),
  
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Course description cannot be empty')
    .isLength({ max: 1000 })
    .withMessage('Course description cannot exceed 1000 characters'),
  
  body('faculty')
    .optional()
    .isMongoId()
    .withMessage('Invalid faculty ID format'),
  
  body('department')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),
  
  body('creditHours')
    .isInt({ min: 1, max: 6 })
    .withMessage('Credit hours must be between 1 and 6'),
  
  body('semester')
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be a number between 1 and 12'),
  
  body('semesterTerm')
    .isIn(['Fall', 'Spring', 'Summer', 'Winter'])
    .withMessage('Semester term must be Fall, Spring, Summer, or Winter'),
  
  body('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  
  body('maxStudents')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Maximum students must be between 1 and 200'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean value'),
  
  handleValidationErrors
];

/**
 * Course enrollment validation
 */
const validateCourseEnrollment = [
  body('studentId')
    .isMongoId()
    .withMessage('Invalid student ID format'),
  
  handleValidationErrors
];

/**
 * Course material validation
 */
const validateCourseMaterial = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Material title is required')
    .isLength({ max: 100 })
    .withMessage('Material title cannot exceed 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Material description cannot exceed 500 characters'),
  
  body('fileUrl')
    .trim()
    .notEmpty()
    .withMessage('File URL is required')
    .isURL()
    .withMessage('File URL must be a valid URL'),
  
  body('fileType')
    .optional()
    .isIn(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'video', 'image', 'other'])
    .withMessage('Invalid file type'),
  
  handleValidationErrors
];

/**
 * Course assignment validation
 */
const validateCourseAssignment = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Assignment title is required')
    .isLength({ max: 100 })
    .withMessage('Assignment title cannot exceed 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Assignment description is required')
    .isLength({ max: 1000 })
    .withMessage('Assignment description cannot exceed 1000 characters'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date')
    .custom((value) => {
      const dueDate = new Date(value);
      const now = new Date();
      if (dueDate <= now) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  
  body('totalPoints')
    .isInt({ min: 1 })
    .withMessage('Total points must be at least 1'),
  
  handleValidationErrors
];

/**
 * Assignment submission validation
 */
const validateAssignmentSubmission = [
  body('fileUrl')
    .trim()
    .notEmpty()
    .withMessage('File URL is required')
    .isURL()
    .withMessage('File URL must be a valid URL'),
  
  handleValidationErrors
];

/**
 * Assignment grading validation
 */
const validateAssignmentGrading = [
  body('grade')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Grade must be between 0 and 100'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Feedback cannot exceed 500 characters'),
  
  handleValidationErrors
];

/**
 * Course ID parameter validation
 */
const validateCourseId = [
  param('courseId')
    .isMongoId()
    .withMessage('Invalid course ID format'),
  
  handleValidationErrors
];

/**
 * Course query validation
 */
const validateCourseQuery = [
  query('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters'),
  
  query('semester')
    .optional()
    .isIn(['Fall', 'Spring', 'Summer', 'Winter'])
    .withMessage('Semester must be Fall, Spring, Summer, or Winter'),
  
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  
  query('instructor')
    .optional()
    .isMongoId()
    .withMessage('Invalid instructor ID format'),
  
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  query('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean value'),
  
  query('available')
    .optional()
    .isBoolean()
    .withMessage('available must be a boolean value'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['title', 'code', 'department', 'semester', 'year', 'createdAt'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  handleValidationErrors
];

module.exports = {
  validateCourseCreation,
  validateCourseUpdate,
  validateCourseEnrollment,
  validateCourseMaterial,
  validateCourseAssignment,
  validateAssignmentSubmission,
  validateAssignmentGrading,
  validateCourseId,
  validateCourseQuery,
  handleValidationErrors
}; 