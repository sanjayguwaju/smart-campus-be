const Submission = require('../models/submission.model');
const Assignment = require('../models/assignment.model');
const User = require('../models/user.model');
const { createError } = require('../utils/createError');
const logger = require('../utils/logger');

class SubmissionService {
  /**
   * Submit assignment
   */
  static async submitAssignment(submissionData, studentId) {
    try {
      const { assignment: assignmentId, studentComments, files } = submissionData;

      // Validate assignment exists and is published
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      if (assignment.status !== 'published') {
        throw createError(400, 'Assignment is not open for submissions');
      }

      // Check if student can submit
      const existingSubmissions = await Submission.find({
        assignment: assignmentId,
        student: studentId
      });

      if (existingSubmissions.length >= assignment.requirements.maxSubmissions) {
        throw createError(400, 'Maximum number of submissions reached');
      }

      // Check if submission is late
      const now = new Date();
      const effectiveDueDate = assignment.extendedDueDate || assignment.dueDate;
      const isLate = now > effectiveDueDate;

      if (isLate && !assignment.requirements.allowLateSubmission) {
        throw createError(400, 'Late submissions are not allowed for this assignment');
      }

      // Validate files
      if (files && files.length > 0) {
        for (const file of files) {
          // Validate file size
          if (file.fileSize > assignment.requirements.maxFileSize * 1024 * 1024) {
            throw createError(400, `File ${file.fileName} exceeds maximum size limit`);
          }

          // Validate file type
          if (assignment.requirements.allowedFileTypes.length > 0) {
            const fileExtension = file.fileName.split('.').pop().toLowerCase();
            if (!assignment.requirements.allowedFileTypes.includes(fileExtension)) {
              throw createError(400, `File type ${fileExtension} is not allowed`);
            }
          }
        }
      }

      // Calculate submission number
      const submissionNumber = existingSubmissions.length + 1;

      // Calculate late penalty if applicable
      let latePenalty = 0;
      if (isLate && assignment.requirements.latePenalty > 0) {
        latePenalty = assignment.calculateLatePenalty(now);
      }

      const submission = new Submission({
        assignment: assignmentId,
        student: studentId,
        files: files || [],
        submissionNumber,
        submittedAt: now,
        isLate,
        latePenalty,
        studentComments,
        status: isLate ? 'late' : 'submitted',
        createdBy: studentId
      });

      await submission.save();

      // Add history entry
      await submission.addHistoryEntry(
        'submitted',
        studentId,
        `Submission #${submissionNumber}${isLate ? ' (Late)' : ''}`
      );

      // Update assignment statistics
      await this.updateAssignmentStatistics(assignmentId);

      logger.info(`Assignment submitted: ${assignmentId} by student: ${studentId}`);

      return submission;
    } catch (error) {
      logger.error(`Error submitting assignment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get submissions with filtering and pagination
   */
  static async getSubmissions(filters, options, userRole, userId) {
    try {
      const filter = { ...filters };

      // Apply role-based filtering
      if (userRole === 'student') {
        // Students can only see their own submissions
        filter.student = userId;
      } else if (userRole === 'faculty') {
        // Faculty can see submissions for their assignments
        const facultyAssignments = await Assignment.find({ faculty: userId });
        const assignmentIds = facultyAssignments.map(a => a._id);
        filter.assignment = { $in: assignmentIds };
      }

      const submissions = await Submission.paginate(filter, {
        ...options,
        populate: [
          { path: 'assignment', select: 'title course faculty' },
          { path: 'student', select: 'firstName lastName email studentId' },
          { path: 'reviewedBy', select: 'firstName lastName' },
          { path: 'createdBy', select: 'firstName lastName' }
        ],
        sort: { submittedAt: -1 }
      });

      return submissions;
    } catch (error) {
      logger.error(`Error getting submissions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get submission by ID with proper permissions
   */
  static async getSubmissionById(submissionId, userRole, userId) {
    try {
      const submission = await Submission.findById(submissionId)
        .populate('assignment', 'title description course faculty requirements gradingCriteria')
        .populate('student', 'firstName lastName email studentId')
        .populate('reviewedBy', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .populate('lastModifiedBy', 'firstName lastName');

      if (!submission) {
        throw createError(404, 'Submission not found');
      }

      // Check permissions
      if (userRole === 'student' && submission.student.toString() !== userId) {
        throw createError(403, 'Access denied');
      } else if (userRole === 'faculty') {
        const assignment = await Assignment.findById(submission.assignment);
        if (assignment.faculty.toString() !== userId) {
          throw createError(403, 'Access denied');
        }
      }

      return submission;
    } catch (error) {
      logger.error(`Error getting submission: ${error.message}`);
      throw error;
    }
  }

  /**
   * Grade submission
   */
  static async gradeSubmission(submissionId, gradingData, reviewerId, userRole) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }

      // Check permissions - only faculty who created the assignment can grade
      const assignment = await Assignment.findById(submission.assignment);
      if (assignment.faculty.toString() !== reviewerId && userRole !== 'admin') {
        throw createError(403, 'Only the assignment creator or admin can grade this submission');
      }

      // Validate grading data
      if (gradingData.numericalScore < 0 || gradingData.numericalScore > 100) {
        throw createError(400, 'Numerical score must be between 0 and 100');
      }

      if (gradingData.criteriaScores && gradingData.criteriaScores.length > 0) {
        for (const criteria of gradingData.criteriaScores) {
          if (criteria.earnedPoints > criteria.maxPoints) {
            throw createError(400, `Earned points cannot exceed max points for criterion: ${criteria.criterion}`);
          }
        }
      }

      await submission.gradeSubmission(gradingData, reviewerId);

      // Update assignment statistics
      await this.updateAssignmentStatistics(submission.assignment);

      logger.info(`Submission graded: ${submissionId} by user: ${reviewerId}`);

      return submission;
    } catch (error) {
      logger.error(`Error grading submission: ${error.message}`);
      throw error;
    }
  }

  /**
   * Return submission for revision
   */
  static async returnSubmission(submissionId, feedbackData, returnedBy, userRole) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }

