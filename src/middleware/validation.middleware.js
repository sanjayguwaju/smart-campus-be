const { validationResult } = require('express-validator');
const ResponseHandler = require('../utils/responseHandler');

/**
 * Middleware to validate request using express-validator
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return ResponseHandler.error(res, 400, 'Validation failed', errorMessages);
  }
  
  next();
};

module.exports = {
  validateRequest
}; 