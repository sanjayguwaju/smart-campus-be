const { body, param, query, validationResult } = require('express-validator');
const ResponseHandler = require('../utils/responseHandler');

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
 * Assignment creation validation
 */
const validateAssignmentCreation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Assignment title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  
  body('course')
    .isMongoId()
    .withMessage('Course ID must be a valid MongoDB ObjectId'),
  
  body('faculty')
    .isMongoId()
    .withMessage('Faculty ID must be a valid MongoDB ObjectId'),
  
  body('assignmentType')
    .optional()
    .isIn(['Homework', 'Project', 'Quiz', 'Exam', 'Lab', 'Presentation', 'Essay', 'Research'])
    .withMessage('Assignment type must be one of: Homework, Project, Quiz, Exam, Lab, Presentation, Essay, Research'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  
  body('extendedDueDate')
    .optional()
    .isISO8601()
    .withMessage('Extended due date must be a valid date')
    .custom((value, { req }) => {
      if (req.body.dueDate && new Date(value) <= new Date(req.body.dueDate)) {
        throw new Error('Extended due date must be after the original due date');
      }
      return true;
    }),
  
  body('totalPoints')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Total points must be between 1 and 1000'),
  
  body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard', 'Expert'])
    .withMessage('Difficulty must be one of: Easy, Medium, Hard, Expert'),
  
  body('estimatedTime')
    .optional()
    .isFloat({ min: 0.5, max: 100 })
    .withMessage('Estimated time must be between 0.5 and 100 hours'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'submission_closed', 'grading', 'completed', 'archived'])
    .withMessage('Status must be one of: draft, published, submission_closed, grading, completed, archived'),
  
  body('isVisible')
    .optional()
    .isBoolean()
    .withMessage('isVisible must be a boolean'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Tag cannot exceed 50 characters'),
  
  body('requirements.maxFileSize')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum file size must be at least 1 MB'),
  
  body('requirements.allowedFileTypes')
    .optional()
    .isArray()
    .withMessage('Allowed file types must be an array'),
  
  body('requirements.maxSubmissions')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Maximum submissions must be at least 1'),
  
  body('requirements.allowLateSubmission')
    .optional()
    .isBoolean()
    .withMessage('allowLateSubmission must be a boolean'),
  
  body('requirements.latePenalty')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Late penalty must be between 0 and 100'),
  
  body('gradingCriteria')
    .optional()
    .isArray()
    .withMessage('Grading criteria must be an array'),
  
  body('gradingCriteria.*.criterion')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Criterion name cannot exceed 100 characters'),
  
  body('gradingCriteria.*.maxPoints')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Points cannot be negative'),
  
  body('gradingCriteria.*.description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Criterion description cannot exceed 500 characters'),
  
  handleValidationErrors
];

/**
 * Assignment update validation
 */
const validateAssignmentUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  
  body('assignmentType')
    .optional()
    .isIn(['Homework', 'Project', 'Quiz', 'Exam', 'Lab', 'Presentation', 'Essay', 'Research'])
    .withMessage('Assignment type must be one of: Homework, Project, Quiz, Exam, Lab, Presentation, Essay, Research'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Due date must be in the future');
      }
      return true;
    }),
  
  body('extendedDueDate')
    .optional()
    .isISO8601()
    .withMessage('Extended due date must be a valid date'),
  
  body('totalPoints')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Total points must be between 1 and 1000'),
  
  body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard', 'Expert'])
    .withMessage('Difficulty must be one of: Easy, Medium, Hard, Expert'),
  
  body('estimatedTime')
    .optional()
    .isFloat({ min: 0.5, max: 100 })
    .withMessage('Estimated time must be between 0.5 and 100 hours'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'submission_closed', 'grading', 'completed', 'archived'])
    .withMessage('Status must be one of: draft, published, submission_closed, grading, completed, archived'),
  
  body('isVisible')
    .optional()
    .isBoolean()
    .withMessage('isVisible must be a boolean'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  handleValidationErrors
];

/**
 * Assignment ID validation
 */
const validateAssignmentId = [
  param('id')
    .isMongoId()
    .withMessage('Assignment ID must be a valid MongoDB ObjectId'),
  
  handleValidationErrors
];

/**
 * Assignment query validation
 */
const validateAssignmentQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page number must be at least 1'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('course')
    .optional()
    .isMongoId()
    .withMessage('Course ID must be a valid MongoDB ObjectId'),
  
  query('faculty')
    .optional()
    .isMongoId()
    .withMessage('Faculty ID must be a valid MongoDB ObjectId'),
  
  query('assignmentType')
    .optional()
    .isIn(['Homework', 'Project', 'Quiz', 'Exam', 'Lab', 'Presentation', 'Essay', 'Research'])
    .withMessage('Assignment type must be one of: Homework, Project, Quiz, Exam, Lab, Presentation, Essay, Research'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'submission_closed', 'grading', 'completed', 'archived'])
    .withMessage('Status must be one of: draft, published, submission_closed, grading, completed, archived'),
  
  query('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard', 'Expert'])
    .withMessage('Difficulty must be one of: Easy, Medium, Hard, Expert'),
  
  query('isVisible')
    .optional()
    .isBoolean()
    .withMessage('isVisible must be a boolean'),
  
  query('sortBy')
    .optional()
    .isIn(['title', 'dueDate', 'createdAt', 'totalPoints', 'difficulty', 'assignmentType'])
    .withMessage('Sort by must be one of: title, dueDate, createdAt, totalPoints, difficulty, assignmentType'),
  
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
    .isInt({ min: 1 })
    .withMessage('File size must be at least 1 byte'),
  
  body('fileType')
    .optional()
    .isString()
    .trim()
    .withMessage('File type must be a string'),
  
  handleValidationErrors
];

/**
 * Status update validation
 */
const validateStatusUpdate = [
  body('status')
    .isIn(['draft', 'published', 'submission_closed', 'grading', 'completed', 'archived'])
    .withMessage('Status must be one of: draft, published, submission_closed, grading, completed, archived'),
  
  handleValidationErrors
];

/**
 * Bulk operation validation
 */
const validateBulkOperation = [
  body('operation')
    .isIn(['publish', 'archive', 'delete', 'updateStatus'])
    .withMessage('Operation must be one of: publish, archive, delete, updateStatus'),
  
  body('assignmentIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('Assignment IDs must be an array with 1 to 100 items'),
  
  body('assignmentIds.*')
    .isMongoId()
    .withMessage('Each assignment ID must be a valid MongoDB ObjectId'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'submission_closed', 'grading', 'completed', 'archived'])
    .withMessage('Status must be one of: draft, published, submission_closed, grading, completed, archived')
    .custom((value, { req }) => {
      if (req.body.operation === 'updateStatus' && !value) {
        throw new Error('Status is required for updateStatus operation');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Legacy Joi schemas for reference (keeping for backward compatibility)
const Joi = require('joi');

// Validation for creating a new assignment
const createAssignmentSchema = Joi.object({
  title: Joi.string()
    .required()
    .trim()
    .max(200)
    .messages({
      'string.empty': 'Assignment title is required',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Assignment title is required'
    }),
  
  description: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  
  course: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.empty': 'Course ID is required',
      'string.pattern.base': 'Course ID must be a valid MongoDB ObjectId',
      'any.required': 'Course is required'
    }),
  
  faculty: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.empty': 'Faculty ID is required',
      'string.pattern.base': 'Faculty ID must be a valid MongoDB ObjectId',
      'any.required': 'Faculty is required'
    }),
  
  assignmentType: Joi.string()
    .valid('Homework', 'Project', 'Quiz', 'Exam', 'Lab', 'Presentation', 'Essay', 'Research')
    .default('Homework')
    .messages({
      'any.only': 'Assignment type must be one of: Homework, Project, Quiz, Exam, Lab, Presentation, Essay, Research'
    }),
  
  dueDate: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.greater': 'Due date must be in the future',
      'any.required': 'Due date is required'
    }),
  
  extendedDueDate: Joi.date()
    .greater(Joi.ref('dueDate'))
    .optional()
    .messages({
      'date.greater': 'Extended due date must be after the original due date'
    }),
  
  requirements: Joi.object({
    maxFileSize: Joi.number()
      .min(1)
      .default(10)
      .messages({
        'number.min': 'Maximum file size must be at least 1 MB'
      }),
    
    allowedFileTypes: Joi.array()
      .items(Joi.string().trim().lowercase())
      .optional(),
    
    maxSubmissions: Joi.number()
      .min(1)
      .default(1)
      .messages({
        'number.min': 'Maximum submissions must be at least 1'
      }),
    
    allowLateSubmission: Joi.boolean()
      .default(false),
    
    latePenalty: Joi.number()
      .min(0)
      .max(100)
      .default(0)
      .messages({
        'number.min': 'Late penalty cannot be negative',
        'number.max': 'Late penalty cannot exceed 100%'
      })
  }).optional(),
  
  gradingCriteria: Joi.array()
    .items(Joi.object({
      criterion: Joi.string()
        .required()
        .trim()
        .max(100)
        .messages({
          'string.empty': 'Criterion name is required',
          'string.max': 'Criterion name cannot exceed 100 characters',
          'any.required': 'Criterion name is required'
        }),
      
      maxPoints: Joi.number()
        .min(0)
        .required()
        .messages({
          'number.min': 'Points cannot be negative',
          'any.required': 'Maximum points is required'
        }),
      
      description: Joi.string()
        .trim()
        .max(500)
        .optional()
        .messages({
          'string.max': 'Criterion description cannot exceed 500 characters'
        })
    }))
    .optional(),
  
  totalPoints: Joi.number()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'number.min': 'Total points must be at least 1',
      'number.max': 'Total points cannot exceed 1000',
      'any.required': 'Total points is required'
    }),
  
  status: Joi.string()
    .valid('draft', 'published', 'submission_closed', 'grading', 'completed', 'archived')
    .default('draft')
    .messages({
      'any.only': 'Status must be one of: draft, published, submission_closed, grading, completed, archived'
    }),
  
  isVisible: Joi.boolean()
    .default(false),
  
  tags: Joi.array()
    .items(Joi.string().trim().lowercase().max(50))
    .optional()
    .messages({
      'string.max': 'Tag cannot exceed 50 characters'
    }),
  
  difficulty: Joi.string()
    .valid('Easy', 'Medium', 'Hard', 'Expert')
    .default('Medium')
    .messages({
      'any.only': 'Difficulty must be one of: Easy, Medium, Hard, Expert'
    }),
  
  estimatedTime: Joi.number()
    .min(0.5)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Estimated time must be at least 0.5 hours',
      'number.max': 'Estimated time cannot exceed 100 hours'
    })
});

