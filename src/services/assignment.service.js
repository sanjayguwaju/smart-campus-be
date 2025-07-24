const Assignment = require('../models/assignment.model');
const Submission = require('../models/submission.model');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const { createError } = require('../utils/createError');
const logger = require('../utils/logger');

class AssignmentService {
  /**
   * Create a new assignment
   */
  static async createAssignment(assignmentData, facultyId) {
    try {
      // Validate course exists
      const course = await Course.findById(assignmentData.course);
      if (!course) {
        throw createError(404, 'Course not found');
      }

      // Validate faculty exists and is faculty
      const faculty = await User.findById(facultyId);
      if (!faculty || faculty.role !== 'faculty') {
        throw createError(403, 'Only faculty can create assignments');
      }

      // Validate due date is in the future
      if (new Date(assignmentData.dueDate) <= new Date()) {
        throw createError(400, 'Due date must be in the future');
      }

      // Validate extended due date if provided
      if (assignmentData.extendedDueDate) {
        if (new Date(assignmentData.extendedDueDate) <= new Date(assignmentData.dueDate)) {
          throw createError(400, 'Extended due date must be after the original due date');
        }
      }

      // Validate grading criteria points match total points
      if (assignmentData.gradingCriteria && assignmentData.gradingCriteria.length > 0) {
        const criteriaPoints = assignmentData.gradingCriteria.reduce(
          (sum, criteria) => sum + criteria.maxPoints, 
          0
        );
        if (criteriaPoints !== assignmentData.totalPoints) {
          throw createError(400, 'Total points must match the sum of grading criteria points');
        }
      }

      const assignment = new Assignment({
        ...assignmentData,
        faculty: facultyId,
        createdBy: facultyId
      });

      await assignment.save();

      logger.info(`Assignment created: ${assignment._id} by faculty: ${facultyId}`);

      return assignment;
    } catch (error) {
      logger.error(`Error creating assignment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get assignments with filtering and pagination
   */
  static async getAssignments(filters, options, userRole, userId) {
    try {
      const filter = { ...filters };

      // Apply role-based filtering
      if (userRole === 'student') {
        filter.status = 'published';
        filter.isVisible = true;
      } else if (userRole === 'faculty') {
        filter.$or = [
          { faculty: userId },
          { status: 'published', isVisible: true }
        ];
      }

      const assignments = await Assignment.paginate(filter, {
        ...options,
        populate: [
          { path: 'course', select: 'name code' },
          { path: 'faculty', select: 'firstName lastName email' },
          { path: 'createdBy', select: 'firstName lastName' }
        ],
        sort: { createdAt: -1 }
      });

      return assignments;
    } catch (error) {
      logger.error(`Error getting assignments: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get assignment by ID with proper permissions
   */
  static async getAssignmentById(assignmentId, userRole, userId) {
    try {
      const assignment = await Assignment.findById(assignmentId)
        .populate('course', 'name code description')
        .populate('faculty', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .populate('lastModifiedBy', 'firstName lastName');

      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      // Check permissions
      if (userRole === 'student') {
        if (assignment.status !== 'published' || !assignment.isVisible) {
          throw createError(403, 'Access denied');
        }
      } else if (userRole === 'faculty' && assignment.faculty.toString() !== userId) {
        if (assignment.status !== 'published' || !assignment.isVisible) {
          throw createError(403, 'Access denied');
        }
      }

      return assignment;
    } catch (error) {
      logger.error(`Error getting assignment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update assignment
   */
  static async updateAssignment(assignmentId, updateData, userId, userRole) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      // Check permissions
      if (assignment.faculty.toString() !== userId && userRole !== 'admin') {
        throw createError(403, 'Only the assignment creator or admin can update this assignment');
      }

      // Validate due date changes
      if (updateData.dueDate) {
        const newDueDate = new Date(updateData.dueDate);
        if (newDueDate <= new Date()) {
          throw createError(400, 'Due date must be in the future');
        }

        // Check if there are existing submissions
        const submissionCount = await Submission.countDocuments({ assignment: assignmentId });
        if (submissionCount > 0) {
          throw createError(400, 'Cannot change due date after submissions have been made');
        }
      }

      // Validate extended due date
      if (updateData.extendedDueDate) {
        const effectiveDueDate = updateData.dueDate || assignment.dueDate;
        if (new Date(updateData.extendedDueDate) <= new Date(effectiveDueDate)) {
          throw createError(400, 'Extended due date must be after the original due date');
        }
      }

      // Update assignment
      Object.assign(assignment, updateData);
      assignment.lastModifiedBy = userId;

      await assignment.save();

      logger.info(`Assignment updated: ${assignmentId} by user: ${userId}`);

      return assignment;
    } catch (error) {
      logger.error(`Error updating assignment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete assignment
   */
  static async deleteAssignment(assignmentId, userId, userRole) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      // Check permissions
      if (assignment.faculty.toString() !== userId && userRole !== 'admin') {
        throw createError(403, 'Only the assignment creator or admin can delete this assignment');
      }

      // Check if there are submissions
      const submissionCount = await Submission.countDocuments({ assignment: assignmentId });
      if (submissionCount > 0) {
        throw createError(400, 'Cannot delete assignment with existing submissions');
      }

      await Assignment.findByIdAndDelete(assignmentId);

      logger.info(`Assignment deleted: ${assignmentId} by user: ${userId}`);

      return { message: 'Assignment deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting assignment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Publish assignment
   */
  static async publishAssignment(assignmentId, userId, userRole) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      if (assignment.faculty.toString() !== userId && userRole !== 'admin') {
        throw createError(403, 'Only the assignment creator or admin can publish this assignment');
      }

      await assignment.publish();

      logger.info(`Assignment published: ${assignmentId} by user: ${userId}`);

      return assignment;
    } catch (error) {
      logger.error(`Error publishing assignment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Close assignment submissions
   */
  static async closeAssignment(assignmentId, userId, userRole) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      if (assignment.faculty.toString() !== userId && userRole !== 'admin') {
        throw createError(403, 'Only the assignment creator or admin can close this assignment');
      }

      await assignment.closeSubmissions();

      logger.info(`Assignment closed: ${assignmentId} by user: ${userId}`);

      return assignment;
    } catch (error) {
      logger.error(`Error closing assignment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get assignment statistics
   */
  static async getAssignmentStatistics(assignmentId, userId, userRole) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      // Check permissions
      if (userRole === 'faculty' && assignment.faculty.toString() !== userId) {
        throw createError(403, 'Access denied');
      }

      // Get submission statistics
      const submissions = await Submission.find({ assignment: assignmentId });
      
      const statistics = {
        totalSubmissions: submissions.length,
        onTimeSubmissions: submissions.filter(s => !s.isLate).length,
        lateSubmissions: submissions.filter(s => s.isLate).length,
        gradedSubmissions: submissions.filter(s => s.status === 'graded').length,
        averageScore: submissions.length > 0 
          ? submissions.reduce((sum, s) => sum + (s.numericalScore || 0), 0) / submissions.length 
          : 0,
        gradeDistribution: {},
        submissionTimeline: [],
        plagiarismFlagged: submissions.filter(s => s.plagiarismCheck.flagged).length,
        verificationStatus: {
          verified: submissions.filter(s => s.verification.isVerified).length,
          unverified: submissions.filter(s => !s.verification.isVerified).length
        }
      };

      // Calculate grade distribution
      submissions.forEach(submission => {
        if (submission.grade) {
          statistics.gradeDistribution[submission.grade] = 
            (statistics.gradeDistribution[submission.grade] || 0) + 1;
        }
      });

      // Calculate submission timeline (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      last7Days.forEach(date => {
        const count = submissions.filter(s => 
          s.submittedAt.toISOString().split('T')[0] === date
        ).length;
        statistics.submissionTimeline.push({ date, count });
      });

      return statistics;
    } catch (error) {
      logger.error(`Error getting assignment statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add files to assignment
   */
  static async addAssignmentFiles(assignmentId, files, userId, userRole) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      if (assignment.faculty.toString() !== userId && userRole !== 'admin') {
        throw createError(403, 'Only the assignment creator or admin can add files');
      }

      for (const file of files) {
        await assignment.addFile(
          file.fileName,
          file.fileUrl,
          file.fileSize,
          file.fileType
        );
      }

      logger.info(`Files added to assignment: ${assignmentId} by user: ${userId}`);

      return assignment;
    } catch (error) {
      logger.error(`Error adding files to assignment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove file from assignment
   */
  static async removeAssignmentFile(assignmentId, fileUrl, userId, userRole) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      if (assignment.faculty.toString() !== userId && userRole !== 'admin') {
        throw createError(403, 'Only the assignment creator or admin can remove files');
      }

      await assignment.removeFile(fileUrl);

      logger.info(`File removed from assignment: ${assignmentId} by user: ${userId}`);

      return assignment;
    } catch (error) {
      logger.error(`Error removing file from assignment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get assignments by course
   */
  static async getAssignmentsByCourse(courseId, userRole, userId) {
    try {
      const filter = { course: courseId };

      // Apply role-based filtering
      if (userRole === 'student') {
        filter.status = 'published';
        filter.isVisible = true;
      } else if (userRole === 'faculty') {
        filter.$or = [
          { faculty: userId },
          { status: 'published', isVisible: true }
        ];
      }

      const assignments = await Assignment.find(filter)
        .populate('faculty', 'firstName lastName')
        .sort({ dueDate: 1 });

      return assignments;
    } catch (error) {
      logger.error(`Error getting assignments by course: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get assignments by faculty
   */
  static async getAssignmentsByFaculty(facultyId, userRole, userId) {
    try {
      // Check permissions
      if (userRole === 'faculty' && facultyId !== userId) {
        throw createError(403, 'Access denied');
      }

      const assignments = await Assignment.find({ faculty: facultyId })
        .populate('course', 'name code')
        .sort({ createdAt: -1 });

      return assignments;
    } catch (error) {
      logger.error(`Error getting assignments by faculty: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get overdue assignments
   */
  static async getOverdueAssignments(userRole, userId) {
    try {
      const filter = {};

      // Apply role-based filtering
      if (userRole === 'faculty') {
        filter.faculty = userId;
      }

      const assignments = await Assignment.findOverdue()
        .populate('course', 'name code')
        .populate('faculty', 'firstName lastName');

      // Filter by role if needed
      if (userRole === 'faculty') {
        return assignments.filter(a => a.faculty.toString() === userId);
      }

      return assignments;
    } catch (error) {
      logger.error(`Error getting overdue assignments: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search assignments
   */
  static async searchAssignments(searchTerm, userRole, userId) {
    try {
      const filter = {
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      };

      // Apply role-based filtering
      if (userRole === 'student') {
        filter.status = 'published';
        filter.isVisible = true;
      } else if (userRole === 'faculty') {
        filter.$and = [
          {
            $or: [
              { faculty: userId },
              { status: 'published', isVisible: true }
            ]
          }
        ];
      }

      const assignments = await Assignment.find(filter)
        .populate('course', 'name code')
        .populate('faculty', 'firstName lastName')
        .sort({ createdAt: -1 });

      return assignments;
    } catch (error) {
      logger.error(`Error searching assignments: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update assignment statistics
   */
  static async updateAssignmentStatistics(assignmentId) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      const submissions = await Submission.find({ assignment: assignmentId });
      
      const statistics = {
        totalSubmissions: submissions.length,
        onTimeSubmissions: submissions.filter(s => !s.isLate).length,
        lateSubmissions: submissions.filter(s => s.isLate).length,
        averageScore: submissions.length > 0 
          ? submissions.reduce((sum, s) => sum + (s.numericalScore || 0), 0) / submissions.length 
          : 0
      };

      await assignment.updateStatistics(statistics);

      return statistics;
    } catch (error) {
      logger.error(`Error updating assignment statistics: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AssignmentService; 