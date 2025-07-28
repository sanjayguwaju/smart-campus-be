const Joi = require('joi');

/**
 * Validation schema for enrollment creation
 */
const validateEnrollmentCreation = (req, res, next) => {
  const schema = Joi.object({
    student: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid student ID format',
        'any.required': 'Student ID is required'
      }),
    program: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid program ID format',
        'any.required': 'Program ID is required'
      }),
    semester: Joi.number()
      .integer()
      .min(1)
      .max(12)
      .required()
      .messages({
        'number.base': 'Semester must be a number',
        'number.integer': 'Semester must be an integer',
        'number.min': 'Semester must be at least 1',
        'number.max': 'Semester cannot exceed 12',
        'any.required': 'Semester is required'
      }),
    academicYear: Joi.string()
      .pattern(/^\d{4}-\d{4}$/)
      .required()
      .messages({
        'string.pattern.base': 'Academic year must be in format YYYY-YYYY',
        'any.required': 'Academic year is required'
      }),
    courses: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .messages({
            'string.pattern.base': 'Invalid course ID format'
          })
      )
      .optional()
      .messages({
        'array.base': 'Courses must be an array'
      }),
    status: Joi.string()
      .valid('active', 'completed', 'dropped', 'suspended', 'graduated')
      .default('active')
      .optional()
      .messages({
        'any.only': 'Status must be one of: active, completed, dropped, suspended, graduated'
      }),
    enrollmentType: Joi.string()
      .valid('full_time', 'part_time', 'audit', 'transfer')
      .default('full_time')
      .optional()
      .messages({
        'any.only': 'Enrollment type must be one of: full_time, part_time, audit, transfer'
      }),
    totalCredits: Joi.number()
      .min(0)
      .max(30)
      .default(0)
      .optional()
      .messages({
        'number.base': 'Total credits must be a number',
        'number.min': 'Total credits cannot be negative',
        'number.max': 'Total credits cannot exceed 30'
      }),
    gpa: Joi.number()
      .min(0.0)
      .max(4.0)
      .default(0.0)
      .optional()
      .messages({
        'number.base': 'GPA must be a number',
        'number.min': 'GPA cannot be negative',
        'number.max': 'GPA cannot exceed 4.0'
      }),
    cgpa: Joi.number()
      .min(0.0)
      .max(4.0)
      .default(0.0)
      .optional()
      .messages({
        'number.base': 'CGPA must be a number',
        'number.min': 'CGPA cannot be negative',
        'number.max': 'CGPA cannot exceed 4.0'
      }),
    academicStanding: Joi.string()
      .valid('good_standing', 'academic_warning', 'academic_probation', 'academic_suspension')
      .default('good_standing')
      .optional()
      .messages({
        'any.only': 'Academic standing must be one of: good_standing, academic_warning, academic_probation, academic_suspension'
      }),
    financialStatus: Joi.string()
      .valid('paid', 'partial', 'unpaid', 'scholarship')
      .default('unpaid')
      .optional()
      .messages({
        'any.only': 'Financial status must be one of: paid, partial, unpaid, scholarship'
      }),
    scholarship: Joi.object({
      type: Joi.string()
        .valid('merit', 'need_based', 'athletic', 'academic', 'other')
        .default('merit')
        .optional()
        .messages({
          'any.only': 'Scholarship type must be one of: merit, need_based, athletic, academic, other'
        }),
      amount: Joi.number()
        .min(0)
        .default(0)
        .optional()
        .messages({
          'number.base': 'Scholarship amount must be a number',
          'number.min': 'Scholarship amount cannot be negative'
        }),
      description: Joi.string()
        .max(500)
        .optional()
        .messages({
          'string.max': 'Scholarship description cannot exceed 500 characters'
        })
    }).optional(),
    advisor: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid advisor ID format'
      }),
    notes: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Notes cannot exceed 1000 characters'
      }),
    documents: Joi.array()
      .items(
        Joi.object({
          type: Joi.string()
            .valid('transcript', 'id_card', 'medical_form', 'financial_aid', 'other')
            .required()
            .messages({
              'any.only': 'Document type must be one of: transcript, id_card, medical_form, financial_aid, other',
              'any.required': 'Document type is required'
            }),
          fileName: Joi.string()
            .max(255)
            .required()
            .messages({
              'string.max': 'File name cannot exceed 255 characters',
              'any.required': 'File name is required'
            }),
          fileUrl: Joi.string()
            .uri()
            .required()
            .messages({
              'string.uri': 'File URL must be a valid URI',
              'any.required': 'File URL is required'
            }),
          fileSize: Joi.number()
            .min(0)
            .optional()
            .messages({
              'number.base': 'File size must be a number',
              'number.min': 'File size cannot be negative'
            })
        })
      )
      .optional()
      .messages({
        'array.base': 'Documents must be an array'
      }),
    createdBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid created by user ID format'
      }),
    lastModifiedBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid last modified by user ID format'
      }),
    auditTrail: Joi.array()
      .items(
        Joi.object({
          action: Joi.string()
            .valid('enrolled', 'course_added', 'course_dropped', 'status_changed', 'gpa_updated', 'document_uploaded')
            .required()
            .messages({
              'any.only': 'Action must be one of: enrolled, course_added, course_dropped, status_changed, gpa_updated, document_uploaded',
              'any.required': 'Action is required'
            }),
          timestamp: Joi.date()
            .default(Date.now)
            .optional()
            .messages({
              'date.base': 'Timestamp must be a valid date'
            }),
          performedBy: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              'string.pattern.base': 'Invalid performed by user ID format',
              'any.required': 'Performed by user ID is required'
            }),
          details: Joi.string()
            .max(500)
            .optional()
            .messages({
              'string.max': 'Details cannot exceed 500 characters'
            })
        })
      )
      .optional()
      .messages({
        'array.base': 'Audit trail must be an array'
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
 * Validation schema for enrollment updates
 */
const validateEnrollmentUpdate = (req, res, next) => {
  const schema = Joi.object({
    semester: Joi.number()
      .integer()
      .min(1)
      .max(12)
      .optional()
      .messages({
        'number.base': 'Semester must be a number',
        'number.integer': 'Semester must be an integer',
        'number.min': 'Semester must be at least 1',
        'number.max': 'Semester cannot exceed 12'
      }),
    academicYear: Joi.string()
      .pattern(/^\d{4}-\d{4}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Academic year must be in format YYYY-YYYY'
      }),
    courses: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .messages({
            'string.pattern.base': 'Invalid course ID format'
          })
      )
      .optional()
      .messages({
        'array.base': 'Courses must be an array'
      }),
    status: Joi.string()
      .valid('active', 'completed', 'dropped', 'suspended', 'graduated')
      .optional()
      .messages({
        'any.only': 'Status must be one of: active, completed, dropped, suspended, graduated'
      }),
    enrollmentType: Joi.string()
      .valid('full_time', 'part_time', 'audit', 'transfer')
      .optional()
      .messages({
        'any.only': 'Enrollment type must be one of: full_time, part_time, audit, transfer'
      }),
    totalCredits: Joi.number()
      .min(0)
      .max(30)
      .optional()
      .messages({
        'number.base': 'Total credits must be a number',
        'number.min': 'Total credits cannot be negative',
        'number.max': 'Total credits cannot exceed 30'
      }),
    gpa: Joi.number()
      .min(0.0)
      .max(4.0)
      .optional()
      .messages({
        'number.base': 'GPA must be a number',
        'number.min': 'GPA cannot be negative',
        'number.max': 'GPA cannot exceed 4.0'
      }),
    cgpa: Joi.number()
      .min(0.0)
      .max(4.0)
      .optional()
      .messages({
        'number.base': 'CGPA must be a number',
        'number.min': 'CGPA cannot be negative',
        'number.max': 'CGPA cannot exceed 4.0'
      }),
    academicStanding: Joi.string()
      .valid('good_standing', 'academic_warning', 'academic_probation', 'academic_suspension')
      .optional()
      .messages({
        'any.only': 'Academic standing must be one of: good_standing, academic_warning, academic_probation, academic_suspension'
      }),
    financialStatus: Joi.string()
      .valid('paid', 'partial', 'unpaid', 'scholarship')
      .optional()
      .messages({
        'any.only': 'Financial status must be one of: paid, partial, unpaid, scholarship'
      }),
    scholarship: Joi.object({
      type: Joi.string()
        .valid('merit', 'need_based', 'athletic', 'academic', 'other')
        .optional()
        .messages({
          'any.only': 'Scholarship type must be one of: merit, need_based, athletic, academic, other'
        }),
      amount: Joi.number()
        .min(0)
        .optional()
        .messages({
          'number.base': 'Scholarship amount must be a number',
          'number.min': 'Scholarship amount cannot be negative'
        }),
      description: Joi.string()
        .max(500)
        .optional()
        .messages({
          'string.max': 'Scholarship description cannot exceed 500 characters'
        })
    }).optional(),
    advisor: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid advisor ID format'
      }),
    notes: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Notes cannot exceed 1000 characters'
      }),
    lastModifiedBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid last modified by user ID format'
      }),
    auditTrail: Joi.array()
      .items(
        Joi.object({
          action: Joi.string()
            .valid('enrolled', 'course_added', 'course_dropped', 'status_changed', 'gpa_updated', 'document_uploaded')
            .required()
            .messages({
              'any.only': 'Action must be one of: enrolled, course_added, course_dropped, status_changed, gpa_updated, document_uploaded',
              'any.required': 'Action is required'
            }),
          timestamp: Joi.date()
            .default(Date.now)
            .optional()
            .messages({
              'date.base': 'Timestamp must be a valid date'
            }),
          performedBy: Joi.string()
            .pattern(/^[0-9a-fA-F]{24}$/)
            .required()
            .messages({
              'string.pattern.base': 'Invalid performed by user ID format',
              'any.required': 'Performed by user ID is required'
            }),
          details: Joi.string()
            .max(500)
            .optional()
            .messages({
              'string.max': 'Details cannot exceed 500 characters'
            })
        })
      )
      .optional()
      .messages({
        'array.base': 'Audit trail must be an array'
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
 * Validation schema for enrollment ID
 */
const validateEnrollmentId = (req, res, next) => {
  const schema = Joi.object({
    id: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid enrollment ID format',
        'any.required': 'Enrollment ID is required'
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
 * Validation schema for enrollment queries
 */
const validateEnrollmentQuery = (req, res, next) => {
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
      .messages({
        'string.max': 'Search term cannot exceed 100 characters'
      }),
    student: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid student ID format'
      }),
    program: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid program ID format'
      }),
    semester: Joi.number()
      .integer()
      .min(1)
      .max(12)
      .optional()
      .messages({
        'number.base': 'Semester must be a number',
        'number.integer': 'Semester must be an integer',
        'number.min': 'Semester must be at least 1',
        'number.max': 'Semester cannot exceed 12'
      }),
    academicYear: Joi.string()
      .pattern(/^\d{4}-\d{4}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Academic year must be in format YYYY-YYYY'
      }),
    status: Joi.string()
      .valid('active', 'completed', 'dropped', 'suspended', 'graduated')
      .optional()
      .messages({
        'any.only': 'Status must be one of: active, completed, dropped, suspended, graduated'
      }),
    enrollmentType: Joi.string()
      .valid('full_time', 'part_time', 'audit', 'transfer')
      .optional()
      .messages({
        'any.only': 'Enrollment type must be one of: full_time, part_time, audit, transfer'
      }),
    academicStanding: Joi.string()
      .valid('good_standing', 'academic_warning', 'academic_probation', 'academic_suspension')
      .optional()
      .messages({
        'any.only': 'Academic standing must be one of: good_standing, academic_warning, academic_probation, academic_suspension'
      }),
    financialStatus: Joi.string()
      .valid('paid', 'partial', 'unpaid', 'scholarship')
      .optional()
      .messages({
        'any.only': 'Financial status must be one of: paid, partial, unpaid, scholarship'
      }),
    advisor: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Invalid advisor ID format'
      }),
    sortBy: Joi.string()
      .valid('enrolledAt', 'semester', 'academicYear', 'status', 'gpa', 'totalCredits', 'student', 'program', 'createdAt', 'updatedAt')
      .default('enrolledAt')
      .optional()
      .messages({
        'any.only': 'Sort by must be one of: enrolledAt, semester, academicYear, status, gpa, totalCredits, student, program, createdAt, updatedAt'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
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
 * Validation schema for course enrollment
 */
const validateCourseEnrollment = (req, res, next) => {
  const schema = Joi.object({
    courseId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid course ID format',
        'any.required': 'Course ID is required'
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
 * Validation schema for enrollment status update
 */
const validateEnrollmentStatusUpdate = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid('active', 'completed', 'dropped', 'suspended', 'graduated')
      .required()
      .messages({
        'any.only': 'Status must be one of: active, completed, dropped, suspended, graduated',
        'any.required': 'Status is required'
      }),
    lastModifiedBy: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid last modified by user ID format',
        'any.required': 'Last modified by user ID is required'
      }),
    details: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Details cannot exceed 500 characters'
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
 * Validation schema for GPA update
 */
const validateGPAUpdate = (req, res, next) => {
  const schema = Joi.object({
    gpa: Joi.number()
      .min(0.0)
      .max(4.0)
      .required()
      .messages({
        'number.base': 'GPA must be a number',
        'number.min': 'GPA cannot be negative',
        'number.max': 'GPA cannot exceed 4.0',
        'any.required': 'GPA is required'
      }),
    cgpa: Joi.number()
      .min(0.0)
      .max(4.0)
      .optional()
      .messages({
        'number.base': 'CGPA must be a number',
        'number.min': 'CGPA cannot be negative',
        'number.max': 'CGPA cannot exceed 4.0'
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
 * Validation schema for document upload
 */
const validateDocumentUpload = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string()
      .valid('transcript', 'id_card', 'medical_form', 'financial_aid', 'other')
      .required()
      .messages({
        'any.only': 'Document type must be one of: transcript, id_card, medical_form, financial_aid, other',
        'any.required': 'Document type is required'
      }),
    fileName: Joi.string()
      .max(255)
      .required()
      .messages({
        'string.max': 'File name cannot exceed 255 characters',
        'any.required': 'File name is required'
      }),
    fileUrl: Joi.string()
      .uri()
      .required()
      .messages({
        'string.uri': 'File URL must be a valid URI',
        'any.required': 'File URL is required'
      }),
    fileSize: Joi.number()
      .min(0)
      .optional()
      .messages({
        'number.base': 'File size must be a number',
        'number.min': 'File size cannot be negative'
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
 * Validation schema for bulk enrollment operations
 */
const validateBulkEnrollmentOperation = (req, res, next) => {
  const schema = Joi.object({
    enrollmentIds: Joi.array()
      .items(
        Joi.string()
          .pattern(/^[0-9a-fA-F]{24}$/)
          .messages({
            'string.pattern.base': 'Invalid enrollment ID format'
          })
      )
      .min(1)
      .required()
      .messages({
        'array.base': 'Enrollment IDs must be an array',
        'array.min': 'At least one enrollment ID is required',
        'any.required': 'Enrollment IDs are required'
      }),
    operation: Joi.string()
      .valid('activate', 'suspend', 'complete', 'drop', 'update_status', 'update_gpa')
      .required()
      .messages({
        'any.only': 'Operation must be one of: activate, suspend, complete, drop, update_status, update_gpa',
        'any.required': 'Operation is required'
      }),
    data: Joi.object().optional(),
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

module.exports = {
  validateEnrollmentCreation,
  validateEnrollmentUpdate,
  validateEnrollmentId,
  validateEnrollmentQuery,
  validateCourseEnrollment,
  validateEnrollmentStatusUpdate,
  validateGPAUpdate,
  validateDocumentUpload,
  validateBulkEnrollmentOperation
}; 