// Validation for updating an assignment
const updateAssignmentSchema = Joi.object({
  title: Joi.string()
    .trim()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Title cannot exceed 200 characters'
    }),
  
  description: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  
  assignmentType: Joi.string()
    .valid('Homework', 'Project', 'Quiz', 'Exam', 'Lab', 'Presentation', 'Essay', 'Research')
    .optional()
    .messages({
      'any.only': 'Assignment type must be one of: Homework, Project, Quiz, Exam, Lab, Presentation, Essay, Research'
    }),
  
  dueDate: Joi.date()
    .greater('now')
    .optional()
    .messages({
      'date.greater': 'Due date must be in the future'
    }),
  
  extendedDueDate: Joi.date()
    .greater(Joi.ref('dueDate'))
    .optional()
    .messages({
      'date.greater': 'Extended due date must be after the original due date'
    }),
  
  requirements: Joi.object({
    maxFileSize: Joi.number()
      .min(1)
      .optional()
      .messages({
        'number.min': 'Maximum file size must be at least 1 MB'
      }),
    
    allowedFileTypes: Joi.array()
      .items(Joi.string().trim().lowercase())
      .optional(),
    
    maxSubmissions: Joi.number()
      .min(1)
      .optional()
      .messages({
        'number.min': 'Maximum submissions must be at least 1'
      }),
    
    allowLateSubmission: Joi.boolean()
      .optional(),
    
    latePenalty: Joi.number()
      .min(0)
      .max(100)
      .optional()
      .messages({
        'number.min': 'Late penalty cannot be negative',
        'number.max': 'Late penalty cannot exceed 100%'
      })
  }).optional(),
  
  gradingCriteria: Joi.array()
    .items(Joi.object({
      criterion: Joi.string()
        .required()
        .trim()
        .max(100)
        .messages({
          'string.empty': 'Criterion name is required',
          'string.max': 'Criterion name cannot exceed 100 characters',
          'any.required': 'Criterion name is required'
        }),
      
      maxPoints: Joi.number()
        .min(0)
        .required()
        .messages({
          'number.min': 'Points cannot be negative',
          'any.required': 'Maximum points is required'
        }),
      
      description: Joi.string()
        .trim()
        .max(500)
        .optional()
        .messages({
          'string.max': 'Criterion description cannot exceed 500 characters'
        })
    }))
    .optional(),
  
  totalPoints: Joi.number()
    .min(1)
    .max(1000)
    .optional()
    .messages({
      'number.min': 'Total points must be at least 1',
      'number.max': 'Total points cannot exceed 1000'
    }),
  
  status: Joi.string()
    .valid('draft', 'published', 'submission_closed', 'grading', 'completed', 'archived')
    .optional()
    .messages({
      'any.only': 'Status must be one of: draft, published, submission_closed, grading, completed, archived'
    }),
  
  isVisible: Joi.boolean()
    .optional(),
  
  tags: Joi.array()
    .items(Joi.string().trim().lowercase().max(50))
    .optional()
    .messages({
      'string.max': 'Tag cannot exceed 50 characters'
    }),
  
  difficulty: Joi.string()
    .valid('Easy', 'Medium', 'Hard', 'Expert')
    .optional()
    .messages({
      'any.only': 'Difficulty must be one of: Easy, Medium, Hard, Expert'
    }),
  
  estimatedTime: Joi.number()
    .min(0.5)
    .max(100)
    .optional()
    .messages({
      'number.min': 'Estimated time must be at least 0.5 hours',
      'number.max': 'Estimated time cannot exceed 100 hours'
    })
});

