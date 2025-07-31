const CourseGrade = require('../models/courseGrade.model');
const Course = require('../models/course.model');
const Assignment = require('../models/assignment.model');
const Submission = require('../models/submission.model');
const Enrollment = require('../models/enrollment.model');
const createError = require('../utils/createError');
const logger = require('../utils/logger');

/**
 * Course Grade Service Class
 */
class CourseGradeService {
  /**
   * Create a new course grade
   */
  async createCourseGrade(gradeData, facultyId) {
    try {
      // Validate that course exists and faculty is assigned
      const course = await Course.findById(gradeData.course);
      if (!course) {
        throw createError(404, 'Course not found');
      }

      if (course.faculty.toString() !== facultyId.toString()) {
        throw createError(403, 'You are not authorized to grade this course');
      }

      // Check if grade already exists for this student and course
      const existingGrade = await CourseGrade.findOne({
        student: gradeData.student,
        course: gradeData.course,
        semester: gradeData.semester,
        academicYear: gradeData.academicYear
      });

      if (existingGrade) {
        throw createError(400, 'Grade already exists for this student in this course');
      }

      // Calculate grade points from letter grade
      const gradePoints = CourseGrade.getGradePoints(gradeData.finalGrade);
      
      // Calculate numerical grade
      const numericalGrade = CourseGrade.getNumericalGrade(gradePoints);

      const courseGrade = new CourseGrade({
        ...gradeData,
        faculty: facultyId,
        gradePoints,
        numericalGrade,
        submittedBy: facultyId
      });

      await courseGrade.save();

      // Add initial history entry
      await courseGrade.addHistoryEntry('created', facultyId, null, gradeData.finalGrade, 'Grade created');

      logger.info(`Course grade created: ${courseGrade._id} by faculty: ${facultyId}`);
      return courseGrade;
    } catch (error) {
      logger.error('Error creating course grade:', error);
      throw error;
    }
  }

  /**
   * Get course grades by faculty
   */
  async getCourseGradesByFaculty(facultyId, filters = {}) {
    try {
      const query = { faculty: facultyId };
      
      if (filters.semester) query.semester = filters.semester;
      if (filters.academicYear) query.academicYear = filters.academicYear;
      if (filters.course) query.course = filters.course;
      if (filters.status) query.status = filters.status;

      const grades = await CourseGrade.find(query)
        .populate('student', 'firstName lastName studentId email')
        .populate('course', 'name code creditHours')
        .sort({ submittedAt: -1 });

      logger.info(`Course grades retrieved for faculty: ${facultyId}`);
      return grades;
    } catch (error) {
      logger.error('Error getting course grades by faculty:', error);
      throw error;
    }
  }

  /**
   * Get course grades by course
   */
  async getCourseGradesByCourse(courseId, facultyId, filters = {}) {
    try {
      // Verify faculty is assigned to this course
      const course = await Course.findById(courseId);
      if (!course) {
        throw createError(404, 'Course not found');
      }

      if (course.faculty.toString() !== facultyId.toString()) {
        throw createError(403, 'You are not authorized to view grades for this course');
      }

      const query = { course: courseId };
      
      if (filters.semester) query.semester = filters.semester;
      if (filters.academicYear) query.academicYear = filters.academicYear;
      if (filters.status) query.status = filters.status;

      const grades = await CourseGrade.find(query)
        .populate('student', 'firstName lastName studentId email')
        .populate('course', 'name code creditHours')
        .sort({ 'student.firstName': 1 });

      logger.info(`Course grades retrieved for course: ${courseId}`);
      return grades;
    } catch (error) {
      logger.error('Error getting course grades by course:', error);
      throw error;
    }
  }

  /**
   * Update course grade
   */
  async updateCourseGrade(gradeId, updateData, facultyId) {
    try {
      const courseGrade = await CourseGrade.findById(gradeId);
      if (!courseGrade) {
        throw createError(404, 'Course grade not found');
      }

      // Verify faculty owns this grade
      if (courseGrade.faculty.toString() !== facultyId.toString()) {
        throw createError(403, 'You are not authorized to update this grade');
      }

      // Check if grade is already submitted/final
      if (courseGrade.status !== 'draft') {
        throw createError(400, 'Cannot update grade that is already submitted or finalized');
      }

      const previousGrade = courseGrade.finalGrade;

      // Update grade data
      Object.assign(courseGrade, updateData);

      // Recalculate grade points and numerical grade if final grade changed
      if (updateData.finalGrade && updateData.finalGrade !== previousGrade) {
        courseGrade.gradePoints = CourseGrade.getGradePoints(updateData.finalGrade);
        courseGrade.numericalGrade = CourseGrade.getNumericalGrade(courseGrade.gradePoints);
      }

      await courseGrade.save();

      // Add history entry
      await courseGrade.addHistoryEntry(
        'updated', 
        facultyId, 
        previousGrade, 
        courseGrade.finalGrade, 
        'Grade updated'
      );

      logger.info(`Course grade updated: ${gradeId} by faculty: ${facultyId}`);
      return courseGrade;
    } catch (error) {
      logger.error('Error updating course grade:', error);
      throw error;
    }
  }

