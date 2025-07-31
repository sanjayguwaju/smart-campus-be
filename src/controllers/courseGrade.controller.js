const courseGradeService = require('../services/courseGrade.service');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Course Grade Controller
 */
class CourseGradeController {
  /**
   * Create a new course grade
   */
  async createCourseGrade(req, res) {
    try {
      const gradeData = req.body;
      const facultyId = req.user._id;

      const courseGrade = await courseGradeService.createCourseGrade(gradeData, facultyId);

      return ResponseHandler.success(res, 201, 'Course grade created successfully', courseGrade);
    } catch (error) {
      logger.error('Create course grade error:', error);
      return ResponseHandler.error(res, error.status || 400, error.message);
    }
  }

  /**
   * Get course grades by faculty
   */
  async getCourseGradesByFaculty(req, res) {
    try {
      const facultyId = req.user._id;
      const filters = req.query;

      const grades = await courseGradeService.getCourseGradesByFaculty(facultyId, filters);

      return ResponseHandler.success(res, 200, 'Course grades retrieved successfully', grades);
    } catch (error) {
      logger.error('Get course grades by faculty error:', error);
      return ResponseHandler.error(res, error.status || 400, error.message);
    }
  }

  /**
   * Get course grades by course
   */
  async getCourseGradesByCourse(req, res) {
    try {
      const { courseId } = req.params;
      const facultyId = req.user._id;
      const filters = req.query;

      const grades = await courseGradeService.getCourseGradesByCourse(courseId, facultyId, filters);

      return ResponseHandler.success(res, 200, 'Course grades retrieved successfully', grades);
    } catch (error) {
      logger.error('Get course grades by course error:', error);
      return ResponseHandler.error(res, error.status || 400, error.message);
    }
  }

  /**
   * Update course grade
   */
  async updateCourseGrade(req, res) {
    try {
      const { gradeId } = req.params;
      const updateData = req.body;
      const facultyId = req.user._id;

      const courseGrade = await courseGradeService.updateCourseGrade(gradeId, updateData, facultyId);

      return ResponseHandler.success(res, 200, 'Course grade updated successfully', courseGrade);
    } catch (error) {
      logger.error('Update course grade error:', error);
      return ResponseHandler.error(res, error.status || 400, error.message);
    }
  }

  /**
   * Submit course grade
   */
  async submitCourseGrade(req, res) {
    try {
      const { gradeId } = req.params;
      const facultyId = req.user._id;

      const courseGrade = await courseGradeService.submitCourseGrade(gradeId, facultyId);

      return ResponseHandler.success(res, 200, 'Course grade submitted successfully', courseGrade);
    } catch (error) {
      logger.error('Submit course grade error:', error);
      return ResponseHandler.error(res, error.status || 400, error.message);
    }
  }

  /**
   * Bulk submit course grades
   */
  async bulkSubmitCourseGrades(req, res) {
    try {
      const { courseId } = req.params;
      const { gradeIds } = req.body;
      const facultyId = req.user._id;

      const result = await courseGradeService.bulkSubmitCourseGrades(courseId, facultyId, gradeIds);

      return ResponseHandler.success(res, 200, 'Bulk grade submission completed', result);
    } catch (error) {
      logger.error('Bulk submit course grades error:', error);
      return ResponseHandler.error(res, error.status || 400, error.message);
    }
  }

  /**
   * Auto-calculate grades from assignments
   */
  async autoCalculateGrades(req, res) {
    try {
      const { courseId } = req.params;
      const { semester, academicYear } = req.body;
      const facultyId = req.user._id;

      const grades = await courseGradeService.autoCalculateGrades(courseId, facultyId, semester, academicYear);

      return ResponseHandler.success(res, 200, 'Grades auto-calculated successfully', grades);
    } catch (error) {
      logger.error('Auto-calculate grades error:', error);
      return ResponseHandler.error(res, error.status || 400, error.message);
    }
  }

  /**
   * Get grade statistics for a course
   */
  async getGradeStatistics(req, res) {
    try {
      const { courseId } = req.params;
      const { semester, academicYear } = req.query;
      const facultyId = req.user._id;

      const statistics = await courseGradeService.getGradeStatistics(courseId, facultyId, semester, academicYear);

      return ResponseHandler.success(res, 200, 'Grade statistics retrieved successfully', statistics);
    } catch (error) {
      logger.error('Get grade statistics error:', error);
      return ResponseHandler.error(res, error.status || 400, error.message);
    }
  }

  /**
   * Delete course grade
   */
  async deleteCourseGrade(req, res) {
    try {
      const { gradeId } = req.params;
      const facultyId = req.user._id;

      const result = await courseGradeService.deleteCourseGrade(gradeId, facultyId);

      return ResponseHandler.success(res, 200, result.message, result);
    } catch (error) {
      logger.error('Delete course grade error:', error);
      return ResponseHandler.error(res, error.status || 400, error.message);
    }
  }
}

module.exports = new CourseGradeController(); 