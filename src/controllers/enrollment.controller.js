const enrollmentService = require('../services/enrollment.service');
const { handleResponse, handleError } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Create a new enrollment
 * @route POST /api/enrollments
 * @access Private (Admin, Faculty)
 */
const createEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.createEnrollment(req.body, req.user._id);
    return handleResponse(res, 201, result);
  } catch (error) {
    logger.error('Error in createEnrollment controller:', error);
    return handleError(res, error);
  }
};

/**
 * Get all enrollments with pagination and filtering
 * @route GET /api/enrollments
 * @access Private (Admin, Faculty, Student)
 */
const getEnrollments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      student,
      program,
      semester,
      semesterTerm,
      academicYear,
      status,
      enrollmentType,
      academicStanding,
      financialStatus,
      advisor,
      sortBy = 'enrolledAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = { 
      search, 
      student, 
      program, 
      semester, 
      semesterTerm,
      academicYear,
      status, 
      enrollmentType,
      academicStanding,
      financialStatus,
      advisor 
    };
    const pagination = { page, limit, sortBy, sortOrder };

    const result = await enrollmentService.getEnrollments(filters, pagination);
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in getEnrollments controller:', error);
    return handleError(res, error);
  }
};

/**
 * Get enrollment by ID
 * @route GET /api/enrollments/:id
 * @access Private (Admin, Faculty, Student)
 */
const getEnrollmentById = async (req, res) => {
  try {
    const result = await enrollmentService.getEnrollmentById(req.params.id);
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in getEnrollmentById controller:', error);
    return handleError(res, error);
  }
};

/**
 * Update enrollment
 * @route PUT /api/enrollments/:id
 * @access Private (Admin, Faculty)
 */
const updateEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.updateEnrollment(
      req.params.id, 
      req.body, 
      req.user._id
    );
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in updateEnrollment controller:', error);
    return handleError(res, error);
  }
};

/**
 * Delete enrollment
 * @route DELETE /api/enrollments/:id
 * @access Private (Admin)
 */
const deleteEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.deleteEnrollment(req.params.id, req.user._id);
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in deleteEnrollment controller:', error);
    return handleError(res, error);
  }
};

/**
 * Add course to enrollment
 * @route POST /api/enrollments/:id/courses
 * @access Private (Admin, Faculty)
 */
const addCourseToEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.addCourseToEnrollment(
      req.params.id,
      req.body.courseId,
      req.user._id
    );
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in addCourseToEnrollment controller:', error);
    return handleError(res, error);
  }
};

/**
 * Remove course from enrollment
 * @route DELETE /api/enrollments/:id/courses/:courseId
 * @access Private (Admin, Faculty)
 */
const removeCourseFromEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.removeCourseFromEnrollment(
      req.params.id,
      req.params.courseId,
      req.user._id
    );
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in removeCourseFromEnrollment controller:', error);
    return handleError(res, error);
  }
};

/**
 * Update enrollment status
 * @route PATCH /api/enrollments/:id/status
 * @access Private (Admin, Faculty)
 */
const updateEnrollmentStatus = async (req, res) => {
  try {
    const result = await enrollmentService.updateEnrollmentStatus(
      req.params.id,
      req.body.status,
      req.user._id,
      req.body.details
    );
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in updateEnrollmentStatus controller:', error);
    return handleError(res, error);
  }
};

/**
 * Update GPA
 * @route PATCH /api/enrollments/:id/gpa
 * @access Private (Admin, Faculty)
 */
const updateGPA = async (req, res) => {
  try {
    const result = await enrollmentService.updateGPA(
      req.params.id,
      req.body.gpa,
      req.body.cgpa,
      req.user._id
    );
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in updateGPA controller:', error);
    return handleError(res, error);
  }
};

/**
 * Add document to enrollment
 * @route POST /api/enrollments/:id/documents
 * @access Private (Admin, Faculty, Student)
 */
const addDocumentToEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.addDocumentToEnrollment(
      req.params.id,
      req.body,
      req.user._id
    );
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in addDocumentToEnrollment controller:', error);
    return handleError(res, error);
  }
};

/**
 * Remove document from enrollment
 * @route DELETE /api/enrollments/:id/documents/:documentId
 * @access Private (Admin, Faculty)
 */
const removeDocumentFromEnrollment = async (req, res) => {
  try {
    const result = await enrollmentService.removeDocumentFromEnrollment(
      req.params.id,
      req.params.documentId,
      req.user._id
    );
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in removeDocumentFromEnrollment controller:', error);
    return handleError(res, error);
  }
};

/**
 * Get enrollments by student
 * @route GET /api/enrollments/student/:studentId
 * @access Private (Admin, Faculty, Student)
 */
const getEnrollmentsByStudent = async (req, res) => {
  try {
    const result = await enrollmentService.getEnrollmentsByStudent(req.params.studentId);
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in getEnrollmentsByStudent controller:', error);
    return handleError(res, error);
  }
};

/**
 * Get enrollments by program
 * @route GET /api/enrollments/program/:programId
 * @access Private (Admin, Faculty)
 */
const getEnrollmentsByProgram = async (req, res) => {
  try {
    const result = await enrollmentService.getEnrollmentsByProgram(req.params.programId);
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in getEnrollmentsByProgram controller:', error);
    return handleError(res, error);
  }
};

/**
 * Get enrollment statistics
 * @route GET /api/enrollments/stats
 * @access Private (Admin, Faculty)
 */
const getEnrollmentStats = async (req, res) => {
  try {
    const result = await enrollmentService.getEnrollmentStats();
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in getEnrollmentStats controller:', error);
    return handleError(res, error);
  }
};

/**
 * Bulk operations on enrollments
 * @route POST /api/enrollments/bulk
 * @access Private (Admin)
 */
const bulkEnrollmentOperation = async (req, res) => {
  try {
    const { enrollmentIds, operation, data } = req.body;
    const result = await enrollmentService.bulkEnrollmentOperation(
      operation,
      enrollmentIds,
      data,
      req.user._id
    );
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in bulkEnrollmentOperation controller:', error);
    return handleError(res, error);
  }
};

/**
 * Get current user's enrollments (for students)
 * @route GET /api/enrollments/my-enrollments
 * @access Private (Student)
 */
const getMyEnrollments = async (req, res) => {
  try {
    const result = await enrollmentService.getEnrollmentsByStudent(req.user._id);
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in getMyEnrollments controller:', error);
    return handleError(res, error);
  }
};

/**
 * Get enrollments by advisor (for faculty)
 * @route GET /api/enrollments/my-advisees
 * @access Private (Faculty)
 */
const getMyAdvisees = async (req, res) => {
  try {
    const result = await enrollmentService.getEnrollments({ advisor: req.user._id });
    return handleResponse(res, 200, result);
  } catch (error) {
    logger.error('Error in getMyAdvisees controller:', error);
    return handleError(res, error);
  }
};

module.exports = {
  createEnrollment,
  getEnrollments,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
  addCourseToEnrollment,
  removeCourseFromEnrollment,
  updateEnrollmentStatus,
  updateGPA,
  addDocumentToEnrollment,
  removeDocumentFromEnrollment,
  getEnrollmentsByStudent,
  getEnrollmentsByProgram,
  getEnrollmentStats,
  bulkEnrollmentOperation,
  getMyEnrollments,
  getMyAdvisees
}; 