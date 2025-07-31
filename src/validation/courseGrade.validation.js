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
 * Course grade creation validation
 */
const validateCourseGrade = [
  body('student')
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ID'),
  
  body('course')
    .isMongoId()
    .withMessage('Course ID must be a valid MongoDB ID'),
  
  body('semester')
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),
  
  body('academicYear')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  
  body('finalGrade')
    .isIn(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W', 'P', 'NP'])
    .withMessage('Invalid final grade'),
  
  body('numericalGrade')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Numerical grade must be between 0 and 100'),
  
  body('credits')
    .isFloat({ min: 1, max: 6 })
    .withMessage('Credits must be between 1 and 6'),
  
  body('attendance')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Attendance must be between 0 and 100'),
  
  body('participation')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Participation must be between 0 and 100'),
  
  body('facultyComments')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Faculty comments cannot exceed 1000 characters'),
  
  body('assignmentGrades')
    .optional()
    .isArray()
    .withMessage('Assignment grades must be an array'),
  
  body('assignmentGrades.*.assignment')
    .optional()
    .isMongoId()
    .withMessage('Assignment ID must be a valid MongoDB ID'),
  
  body('assignmentGrades.*.title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Assignment title is required'),
  
  body('assignmentGrades.*.weight')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Assignment weight must be between 0 and 100'),
  
  body('assignmentGrades.*.grade')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Assignment grade must be between 0 and 100'),
  
  body('assignmentGrades.*.maxPoints')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Assignment max points must be at least 1'),
  
  handleValidationErrors
];

/**
 * Course grade update validation
 */
const validateCourseGradeUpdate = [
  param('gradeId')
    .isMongoId()
    .withMessage('Grade ID must be a valid MongoDB ID'),
  
  body('finalGrade')
    .optional()
    .isIn(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W', 'P', 'NP'])
    .withMessage('Invalid final grade'),
  
  body('numericalGrade')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Numerical grade must be between 0 and 100'),
  
  body('attendance')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Attendance must be between 0 and 100'),
  
  body('participation')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Participation must be between 0 and 100'),
  
  body('facultyComments')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Faculty comments cannot exceed 1000 characters'),
  
  body('assignmentGrades')
    .optional()
    .isArray()
    .withMessage('Assignment grades must be an array'),
  
  body('assignmentGrades.*.assignment')
    .optional()
    .isMongoId()
    .withMessage('Assignment ID must be a valid MongoDB ID'),
  
  body('assignmentGrades.*.title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Assignment title is required'),
  
  body('assignmentGrades.*.weight')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Assignment weight must be between 0 and 100'),
  
  body('assignmentGrades.*.grade')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Assignment grade must be between 0 and 100'),
  
  body('assignmentGrades.*.maxPoints')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Assignment max points must be at least 1'),
  
  handleValidationErrors
];

/**
 * Course grade query validation
 */
const validateCourseGradeQuery = [
  query('semester')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),
  
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  
  query('course')
    .optional()
    .isMongoId()
    .withMessage('Course ID must be a valid MongoDB ID'),
  
  query('status')
    .optional()
    .isIn(['draft', 'submitted', 'approved', 'final'])
    .withMessage('Invalid status'),
  
  handleValidationErrors
];

/**
 * Course grade parameter validation
 */
const validateCourseGradeId = [
  param('gradeId')
    .isMongoId()
    .withMessage('Grade ID must be a valid MongoDB ID'),
  
  handleValidationErrors
];

/**
 * Course ID parameter validation
 */
const validateCourseId = [
  param('courseId')
    .isMongoId()
    .withMessage('Course ID must be a valid MongoDB ID'),
  
  handleValidationErrors
];

/**
 * Bulk grade submission validation
 */
const validateBulkGradeSubmission = [
  param('courseId')
    .isMongoId()
    .withMessage('Course ID must be a valid MongoDB ID'),
  
  body('gradeIds')
    .isArray({ min: 1 })
    .withMessage('At least one grade ID is required'),
  
  body('gradeIds.*')
    .isMongoId()
    .withMessage('Each grade ID must be a valid MongoDB ID'),
  
  handleValidationErrors
];

/**
 * Auto-calculate grades validation
 */
const validateAutoCalculateGrades = [
  param('courseId')
    .isMongoId()
    .withMessage('Course ID must be a valid MongoDB ID'),
  
  body('semester')
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be between 1 and 12'),
  
  body('academicYear')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  
  handleValidationErrors
];

module.exports = {
  validateCourseGrade,
  validateCourseGradeUpdate,
  validateCourseGradeQuery,
  validateCourseGradeId,
  validateCourseId,
  validateBulkGradeSubmission,
  validateAutoCalculateGrades
}; 