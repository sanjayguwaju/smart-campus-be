/**
 * Standardized response handler for consistent API responses
 */
class ResponseHandler {
  // Common HTTP status codes for better performance
  static STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
  };

  /**
   * Create base response structure
   * @private
   */
  static _createBaseResponse(success, message) {
    return {
      success,
      message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Success response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Success message
   * @param {*} data - Response data
   * @param {Object} pagination - Pagination info (optional)
   */
  static success(res, statusCode = this.STATUS_CODES.OK, message = 'Success', data = null, pagination = null) {
    const response = {
      ...this._createBaseResponse(true, message),
      ...(data && { data }),
      ...(pagination && { pagination })
    };
    return res.header('Content-Type', 'application/json').status(statusCode).json(response);
  }

  /**
   * Error response
   * @param {Object} res - Express response object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {*} error - Error details
   */
  static error(res, statusCode = this.STATUS_CODES.INTERNAL_SERVER_ERROR, message = 'Internal Server Error', error = null) {
    const response = {
      ...this._createBaseResponse(false, message),
      ...(error && { error })
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors array
   */
  static validationError(res, errors) {
    return this.error(res, this.STATUS_CODES.BAD_REQUEST, 'Validation Error', errors);
  }

  /**
   * Not found response
   * @param {Object} res - Express response object
   * @param {string} message - Not found message
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, this.STATUS_CODES.NOT_FOUND, message);
  }

  /**
   * Unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Unauthorized message
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, this.STATUS_CODES.UNAUTHORIZED, message);
  }

  /**
   * Forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Forbidden message
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, this.STATUS_CODES.FORBIDDEN, message);
  }

  /**
   * Bad request response
   * @param {Object} res - Express response object
   * @param {string} message - Bad request message
   */
  static badRequest(res, message = 'Bad Request') {
    return this.error(res, this.STATUS_CODES.BAD_REQUEST, message);
  }

  /**
   * Conflict response
   * @param {Object} res - Express response object
   * @param {string} message - Conflict message
   */
  static conflict(res, message = 'Conflict') {
    return this.error(res, this.STATUS_CODES.CONFLICT, message);
  }

  /**
   * Created response (201)
   * @param {Object} res - Express response object
   * @param {string} message - Created message
   * @param {*} data - Response data
   */
  static created(res, message = 'Resource created successfully', data = null) {
    return this.success(res, this.STATUS_CODES.CREATED, message, data);
  }

  /**
   * No content response (204)
   * @param {Object} res - Express response object
   */
  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ResponseHandler; 