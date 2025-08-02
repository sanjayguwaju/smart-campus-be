const assignmentService = require('../services/assignment.service');
const { ResponseHandler } = require('../utils/responseHandler');
const logger = require('../utils/logger');

class AssignmentController {
  /**
   * Create a new assignment
   */
  async createAssignment(req, res) {
    try {
      const assignmentData = req.body;
      const userId = req.user._id;

      const assignment = await assignmentService.createAssignment(assignmentData, userId);

      return ResponseHandler.created(res, 'Assignment created successfully', assignment);
    } catch (error) {
      logger.error('Error in createAssignment controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Create assignment for faculty-assigned courses
   */
  async createAssignmentForFacultyCourse(req, res) {
    try {
      const assignmentData = req.body;
      const facultyId = req.user._id;

      const assignment = await assignmentService.createAssignmentForFacultyCourse(assignmentData, facultyId);

      return ResponseHandler.created(res, 'Assignment created successfully for your assigned course', assignment);
    } catch (error) {
      logger.error('Error in createAssignmentForFacultyCourse controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get assignments with filtering and pagination
   */
  async getAssignments(req, res) {
    try {
      const query = req.query;
      const user = req.user;

      const result = await assignmentService.getAssignments(query, user);

      return ResponseHandler.success(res, 200, 'Assignments retrieved successfully', result.data, result.pagination);
    } catch (error) {
      logger.error('Error in getAssignments controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get assignment by ID
   */
  async getAssignmentById(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const assignment = await assignmentService.getAssignmentById(id, user);

      return ResponseHandler.success(res, 200, 'Assignment retrieved successfully', assignment);
    } catch (error) {
      logger.error('Error in getAssignmentById controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Update assignment
   */
  async updateAssignment(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user._id;

      const assignment = await assignmentService.updateAssignment(id, updateData, userId);

      return ResponseHandler.success(res, 200, 'Assignment updated successfully', assignment);
    } catch (error) {
      logger.error('Error in updateAssignment controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Delete assignment
   */
  async deleteAssignment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const result = await assignmentService.deleteAssignment(id, userId);

      return ResponseHandler.success(res, 200, result.message);
    } catch (error) {
      logger.error('Error in deleteAssignment controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Add file to assignment
   */
  async addFileToAssignment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      
      // Handle file upload
      const fileData = {
        fileName: req.file ? req.file.originalname : req.body.fileName,
        fileSize: req.file ? req.file.size : req.body.fileSize,
        fileType: req.file ? req.file.mimetype : req.body.fileType,
        fileBuffer: req.file ? req.file.buffer : null,
        fileUrl: req.body.fileUrl
      };

      const assignment = await assignmentService.addFileToAssignment(id, fileData, userId);

      return ResponseHandler.success(res, 200, 'File added to assignment successfully', assignment);
    } catch (error) {
      logger.error('Error in addFileToAssignment controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Remove file from assignment
   */
  async removeFileFromAssignment(req, res) {
    try {
      const { id } = req.params;
      const { fileUrl } = req.body;
      const userId = req.user._id;

      const assignment = await assignmentService.removeFileFromAssignment(id, fileUrl, userId);

      return ResponseHandler.success(res, 200, 'File removed from assignment successfully', assignment);
    } catch (error) {
      logger.error('Error in removeFileFromAssignment controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user._id;

      const assignment = await assignmentService.updateAssignmentStatus(id, status, userId);

      return ResponseHandler.success(res, 200, 'Assignment status updated successfully', assignment);
    } catch (error) {
      logger.error('Error in updateAssignmentStatus controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get assignments by course
   */
  async getAssignmentsByCourse(req, res) {
    try {
      const { courseId } = req.params;
      const user = req.user;

      const assignments = await assignmentService.getAssignmentsByCourse(courseId, user);

      return ResponseHandler.success(res, 200, 'Course assignments retrieved successfully', assignments);
    } catch (error) {
      logger.error('Error in getAssignmentsByCourse controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get assignments by faculty
   */
  async getAssignmentsByFaculty(req, res) {
    try {
      const { facultyId } = req.params;
      const user = req.user;
      
      // Extract query parameters for search and pagination
      const {
        search,
        status,
        assignmentType,
        difficulty,
        page = 1,
        limit = 10,
        sortBy = 'dueDate',
        sortOrder = 'asc'
      } = req.query;

      // Create query object
      const query = {
        facultyId,
        search,
        status,
        assignmentType,
        difficulty,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          sortBy,
          sortOrder
        }
      };

      const result = await assignmentService.getAssignmentsByFaculty(query, user);

      return ResponseHandler.success(
        res, 
        200, 
        'Faculty assignments retrieved successfully', 
        result.assignments,
        result.pagination
      );
    } catch (error) {
      logger.error('Error in getAssignmentsByFaculty controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(req, res) {
    try {
      const user = req.user;

      const stats = await assignmentService.getAssignmentStats(user);

      return ResponseHandler.success(res, 200, 'Assignment statistics retrieved successfully', stats);
    } catch (error) {
      logger.error('Error in getAssignmentStats controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Bulk operations on assignments
   */
  async bulkOperation(req, res) {
    try {
      const operationData = req.body;
      const userId = req.user._id;

      const result = await assignmentService.bulkOperation(operationData, userId);

      return ResponseHandler.success(res, 200, `Bulk operation ${result.operation} completed successfully`, result);
    } catch (error) {
      logger.error('Error in bulkOperation controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get overdue assignments
   */
  async getOverdueAssignments(req, res) {
    try {
      const user = req.user;

      const assignments = await assignmentService.getOverdueAssignments(user);

      return ResponseHandler.success(res, 200, 'Overdue assignments retrieved successfully', assignments);
    } catch (error) {
      logger.error('Error in getOverdueAssignments controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Update assignment statistics
   */
  async updateAssignmentStatistics(req, res) {
    try {
      const { id } = req.params;
      const statisticsData = req.body;

      const assignment = await assignmentService.updateAssignmentStatistics(id, statisticsData);

      return ResponseHandler.success(res, 200, 'Assignment statistics updated successfully', assignment);
    } catch (error) {
      logger.error('Error in updateAssignmentStatistics controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get my assignments (for faculty)
   */
  async getMyAssignments(req, res) {
    try {
      const user = req.user;
      
      if (user.role !== 'faculty') {
        return ResponseHandler.forbidden(res, 'Only faculty can access their assignments');
      }

      const query = { ...req.query, faculty: user._id };
      const result = await assignmentService.getAssignments(query, user);

      return ResponseHandler.success(res, 200, 'My assignments retrieved successfully', result.data, result.pagination);
    } catch (error) {
      logger.error('Error in getMyAssignments controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get assignments for my courses (for students)
   */
  async getMyCourseAssignments(req, res) {
    try {
      const user = req.user;
      
      if (user.role !== 'student') {
        return ResponseHandler.forbidden(res, 'Only students can access course assignments');
      }

      const query = { ...req.query };
      const result = await assignmentService.getStudentActiveAssignmentsAggregated(user._id, query);

      return ResponseHandler.success(res, 200, 'Course assignments retrieved successfully', result.data, result.pagination);
    } catch (error) {
      logger.error('Error in getMyCourseAssignments controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get assignments for a specific student (for admin/faculty)
   */
  async getStudentAssignments(req, res) {
    try {
      const user = req.user;
      const { studentId } = req.params;
      const query = { ...req.query };

      // Check permissions
      if (user.role === 'student') {
        return ResponseHandler.forbidden(res, 'Students cannot access other students\' assignments');
      }

      // Faculty can only access assignments for students in their courses
      if (user.role === 'faculty') {
        // Check if the student is enrolled in any course taught by this faculty
        const Course = require('../models/course.model');
        const facultyCourses = await Course.find({ faculty: user._id }).select('_id');
        const facultyCourseIds = facultyCourses.map(course => course._id);

        const Enrollment = require('../models/enrollment.model');
        const studentEnrollment = await Enrollment.findOne({
          student: studentId,
          status: 'active',
          courses: { $in: facultyCourseIds }
        });

        if (!studentEnrollment) {
          return ResponseHandler.forbidden(res, 'You can only access assignments for students enrolled in your courses');
        }
      }

      const result = await assignmentService.getStudentAssignments(studentId, query);

      return ResponseHandler.success(res, 200, 'Student assignments retrieved successfully', result.data, result.pagination);
    } catch (error) {
      logger.error('Error in getStudentAssignments controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get active assignments for a student using aggregation (for admin/faculty)
   */
  async getStudentActiveAssignmentsAggregated(req, res) {
    try {
      const user = req.user;
      const { studentId } = req.params;
      const query = { ...req.query };

      // Check permissions
      if (user.role === 'student') {
        return ResponseHandler.forbidden(res, 'Students cannot access other students\' assignments');
      }

      // Faculty can only access assignments for students in their courses
      if (user.role === 'faculty') {
        // Check if the student is enrolled in any course taught by this faculty
        const Course = require('../models/course.model');
        const facultyCourses = await Course.find({ faculty: user._id }).select('_id');
        const facultyCourseIds = facultyCourses.map(course => course._id);

        const Enrollment = require('../models/enrollment.model');
        const studentEnrollment = await Enrollment.findOne({
          student: studentId,
          status: 'active',
          courses: { $in: facultyCourseIds }
        });

        if (!studentEnrollment) {
          return ResponseHandler.forbidden(res, 'You can only access assignments for students enrolled in your courses');
        }
      }

      const result = await assignmentService.getStudentActiveAssignmentsAggregated(studentId, query);

      return ResponseHandler.success(res, 200, 'Student active assignments retrieved successfully', result.data, result.pagination);
    } catch (error) {
      logger.error('Error in getStudentActiveAssignmentsAggregated controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Search assignments
   */
  async searchAssignments(req, res) {
    try {
      const { q: searchTerm } = req.query;
      const user = req.user;

      if (!searchTerm) {
        return ResponseHandler.badRequest(res, 'Search term is required');
      }

      const query = { ...req.query, search: searchTerm };
      const result = await assignmentService.getAssignments(query, user);

      return ResponseHandler.success(res, 200, 'Search results retrieved successfully', result.data, result.pagination);
    } catch (error) {
      logger.error('Error in searchAssignments controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get assignments by type
   */
  async getAssignmentsByType(req, res) {
    try {
      const { type } = req.params;
      const user = req.user;

      const query = { ...req.query, assignmentType: type };
      const result = await assignmentService.getAssignments(query, user);

      return ResponseHandler.success(res, 200, `${type} assignments retrieved successfully`, result.data, result.pagination);
    } catch (error) {
      logger.error('Error in getAssignmentsByType controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get assignments by difficulty
   */
  async getAssignmentsByDifficulty(req, res) {
    try {
      const { difficulty } = req.params;
      const user = req.user;

      const query = { ...req.query, difficulty };
      const result = await assignmentService.getAssignments(query, user);

      return ResponseHandler.success(res, 200, `${difficulty} difficulty assignments retrieved successfully`, result.data, result.pagination);
    } catch (error) {
      logger.error('Error in getAssignmentsByDifficulty controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Get assignments by tags
   */
  async getAssignmentsByTags(req, res) {
    try {
      const { tags } = req.query;
      const user = req.user;

      if (!tags) {
        return ResponseHandler.badRequest(res, 'Tags parameter is required');
      }

      const query = { ...req.query, tags };
      const result = await assignmentService.getAssignments(query, user);

      return ResponseHandler.success(res, 200, 'Tagged assignments retrieved successfully', result.data, result.pagination);
    } catch (error) {
      logger.error('Error in getAssignmentsByTags controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Update assignment by faculty ID
   */
  async updateAssignmentByFaculty(req, res) {
    try {
      const { facultyId, assignmentId } = req.params;
      const updateData = req.body;
      const user = req.user;

      const assignment = await assignmentService.updateAssignmentByFaculty(facultyId, assignmentId, updateData, user);

      return ResponseHandler.success(res, 200, 'Assignment updated successfully', assignment);
    } catch (error) {
      logger.error('Error in updateAssignmentByFaculty controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }

  /**
   * Delete assignment by faculty ID
   */
  async deleteAssignmentByFaculty(req, res) {
    try {
      const { facultyId, assignmentId } = req.params;
      const user = req.user;

      const result = await assignmentService.deleteAssignmentByFaculty(facultyId, assignmentId, user);

      return ResponseHandler.success(res, 200, result.message);
    } catch (error) {
      logger.error('Error in deleteAssignmentByFaculty controller:', error);
      return ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
}

module.exports = new AssignmentController(); 