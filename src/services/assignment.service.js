const Assignment = require('../models/assignment.model');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const { ResponseHandler } = require('../utils/responseHandler');
const logger = require('../utils/logger');
const createError = require('../utils/createError');
const { uploadImage, deleteImage } = require('../config/cloudinary.config');

class AssignmentService {
  /**
   * Create a new assignment
   */
  async createAssignment(assignmentData, userId) {
    try {
      // Validate that course exists
      const course = await Course.findById(assignmentData.course);
      if (!course) {
        throw createError(404, 'Course not found');
      }

      // Get user information to check role
      const user = await User.findById(userId);
      if (!user) {
        throw createError(404, 'User not found');
      }

      // Check permissions: admin can create any assignment, faculty can create for their courses
      const isAdmin = user.role === 'admin';
      const isCourseFaculty = course.faculty.toString() === userId.toString();
      
      if (!isAdmin && !isCourseFaculty) {
        throw createError(403, 'Only course faculty or admin can create assignments for this course');
      }

      // Set faculty to course faculty if not provided
      if (!assignmentData.faculty) {
        assignmentData.faculty = course.faculty;
      }

      // Validate that faculty exists and is actually a faculty member
      const faculty = await User.findById(assignmentData.faculty);
      if (!faculty || faculty.role !== 'faculty') {
        throw createError(400, 'Invalid faculty member');
      }

      // Validate grading criteria points match total points
      if (assignmentData.gradingCriteria && assignmentData.gradingCriteria.length > 0) {
        const criteriaPoints = assignmentData.gradingCriteria.reduce((sum, criteria) => sum + criteria.maxPoints, 0);
        if (criteriaPoints !== assignmentData.totalPoints) {
          throw createError(400, 'Total points must match the sum of grading criteria points');
        }
      }

      const assignment = new Assignment({
        ...assignmentData,
        createdBy: userId,
        lastModifiedBy: userId
      });

      await assignment.save();
      
      logger.info(`Assignment created: ${assignment._id} by user: ${userId}`);
      return assignment;
    } catch (error) {
      logger.error('Error creating assignment:', error);
      throw error;
    }
  }

