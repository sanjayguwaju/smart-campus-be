const courseService = require('../services/course.service');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');
const Course = require('../models/course.model');

/**
 * Course Controller
 */
class CourseController {
  /**
   * Get all courses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCourses(req, res) {
    try {
      const filters = {
        department: req.query.department,
        semester: req.query.semester,
        year: req.query.year ? parseInt(req.query.year) : undefined,
        instructor: req.query.instructor,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        isPublished: req.query.isPublished === 'true' ? true : req.query.isPublished === 'false' ? false : undefined,
        available: req.query.available === 'true',
        search: req.query.search
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await courseService.getCourses(filters, pagination);

      return ResponseHandler.success(res, 200, 'Courses retrieved successfully', result);
    } catch (error) {
      logger.error('Get courses error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve courses');
    }
  }

  /**
   * Get course by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCourseById(req, res) {
    try {
      const { courseId } = req.params;
      const course = await Course.findById(courseId)
        .populate('program')
        .populate('department')
        .populate('faculty');

      if (!course) {
        return ResponseHandler.notFound(res, 'Course not found');
      }

      return ResponseHandler.success(res, 200, 'Course retrieved successfully', course);
    } catch (error) {
      logger.error('Get course by ID error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve course');
    }
  }

  /**
   * Create new course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createCourse(req, res) {
    try {
      const course = await Course.create(req.body);
      await course.populate('faculty', 'firstName lastName email department');
      await course.populate('program', 'name level duration semesters department');
      await course.populate('department', 'name');
      res.status(201).json({ success: true, data: course });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Update course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateCourse(req, res) {
    try {
      const { courseId } = req.params;
      const updateData = req.body;
      let course = await Course.findByIdAndUpdate(
        courseId,
        updateData,
        { new: true, runValidators: true }
      );
      if (!course) {
        return ResponseHandler.notFound(res, 'Course not found');
      }
      await course.populate('faculty', 'firstName lastName email department');
      await course.populate('program', 'name level duration semesters department');
      await course.populate('department', 'name');
      return ResponseHandler.success(res, 200, 'Course updated successfully', course);
    } catch (error) {
      logger.error('Update course error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Delete course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteCourse(req, res) {
    try {
      const { courseId } = req.params;
      const course = await Course.findByIdAndDelete(courseId);

      if (!course) {
        return ResponseHandler.notFound(res, 'Course not found');
      }

      return ResponseHandler.success(res, 200, 'Course deleted successfully');
    } catch (error) {
      logger.error('Delete course error:', error);
      return ResponseHandler.error(res, 500, 'Failed to delete course');
    }
  }

  /**
   * Enroll student in course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async enrollStudent(req, res) {
    try {
      const { courseId } = req.params;
      const { studentId } = req.body;
      const course = await courseService.enrollStudent(courseId, studentId);

      return ResponseHandler.success(res, 200, 'Student enrolled successfully', course);
    } catch (error) {
      logger.error('Enroll student error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Remove student from course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async removeStudent(req, res) {
    try {
      const { courseId } = req.params;
      const { studentId } = req.body;
      const course = await courseService.removeStudent(courseId, studentId);

      return ResponseHandler.success(res, 200, 'Student removed successfully', course);
    } catch (error) {
      logger.error('Remove student error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Add course material
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addCourseMaterial(req, res) {
    try {
      const { courseId } = req.params;
      const materialData = {
        ...req.body,
        uploadedBy: req.user._id
      };
      const course = await courseService.addCourseMaterial(courseId, materialData);

      return ResponseHandler.success(res, 200, 'Material added successfully', course);
    } catch (error) {
      logger.error('Add course material error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Remove course material
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async removeCourseMaterial(req, res) {
    try {
      const { courseId, materialId } = req.params;
      const course = await courseService.removeCourseMaterial(courseId, materialId);

      return ResponseHandler.success(res, 200, 'Material removed successfully', course);
    } catch (error) {
      logger.error('Remove course material error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Add course assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async addCourseAssignment(req, res) {
    try {
      const { courseId } = req.params;
      const assignmentData = req.body;
      const course = await courseService.addCourseAssignment(courseId, assignmentData);

      return ResponseHandler.success(res, 200, 'Assignment added successfully', course);
    } catch (error) {
      logger.error('Add course assignment error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Submit assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async submitAssignment(req, res) {
    try {
      const { courseId, assignmentId } = req.params;
      const studentId = req.user._id;
      const submissionData = req.body;
      const course = await courseService.submitAssignment(courseId, assignmentId, studentId, submissionData);

      return ResponseHandler.success(res, 200, 'Assignment submitted successfully', course);
    } catch (error) {
      logger.error('Submit assignment error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Grade assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async gradeAssignment(req, res) {
    try {
      const { courseId, assignmentId, studentId } = req.params;
      const gradeData = req.body;
      const course = await courseService.gradeAssignment(courseId, assignmentId, studentId, gradeData);

      return ResponseHandler.success(res, 200, 'Assignment graded successfully', course);
    } catch (error) {
      logger.error('Grade assignment error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Get courses by instructor
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCoursesByInstructor(req, res) {
    try {
      const { instructorId } = req.params;
      const courses = await courseService.getCoursesByInstructor(instructorId);

      return ResponseHandler.success(res, 200, 'Courses retrieved successfully', courses);
    } catch (error) {
      logger.error('Get courses by instructor error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve courses');
    }
  }

  /**
   * Get courses by department
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCoursesByDepartment(req, res) {
    try {
      const { department } = req.params;
      const courses = await courseService.getCoursesByDepartment(department);

      return ResponseHandler.success(res, 200, 'Courses retrieved successfully', courses);
    } catch (error) {
      logger.error('Get courses by department error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve courses');
    }
  }

  /**
   * Get available courses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAvailableCourses(req, res) {
    try {
      const courses = await courseService.getAvailableCourses();

      return ResponseHandler.success(res, 200, 'Available courses retrieved successfully', courses);
    } catch (error) {
      logger.error('Get available courses error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve available courses');
    }
  }

  /**
   * Get course statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCourseStats(req, res) {
    try {
      const stats = await courseService.getCourseStats();

      return ResponseHandler.success(res, 200, 'Course statistics retrieved successfully', stats);
    } catch (error) {
      logger.error('Get course stats error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve course statistics');
    }
  }

  /**
   * Publish/Unpublish course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async toggleCoursePublish(req, res) {
    try {
      const { courseId } = req.params;
      const { isPublished } = req.body;
      
      const course = await courseService.updateCourse(courseId, { isPublished });
      const status = isPublished ? 'published' : 'unpublished';

      return ResponseHandler.success(res, 200, `Course ${status} successfully`, course);
    } catch (error) {
      logger.error('Toggle course publish error:', error);
      if (error.message === 'Course not found') {
        return ResponseHandler.notFound(res, 'Course not found');
      }
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Activate/Deactivate course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async toggleCourseStatus(req, res) {
    try {
      const { courseId } = req.params;
      const { isActive } = req.body;
      
      const course = await courseService.updateCourse(courseId, { isActive });
      const status = isActive ? 'activated' : 'deactivated';

      return ResponseHandler.success(res, 200, `Course ${status} successfully`, course);
    } catch (error) {
      logger.error('Toggle course status error:', error);
      if (error.message === 'Course not found') {
        return ResponseHandler.notFound(res, 'Course not found');
      }
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Search courses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchCourses(req, res) {
    try {
      const { q: searchQuery, department, semester, year } = req.query;

      if (!searchQuery) {
        return ResponseHandler.error(res, 400, 'Search query is required');
      }

      const filters = {
        search: searchQuery,
        department,
        semester,
        year: year ? parseInt(year) : undefined
      };

      const pagination = {
        page: 1,
        limit: 20,
        sortBy: 'title',
        sortOrder: 'asc'
      };

      const result = await courseService.getCourses(filters, pagination);

      return ResponseHandler.success(res, 200, 'Search completed successfully', result);
    } catch (error) {
      logger.error('Search courses error:', error);
      return ResponseHandler.error(res, 500, 'Failed to search courses');
    }
  }

  /**
   * Get course enrollment status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEnrollmentStatus(req, res) {
    try {
      const { courseId } = req.params;
      const studentId = req.user._id;

      const course = await courseService.getCourseById(courseId);
      const isEnrolled = course.students.some(student => student._id.toString() === studentId.toString());

      return ResponseHandler.success(res, 200, 'Enrollment status retrieved successfully', {
        courseId,
        isEnrolled,
        isAvailable: course.isAvailable,
        currentStudents: course.currentStudents,
        maxStudents: course.maxStudents
      });
    } catch (error) {
      logger.error('Get enrollment status error:', error);
      if (error.message === 'Course not found') {
        return ResponseHandler.notFound(res, 'Course not found');
      }
      return ResponseHandler.error(res, 500, 'Failed to get enrollment status');
    }
  }
}

module.exports = new CourseController(); 