  /**
   * Submit course grade
   */
  async submitCourseGrade(gradeId, facultyId) {
    try {
      const courseGrade = await CourseGrade.findById(gradeId);
      if (!courseGrade) {
        throw createError(404, 'Course grade not found');
      }

      // Verify faculty owns this grade
      if (courseGrade.faculty.toString() !== facultyId.toString()) {
        throw createError(403, 'You are not authorized to submit this grade');
      }

      // Check if grade is already submitted
      if (courseGrade.status !== 'draft') {
        throw createError(400, 'Grade is already submitted or finalized');
      }

      await courseGrade.submitGrade(facultyId);

      logger.info(`Course grade submitted: ${gradeId} by faculty: ${facultyId}`);
      return courseGrade;
    } catch (error) {
      logger.error('Error submitting course grade:', error);
      throw error;
    }
  }

  /**
   * Bulk submit course grades
   */
  async bulkSubmitCourseGrades(courseId, facultyId, gradeIds) {
    try {
      // Verify faculty is assigned to this course
      const course = await Course.findById(courseId);
      if (!course) {
        throw createError(404, 'Course not found');
      }

      if (course.faculty.toString() !== facultyId.toString()) {
        throw createError(403, 'You are not authorized to submit grades for this course');
      }

      const results = [];
      const errors = [];

      for (const gradeId of gradeIds) {
        try {
          const courseGrade = await CourseGrade.findById(gradeId);
          if (!courseGrade) {
            errors.push({ gradeId, error: 'Grade not found' });
            continue;
          }

          if (courseGrade.course.toString() !== courseId) {
            errors.push({ gradeId, error: 'Grade does not belong to this course' });
            continue;
          }

          if (courseGrade.status !== 'draft') {
            errors.push({ gradeId, error: 'Grade is already submitted or finalized' });
            continue;
          }

          await courseGrade.submitGrade(facultyId);
          results.push(courseGrade);
        } catch (error) {
          errors.push({ gradeId, error: error.message });
        }
      }

      logger.info(`Bulk grade submission completed for course: ${courseId}`);
      return { results, errors };
    } catch (error) {
      logger.error('Error bulk submitting course grades:', error);
      throw error;
    }
  }

  /**
   * Auto-calculate grades from assignments
   */
  async autoCalculateGrades(courseId, facultyId, semester, academicYear) {
    try {
      // Verify faculty is assigned to this course
      const course = await Course.findById(courseId);
      if (!course) {
        throw createError(404, 'Course not found');
      }

      if (course.faculty.toString() !== facultyId.toString()) {
        throw createError(403, 'You are not authorized to calculate grades for this course');
      }

      // Get all assignments for this course
      const assignments = await Assignment.find({ 
        course: courseId,
        status: { $in: ['grading', 'completed'] }
      });

      if (assignments.length === 0) {
        throw createError(400, 'No graded assignments found for this course');
      }

      // Get enrolled students
      const enrollments = await Enrollment.find({
        program: course.program,
        semester,
        academicYear,
        status: 'active'
      }).populate('student', 'firstName lastName studentId');

      const results = [];

      for (const enrollment of enrollments) {
        try {
          const studentGrades = [];
          let totalWeight = 0;

          // Calculate grades for each assignment
          for (const assignment of assignments) {
            const submission = await Submission.findOne({
              assignment: assignment._id,
              student: enrollment.student._id
            });

            if (submission && submission.status === 'graded') {
              const weight = assignment.weight || (100 / assignments.length);
              totalWeight += weight;

              studentGrades.push({
                assignment: assignment._id,
                title: assignment.title,
                weight,
                grade: submission.numericalScore || 0,
                maxPoints: assignment.totalPoints
              });
            }
          }

          if (studentGrades.length > 0) {
            // Calculate weighted average
            let weightedSum = 0;
            studentGrades.forEach(grade => {
              weightedSum += (grade.grade / grade.maxPoints) * grade.weight;
            });

            const finalNumericalGrade = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
            const finalLetterGrade = this.getLetterGrade(finalNumericalGrade);
            const gradePoints = CourseGrade.getGradePoints(finalLetterGrade);

            // Create or update course grade
            const existingGrade = await CourseGrade.findOne({
              student: enrollment.student._id,
              course: courseId,
              semester,
              academicYear
            });

            const gradeData = {
              student: enrollment.student._id,
              course: courseId,
              faculty: facultyId,
              semester,
              academicYear,
              finalGrade: finalLetterGrade,
              numericalGrade: finalNumericalGrade,
              gradePoints,
              credits: course.creditHours,
              assignmentGrades: studentGrades,
              status: 'draft'
            };

            if (existingGrade) {
              Object.assign(existingGrade, gradeData);
              await existingGrade.save();
              results.push(existingGrade);
            } else {
              const newGrade = new CourseGrade(gradeData);
              await newGrade.save();
              results.push(newGrade);
            }
          }
        } catch (error) {
          logger.error(`Error calculating grade for student ${enrollment.student._id}:`, error);
        }
      }

      logger.info(`Auto-calculated grades for course: ${courseId}`);
      return results;
    } catch (error) {
      logger.error('Error auto-calculating grades:', error);
      throw error;
    }
  }

