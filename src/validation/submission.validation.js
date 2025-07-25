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
 * Submission creation validation
 */
const validateSubmissionCreation = [
  body('assignment')
    .isMongoId()
    .withMessage('Assignment ID must be a valid MongoDB ObjectId'),
  
  body('student')
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId'),
  
  body('files')
    .optional()
    .isArray()
    .withMessage('Files must be an array'),
  
  body('files.*.fileName')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('File name cannot exceed 255 characters'),
  
  body('files.*.fileUrl')
    .optional()
    .isString()
    .trim()
    .withMessage('File URL must be a string'),
  
  body('files.*.fileSize')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('File size cannot be negative'),
  
  body('files.*.fileType')
    .optional()
    .isString()
    .trim()
    .withMessage('File type must be a string'),
  
  body('studentComments')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Student comments cannot exceed 1000 characters'),
  
  handleValidationErrors
];

/**
 * Submission update validation
 */
const validateSubmissionUpdate = [
  body('status')
    .optional()
    .isIn(['submitted', 'under_review', 'graded', 'returned', 'late', 'rejected'])
    .withMessage('Status must be one of: submitted, under_review, graded, returned, late, rejected'),
  
  body('grade')
    .optional()
    .isIn(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'Incomplete', 'Pass', 'Fail'])
    .withMessage('Invalid grade format'),
  
  body('numericalScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Numerical score must be between 0 and 100'),
  
  body('isLate')
    .optional()
    .isBoolean()
    .withMessage('isLate must be a boolean'),
  
  body('latePenalty')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Late penalty must be between 0 and 100'),
  
  body('criteriaScores')
    .optional()
    .isArray()
    .withMessage('Criteria scores must be an array'),
  
  body('criteriaScores.*.criterion')
    .optional()
    .isString()
    .trim()
    .withMessage('Criterion must be a string'),
  
  body('criteriaScores.*.maxPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max points cannot be negative'),
  
  body('criteriaScores.*.earnedPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Earned points cannot be negative'),
  
  body('criteriaScores.*.feedback')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Criteria feedback cannot exceed 500 characters'),
  
  body('feedback.general')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('General feedback cannot exceed 2000 characters'),
  
  body('feedback.strengths')
    .optional()
    .isArray()
    .withMessage('Strengths must be an array'),
  
  body('feedback.strengths.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Strength comment cannot exceed 200 characters'),
  
  body('feedback.improvements')
    .optional()
    .isArray()
    .withMessage('Improvements must be an array'),
  
  body('feedback.improvements.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Improvement comment cannot exceed 200 characters'),
  
  body('feedback.rubric')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Rubric feedback cannot exceed 1000 characters'),
  
  body('instructorNotes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Instructor notes cannot exceed 1000 characters'),
  
  handleValidationErrors
];

/**
 * Submission ID validation
 */
const validateSubmissionId = [
  param('id')
    .isMongoId()
    .withMessage('Submission ID must be a valid MongoDB ObjectId'),
  
  handleValidationErrors
];

/**
 * Submission query validation
 */
const validateSubmissionQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page number must be at least 1'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('assignment')
    .optional()
    .isMongoId()
    .withMessage('Assignment ID must be a valid MongoDB ObjectId'),
  
  query('student')
    .optional()
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId'),
  
  query('status')
    .optional()
    .isIn(['submitted', 'under_review', 'graded', 'returned', 'late', 'rejected'])
    .withMessage('Status must be one of: submitted, under_review, graded, returned, late, rejected'),
  
  query('grade')
    .optional()
    .isIn(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'Incomplete', 'Pass', 'Fail'])
    .withMessage('Invalid grade format'),
  
  query('isLate')
    .optional()
    .isBoolean()
    .withMessage('isLate must be a boolean'),
  
  query('plagiarismFlagged')
    .optional()
    .isBoolean()
    .withMessage('plagiarismFlagged must be a boolean'),
  
  query('sortBy')
    .optional()
    .isIn(['submittedAt', 'reviewedAt', 'numericalScore', 'grade', 'status'])
    .withMessage('Sort by must be one of: submittedAt, reviewedAt, numericalScore, grade, status'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
  
  query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  
  handleValidationErrors
];

/**
 * File upload validation
 */
const validateFileUpload = [
  body('fileName')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('File name cannot exceed 255 characters'),
  
  body('fileSize')
    .optional()
    .isFloat({ min: 0.001 })
    .withMessage('File size must be at least 0.001 bytes'),
  
  body('fileType')
    .optional()
    .isString()
    .trim()
    .withMessage('File type must be a string'),
  
  handleValidationErrors
];

/**
 * Grading validation
 */
const validateGrading = [
  body('grade')
    .isIn(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'Incomplete', 'Pass', 'Fail'])
    .withMessage('Invalid grade format'),
  
  body('numericalScore')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Numerical score must be between 0 and 100'),
  
  body('criteriaScores')
    .optional()
    .isArray()
    .withMessage('Criteria scores must be an array'),
  
  body('criteriaScores.*.criterion')
    .optional()
    .isString()
    .trim()
    .withMessage('Criterion must be a string'),
  
  body('criteriaScores.*.maxPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max points cannot be negative'),
  
  body('criteriaScores.*.earnedPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Earned points cannot be negative'),
  
  body('criteriaScores.*.feedback')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Criteria feedback cannot exceed 500 characters'),
  
  body('feedback')
    .optional()
    .isObject()
    .withMessage('Feedback must be an object'),
  
  handleValidationErrors
];

/**
 * Plagiarism check validation
 */
const validatePlagiarismCheck = [
  body('similarityScore')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Similarity score must be between 0 and 100'),
  
  body('reportUrl')
    .optional()
    .isString()
    .trim()
    .withMessage('Report URL must be a string'),
  
  handleValidationErrors
];

/**
 * Bulk operation validation
 */
const validateBulkOperation = [
  body('operation')
    .isIn(['grade', 'return', 'markLate', 'checkPlagiarism', 'verify', 'delete'])
    .withMessage('Operation must be one of: grade, return, markLate, checkPlagiarism, verify, delete'),
  
  body('submissionIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('Submission IDs must be an array with 1 to 100 items'),
  
  body('submissionIds.*')
    .isMongoId()
    .withMessage('Each submission ID must be a valid MongoDB ObjectId'),
  
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
  
  handleValidationErrors
];

module.exports = {
  validateSubmissionCreation,
  validateSubmissionUpdate,
  validateSubmissionId,
  validateSubmissionQuery,
  validateFileUpload,
  validateGrading,
  validatePlagiarismCheck,
  validateBulkOperation
}; 