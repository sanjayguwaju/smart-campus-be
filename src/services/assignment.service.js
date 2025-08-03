const Assignment = require('../models/assignment.model');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const { ResponseHandler } = require('../utils/responseHandler');
const logger = require('../utils/logger');
const createError = require('../utils/createError');
const { uploadImage, deleteImage } = require('../config/cloudinary.config');
const { default: mongoose } = require('mongoose');

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
        status: 'published', // Auto-publish assignments
        isVisible: true,     // Make them immediately visible
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
   * Create assignment for faculty-assigned courses only
   */
  async createAssignmentForFacultyCourse(assignmentData, facultyId) {
    try {
      // Validate that course exists
      const course = await Course.findById(assignmentData.course);
      if (!course) {
        throw createError(404, 'Course not found');
      }

      // Verify that the faculty is assigned to this course
      if (course.faculty.toString() !== facultyId.toString()) {
        throw createError(403, 'You are not authorized to create assignments for this course. Only the assigned faculty can create assignments.');
      }

      // Set faculty to the authenticated faculty member
      assignmentData.faculty = facultyId;

      // Validate grading criteria points match total points
      if (assignmentData.gradingCriteria && assignmentData.gradingCriteria.length > 0) {
        const criteriaPoints = assignmentData.gradingCriteria.reduce((sum, criteria) => sum + criteria.maxPoints, 0);
        if (criteriaPoints !== assignmentData.totalPoints) {
          throw createError(400, 'Total points must match the sum of grading criteria points');
        }
      }

      const assignment = new Assignment({
        ...assignmentData,
        status: 'published', // Auto-publish assignments
        isVisible: true,     // Make them immediately visible
        createdBy: facultyId,
        lastModifiedBy: facultyId
      });

      await assignment.save();
      
      logger.info(`Assignment created for faculty-assigned course: ${assignment._id} by faculty: ${facultyId}`);
      return assignment;
    } catch (error) {
      logger.error('Error creating assignment for faculty course:', error);
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
        
        // Get student's enrolled courses
        const Enrollment = require('../models/enrollment.model');
        const enrollment = await Enrollment.findOne({ 
          student: user._id, 
          status: 'active' 
        }).populate('courses').lean();
        
        if (enrollment && enrollment.courses.length > 0) {
          const enrolledCourseIds = enrollment.courses.map(course => course._id);
          filter.course = { $in: enrolledCourseIds };
        } else {
          // If no enrollment found, return empty result
          return {
            assignments: [],
            data: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            }
          };
        }
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
        .populate('faculty', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Get total count for pagination
      const total = await Assignment.countDocuments(filter);

      return {
        assignments,
        data: assignments,
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
   * Get assignments by faculty with search and pagination
   */
  async getAssignmentsByFaculty(query, user) {
    try {
      const { facultyId, search, status, assignmentType, difficulty, pagination } = query;
      
      // Check permissions
      if (user.role === 'student') {
        throw createError(403, 'Students cannot access faculty assignments');
      }

      if (user.role === 'faculty' && user._id.toString() !== facultyId) {
        throw createError(403, 'Faculty can only access their own assignments');
      }

      // Build filter object
      const filter = { faculty: facultyId };

      // Add search filter
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Add status filter
      if (status) {
        filter.status = status;
      }

      // Add assignment type filter
      if (assignmentType) {
        filter.assignmentType = assignmentType;
      }

      // Add difficulty filter
      if (difficulty) {
        filter.difficulty = difficulty;
      }

      // Get total count for pagination
      const total = await Assignment.countDocuments(filter);

      // Calculate pagination
      const { page = 1, limit = 10, sortBy = 'dueDate', sortOrder = 'asc' } = pagination;
      const skip = (page - 1) * limit;
      const pages = Math.ceil(total / limit);

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Add _id to sort for consistent pagination
      if (sortBy !== '_id') {
        sort._id = sortOrder === 'desc' ? -1 : 1;
      }

      // Execute query with pagination
      const assignments = await Assignment.find(filter)
        .populate('course', 'name code')
        .populate('faculty', 'firstName lastName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      return {
        assignments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages
        }
      };
    } catch (error) {
      logger.error('Error getting assignments by faculty:', error);
      throw error;
    }
  }

  /**
   * Get assignments assigned to a specific student
   */
  async getStudentAssignments(studentId, query = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        course,
        assignmentType,
        status,
        difficulty,
        dueDateFrom,
        dueDateTo,
        sortBy = 'dueDate',
        sortOrder = 'asc',
        search,
        tags,
        includeOverdue = false
      } = query;

      // Validate student exists and is actually a student
      const student = await User.findById(studentId);
      if (!student) {
        throw createError(404, 'Student not found');
      }
      if (student.role !== 'student') {
        throw createError(400, 'User is not a student');
      }

      // Get student's active enrollment and enrolled courses
      const Enrollment = require('../models/enrollment.model');
      const enrollment = await Enrollment.findOne({ 
        student: studentId, 
        status: 'active' 
      }).populate('courses').lean();

      if (!enrollment || !enrollment.courses || enrollment.courses.length === 0) {
        // Return empty result if no active enrollment or courses
        return {
          assignments: [],
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        };
      }

      const enrolledCourseIds = enrollment.courses.map(course => course._id);

      // Build filter object for assignments
      const filter = {
        course: { $in: enrolledCourseIds },
        status: 'published',
        isVisible: true
      };

      // Apply additional filters
      if (course) {
        // Validate that the course is in student's enrolled courses
        if (!enrolledCourseIds.includes(course)) {
          throw createError(403, 'Access denied - course not in enrolled courses');
        }
        filter.course = course;
      }

      if (assignmentType) filter.assignmentType = assignmentType;
      if (difficulty) filter.difficulty = difficulty;
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
        filter.tags = { $in: tagArray };
      }

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

      // Status filtering - students can only see published assignments
      if (status && status !== 'published') {
        // If status is not published, return empty result
        return {
          assignments: [],
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        };
      }

      // Get total count for pagination
      const total = await Assignment.countDocuments(filter);

      // Calculate pagination
      const skip = (page - 1) * limit;
      const pages = Math.ceil(total / limit);

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      // Add _id to sort for consistent pagination
      if (sortBy !== '_id') {
        sort._id = sortOrder === 'desc' ? -1 : 1;
      }

      // Execute query with pagination
      const assignments = await Assignment.find(filter)
        .populate('course', 'name code description')
        .populate('faculty', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      // Add overdue status to assignments
      const assignmentsWithOverdueStatus = assignments.map(assignment => {
        const isOverdue = assignment.dueDate < new Date() && assignment.status === 'published';
        return {
          ...assignment,
          isOverdue,
          daysUntilDue: Math.ceil((assignment.dueDate - new Date()) / (1000 * 60 * 60 * 24))
        };
      });

      // Filter overdue assignments if requested
      let finalAssignments = assignmentsWithOverdueStatus;
      if (includeOverdue) {
        finalAssignments = assignmentsWithOverdueStatus.filter(assignment => assignment.isOverdue);
      }

      return {
        assignments: finalAssignments,
        data: finalAssignments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: finalAssignments.length,
          pages: Math.ceil(finalAssignments.length / limit)
        },
        studentInfo: {
          studentId: student._id,
          studentName: `${student.firstName} ${student.lastName}`,
          enrolledCourses: enrollment.courses.length,
          currentSemester: enrollment.semester,
          academicYear: enrollment.academicYear
        }
      };
    } catch (error) {
      logger.error('Error getting student assignments:', error);
      throw error;
    }
  }

  /**
   * Get active assignments for a student using MongoDB aggregation
   * This method uses aggregation pipeline for better performance
   */
  async getStudentActiveAssignmentsAggregated(studentId, query = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        course,
        assignmentType,
        difficulty,
        dueDateFrom,
        dueDateTo,
        sortBy = 'dueDate',
        sortOrder = 'asc',
        search,
        tags
      } = query;

      // Validate student exists and is actually a student
      const student = await User.findById(studentId);
      if (!student) {
        throw createError(404, 'Student not found');
      }
      if (student.role !== 'student') {
        throw createError(400, 'User is not a student');
      }

      // Build aggregation pipeline
      const pipeline = [];

      // Stage 1: Find student's active enrollment and get course IDs
      const Enrollment = require('../models/enrollment.model');
      const studentEnrollment = await Enrollment.findOne({ 
        student: studentId, 
        status: 'active' 
      }).lean();

      if (!studentEnrollment || !studentEnrollment.courses || studentEnrollment.courses.length === 0) {
        // Return empty result if no active enrollment or courses
        return {
          assignments: [],
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          },
          studentInfo: {
            studentId: student._id,
            studentName: `${student.firstName} ${student.lastName}`,
            enrolledCourses: 0,
            currentSemester: null,
            academicYear: null
          }
        };
      }

      const enrolledCourseIds = studentEnrollment.courses.map(course => course);

      // Stage 1: Match assignments that are in enrolled courses and active
      pipeline.push({
        $match: {
          $and: [
            { course: { $in: enrolledCourseIds } },
            { status: 'published' },
          ]
        }
      });

      // Stage 2: Apply additional filters
      const matchStage = {};

      if (course) {
        matchStage.course = new mongoose.Types.ObjectId(course);
      }

      if (assignmentType) {
        matchStage.assignmentType = assignmentType;
      }

      if (difficulty) {
        matchStage.difficulty = difficulty;
      }

      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
        matchStage.tags = { $in: tagArray };
      }

      // Date range filtering
      if (dueDateFrom || dueDateTo) {
        matchStage.dueDate = {};
        if (dueDateFrom) matchStage.dueDate.$gte = new Date(dueDateFrom);
        if (dueDateTo) matchStage.dueDate.$lte = new Date(dueDateTo);
      }

      // Search functionality
      if (search) {
        matchStage.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      // Stage 3: Lookup course information
      pipeline.push({
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo'
        }
      });

      // Stage 4: Lookup faculty information
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'faculty',
          foreignField: '_id',
          as: 'facultyInfo'
        }
      });

      // Stage 5: Lookup created by information
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByInfo'
        }
      });

      // Stage 6: Unwind arrays and format data
      pipeline.push({
        $addFields: {
          course: { $arrayElemAt: ['$courseInfo', 0] },
          faculty: { $arrayElemAt: ['$facultyInfo', 0] },
          createdBy: { $arrayElemAt: ['$createdByInfo', 0] }
        }
      });

      // Stage 7: Project only needed fields
      pipeline.push({
        $project: {
          courseInfo: 0,
          facultyInfo: 0,
          createdByInfo: 0
        }
      });

      // Stage 8: Add computed fields
      pipeline.push({
        $addFields: {
          isOverdue: {
            $and: [
              { $lt: ['$dueDate', new Date()] },
              { $eq: ['$status', 'published'] }
            ]
          },
          daysUntilDue: {
            $ceil: {
              $divide: [
                { $subtract: ['$dueDate', new Date()] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      });

      // Stage 9: Sort
      const sortStage = {};
      sortStage[sortBy] = sortOrder === 'desc' ? -1 : 1;
      if (sortBy !== '_id') {
        sortStage._id = sortOrder === 'desc' ? -1 : 1;
      }
      pipeline.push({ $sort: sortStage });

      // Stage 10: Get total count for pagination
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Assignment.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      // Stage 11: Apply pagination
      const skip = (page - 1) * limit;
      pipeline.push(
        { $skip: skip },
        { $limit: parseInt(limit) }
      );

      console.log(JSON.stringify(pipeline));

      // Execute aggregation
      const assignments = await Assignment.aggregate(pipeline);

      return {
        assignments,
        data: assignments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        studentInfo: {
          studentId: student._id,
          studentName: `${student.firstName} ${student.lastName}`,
          enrolledCourses: studentEnrollment ? studentEnrollment.courses.length : 0,
          currentSemester: studentEnrollment ? studentEnrollment.semester : null,
          academicYear: studentEnrollment ? studentEnrollment.academicYear : null
        }
      };
    } catch (error) {
      logger.error('Error getting student active assignments aggregated:', error);
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

  /**
   * Update assignment by faculty ID
   */
  async updateAssignmentByFaculty(facultyId, assignmentId, updateData, user) {
    try {
      // Check permissions
      if (user.role === 'student') {
        throw createError(403, 'Students cannot update assignments');
      }

      if (user.role === 'faculty' && user._id.toString() !== facultyId) {
        throw createError(403, 'Faculty can only update their own assignments');
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      // Verify the assignment belongs to the specified faculty
      if (assignment.faculty.toString() !== facultyId) {
        throw createError(403, 'Assignment does not belong to the specified faculty');
      }

      // Validate grading criteria points match total points if both are provided
      if (updateData.gradingCriteria && updateData.totalPoints) {
        const criteriaPoints = updateData.gradingCriteria.reduce((sum, criteria) => sum + criteria.maxPoints, 0);
        if (criteriaPoints !== updateData.totalPoints) {
          throw createError(400, 'Total points must match the sum of grading criteria points');
        }
      }

      // Update assignment
      Object.assign(assignment, updateData, { lastModifiedBy: user._id });
      await assignment.save();

      // Populate course information for response
      await assignment.populate('course', 'name code');

      logger.info(`Assignment updated by faculty: ${assignmentId} by user: ${user._id}`);
      return assignment;
    } catch (error) {
      logger.error('Error updating assignment by faculty:', error);
      throw error;
    }
  }

  /**
   * Delete assignment by faculty ID
   */
  async deleteAssignmentByFaculty(facultyId, assignmentId, user) {
    try {
      // Check permissions
      if (user.role === 'student') {
        throw createError(403, 'Students cannot delete assignments');
      }

      if (user.role === 'faculty' && user._id.toString() !== facultyId) {
        throw createError(403, 'Faculty can only delete their own assignments');
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw createError(404, 'Assignment not found');
      }

      // Verify the assignment belongs to the specified faculty
      if (assignment.faculty.toString() !== facultyId) {
        throw createError(403, 'Assignment does not belong to the specified faculty');
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

      logger.info(`Assignment deleted by faculty: ${assignmentId} by user: ${user._id}`);
      return { message: 'Assignment deleted successfully' };
    } catch (error) {
      logger.error('Error deleting assignment by faculty:', error);
      throw error;
    }
  }
}

module.exports = new AssignmentService(); 