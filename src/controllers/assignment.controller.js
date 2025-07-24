const Assignment = require('../models/assignment.model');
const Submission = require('../models/submission.model');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const { createError } = require('../utils/createError');
const { successResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary.config');

/**
 * @swagger
 * components:
 *   schemas:
 *     Assignment:
 *       type: object
 *       required:
 *         - title
 *         - course
 *         - faculty
 *         - dueDate
 *         - totalPoints
 *       properties:
 *         title:
 *           type: string
 *           description: Assignment title
 *         description:
 *           type: string
 *           description: Assignment description
 *         course:
 *           type: string
 *           description: Course ID
 *         faculty:
 *           type: string
 *           description: Faculty ID
 *         assignmentType:
 *           type: string
 *           enum: [Homework, Project, Quiz, Exam, Lab, Presentation, Essay, Research]
 *         dueDate:
 *           type: string
 *           format: date-time
 *         extendedDueDate:
 *           type: string
 *           format: date-time
 *         totalPoints:
 *           type: number
 *         difficulty:
 *           type: string
 *           enum: [Easy, Medium, Hard, Expert]
 *         estimatedTime:
 *           type: number
 *         tags:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/v1/assignments:
 *   post:
 *     summary: Create a new assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               course:
 *                 type: string
 *               assignmentType:
 *                 type: string
 *               dueDate:
 *                 type: string
 *               totalPoints:
 *                 type: number
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 */
const createAssignment = async (req, res, next) => {
  try {
    const {
      title,
      description,
      course,
      assignmentType = 'Homework',
      dueDate,
      extendedDueDate,
      totalPoints,
      difficulty = 'Medium',
      estimatedTime,
      tags,
      requirements,
      gradingCriteria
    } = req.body;

    // Validate course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      throw createError(404, 'Course not found');
    }

    // Validate faculty exists and is faculty
    const facultyExists = await User.findById(req.user.id);
    if (!facultyExists || facultyExists.role !== 'faculty') {
      throw createError(403, 'Only faculty can create assignments');
    }

    // Handle file uploads
    const files = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path, 'assignments');
        files.push({
          fileName: file.originalname,
          fileUrl: result.secure_url,
          fileSize: file.size,
          fileType: file.mimetype
        });
      }
    }

    const assignment = new Assignment({
      title,
      description,
      course,
      faculty: req.user.id,
      assignmentType,
      dueDate,
      extendedDueDate,
      totalPoints,
      difficulty,
      estimatedTime,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      requirements: requirements ? JSON.parse(requirements) : {},
      gradingCriteria: gradingCriteria ? JSON.parse(gradingCriteria) : [],
      files,
      createdBy: req.user.id
    });

    await assignment.save();

    logger.info(`Assignment created: ${assignment._id} by user: ${req.user.id}`);

    res.status(201).json(successResponse(
      'Assignment created successfully',
      assignment,
      201
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/assignments:
 *   get:
 *     summary: Get all assignments with filtering and pagination
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Filter by course ID
 *       - in: query
 *         name: faculty
 *         schema:
 *           type: string
 *         description: Filter by faculty ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: assignmentType
 *         schema:
 *           type: string
 *         description: Filter by assignment type
 */
const getAllAssignments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      course,
      faculty,
      status,
      assignmentType,
      difficulty,
      search
    } = req.query;

    const filter = {};

    // Apply filters
    if (course) filter.course = course;
    if (faculty) filter.faculty = faculty;
    if (status) filter.status = status;
    if (assignmentType) filter.assignmentType = assignmentType;
    if (difficulty) filter.difficulty = difficulty;

    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'student') {
      // Students can only see published assignments for their courses
      filter.status = 'published';
      filter.isVisible = true;
    } else if (req.user.role === 'faculty') {
      // Faculty can see their own assignments and published ones
      filter.$or = [
        { faculty: req.user.id },
        { status: 'published', isVisible: true }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'course', select: 'name code' },
        { path: 'faculty', select: 'firstName lastName email' },
        { path: 'createdBy', select: 'firstName lastName' }
      ],
      sort: { createdAt: -1 }
    };

    const assignments = await Assignment.paginate(filter, options);

    logger.info(`Assignments retrieved by user: ${req.user.id}`);

    res.json(successResponse(
      'Assignments retrieved successfully',
      assignments
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/assignments/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 */
const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id)
      .populate('course', 'name code description')
      .populate('faculty', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('lastModifiedBy', 'firstName lastName');

    if (!assignment) {
      throw createError(404, 'Assignment not found');
    }

    // Check permissions
    if (req.user.role === 'student') {
      if (assignment.status !== 'published' || !assignment.isVisible) {
        throw createError(403, 'Access denied');
      }
    } else if (req.user.role === 'faculty' && assignment.faculty.toString() !== req.user.id) {
      if (assignment.status !== 'published' || !assignment.isVisible) {
        throw createError(403, 'Access denied');
      }
    }

    logger.info(`Assignment retrieved: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Assignment retrieved successfully',
      assignment
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/assignments/{id}:
 *   put:
 *     summary: Update assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 */
const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      throw createError(404, 'Assignment not found');
    }

    // Check permissions
    if (assignment.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the assignment creator or admin can update this assignment');
    }

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path, 'assignments');
        assignment.files.push({
          fileName: file.originalname,
          fileUrl: result.secure_url,
          fileSize: file.size,
          fileType: file.mimetype
        });
      }
    }

    // Update assignment
    Object.assign(assignment, updateData);
    assignment.lastModifiedBy = req.user.id;

    await assignment.save();

    logger.info(`Assignment updated: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Assignment updated successfully',
      assignment
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/assignments/{id}:
 *   delete:
 *     summary: Delete assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 */
const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      throw createError(404, 'Assignment not found');
    }

    // Check permissions
    if (assignment.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the assignment creator or admin can delete this assignment');
    }

    // Check if there are submissions
    const submissionCount = await Submission.countDocuments({ assignment: id });
    if (submissionCount > 0) {
      throw createError(400, 'Cannot delete assignment with existing submissions');
    }

    // Delete files from cloudinary
    for (const file of assignment.files) {
      await deleteFromCloudinary(file.fileUrl);
    }

    await Assignment.findByIdAndDelete(id);

    logger.info(`Assignment deleted: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Assignment deleted successfully'
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/assignments/{id}/publish:
 *   patch:
 *     summary: Publish assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 */
const publishAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      throw createError(404, 'Assignment not found');
    }

    if (assignment.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the assignment creator or admin can publish this assignment');
    }

    await assignment.publish();

    logger.info(`Assignment published: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Assignment published successfully',
      assignment
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/assignments/{id}/close:
 *   patch:
 *     summary: Close assignment submissions
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 */
const closeAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      throw createError(404, 'Assignment not found');
    }

    if (assignment.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the assignment creator or admin can close this assignment');
    }

    await assignment.closeSubmissions();

    logger.info(`Assignment closed: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Assignment submissions closed successfully',
      assignment
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/assignments/{id}/statistics:
 *   get:
 *     summary: Get assignment statistics
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 */
const getAssignmentStatistics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      throw createError(404, 'Assignment not found');
    }

    // Get submission statistics
    const submissions = await Submission.find({ assignment: id });
    
    const statistics = {
      totalSubmissions: submissions.length,
      onTimeSubmissions: submissions.filter(s => !s.isLate).length,
      lateSubmissions: submissions.filter(s => s.isLate).length,
      gradedSubmissions: submissions.filter(s => s.status === 'graded').length,
      averageScore: submissions.length > 0 
        ? submissions.reduce((sum, s) => sum + (s.numericalScore || 0), 0) / submissions.length 
        : 0,
      gradeDistribution: {},
      submissionTimeline: []
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

    logger.info(`Assignment statistics retrieved: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Assignment statistics retrieved successfully',
      statistics
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/assignments/{id}/files:
 *   post:
 *     summary: Add files to assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 */
const addAssignmentFiles = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      throw createError(404, 'Assignment not found');
    }

    if (assignment.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the assignment creator or admin can add files');
    }

    if (!req.files || req.files.length === 0) {
      throw createError(400, 'No files provided');
    }

    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path, 'assignments');
      await assignment.addFile(
        file.originalname,
        result.secure_url,
        file.size,
        file.mimetype
      );
    }

    logger.info(`Files added to assignment: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Files added successfully',
      assignment
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/assignments/{id}/files/{fileUrl}:
 *   delete:
 *     summary: Remove file from assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Assignment ID
 *       - in: path
 *         name: fileUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: File URL to remove
 */
const removeAssignmentFile = async (req, res, next) => {
  try {
    const { id, fileUrl } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      throw createError(404, 'Assignment not found');
    }

    if (assignment.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the assignment creator or admin can remove files');
    }

    // Delete from cloudinary
    await deleteFromCloudinary(fileUrl);

    // Remove from assignment
    await assignment.removeFile(fileUrl);

    logger.info(`File removed from assignment: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'File removed successfully',
      assignment
    ));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  publishAssignment,
  closeAssignment,
  getAssignmentStatistics,
  addAssignmentFiles,
  removeAssignmentFile
}; 