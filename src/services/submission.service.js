const Submission = require('../models/submission.model');
const Assignment = require('../models/assignment.model');
const User = require('../models/user.model');
const { uploadImage, deleteImage } = require('../config/cloudinary.config');
const createError = require('../utils/createError');
const logger = require('../utils/logger');

class SubmissionService {
  /**
   * Create a new submission
   */
  async createSubmission(submissionData, userId) {
    try {
      // Check if assignment exists and is published
      const assignment = await Assignment.findById(submissionData.assignment);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }
      
      if (assignment.status !== 'published') {
        throw createError(400, 'Cannot submit to unpublished assignment');
      }
      
      // Check if student exists
      const student = await User.findById(submissionData.student);
      if (!student || student.role !== 'student') {
        throw createError(404, 'Student not found');
      }
      
      // Check if submission already exists for this student and assignment
      const existingSubmission = await Submission.findOne({
        assignment: submissionData.assignment,
        student: submissionData.student
      });
      
      if (existingSubmission) {
        // Create a new submission with incremented submission number
        submissionData.submissionNumber = existingSubmission.submissionNumber + 1;
      }
      
      // Check if submission is late
      const now = new Date();
      if (assignment.dueDate && now > assignment.dueDate) {
        submissionData.isLate = true;
        submissionData.latePenalty = assignment.requirements?.latePenalty || 0;
        submissionData.status = 'late';
      }
      
      // Add metadata
      submissionData.createdBy = userId;
      submissionData.ipAddress = submissionData.ipAddress || 'unknown';
      submissionData.userAgent = submissionData.userAgent || 'unknown';
      
      const submission = new Submission(submissionData);
      await submission.save();
      
      // Add history entry
      await submission.addHistoryEntry('submitted', userId, 'Initial submission');
      
      logger.info(`Submission created: ${submission._id} for assignment: ${submissionData.assignment}`);
      
      return submission;
    } catch (error) {
      logger.error('Error creating submission:', error);
      throw error;
    }
  }
  
  /**
   * Get submissions with filtering and pagination
   */
  async getSubmissions(query, user) {
    try {
      const {
        page = 1,
        limit = 10,
        assignment,
        student,
        status,
        grade,
        isLate,
        plagiarismFlagged,
        sortBy = 'submittedAt',
        sortOrder = 'desc',
        search
      } = query;
      
      // Build filter object
      const filter = {};
      
      if (assignment) filter.assignment = assignment;
      if (student) filter.student = student;
      if (status) filter.status = status;
      if (grade) filter.grade = grade;
      if (isLate !== undefined) filter.isLate = isLate;
      if (plagiarismFlagged !== undefined) filter['plagiarismCheck.flagged'] = plagiarismFlagged;
      
      // Role-based filtering
      if (user.role === 'student') {
        filter.student = user._id;
      } else if (user.role === 'faculty') {
        // Faculty can see submissions for assignments they created
        const facultyAssignments = await Assignment.find({ faculty: user._id }).select('_id');
        filter.assignment = { $in: facultyAssignments.map(a => a._id) };
      }
      
      // Search functionality
      if (search) {
        filter.$or = [
          { 'files.fileName': { $regex: search, $options: 'i' } },
          { studentComments: { $regex: search, $options: 'i' } },
          { instructorNotes: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Execute query with pagination
      const skip = (page - 1) * limit;
      const submissions = await Submission.find(filter)
        .populate('assignment', 'title course')
        .populate('student', 'firstName lastName email')
        .populate('reviewedBy', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      // Get total count
      const total = await Submission.countDocuments(filter);
      
      return {
        submissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting submissions:', error);
      throw error;
    }
  }
  
  /**
   * Get submission by ID
   */
  async getSubmissionById(submissionId, user) {
    try {
      const submission = await Submission.findById(submissionId)
        .populate('assignment', 'title description course faculty dueDate totalPoints')
        .populate('student', 'firstName lastName email')
        .populate('reviewedBy', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .populate('verification.verifiedBy', 'firstName lastName');
      
      if (!submission) {
        throw createError(404, 'Submission not found');
      }
      
      // Check access permissions
      if (user.role === 'student' && submission.student.toString() !== user._id.toString()) {
        throw createError(403, 'Access denied');
      }
      
      if (user.role === 'faculty') {
        const assignment = await Assignment.findById(submission.assignment._id);
        if (assignment.faculty.toString() !== user._id.toString()) {
          throw createError(403, 'Access denied');
        }
      }
      
      return submission;
    } catch (error) {
      logger.error('Error getting submission by ID:', error);
      throw error;
    }
  }
  
  /**
   * Update submission
   */
  async updateSubmission(submissionId, updateData, userId) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }
      
      // Check permissions
      if (user.role === 'student' && submission.student.toString() !== user._id.toString()) {
        throw createError(403, 'Access denied');
      }
      
      if (user.role === 'faculty') {
        const assignment = await Assignment.findById(submission.assignment);
        if (assignment.faculty.toString() !== user._id.toString()) {
          throw createError(403, 'Access denied');
        }
      }
      
      // Update fields
      Object.keys(updateData).forEach(key => {
        if (key !== '_id' && key !== 'createdBy') {
          submission[key] = updateData[key];
        }
      });
      
      submission.lastModifiedBy = userId;
      await submission.save();
      
      logger.info(`Submission updated: ${submissionId} by user: ${userId}`);
      
      return submission;
    } catch (error) {
      logger.error('Error updating submission:', error);
      throw error;
    }
  }
  
  /**
   * Delete submission
   */
  async deleteSubmission(submissionId, userId) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }
      
      // Check permissions (only admin or faculty who created the assignment)
      if (user.role === 'student') {
        throw createError(403, 'Students cannot delete submissions');
      }
      
      if (user.role === 'faculty') {
        const assignment = await Assignment.findById(submission.assignment);
        if (assignment.faculty.toString() !== user._id.toString()) {
          throw createError(403, 'Access denied');
        }
      }
      
      // Delete files from Cloudinary
      for (const file of submission.files) {
        try {
          await deleteImage(file.fileUrl);
        } catch (fileError) {
          logger.warn(`Failed to delete file from Cloudinary: ${file.fileUrl}`, fileError);
        }
      }
      
      await Submission.findByIdAndDelete(submissionId);
      
      logger.info(`Submission deleted: ${submissionId} by user: ${userId}`);
      
      return { message: 'Submission deleted successfully' };
    } catch (error) {
      logger.error('Error deleting submission:', error);
      throw error;
    }
  }
  
  /**
   * Add file to submission
   */
  async addFileToSubmission(submissionId, fileData, userId) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }
      
      // Check permissions
      if (user.role === 'student' && submission.student.toString() !== user._id.toString()) {
        throw createError(403, 'Access denied');
      }
      
      // Upload file to Cloudinary
      let fileUrl;
      if (fileData.fileBuffer) {
        const uploadResult = await uploadImage(fileData.fileBuffer, { folder: 'smart-campus/submissions' });
        fileUrl = uploadResult.url;
      } else {
        fileUrl = fileData.fileUrl;
      }
      
      // Add file to submission
      await submission.addFile(
        fileData.fileName,
        fileUrl,
        fileData.fileSize,
        fileData.fileType
      );
      
      logger.info(`File added to submission: ${submissionId} by user: ${userId}`);
      
      return submission;
    } catch (error) {
      logger.error('Error adding file to submission:', error);
      throw error;
    }
  }
  
  /**
   * Remove file from submission
   */
  async removeFileFromSubmission(submissionId, fileUrl, userId) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }
      
      // Check permissions
      if (user.role === 'student' && submission.student.toString() !== user._id.toString()) {
        throw createError(403, 'Access denied');
      }
      
      // Remove file from Cloudinary
      try {
        await deleteImage(fileUrl);
      } catch (fileError) {
        logger.warn(`Failed to delete file from Cloudinary: ${fileUrl}`, fileError);
      }
      
      // Remove file from submission
      await submission.removeFile(fileUrl);
      
      logger.info(`File removed from submission: ${submissionId} by user: ${userId}`);
      
      return submission;
    } catch (error) {
      logger.error('Error removing file from submission:', error);
      throw error;
    }
  }
  
  /**
   * Grade submission
   */
  async gradeSubmission(submissionId, gradingData, userId) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }
      
      // Check permissions (only faculty who created the assignment)
      if (user.role === 'student') {
        throw createError(403, 'Students cannot grade submissions');
      }
      
      const assignment = await Assignment.findById(submission.assignment);
      if (assignment.faculty.toString() !== user._id.toString()) {
        throw createError(403, 'Access denied');
      }
      
      // Grade the submission
      await submission.gradeSubmission(gradingData, userId);
      
      logger.info(`Submission graded: ${submissionId} by user: ${userId}`);
      
      return submission;
    } catch (error) {
      logger.error('Error grading submission:', error);
      throw error;
    }
  }
  
  /**
   * Return submission for revision
   */
  async returnSubmissionForRevision(submissionId, feedback, userId) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }
      
      // Check permissions
      if (user.role === 'student') {
        throw createError(403, 'Students cannot return submissions');
      }
      
      const assignment = await Assignment.findById(submission.assignment);
      if (assignment.faculty.toString() !== user._id.toString()) {
        throw createError(403, 'Access denied');
      }
      
      // Return submission for revision
      await submission.returnForRevision(feedback, userId);
      
      logger.info(`Submission returned for revision: ${submissionId} by user: ${userId}`);
      
      return submission;
    } catch (error) {
      logger.error('Error returning submission for revision:', error);
      throw error;
    }
  }
  
  /**
   * Mark submission as late
   */
  async markSubmissionAsLate(submissionId, penalty, userId) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }
      
      // Check permissions
      if (user.role === 'student') {
        throw createError(403, 'Students cannot mark submissions as late');
      }
      
      const assignment = await Assignment.findById(submission.assignment);
      if (assignment.faculty.toString() !== user._id.toString()) {
        throw createError(403, 'Access denied');
      }
      
      // Mark as late
      await submission.markAsLate(penalty, userId);
      
      logger.info(`Submission marked as late: ${submissionId} by user: ${userId}`);
      
      return submission;
    } catch (error) {
      logger.error('Error marking submission as late:', error);
      throw error;
    }
  }
  
  /**
   * Check plagiarism
   */
  async checkPlagiarism(submissionId, plagiarismData, userId) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }
      
      // Check permissions
      if (user.role === 'student') {
        throw createError(403, 'Students cannot check plagiarism');
      }
      
      const assignment = await Assignment.findById(submission.assignment);
      if (assignment.faculty.toString() !== user._id.toString()) {
        throw createError(403, 'Access denied');
      }
      
      // Check plagiarism
      await submission.checkPlagiarism(
        plagiarismData.similarityScore,
        plagiarismData.reportUrl,
        userId
      );
      
      logger.info(`Plagiarism check completed: ${submissionId} by user: ${userId}`);
      
      return submission;
    } catch (error) {
      logger.error('Error checking plagiarism:', error);
      throw error;
    }
  }
  
  /**
   * Verify submission
   */
  async verifySubmission(submissionId, notes, userId) {
    try {
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        throw createError(404, 'Submission not found');
      }
      
      // Check permissions (only admin or faculty)
      if (user.role === 'student') {
        throw createError(403, 'Students cannot verify submissions');
      }
      
      if (user.role === 'faculty') {
        const assignment = await Assignment.findById(submission.assignment);
        if (assignment.faculty.toString() !== user._id.toString()) {
          throw createError(403, 'Access denied');
        }
      }
      
      // Verify submission
      await submission.verifySubmission(userId, notes);
      
      logger.info(`Submission verified: ${submissionId} by user: ${userId}`);
      
      return submission;
    } catch (error) {
      logger.error('Error verifying submission:', error);
      throw error;
    }
  }
  
  /**
   * Get submissions by assignment
   */
  async getSubmissionsByAssignment(assignmentId, user) {
    try {
      // Check if assignment exists
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }
      
      // Check permissions
      if (user.role === 'student') {
        throw createError(403, 'Students cannot view all submissions for an assignment');
      }
      
      if (user.role === 'faculty' && assignment.faculty.toString() !== user._id.toString()) {
        throw createError(403, 'Access denied');
      }
      
      const submissions = await Submission.findByAssignment(assignmentId)
        .populate('student', 'firstName lastName email')
        .populate('reviewedBy', 'firstName lastName')
        .lean();
      
      return submissions;
    } catch (error) {
      logger.error('Error getting submissions by assignment:', error);
      throw error;
    }
  }
  
  /**
   * Get submissions by student
   */
  async getSubmissionsByStudent(studentId, user, query = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        assignment,
        course,
        isLate,
        isGraded,
        sortBy = 'submittedAt',
        sortOrder = 'desc'
      } = query;

      // Check permissions
      if (user.role === 'student' && studentId !== user._id.toString()) {
        throw createError(403, 'Students can only view their own submissions');
      }
      
      // Build filter object
      const filter = { student: studentId };
      
      if (user.role === 'faculty') {
        // Faculty can only see submissions for assignments they created
        const facultyAssignments = await Assignment.find({ faculty: user._id }).select('_id');
        filter.assignment = { $in: facultyAssignments.map(a => a._id) };
      }
      
      // Apply additional filters
      if (status) filter.status = status;
      if (assignment) filter.assignment = assignment;
      if (isLate !== undefined) filter.isLate = isLate;
      if (isGraded !== undefined) {
        if (isGraded) {
          filter.status = 'graded';
        } else {
          filter.status = { $ne: 'graded' };
        }
      }
      
      // Search functionality
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Course filtering (if needed)
      if (course) {
        // This would require a lookup to assignment.course
        // For now, we'll implement this later if needed
      }
      
      // Build aggregation pipeline
      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: 'assignments',
            localField: 'assignment',
            foreignField: '_id',
            as: 'assignmentInfo'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'reviewedBy',
            foreignField: '_id',
            as: 'reviewedByInfo'
          }
        },
        {
          $addFields: {
            assignment: { $arrayElemAt: ['$assignmentInfo', 0] },
            reviewedBy: { $arrayElemAt: ['$reviewedByInfo', 0] }
          }
        },
        {
          $project: {
            assignmentInfo: 0,
            reviewedByInfo: 0
          }
        }
      ];
      
      // Course filtering after lookup
      if (course) {
        pipeline.push({
          $match: {
            'assignment.course': course
          }
        });
      }
      
      // Get total count for pagination
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Submission.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;
      
      // Add sorting and pagination
      pipeline.push(
        { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) }
      );
      
      // Execute aggregation
      const submissions = await Submission.aggregate(pipeline);
      
      return {
        submissions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting submissions by student:', error);
      throw error;
    }
  }
  
  /**
   * Get submission statistics
   */
  async getSubmissionStats(user) {
    try {
      let matchStage = {};
      
      // Role-based filtering
      if (user.role === 'student') {
        matchStage.student = user._id;
      } else if (user.role === 'faculty') {
        const facultyAssignments = await Assignment.find({ faculty: user._id }).select('_id');
        matchStage.assignment = { $in: facultyAssignments.map(a => a._id) };
      }
      
      const stats = await Submission.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalSubmissions: { $sum: 1 },
            gradedSubmissions: {
              $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] }
            },
            lateSubmissions: {
              $sum: { $cond: [{ $eq: ['$isLate', true] }, 1, 0] }
            },
            plagiarismFlagged: {
              $sum: { $cond: [{ $eq: ['$plagiarismCheck.flagged', true] }, 1, 0] }
            },
            averageScore: { $avg: '$numericalScore' },
            verifiedSubmissions: {
              $sum: { $cond: [{ $eq: ['$verification.isVerified', true] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalSubmissions: 1,
            gradedSubmissions: 1,
            lateSubmissions: 1,
            plagiarismFlagged: 1,
            averageScore: { $round: ['$averageScore', 2] },
            verifiedSubmissions: 1,
            pendingSubmissions: { $subtract: ['$totalSubmissions', '$gradedSubmissions'] }
          }
        }
      ]);
      
      return stats[0] || {
        totalSubmissions: 0,
        gradedSubmissions: 0,
        lateSubmissions: 0,
        plagiarismFlagged: 0,
        averageScore: 0,
        verifiedSubmissions: 0,
        pendingSubmissions: 0
      };
    } catch (error) {
      logger.error('Error getting submission stats:', error);
      throw error;
    }
  }
  
  /**
   * Bulk operations on submissions
   */
  async bulkOperation(operationData, userId) {
    try {
      const { operation, submissionIds, data } = operationData;
      
      // Check permissions
      if (user.role === 'student') {
        throw createError(403, 'Students cannot perform bulk operations');
      }
      
      const results = {
        success: [],
        failed: [],
        total: submissionIds.length
      };
      
      for (const submissionId of submissionIds) {
        try {
          const submission = await Submission.findById(submissionId);
          if (!submission) {
            results.failed.push({ id: submissionId, error: 'Submission not found' });
            continue;
          }
          
          // Check faculty permissions
          if (user.role === 'faculty') {
            const assignment = await Assignment.findById(submission.assignment);
            if (assignment.faculty.toString() !== user._id.toString()) {
              results.failed.push({ id: submissionId, error: 'Access denied' });
              continue;
            }
          }
          
          // Perform operation
          switch (operation) {
            case 'grade':
              await submission.gradeSubmission(data, userId);
              break;
            case 'return':
              await submission.returnForRevision(data.feedback, userId);
              break;
            case 'markLate':
              await submission.markAsLate(data.penalty, userId);
              break;
            case 'checkPlagiarism':
              await submission.checkPlagiarism(data.similarityScore, data.reportUrl, userId);
              break;
            case 'verify':
              await submission.verifySubmission(userId, data.notes);
              break;
            case 'delete':
              await this.deleteSubmission(submissionId, userId);
              break;
            default:
              throw new Error(`Unknown operation: ${operation}`);
          }
          
          results.success.push(submissionId);
        } catch (error) {
          results.failed.push({ id: submissionId, error: error.message });
        }
      }
      
      logger.info(`Bulk operation completed: ${operation} on ${results.success.length} submissions by user: ${userId}`);
      
      return results;
    } catch (error) {
      logger.error('Error performing bulk operation:', error);
      throw error;
    }
  }
  
  /**
   * Get late submissions
   */
  async getLateSubmissions(user) {
    try {
      let filter = { isLate: true };
      
      // Role-based filtering
      if (user.role === 'student') {
        filter.student = user._id;
      } else if (user.role === 'faculty') {
        const facultyAssignments = await Assignment.find({ faculty: user._id }).select('_id');
        filter.assignment = { $in: facultyAssignments.map(a => a._id) };
      }
      
      const submissions = await Submission.find(filter)
        .populate('assignment', 'title course')
        .populate('student', 'firstName lastName email')
        .sort({ submittedAt: -1 })
        .lean();
      
      return submissions;
    } catch (error) {
      logger.error('Error getting late submissions:', error);
      throw error;
    }
  }
  
  /**
   * Get ungraded submissions
   */
  async getUngradedSubmissions(user) {
    try {
      let filter = { 
        status: { $in: ['submitted', 'under_review'] },
        grade: { $exists: false }
      };
      
      // Role-based filtering
      if (user.role === 'student') {
        filter.student = user._id;
      } else if (user.role === 'faculty') {
        const facultyAssignments = await Assignment.find({ faculty: user._id }).select('_id');
        filter.assignment = { $in: facultyAssignments.map(a => a._id) };
      }
      
      const submissions = await Submission.find(filter)
        .populate('assignment', 'title course')
        .populate('student', 'firstName lastName email')
        .sort({ submittedAt: 1 })
        .lean();
      
      return submissions;
    } catch (error) {
      logger.error('Error getting ungraded submissions:', error);
      throw error;
    }
  }
  
  /**
   * Get plagiarism flagged submissions
   */
  async getPlagiarismFlaggedSubmissions(user) {
    try {
      let filter = { 'plagiarismCheck.flagged': true };
      
      // Role-based filtering
      if (user.role === 'student') {
        filter.student = user._id;
      } else if (user.role === 'faculty') {
        const facultyAssignments = await Assignment.find({ faculty: user._id }).select('_id');
        filter.assignment = { $in: facultyAssignments.map(a => a._id) };
      }
      
      const submissions = await Submission.find(filter)
        .populate('assignment', 'title course')
        .populate('student', 'firstName lastName email')
        .sort({ submittedAt: -1 })
        .lean();
      
      return submissions;
    } catch (error) {
      logger.error('Error getting plagiarism flagged submissions:', error);
      throw error;
    }
  }
}

module.exports = new SubmissionService(); 