  /**
   * Get assignments with filtering, pagination, and search
   */
  async getAssignments(query, user) {
    try {
      const {
        page = 1,
        limit = 10,
        course,
        faculty,
        assignmentType,
        status,
        difficulty,
        isVisible,
        dueDateFrom,
        dueDateTo,
        sortBy = 'dueDate',
        sortOrder = 'asc',
        search,
        tags
      } = query;

      // Build filter object
      const filter = {};

      // Role-based filtering
      if (user.role === 'student') {
        // Students can only see published assignments
        filter.status = 'published';
        filter.isVisible = true;
        
        // Note: Student enrollment should be checked through the enrollment model
        // For now, students can see all published assignments
      } else if (user.role === 'faculty') {
        // Faculty can see their own assignments and published assignments
        filter.$or = [
          { faculty: user._id },
          { status: 'published', isVisible: true }
        ];
      }
      // Admins can see all assignments

      // Apply additional filters
      if (course) filter.course = course;
      if (faculty) filter.faculty = faculty;
      if (assignmentType) filter.assignmentType = assignmentType;
      if (status) filter.status = status;
      if (difficulty) filter.difficulty = difficulty;
      if (isVisible !== undefined) filter.isVisible = isVisible;

      // Date range filtering
      if (dueDateFrom || dueDateTo) {
        filter.dueDate = {};
        if (dueDateFrom) filter.dueDate.$gte = new Date(dueDateFrom);
        if (dueDateTo) filter.dueDate.$lte = new Date(dueDateTo);
      }

      // Search functionality
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Tags filtering
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
        filter.tags = { $in: tagArray };
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const assignments = await Assignment.find(filter)
        .populate('course', 'name code')
        .populate('faculty', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count for pagination
      const total = await Assignment.countDocuments(filter);

      return {
        assignments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting assignments:', error);
      throw error;
    }
  }

  /**
   * Get assignment by ID
   */
  async getAssignmentById(assignmentId, user) {
    try {
      const assignment = await Assignment.findById(assignmentId)
        .populate('course', 'name code description')
        .populate('faculty', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .populate('lastModifiedBy', 'firstName lastName');

      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      // Check access permissions
      if (user.role === 'student') {
        if (assignment.status !== 'published' || !assignment.isVisible) {
          throw createError(403, 'Access denied');
        }
        
        // Note: Student enrollment should be checked through the enrollment model
        // For now, students can access published assignments
      } else if (user.role === 'faculty') {
        if (assignment.faculty.toString() !== user._id.toString() && assignment.status !== 'published') {
          throw createError(403, 'Access denied');
        }
      }

      return assignment;
    } catch (error) {
      logger.error('Error getting assignment by ID:', error);
      throw error;
    }
  }

  /**
   * Update assignment
   */
  async updateAssignment(assignmentId, updateData, userId) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      // Check permissions
      if (assignment.faculty.toString() !== userId.toString() && assignment.createdBy.toString() !== userId.toString()) {
        throw createError(403, 'Only assignment creator or faculty can update this assignment');
      }

      // Validate grading criteria points match total points if both are provided
      if (updateData.gradingCriteria && updateData.totalPoints) {
        const criteriaPoints = updateData.gradingCriteria.reduce((sum, criteria) => sum + criteria.maxPoints, 0);
        if (criteriaPoints !== updateData.totalPoints) {
          throw createError(400, 'Total points must match the sum of grading criteria points');
        }
      }

      // Update assignment
      Object.assign(assignment, updateData, { lastModifiedBy: userId });
      await assignment.save();

      logger.info(`Assignment updated: ${assignmentId} by user: ${userId}`);
      return assignment;
    } catch (error) {
      logger.error('Error updating assignment:', error);
      throw error;
    }
  }

  /**
   * Delete assignment
   */
  async deleteAssignment(assignmentId, userId) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      // Check permissions
      if (assignment.faculty.toString() !== userId.toString() && assignment.createdBy.toString() !== userId.toString()) {
        throw createError(403, 'Only assignment creator or faculty can delete this assignment');
      }

      // Delete associated files from Cloudinary
      if (assignment.files && assignment.files.length > 0) {
        for (const file of assignment.files) {
          try {
            await deleteImage(file.fileUrl);
          } catch (fileError) {
            logger.warn(`Failed to delete file from Cloudinary: ${file.fileUrl}`, fileError);
          }
        }
      }

      await Assignment.findByIdAndDelete(assignmentId);

      logger.info(`Assignment deleted: ${assignmentId} by user: ${userId}`);
      return { message: 'Assignment deleted successfully' };
    } catch (error) {
      logger.error('Error deleting assignment:', error);
      throw error;
    }
  }

  /**
   * Add file to assignment
   */
  async addFileToAssignment(assignmentId, fileData, userId) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      // Check permissions
      if (assignment.faculty.toString() !== userId.toString() && assignment.createdBy.toString() !== userId.toString()) {
        throw createError(403, 'Only assignment creator or faculty can add files');
      }

      // Upload file to Cloudinary if file buffer is provided
      let fileUrl = fileData.fileUrl;
      if (fileData.fileBuffer) {
        const uploadResult = await uploadImage(fileData.fileBuffer, { folder: 'smart-campus/assignments' });
        fileUrl = uploadResult.url;
      }

      // Add file to assignment
      await assignment.addFile(
        fileData.fileName,
        fileUrl,
        fileData.fileSize,
        fileData.fileType
      );

      logger.info(`File added to assignment: ${assignmentId} by user: ${userId}`);
      return assignment;
    } catch (error) {
      logger.error('Error adding file to assignment:', error);
      throw error;
    }
  }

  /**
   * Remove file from assignment
   */
  async removeFileFromAssignment(assignmentId, fileUrl, userId) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      // Check permissions
      if (assignment.faculty.toString() !== userId.toString() && assignment.createdBy.toString() !== userId.toString()) {
        throw createError(403, 'Only assignment creator or faculty can remove files');
      }

      // Find the file
      const file = assignment.files.find(f => f.fileUrl === fileUrl);
      if (!file) {
        throw createError(404, 'File not found in assignment');
      }

      // Delete from Cloudinary
      try {
        await deleteImage(fileUrl);
      } catch (fileError) {
        logger.warn(`Failed to delete file from Cloudinary: ${fileUrl}`, fileError);
      }

      // Remove file from assignment
      await assignment.removeFile(fileUrl);

      logger.info(`File removed from assignment: ${assignmentId} by user: ${userId}`);
      return assignment;
    } catch (error) {
      logger.error('Error removing file from assignment:', error);
      throw error;
    }
  }

  /**
   * Update assignment status
   */
  async updateAssignmentStatus(assignmentId, status, userId) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      // Check permissions
      if (assignment.faculty.toString() !== userId.toString() && assignment.createdBy.toString() !== userId.toString()) {
        throw createError(403, 'Only assignment creator or faculty can update status');
      }

      // Update status based on the new status
      switch (status) {
        case 'published':
          await assignment.publish();
          break;
        case 'submission_closed':
          await assignment.closeSubmissions();
          break;
        case 'grading':
          await assignment.startGrading();
          break;
        case 'completed':
          await assignment.complete();
          break;
        case 'archived':
          await assignment.archive();
          break;
        default:
          assignment.status = status;
          await assignment.save();
      }

      logger.info(`Assignment status updated: ${assignmentId} to ${status} by user: ${userId}`);
      return assignment;
    } catch (error) {
      logger.error('Error updating assignment status:', error);
      throw error;
    }
  }

  /**
   * Get assignments by course
   */
  async getAssignmentsByCourse(courseId, user) {
    try {
      // Check if user has access to the course
      const course = await Course.findById(courseId);
      if (!course) {
        throw createError(404, 'Course not found');
      }

      if (user.role === 'student') {
        // Note: Student enrollment should be checked through the enrollment model
        // For now, students can access course assignments
      } else if (user.role === 'faculty') {
        if (course.faculty.toString() !== user._id.toString()) {
          throw createError(403, 'Access denied - not course faculty');
        }
      }

      const filter = { course: courseId };
      
      // Students can only see published assignments
      if (user.role === 'student') {
        filter.status = 'published';
        filter.isVisible = true;
      }

      const assignments = await Assignment.find(filter)
        .populate('faculty', 'firstName lastName')
        .sort({ dueDate: 1 })
        .lean();

      return assignments;
    } catch (error) {
      logger.error('Error getting assignments by course:', error);
      throw error;
    }
  }

  /**
   * Get assignments by faculty
   */
  async getAssignmentsByFaculty(facultyId, user) {
    try {
      // Check permissions
      if (user.role === 'student') {
        throw createError(403, 'Students cannot access faculty assignments');
      }

      if (user.role === 'faculty' && user._id.toString() !== facultyId) {
        throw createError(403, 'Faculty can only access their own assignments');
      }

      const assignments = await Assignment.find({ faculty: facultyId })
        .populate('course', 'name code')
        .sort({ dueDate: 1 })
        .lean();

      return assignments;
    } catch (error) {
      logger.error('Error getting assignments by faculty:', error);
      throw error;
    }
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats(user) {
    try {
      // Check permissions
      if (user.role === 'student') {
        throw createError(403, 'Students cannot access assignment statistics');
      }

      const filter = {};
      
      // Faculty can only see their own statistics
      if (user.role === 'faculty') {
        filter.faculty = user._id;
      }

      const stats = await Assignment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalAssignments: { $sum: 1 },
            publishedAssignments: {
              $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
            },
            draftAssignments: {
              $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
            },
            completedAssignments: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            overdueAssignments: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['published', 'submission_closed']] },
                      { $lt: ['$dueDate', new Date()] }
                    ]
                  }, 1, 0]
              }
            }
          }
        }
      ]);

      // Get assignments by type
      const typeStats = await Assignment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$assignmentType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Get assignments by difficulty
      const difficultyStats = await Assignment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$difficulty',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return {
        overview: stats[0] || {
          totalAssignments: 0,
          publishedAssignments: 0,
          draftAssignments: 0,
          completedAssignments: 0,
          overdueAssignments: 0
        },
        byType: typeStats,
        byDifficulty: difficultyStats
      };
    } catch (error) {
      logger.error('Error getting assignment statistics:', error);
      throw error;
    }
  }

  /**
   * Bulk operations on assignments
   */
  async bulkOperation(operationData, userId) {
    try {
      const { operation, assignmentIds, status } = operationData;

      // Check if all assignments exist and user has permission
      const assignments = await Assignment.find({
        _id: { $in: assignmentIds }
      });

      if (assignments.length !== assignmentIds.length) {
        throw createError(400, 'Some assignments not found');
      }

      // Check permissions for all assignments
      for (const assignment of assignments) {
        if (assignment.faculty.toString() !== userId.toString() && assignment.createdBy.toString() !== userId.toString()) {
          throw createError(403, `No permission to modify assignment: ${assignment._id}`);
        }
      }

      let result;
      switch (operation) {
        case 'publish':
          result = await Assignment.updateMany(
            { _id: { $in: assignmentIds } },
            { 
              status: 'published',
              isVisible: true,
              lastModifiedBy: userId
            }
          );
          break;

        case 'archive':
          result = await Assignment.updateMany(
            { _id: { $in: assignmentIds } },
            { 
              status: 'archived',
              isVisible: false,
              lastModifiedBy: userId
            }
          );
          break;

        case 'delete':
          // Delete files from Cloudinary first
          for (const assignment of assignments) {
            if (assignment.files && assignment.files.length > 0) {
              for (const file of assignment.files) {
                try {
                  await deleteImage(file.fileUrl);
                } catch (fileError) {
                  logger.warn(`Failed to delete file from Cloudinary: ${file.fileUrl}`, fileError);
                }
              }
            }
          }
          
          result = await Assignment.deleteMany({ _id: { $in: assignmentIds } });
          break;

        case 'updateStatus':
          if (!status) {
            throw createError(400, 'Status is required for updateStatus operation');
          }
          result = await Assignment.updateMany(
            { _id: { $in: assignmentIds } },
            { 
              status,
              lastModifiedBy: userId
            }
          );
          break;

        default:
          throw createError(400, 'Invalid operation');
      }

      logger.info(`Bulk operation ${operation} completed on ${assignmentIds.length} assignments by user: ${userId}`);
      return {
        operation,
        processedCount: result.modifiedCount || result.deletedCount,
        totalCount: assignmentIds.length
      };
    } catch (error) {
      logger.error('Error performing bulk operation:', error);
      throw error;
    }
  }

  /**
   * Get overdue assignments
   */
  async getOverdueAssignments(user) {
    try {
      const filter = {};
      
      // Role-based filtering
      if (user.role === 'student') {
        // Get enrolled courses for the student
        const enrolledCourses = await Course.find({ students: user._id }).select('_id');
        filter.course = { $in: enrolledCourses.map(c => c._id) };
        filter.status = 'published';
        filter.isVisible = true;
      } else if (user.role === 'faculty') {
        filter.faculty = user._id;
      }

      const overdueAssignments = await Assignment.findOverdue()
        .populate('course', 'name code')
        .populate('faculty', 'firstName lastName')
        .lean();

      return overdueAssignments;
    } catch (error) {
      logger.error('Error getting overdue assignments:', error);
      throw error;
    }
  }

  /**
   * Update assignment statistics
   */
  async updateAssignmentStatistics(assignmentId, statisticsData) {
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      await assignment.updateStatistics(statisticsData);
      return assignment;
    } catch (error) {
      logger.error('Error updating assignment statistics:', error);
      throw error;
    }
  }
}

module.exports = new AssignmentService(); 