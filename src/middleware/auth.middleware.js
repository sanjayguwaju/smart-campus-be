const { verifyToken, getTokenFromHeader } = require('../utils/jwt');
const User = require('../models/user.model');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Middleware to verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return ResponseHandler.unauthorized(res, 'Access token required');
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return ResponseHandler.unauthorized(res, 'Invalid or inactive user');
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return ResponseHandler.unauthorized(res, 'Invalid token');
  }
};

/**
 * Middleware to check if user has required role
 * @param {string|Array} roles - Required role(s)
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ResponseHandler.unauthorized(res, 'Authentication required');
    }

    const userRole = req.user.role;
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    if (!requiredRoles.includes(userRole)) {
      logger.warn(`User ${req.user.email} attempted to access restricted resource. Role: ${userRole}, Required: ${requiredRoles.join(', ')}`);
      return ResponseHandler.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = authorize('admin');

/**
 * Middleware to check if user is faculty
 */
const requireFaculty = authorize('faculty');

/**
 * Middleware to check if user is student
 */
const requireStudent = authorize('student');

/**
 * Middleware to check if user is faculty or admin
 */
const requireFacultyOrAdmin = authorize(['faculty', 'admin']);

/**
 * Middleware to check if user is student or faculty
 */
const requireStudentOrFaculty = authorize(['student', 'faculty']);

/**
 * Middleware to check if user can access their own resource or is admin
 */
const canAccessOwnResource = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return ResponseHandler.unauthorized(res, 'Authentication required');
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Users can only access their own resources
    if (req.user._id.toString() === resourceUserId) {
      return next();
    }

    logger.warn(`User ${req.user.email} attempted to access another user's resource`);
    return ResponseHandler.forbidden(res, 'Can only access your own resources');
  };
};

/**
 * Middleware to check if user can access course (enrolled student, instructor, or admin)
 */
const canAccessCourse = async (req, res, next) => {
  try {
    if (!req.user) {
      return ResponseHandler.unauthorized(res, 'Authentication required');
    }

    const courseId = req.params.courseId || req.body.courseId;
    if (!courseId) {
      return ResponseHandler.badRequest(res, 'Course ID required');
    }

    const Course = require('../models/course.model');
    const course = await Course.findById(courseId);
    
    if (!course) {
      return ResponseHandler.notFound(res, 'Course not found');
    }

    // Admin can access any course
    if (req.user.role === 'admin') {
      req.course = course;
      return next();
    }

    // Instructor can access their own courses
    if (req.user.role === 'faculty' && course.instructor.toString() === req.user._id.toString()) {
      req.course = course;
      return next();
    }

    // Student can access courses they're enrolled in
    if (req.user.role === 'student' && course.students.includes(req.user._id)) {
      req.course = course;
      return next();
    }

    logger.warn(`User ${req.user.email} attempted to access course ${courseId} without permission`);
    return ResponseHandler.forbidden(res, 'Access denied to this course');
  } catch (error) {
    logger.error('Course access check error:', error);
    return ResponseHandler.error(res, 500, 'Error checking course access');
  }
};

/**
 * Middleware to check if user can modify course (instructor or admin)
 */
const canModifyCourse = async (req, res, next) => {
  try {
    if (!req.user) {
      return ResponseHandler.unauthorized(res, 'Authentication required');
    }

    const courseId = req.params.courseId || req.body.courseId;
    if (!courseId) {
      return ResponseHandler.badRequest(res, 'Course ID required');
    }

    const Course = require('../models/course.model');
    const course = await Course.findById(courseId);
    
    if (!course) {
      return ResponseHandler.notFound(res, 'Course not found');
    }

    // Admin can modify any course
    if (req.user.role === 'admin') {
      req.course = course;
      return next();
    }

    // Instructor can only modify their own courses
    if (req.user.role === 'faculty' && course.instructor.toString() === req.user._id.toString()) {
      req.course = course;
      return next();
    }

    logger.warn(`User ${req.user.email} attempted to modify course ${courseId} without permission`);
    return ResponseHandler.forbidden(res, 'Only course instructor or admin can modify this course');
  } catch (error) {
    logger.error('Course modification check error:', error);
    return ResponseHandler.error(res, 500, 'Error checking course modification permissions');
  }
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireFaculty,
  requireStudent,
  requireFacultyOrAdmin,
  requireStudentOrFaculty,
  canAccessOwnResource,
  canAccessCourse,
  canModifyCourse
}; 