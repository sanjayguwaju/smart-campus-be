const Submission = require('../models/submission.model');
const Assignment = require('../models/assignment.model');
const User = require('../models/user.model');
const { createError } = require('../utils/createError');
const { successResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary.config');

/**
 * @swagger
 * components:
 *   schemas:
 *     Submission:
 *       type: object
 *       required:
 *         - assignment
 *         - student
 *       properties:
 *         assignment:
 *           type: string
 *           description: Assignment ID
 *         student:
 *           type: string
 *           description: Student ID
 *         studentComments:
 *           type: string
 *           description: Student comments
 *         files:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 */

/**
 * @swagger
 * /api/v1/submissions:
 *   post:
 *     summary: Submit assignment
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               assignment:
 *                 type: string
 *               studentComments:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 */
const submitAssignment = async (req, res, next) => {
  try {
    const { assignment: assignmentId, studentComments } = req.body;

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
      student: req.user.id
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

    // Handle file uploads
    const files = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Validate file size
        if (file.size > assignment.requirements.maxFileSize * 1024 * 1024) {
          throw createError(400, `File ${file.originalname} exceeds maximum size limit`);
        }

        // Validate file type
        if (assignment.requirements.allowedFileTypes.length > 0) {
          const fileExtension = file.originalname.split('.').pop().toLowerCase();
          if (!assignment.requirements.allowedFileTypes.includes(fileExtension)) {
            throw createError(400, `File type ${fileExtension} is not allowed`);
          }
        }

        const result = await uploadToCloudinary(file.path, 'submissions');
        files.push({
          fileName: file.originalname,
          fileUrl: result.secure_url,
          fileSize: file.size,
          fileType: file.mimetype
        });
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
      student: req.user.id,
      files,
      submissionNumber,
      submittedAt: now,
      isLate,
      latePenalty,
      studentComments,
      status: isLate ? 'late' : 'submitted',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      createdBy: req.user.id
    });

    await submission.save();

    // Add history entry
    await submission.addHistoryEntry(
      isLate ? 'submitted' : 'submitted',
      req.user.id,
      `Submission #${submissionNumber}${isLate ? ' (Late)' : ''}`
    );

    // Update assignment statistics
    const totalSubmissions = await Submission.countDocuments({ assignment: assignmentId });
    const onTimeSubmissions = await Submission.countDocuments({ 
      assignment: assignmentId, 
      isLate: false 
    });
    const lateSubmissions = await Submission.countDocuments({ 
      assignment: assignmentId, 
      isLate: true 
    });

    await assignment.updateStatistics({
      totalSubmissions,
      onTimeSubmissions,
      lateSubmissions
    });

    logger.info(`Assignment submitted: ${assignmentId} by student: ${req.user.id}`);

    res.status(201).json(successResponse(
      'Assignment submitted successfully',
      submission,
      201
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/submissions:
 *   get:
 *     summary: Get all submissions with filtering and pagination
 *     tags: [Submissions]
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
 *         name: assignment
 *         schema:
 *           type: string
 *         description: Filter by assignment ID
 *       - in: query
 *         name: student
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: isLate
 *         schema:
 *           type: boolean
 *         description: Filter by late submissions
 */
const getAllSubmissions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      assignment,
      student,
      status,
      isLate,
      grade,
      search
    } = req.query;

    const filter = {};

    // Apply filters
    if (assignment) filter.assignment = assignment;
    if (student) filter.student = student;
    if (status) filter.status = status;
    if (isLate !== undefined) filter.isLate = isLate === 'true';
    if (grade) filter.grade = grade;

    // Search functionality
    if (search) {
      filter.$or = [
        { studentComments: { $regex: search, $options: 'i' } },
        { 'feedback.general': { $regex: search, $options: 'i' } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'student') {
      // Students can only see their own submissions
      filter.student = req.user.id;
    } else if (req.user.role === 'faculty') {
      // Faculty can see submissions for their assignments
      const facultyAssignments = await Assignment.find({ faculty: req.user.id });
      const assignmentIds = facultyAssignments.map(a => a._id);
      filter.assignment = { $in: assignmentIds };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'assignment', select: 'title course faculty' },
        { path: 'student', select: 'firstName lastName email studentId' },
        { path: 'reviewedBy', select: 'firstName lastName' },
        { path: 'createdBy', select: 'firstName lastName' }
      ],
      sort: { submittedAt: -1 }
    };

    const submissions = await Submission.paginate(filter, options);

    logger.info(`Submissions retrieved by user: ${req.user.id}`);

    res.json(successResponse(
      'Submissions retrieved successfully',
      submissions
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/submissions/{id}:
 *   get:
 *     summary: Get submission by ID
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 */
const getSubmissionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findById(id)
      .populate('assignment', 'title description course faculty requirements gradingCriteria')
      .populate('student', 'firstName lastName email studentId')
      .populate('reviewedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('lastModifiedBy', 'firstName lastName');

    if (!submission) {
      throw createError(404, 'Submission not found');
    }

    // Check permissions
    if (req.user.role === 'student' && submission.student.toString() !== req.user.id) {
      throw createError(403, 'Access denied');
    } else if (req.user.role === 'faculty') {
      const assignment = await Assignment.findById(submission.assignment);
      if (assignment.faculty.toString() !== req.user.id) {
        throw createError(403, 'Access denied');
      }
    }

    logger.info(`Submission retrieved: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Submission retrieved successfully',
      submission
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/submissions/{id}/grade:
 *   post:
 *     summary: Grade submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               grade:
 *                 type: string
 *               numericalScore:
 *                 type: number
 *               criteriaScores:
 *                 type: array
 *               feedback:
 *                 type: object
 */
const gradeSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { grade, numericalScore, criteriaScores, feedback, instructorNotes } = req.body;

    const submission = await Submission.findById(id);
    if (!submission) {
      throw createError(404, 'Submission not found');
    }

    // Check permissions - only faculty who created the assignment can grade
    const assignment = await Assignment.findById(submission.assignment);
    if (assignment.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the assignment creator or admin can grade this submission');
    }

    // Validate grading data
    if (numericalScore < 0 || numericalScore > 100) {
      throw createError(400, 'Numerical score must be between 0 and 100');
    }

    if (criteriaScores && criteriaScores.length > 0) {
      for (const criteria of criteriaScores) {
        if (criteria.earnedPoints > criteria.maxPoints) {
          throw createError(400, `Earned points cannot exceed max points for criterion: ${criteria.criterion}`);
        }
      }
    }

    const gradingData = {
      grade,
      numericalScore,
      criteriaScores: criteriaScores || [],
      feedback: feedback || {}
    };

    if (instructorNotes) {
      submission.instructorNotes = instructorNotes;
    }

    await submission.gradeSubmission(gradingData, req.user.id);

    // Update assignment statistics
    const allSubmissions = await Submission.find({ assignment: submission.assignment });
    const averageScore = allSubmissions.length > 0 
      ? allSubmissions.reduce((sum, s) => sum + (s.numericalScore || 0), 0) / allSubmissions.length 
      : 0;

    await assignment.updateStatistics({
      averageScore
    });

    logger.info(`Submission graded: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Submission graded successfully',
      submission
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/submissions/{id}/return:
 *   post:
 *     summary: Return submission for revision
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 */
const returnSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedback, instructorNotes } = req.body;

    const submission = await Submission.findById(id);
    if (!submission) {
      throw createError(404, 'Submission not found');
    }

    // Check permissions
    const assignment = await Assignment.findById(submission.assignment);
    if (assignment.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the assignment creator or admin can return this submission');
    }

    const feedbackData = {
      general: feedback?.general || '',
      strengths: feedback?.strengths || [],
      improvements: feedback?.improvements || [],
      rubric: feedback?.rubric || ''
    };

    await submission.returnForRevision(feedbackData, req.user.id);

    if (instructorNotes) {
      submission.instructorNotes = instructorNotes;
      await submission.save();
    }

    logger.info(`Submission returned: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Submission returned for revision successfully',
      submission
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/submissions/{id}/plagiarism:
 *   post:
 *     summary: Check submission for plagiarism
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 */
const checkPlagiarism = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { similarityScore, reportUrl } = req.body;

    const submission = await Submission.findById(id);
    if (!submission) {
      throw createError(404, 'Submission not found');
    }

    // Check permissions
    const assignment = await Assignment.findById(submission.assignment);
    if (assignment.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the assignment creator or admin can check plagiarism');
    }

    await submission.checkPlagiarism(similarityScore, reportUrl, req.user.id);

    logger.info(`Plagiarism check completed: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Plagiarism check completed successfully',
      submission
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/submissions/{id}/verify:
 *   post:
 *     summary: Verify submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 */
const verifySubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const submission = await Submission.findById(id);
    if (!submission) {
      throw createError(404, 'Submission not found');
    }

    // Check permissions
    const assignment = await Assignment.findById(submission.assignment);
    if (assignment.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the assignment creator or admin can verify this submission');
    }

    await submission.verifySubmission(req.user.id, notes);

    logger.info(`Submission verified: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Submission verified successfully',
      submission
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/submissions/{id}/files:
 *   post:
 *     summary: Add files to submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 */
const addSubmissionFiles = async (req, res, next) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findById(id);
    if (!submission) {
      throw createError(404, 'Submission not found');
    }

    // Check permissions
    if (submission.student.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the student or admin can add files to this submission');
    }

    if (!req.files || req.files.length === 0) {
      throw createError(400, 'No files provided');
    }

    // Get assignment for validation
    const assignment = await Assignment.findById(submission.assignment);

    for (const file of req.files) {
      // Validate file size
      if (file.size > assignment.requirements.maxFileSize * 1024 * 1024) {
        throw createError(400, `File ${file.originalname} exceeds maximum size limit`);
      }

      // Validate file type
      if (assignment.requirements.allowedFileTypes.length > 0) {
        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        if (!assignment.requirements.allowedFileTypes.includes(fileExtension)) {
          throw createError(400, `File type ${fileExtension} is not allowed`);
        }
      }

      const result = await uploadToCloudinary(file.path, 'submissions');
      await submission.addFile(
        file.originalname,
        result.secure_url,
        file.size,
        file.mimetype
      );
    }

    logger.info(`Files added to submission: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Files added successfully',
      submission
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/submissions/{id}/files/{fileUrl}:
 *   delete:
 *     summary: Remove file from submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 *       - in: path
 *         name: fileUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: File URL to remove
 */
const removeSubmissionFile = async (req, res, next) => {
  try {
    const { id, fileUrl } = req.params;

    const submission = await Submission.findById(id);
    if (!submission) {
      throw createError(404, 'Submission not found');
    }

    // Check permissions
    if (submission.student.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the student or admin can remove files from this submission');
    }

    // Delete from cloudinary
    await deleteFromCloudinary(fileUrl);

    // Remove from submission
    await submission.removeFile(fileUrl);

    logger.info(`File removed from submission: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'File removed successfully',
      submission
    ));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/submissions/{id}:
 *   delete:
 *     summary: Delete submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Submission ID
 */
const deleteSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;

    const submission = await Submission.findById(id);
    if (!submission) {
      throw createError(404, 'Submission not found');
    }

    // Check permissions
    if (submission.student.toString() !== req.user.id && req.user.role !== 'admin') {
      throw createError(403, 'Only the student or admin can delete this submission');
    }

    // Delete files from cloudinary
    for (const file of submission.files) {
      await deleteFromCloudinary(file.fileUrl);
    }

    await Submission.findByIdAndDelete(id);

    logger.info(`Submission deleted: ${id} by user: ${req.user.id}`);

    res.json(successResponse(
      'Submission deleted successfully'
    ));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitAssignment,
  getAllSubmissions,
  getSubmissionById,
  gradeSubmission,
  returnSubmission,
  checkPlagiarism,
  verifySubmission,
  addSubmissionFiles,
  removeSubmissionFile,
  deleteSubmission
}; 