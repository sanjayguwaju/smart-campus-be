const Joi = require('joi');

/**
 * Validation schema for creating a department
 */
const validateDepartmentCreation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .trim()
      .pattern(/^[a-zA-Z\s\-&]+$/)
      .messages({
        'string.empty': 'Department name is required',
        'string.min': 'Department name must be at least 2 characters long',
        'string.max': 'Department name cannot exceed 100 characters',
        'string.pattern.base': 'Department name can only contain letters, spaces, hyphens, and ampersands',
        'any.required': 'Department name is required'
      }),
    code: Joi.string()
      .min(2)
      .max(10)
      .optional()
      .trim()
      .pattern(/^[A-Z0-9]+$/)
      .messages({
        'string.pattern.base': 'Department code must contain only uppercase letters and numbers',
        'string.min': 'Department code must be at least 2 characters long',
        'string.max': 'Department code cannot exceed 10 characters'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .trim()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),
    headOfDepartment: Joi.string()
      .optional()
      .trim()
      .messages({
        'string.empty': 'Head of department cannot be empty'
      }),
    contactEmail: Joi.string()
      .email()
      .optional()
      .trim()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    contactPhone: Joi.string()
      .pattern(/^[\+]?[1-9][\d]{0,15}$/)
      .optional()
      .trim()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    location: Joi.string()
      .max(200)
      .optional()
      .trim()
      .messages({
        'string.max': 'Location cannot exceed 200 characters'
      }),
    isActive: Joi.boolean()
      .default(true)
      .optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

/**
 * Validation schema for updating a department
 */
const validateDepartmentUpdate = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .trim()
      .pattern(/^[a-zA-Z\s\-&]+$/)
      .messages({
        'string.empty': 'Department name cannot be empty',
        'string.min': 'Department name must be at least 2 characters long',
        'string.max': 'Department name cannot exceed 100 characters',
        'string.pattern.base': 'Department name can only contain letters, spaces, hyphens, and ampersands'
      }),
    code: Joi.string()
      .min(2)
      .max(10)
      .optional()
      .trim()
      .pattern(/^[A-Z0-9]+$/)
      .messages({
        'string.pattern.base': 'Department code must contain only uppercase letters and numbers',
        'string.min': 'Department code must be at least 2 characters long',
        'string.max': 'Department code cannot exceed 10 characters'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .trim()
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      }),
    headOfDepartment: Joi.string()
      .optional()
      .trim()
      .messages({
        'string.empty': 'Head of department cannot be empty'
      }),
    contactEmail: Joi.string()
      .email()
      .optional()
      .trim()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    contactPhone: Joi.string()
      .pattern(/^[\+]?[1-9][\d]{0,15}$/)
      .optional()
      .trim()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    location: Joi.string()
      .max(200)
      .optional()
      .trim()
      .messages({
        'string.max': 'Location cannot exceed 200 characters'
      }),
    isActive: Joi.boolean()
      .optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

/**
 * Validation schema for department ID parameter
 */
const validateDepartmentId = (req, res, next) => {
  const schema = Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid department ID format',
        'any.required': 'Department ID is required'
      })
  });

  const { error } = schema.validate({ id: req.params.id });
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

/**
 * Validation schema for department query parameters
 */
const validateDepartmentQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .optional()
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .optional()
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    search: Joi.string()
      .max(100)
      .optional()
      .trim()
      .messages({
        'string.max': 'Search term cannot exceed 100 characters'
      }),
    isActive: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'isActive must be a boolean'
      }),
    sortBy: Joi.string()
      .valid('name', 'code', 'createdAt', 'updatedAt')
      .default('name')
      .optional()
      .messages({
        'any.only': 'Sort by must be one of: name, code, createdAt, updatedAt'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('asc')
      .optional()
      .messages({
        'any.only': 'Sort order must be either asc or desc'
      })
  });

  const { error } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  next();
};

module.exports = {
  validateDepartmentCreation,
  validateDepartmentUpdate,
  validateDepartmentId,
  validateDepartmentQuery
}; 