      // Check permissions
      const assignment = await Assignment.findById(submission.assignment);
      if (assignment.faculty.toString() !== returnedBy && userRole !== 'admin') {
        throw createError(403, 'Only the assignment creator or admin can return this submission');
      }

      await submission.returnForRevision(feedbackData, returnedBy);

      logger.info(`Submission returned: ${submissionId} by user: ${returnedBy}`);

      return submission;
    } catch (error) {
      logger.error(`Error returning submission: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check submission for plagiarism
   */
  static async checkPlagiarism(submissionId, plagiarismData, checkedBy, userRole) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }

      // Check permissions
      const assignment = await Assignment.findById(submission.assignment);
      if (assignment.faculty.toString() !== checkedBy && userRole !== 'admin') {
        throw createError(403, 'Only the assignment creator or admin can check plagiarism');
      }

      await submission.checkPlagiarism(
        plagiarismData.similarityScore,
        plagiarismData.reportUrl,
        checkedBy
      );

      logger.info(`Plagiarism check completed: ${submissionId} by user: ${checkedBy}`);

      return submission;
    } catch (error) {
      logger.error(`Error checking plagiarism: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify submission
   */
  static async verifySubmission(submissionId, notes, verifiedBy, userRole) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }

      // Check permissions
      const assignment = await Assignment.findById(submission.assignment);
      if (assignment.faculty.toString() !== verifiedBy && userRole !== 'admin') {
        throw createError(403, 'Only the assignment creator or admin can verify this submission');
      }

      await submission.verifySubmission(verifiedBy, notes);

      logger.info(`Submission verified: ${submissionId} by user: ${verifiedBy}`);

      return submission;
    } catch (error) {
      logger.error(`Error verifying submission: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add files to submission
   */
  static async addSubmissionFiles(submissionId, files, userId, userRole) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }

      // Check permissions
      if (submission.student.toString() !== userId && userRole !== 'admin') {
        throw createError(403, 'Only the student or admin can add files to this submission');
      }

      // Get assignment for validation
      const assignment = await Assignment.findById(submission.assignment);

      for (const file of files) {
        // Validate file size
        if (file.fileSize > assignment.requirements.maxFileSize * 1024 * 1024) {
          throw createError(400, `File ${file.fileName} exceeds maximum size limit`);
        }

        // Validate file type
        if (assignment.requirements.allowedFileTypes.length > 0) {
          const fileExtension = file.fileName.split('.').pop().toLowerCase();
          if (!assignment.requirements.allowedFileTypes.includes(fileExtension)) {
            throw createError(400, `File type ${fileExtension} is not allowed`);
          }
        }

        await submission.addFile(
          file.fileName,
          file.fileUrl,
          file.fileSize,
          file.fileType
        );
      }

      logger.info(`Files added to submission: ${submissionId} by user: ${userId}`);

      return submission;
    } catch (error) {
      logger.error(`Error adding files to submission: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove file from submission
   */
  static async removeSubmissionFile(submissionId, fileUrl, userId, userRole) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }

      // Check permissions
      if (submission.student.toString() !== userId && userRole !== 'admin') {
        throw createError(403, 'Only the student or admin can remove files from this submission');
      }

      await submission.removeFile(fileUrl);

      logger.info(`File removed from submission: ${submissionId} by user: ${userId}`);

      return submission;
    } catch (error) {
      logger.error(`Error removing file from submission: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete submission
   */
  static async deleteSubmission(submissionId, userId, userRole) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }

      // Check permissions
      if (submission.student.toString() !== userId && userRole !== 'admin') {
        throw createError(403, 'Only the student or admin can delete this submission');
      }

      await Submission.findByIdAndDelete(submissionId);

      // Update assignment statistics
      await this.updateAssignmentStatistics(submission.assignment);

      logger.info(`Submission deleted: ${submissionId} by user: ${userId}`);

      return { message: 'Submission deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting submission: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get submissions by assignment
   */
  static async getSubmissionsByAssignment(assignmentId, userRole, userId) {
    try {
      // Check permissions
      if (userRole === 'faculty') {
        const assignment = await Assignment.findById(assignmentId);
        if (assignment.faculty.toString() !== userId) {
          throw createError(403, 'Access denied');
        }
      }

      const submissions = await Submission.findByAssignment(assignmentId)
        .populate('student', 'firstName lastName email studentId')
        .populate('reviewedBy', 'firstName lastName');

      return submissions;
    } catch (error) {
      logger.error(`Error getting submissions by assignment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get submissions by student
   */
  static async getSubmissionsByStudent(studentId, userRole, userId) {
    try {
      // Check permissions
      if (userRole === 'student' && studentId !== userId) {
        throw createError(403, 'Access denied');
      }

      const submissions = await Submission.findByStudent(studentId)
        .populate('assignment', 'title course faculty')
        .populate('reviewedBy', 'firstName lastName');

      return submissions;
    } catch (error) {
      logger.error(`Error getting submissions by student: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get late submissions
   */
  static async getLateSubmissions(userRole, userId) {
    try {
      let submissions;

      if (userRole === 'student') {
        submissions = await Submission.find({ student: userId, isLate: true })
          .populate('assignment', 'title course faculty')
          .sort({ submittedAt: -1 });
      } else if (userRole === 'faculty') {
        const facultyAssignments = await Assignment.find({ faculty: userId });
        const assignmentIds = facultyAssignments.map(a => a._id);
        submissions = await Submission.find({
          assignment: { $in: assignmentIds },
          isLate: true
        })
          .populate('assignment', 'title course faculty')
          .populate('student', 'firstName lastName email')
          .sort({ submittedAt: -1 });
      } else {
        submissions = await Submission.findLate()
          .populate('assignment', 'title course faculty')
          .populate('student', 'firstName lastName email');
      }

      return submissions;
    } catch (error) {
      logger.error(`Error getting late submissions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get ungraded submissions
   */
  static async getUngradedSubmissions(userRole, userId) {
    try {
      let submissions;

      if (userRole === 'faculty') {
        const facultyAssignments = await Assignment.find({ faculty: userId });
        const assignmentIds = facultyAssignments.map(a => a._id);
        submissions = await Submission.find({
          assignment: { $in: assignmentIds },
          status: { $in: ['submitted', 'under_review'] },
          grade: { $exists: false }
        })
          .populate('assignment', 'title course faculty')
          .populate('student', 'firstName lastName email')
          .sort({ submittedAt: 1 });
      } else {
        submissions = await Submission.findUngraded()
          .populate('assignment', 'title course faculty')
          .populate('student', 'firstName lastName email');
      }

      return submissions;
    } catch (error) {
      logger.error(`Error getting ungraded submissions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get graded submissions
   */
  static async getGradedSubmissions(userRole, userId) {
    try {
      let submissions;

      if (userRole === 'student') {
        submissions = await Submission.find({
          student: userId,
          status: 'graded',
          grade: { $exists: true, $ne: null }
        })
          .populate('assignment', 'title course faculty')
          .populate('reviewedBy', 'firstName lastName')
          .sort({ reviewedAt: -1 });
      } else if (userRole === 'faculty') {
        const facultyAssignments = await Assignment.find({ faculty: userId });
        const assignmentIds = facultyAssignments.map(a => a._id);
        submissions = await Submission.find({
          assignment: { $in: assignmentIds },
          status: 'graded',
          grade: { $exists: true, $ne: null }
        })
          .populate('assignment', 'title course faculty')
          .populate('student', 'firstName lastName email')
          .populate('reviewedBy', 'firstName lastName')
          .sort({ reviewedAt: -1 });
      } else {
        submissions = await Submission.findGraded()
          .populate('assignment', 'title course faculty')
          .populate('student', 'firstName lastName email')
          .populate('reviewedBy', 'firstName lastName');
      }

      return submissions;
    } catch (error) {
      logger.error(`Error getting graded submissions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get plagiarism flagged submissions
   */
  static async getPlagiarismFlaggedSubmissions(userRole, userId) {
    try {
      let submissions;

      if (userRole === 'faculty') {
        const facultyAssignments = await Assignment.find({ faculty: userId });
        const assignmentIds = facultyAssignments.map(a => a._id);
        submissions = await Submission.find({
          assignment: { $in: assignmentIds },
          'plagiarismCheck.flagged': true
        })
          .populate('assignment', 'title course faculty')
          .populate('student', 'firstName lastName email')
          .sort({ submittedAt: -1 });
      } else {
        submissions = await Submission.findPlagiarismFlagged()
          .populate('assignment', 'title course faculty')
          .populate('student', 'firstName lastName email');
      }

      return submissions;
    } catch (error) {
      logger.error(`Error getting plagiarism flagged submissions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search submissions
   */
  static async searchSubmissions(searchTerm, userRole, userId) {
    try {
      const filter = {
        $or: [
          { studentComments: { $regex: searchTerm, $options: 'i' } },
          { 'feedback.general': { $regex: searchTerm, $options: 'i' } }
        ]
      };

      // Apply role-based filtering
      if (userRole === 'student') {
        filter.student = userId;
      } else if (userRole === 'faculty') {
        const facultyAssignments = await Assignment.find({ faculty: userId });
        const assignmentIds = facultyAssignments.map(a => a._id);
        filter.assignment = { $in: assignmentIds };
      }

      const submissions = await Submission.find(filter)
        .populate('assignment', 'title course faculty')
        .populate('student', 'firstName lastName email')
        .sort({ submittedAt: -1 });

      return submissions;
    } catch (error) {
      logger.error(`Error searching submissions: ${error.message}`);
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

  /**
   * Get submission statistics
   */
  static async getSubmissionStatistics(userRole, userId) {
    try {
      let filter = {};

      if (userRole === 'student') {
        filter.student = userId;
      } else if (userRole === 'faculty') {
        const facultyAssignments = await Assignment.find({ faculty: userId });
        const assignmentIds = facultyAssignments.map(a => a._id);
        filter.assignment = { $in: assignmentIds };
      }

      const submissions = await Submission.find(filter);

      const statistics = {
        totalSubmissions: submissions.length,
        onTimeSubmissions: submissions.filter(s => !s.isLate).length,
        lateSubmissions: submissions.filter(s => s.isLate).length,
        gradedSubmissions: submissions.filter(s => s.status === 'graded').length,
        averageScore: submissions.length > 0 
          ? submissions.reduce((sum, s) => sum + (s.numericalScore || 0), 0) / submissions.length 
          : 0,
        plagiarismFlagged: submissions.filter(s => s.plagiarismCheck.flagged).length,
        gradeDistribution: {}
      };

      // Calculate grade distribution
      submissions.forEach(submission => {
        if (submission.grade) {
          statistics.gradeDistribution[submission.grade] = 
            (statistics.gradeDistribution[submission.grade] || 0) + 1;
        }
      });

      return statistics;
    } catch (error) {
      logger.error(`Error getting submission statistics: ${error.message}`);
      throw error;
    }
  }
}

module.exports = SubmissionService; 