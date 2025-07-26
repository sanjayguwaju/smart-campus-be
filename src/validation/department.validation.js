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
    // Structured address fields
    address: Joi.object({
      street: Joi.string()
        .max(200)
        .optional()
        .trim()
        .messages({
          'string.max': 'Street address cannot exceed 200 characters'
        }),
      city: Joi.string()
        .max(100)
        .optional()
        .trim()
        .messages({
          'string.max': 'City cannot exceed 100 characters'
        }),
      state: Joi.string()
        .max(100)
        .optional()
        .trim()
        .messages({
          'string.max': 'State cannot exceed 100 characters'
        }),
      postalCode: Joi.string()
        .max(20)
        .optional()
        .trim()
        .messages({
          'string.max': 'Postal code cannot exceed 20 characters'
        }),
      country: Joi.string()
        .max(100)
        .optional()
        .trim()
        .default('Nepal')
        .messages({
          'string.max': 'Country cannot exceed 100 characters'
        })
    }).optional(),
    logo: Joi.string()
      .uri()
      .optional()
      .trim()
      .messages({
        'string.uri': 'Please provide a valid logo URL'
      }),
    status: Joi.string()
      .valid('active', 'inactive', 'archived')
      .default('active')
      .optional()
      .messages({
        'any.only': 'Status must be one of: active, inactive, archived'
      }),
    isActive: Joi.boolean()
      .default(false)
      .optional()
      .messages({
        'boolean.base': 'isActive must be a boolean'
      }),
    createdBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid created by user ID format'
      })
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
      .allow('')
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
    // Structured address fields
    address: Joi.object({
      street: Joi.string()
        .max(200)
        .optional()
        .trim()
        .messages({
          'string.max': 'Street address cannot exceed 200 characters'
        }),
      city: Joi.string()
        .max(100)
        .optional()
        .trim()
        .messages({
          'string.max': 'City cannot exceed 100 characters'
        }),
      state: Joi.string()
        .max(100)
        .optional()
        .trim()
        .messages({
          'string.max': 'State cannot exceed 100 characters'
        }),
      postalCode: Joi.string()
        .max(20)
        .optional()
        .trim()
        .messages({
          'string.max': 'Postal code cannot exceed 20 characters'
        }),
      country: Joi.string()
        .max(100)
        .optional()
        .trim()
        .messages({
          'string.max': 'Country cannot exceed 100 characters'
        })
    }).optional(),
    logo: Joi.string()
      .uri()
      .optional()
      .trim()
      .messages({
        'string.uri': 'Please provide a valid logo URL'
      }),
    status: Joi.string()
      .valid('active', 'inactive', 'archived')
      .optional()
      .messages({
        'any.only': 'Status must be one of: active, inactive, archived'
      }),
    isActive: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'isActive must be a boolean'
      }),
    lastModifiedBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid last modified by user ID format'
      })
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
    status: Joi.string()
      .valid('active', 'inactive', 'archived')
      .optional()
      .messages({
        'any.only': 'Status must be one of: active, inactive, archived'
      }),
    isActive: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'isActive must be a boolean'
      }),
    sortBy: Joi.string()
      .valid('name', 'code', 'status', 'isActive', 'createdAt', 'updatedAt')
      .default('name')
      .optional()
      .messages({
        'any.only': 'Sort by must be one of: name, code, status, isActive, createdAt, updatedAt'
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

/**
 * Validation schema for department status update
 */
const validateDepartmentStatusUpdate = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid('active', 'inactive', 'archived')
      .required()
      .messages({
        'any.only': 'Status must be one of: active, inactive, archived',
        'any.required': 'Status is required'
      }),
    lastModifiedBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid last modified by user ID format',
        'any.required': 'Last modified by user ID is required'
      })
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
 * Validation schema for department head assignment
 */
const validateDepartmentHeadAssignment = (req, res, next) => {
  const schema = Joi.object({
    lastModifiedBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid last modified by user ID format',
        'any.required': 'Last modified by user ID is required'
      })
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
 * Validation schema for department address update
 */
const validateDepartmentAddressUpdate = (req, res, next) => {
  const schema = Joi.object({
    address: Joi.object({
      street: Joi.string()
        .max(200)
        .optional()
        .trim()
        .messages({
          'string.max': 'Street address cannot exceed 200 characters'
        }),
      city: Joi.string()
        .max(100)
        .optional()
        .trim()
        .messages({
          'string.max': 'City cannot exceed 100 characters'
        }),
      state: Joi.string()
        .max(100)
        .optional()
        .trim()
        .messages({
          'string.max': 'State cannot exceed 100 characters'
        }),
      postalCode: Joi.string()
        .max(20)
        .optional()
        .trim()
        .messages({
          'string.max': 'Postal code cannot exceed 20 characters'
        }),
      country: Joi.string()
        .max(100)
        .optional()
        .trim()
        .messages({
          'string.max': 'Country cannot exceed 100 characters'
        })
    }).required().messages({
      'object.base': 'Address object is required'
    }),
    lastModifiedBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid last modified by user ID format',
        'any.required': 'Last modified by user ID is required'
      })
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
 * Validation schema for toggling department active status
 */
const validateDepartmentActiveToggle = (req, res, next) => {
  const schema = Joi.object({
    isActive: Joi.boolean()
      .required()
      .messages({
        'boolean.base': 'isActive must be a boolean',
        'any.required': 'isActive is required'
      }),
    lastModifiedBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid last modified by user ID format',
        'any.required': 'Last modified by user ID is required'
      })
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
 * Validation schema for bulk department operations
 */
const validateBulkDepartmentOperation = (req, res, next) => {
  const schema = Joi.object({
    departmentIds: Joi.array()
      .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
      .min(1)
      .max(100)
      .required()
      .messages({
        'array.base': 'Department IDs must be an array',
        'array.min': 'At least one department ID is required',
        'array.max': 'Cannot process more than 100 departments at once',
        'any.required': 'Department IDs are required'
      }),
    operation: Joi.string()
      .valid('activate', 'deactivate', 'archive', 'delete')
      .required()
      .messages({
        'any.only': 'Operation must be one of: activate, deactivate, archive, delete',
        'any.required': 'Operation is required'
      }),
    performedBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid performed by user ID format',
        'any.required': 'Performed by user ID is required'
      })
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

module.exports = {
  validateDepartmentCreation,
  validateDepartmentUpdate,
  validateDepartmentId,
  validateDepartmentQuery,
  validateDepartmentStatusUpdate,
  validateDepartmentHeadAssignment,
  validateDepartmentAddressUpdate,
  validateDepartmentActiveToggle,
  validateBulkDepartmentOperation
}; 