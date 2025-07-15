const logger = require('./logger');

class ErrorHandler {
  static errorTypes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    CONFLICT_ERROR: 'CONFLICT_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  };

  /**
   * Create a custom error with type and context
   * @param {string} message - Error message
   * @param {string} type - Error type
   * @param {number} statusCode - HTTP status code
   * @param {Object} context - Additional context
   * @returns {Error} Custom error object
   */
  static createError(message, type = this.errorTypes.UNKNOWN_ERROR, statusCode = 500, context = {}) {
    const error = new Error(message);
    error.type = type;
    error.statusCode = statusCode;
    error.context = context;
    error.timestamp = new Date().toISOString();
    return error;
  }

  /**
   * Handle and categorize errors
   * @param {Error} error - Error object
   * @param {Object} req - Express request object
   * @returns {Object} Formatted error response
   */
  static handleError(error, req = {}) {
    let errorResponse = {
      success: false,
      message: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      type: this.errorTypes.UNKNOWN_ERROR,
      statusCode: 500
    };

    // Categorize error based on type or properties
    if (error.type) {
      errorResponse.type = error.type;
      errorResponse.statusCode = error.statusCode || 500;
      errorResponse.message = error.message;
    } else if (error.name === 'ValidationError') {
      errorResponse.type = this.errorTypes.VALIDATION_ERROR;
      errorResponse.statusCode = 400;
      errorResponse.message = 'Validation failed';
      errorResponse.details = this.formatValidationErrors(error);
    } else if (error.name === 'CastError') {
      errorResponse.type = this.errorTypes.NOT_FOUND_ERROR;
      errorResponse.statusCode = 404;
      errorResponse.message = 'Resource not found';
    } else if (error.code === 11000) {
      errorResponse.type = this.errorTypes.CONFLICT_ERROR;
      errorResponse.statusCode = 409;
      errorResponse.message = 'Resource already exists';
      errorResponse.details = this.formatDuplicateKeyError(error);
    } else if (error.name === 'JsonWebTokenError') {
      errorResponse.type = this.errorTypes.AUTHENTICATION_ERROR;
      errorResponse.statusCode = 401;
      errorResponse.message = 'Invalid token';
    } else if (error.name === 'TokenExpiredError') {
      errorResponse.type = this.errorTypes.AUTHENTICATION_ERROR;
      errorResponse.statusCode = 401;
      errorResponse.message = 'Token expired';
    } else if (error.message) {
      errorResponse.message = error.message;
    }

    // Add context if available
    if (error.context) {
      errorResponse.context = error.context;
    }

    // Add request context in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
      errorResponse.requestInfo = {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };
    }

    return errorResponse;
  }

  /**
   * Format validation errors
   * @param {Error} error - Validation error
   * @returns {Array} Formatted validation errors
   */
  static formatValidationErrors(error) {
    if (error.errors) {
      return Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
    }
    return [];
  }

  /**
   * Format duplicate key error
   * @param {Error} error - Duplicate key error
   * @returns {Object} Formatted duplicate key error
   */
  static formatDuplicateKeyError(error) {
    const field = Object.keys(error.keyValue)[0];
    return {
      field,
      value: error.keyValue[field],
      message: `${field} already exists`
    };
  }

  /**
   * Log error with context
   * @param {Error} error - Error object
   * @param {Object} req - Express request object
   */
  static logError(error, req = {}) {
    const logData = {
      error: {
        message: error.message,
        type: error.type || 'UNKNOWN',
        stack: error.stack
      },
      request: {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || 'anonymous'
      },
      timestamp: new Date().toISOString()
    };

    // Log based on error type
    if (error.type === this.errorTypes.VALIDATION_ERROR) {
      logger.warn('Validation error:', logData);
    } else if (error.type === this.errorTypes.AUTHENTICATION_ERROR) {
      logger.warn('Authentication error:', logData);
    } else if (error.type === this.errorTypes.AUTHORIZATION_ERROR) {
      logger.warn('Authorization error:', logData);
    } else if (error.statusCode >= 500) {
      logger.error('Server error:', logData);
    } else {
      logger.warn('Client error:', logData);
    }
  }

  /**
   * Handle async errors
   * @param {Function} fn - Async function
   * @returns {Function} Wrapped function with error handling
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Handle specific error types
   * @param {Error} error - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static handleSpecificError(error, req, res, next) {
    // Log the error
    this.logError(error, req);

    // Handle specific error types
    switch (error.type) {
      case this.errorTypes.VALIDATION_ERROR:
        return res.status(400).json(this.handleError(error, req));
      
      case this.errorTypes.AUTHENTICATION_ERROR:
        return res.status(401).json(this.handleError(error, req));
      
      case this.errorTypes.AUTHORIZATION_ERROR:
        return res.status(403).json(this.handleError(error, req));
      
      case this.errorTypes.NOT_FOUND_ERROR:
        return res.status(404).json(this.handleError(error, req));
      
      case this.errorTypes.CONFLICT_ERROR:
        return res.status(409).json(this.handleError(error, req));
      
      case this.errorTypes.RATE_LIMIT_ERROR:
        return res.status(429).json(this.handleError(error, req));
      
      case this.errorTypes.DATABASE_ERROR:
        return res.status(503).json(this.handleError(error, req));
      
      default:
        return res.status(500).json(this.handleError(error, req));
    }
  }
}

module.exports = ErrorHandler; 