  /**
   * Get letter grade from numerical grade
   */
  getLetterGrade(numericalGrade) {
    if (numericalGrade >= 97) return 'A+';
    if (numericalGrade >= 93) return 'A';
    if (numericalGrade >= 90) return 'A-';
    if (numericalGrade >= 87) return 'B+';
    if (numericalGrade >= 83) return 'B';
    if (numericalGrade >= 80) return 'B-';
    if (numericalGrade >= 77) return 'C+';
    if (numericalGrade >= 73) return 'C';
    if (numericalGrade >= 70) return 'C-';
    if (numericalGrade >= 67) return 'D+';
    if (numericalGrade >= 63) return 'D';
    if (numericalGrade >= 60) return 'D-';
    return 'F';
  }

  /**
   * Get grade statistics for a course
   */
  async getGradeStatistics(courseId, facultyId, semester, academicYear) {
    try {
      // Verify faculty is assigned to this course
      const course = await Course.findById(courseId);
      if (!course) {
        throw createError(404, 'Course not found');
      }

      if (course.faculty.toString() !== facultyId.toString()) {
        throw createError(403, 'You are not authorized to view statistics for this course');
      }

      const grades = await CourseGrade.find({
        course: courseId,
        semester,
        academicYear
      });

      const statistics = {
        totalStudents: grades.length,
        averageGrade: 0,
        gradeDistribution: {
          'A+': 0, 'A': 0, 'A-': 0,
          'B+': 0, 'B': 0, 'B-': 0,
          'C+': 0, 'C': 0, 'C-': 0,
          'D+': 0, 'D': 0, 'D-': 0,
          'F': 0, 'I': 0, 'W': 0
        },
        statusDistribution: {
          draft: 0,
          submitted: 0,
          approved: 0,
          final: 0
        }
      };

      let totalNumericalGrade = 0;

      grades.forEach(grade => {
        totalNumericalGrade += grade.numericalGrade;
        statistics.gradeDistribution[grade.finalGrade]++;
        statistics.statusDistribution[grade.status]++;
      });

      statistics.averageGrade = grades.length > 0 ? totalNumericalGrade / grades.length : 0;

      logger.info(`Grade statistics retrieved for course: ${courseId}`);
      return statistics;
    } catch (error) {
      logger.error('Error getting grade statistics:', error);
      throw error;
    }
  }

  /**
   * Delete course grade (only if draft)
   */
  async deleteCourseGrade(gradeId, facultyId) {
    try {
      const courseGrade = await CourseGrade.findById(gradeId);
      if (!courseGrade) {
        throw createError(404, 'Course grade not found');
      }

      // Verify faculty owns this grade
      if (courseGrade.faculty.toString() !== facultyId.toString()) {
        throw createError(403, 'You are not authorized to delete this grade');
      }

      // Only allow deletion of draft grades
      if (courseGrade.status !== 'draft') {
        throw createError(400, 'Cannot delete grade that is already submitted or finalized');
      }

      await CourseGrade.findByIdAndDelete(gradeId);

      logger.info(`Course grade deleted: ${gradeId} by faculty: ${facultyId}`);
      return { success: true, message: 'Grade deleted successfully' };
    } catch (error) {
      logger.error('Error deleting course grade:', error);
      throw error;
    }
  }
}

module.exports = new CourseGradeService(); 