// Validation for assignment ID
const assignmentIdSchema = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.empty': 'Assignment ID is required',
      'string.pattern.base': 'Assignment ID must be a valid MongoDB ObjectId',
      'any.required': 'Assignment ID is required'
    })
});

// Validation for assignment query parameters
const assignmentQuerySchema = Joi.object({
  page: Joi.number()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page number must be at least 1'
    }),
  
  limit: Joi.number()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  course: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Course ID must be a valid MongoDB ObjectId'
    }),
  
  faculty: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Faculty ID must be a valid MongoDB ObjectId'
    }),
  
  assignmentType: Joi.string()
    .valid('Homework', 'Project', 'Quiz', 'Exam', 'Lab', 'Presentation', 'Essay', 'Research')
    .optional()
    .messages({
      'any.only': 'Assignment type must be one of: Homework, Project, Quiz, Exam, Lab, Presentation, Essay, Research'
    }),
  
  status: Joi.string()
    .valid('draft', 'published', 'submission_closed', 'grading', 'completed', 'archived')
    .optional()
    .messages({
      'any.only': 'Status must be one of: draft, published, submission_closed, grading, completed, archived'
    }),
  
  difficulty: Joi.string()
    .valid('Easy', 'Medium', 'Hard', 'Expert')
    .optional()
    .messages({
      'any.only': 'Difficulty must be one of: Easy, Medium, Hard, Expert'
    }),
  
  isVisible: Joi.boolean()
    .optional(),
  
  dueDateFrom: Joi.date()
    .optional()
    .messages({
      'date.base': 'Due date from must be a valid date'
    }),
  
  dueDateTo: Joi.date()
    .min(Joi.ref('dueDateFrom'))
    .optional()
    .messages({
      'date.min': 'Due date to must be after due date from',
      'date.base': 'Due date to must be a valid date'
    }),
  
  sortBy: Joi.string()
    .valid('title', 'dueDate', 'createdAt', 'totalPoints', 'difficulty', 'assignmentType')
    .default('dueDate')
    .messages({
      'any.only': 'Sort by must be one of: title, dueDate, createdAt, totalPoints, difficulty, assignmentType'
    }),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('asc')
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    }),
  
  search: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Search term cannot exceed 100 characters'
    }),
  
  tags: Joi.string()
    .trim()
    .optional()
});

// Validation for file upload
const fileUploadSchema = Joi.object({
  fileName: Joi.string()
    .required()
    .trim()
    .max(255)
    .messages({
      'string.empty': 'File name is required',
      'string.max': 'File name cannot exceed 255 characters',
      'any.required': 'File name is required'
    }),
  
  fileSize: Joi.number()
    .min(1)
    .required()
    .messages({
      'number.min': 'File size must be at least 1 byte',
      'any.required': 'File size is required'
    }),
  
  fileType: Joi.string()
    .trim()
    .optional()
});

// Validation for status update
const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('draft', 'published', 'submission_closed', 'grading', 'completed', 'archived')
    .required()
    .messages({
      'any.only': 'Status must be one of: draft, published, submission_closed, grading, completed, archived',
      'any.required': 'Status is required'
    })
});

// Validation for bulk operations
const bulkOperationSchema = Joi.object({
  operation: Joi.string()
    .valid('publish', 'archive', 'delete', 'updateStatus')
    .required()
    .messages({
      'any.only': 'Operation must be one of: publish, archive, delete, updateStatus',
      'any.required': 'Operation is required'
    }),
  
  assignmentIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.min': 'At least one assignment ID is required',
      'array.max': 'Cannot process more than 100 assignments at once',
      'any.required': 'Assignment IDs are required'
    }),
  
  status: Joi.string()
    .valid('draft', 'published', 'submission_closed', 'grading', 'completed', 'archived')
    .when('operation', {
      is: 'updateStatus',
      then: Joi.required(),
      otherwise: Joi.forbidden()
    })
    .messages({
      'any.only': 'Status must be one of: draft, published, submission_closed, grading, completed, archived',
      'any.required': 'Status is required for updateStatus operation',
      'any.forbidden': 'Status should not be provided for this operation'
    })
});

module.exports = {
  // Express-validator middleware functions
  validateAssignmentCreation,
  validateAssignmentUpdate,
  validateAssignmentId,
  validateAssignmentQuery,
  validateFileUpload,
  validateStatusUpdate,
  validateBulkOperation,
  
  // Legacy Joi schemas (for backward compatibility)
  createAssignmentSchema,
  updateAssignmentSchema,
  assignmentIdSchema,
  assignmentQuerySchema,
  fileUploadSchema,
  statusUpdateSchema,
  bulkOperationSchema
}; 