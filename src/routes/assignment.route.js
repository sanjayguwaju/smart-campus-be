const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  validateAssignmentCreation,
  validateAssignmentUpdate,
  validateAssignmentId,
  validateAssignmentQuery,
  validateFileUpload,
  validateStatusUpdate,
  validateBulkOperation
} = require('../validation/assignment.validation');


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
 *           maxLength: 200
 *           description: Assignment title
 *         description:
 *           type: string
 *           maxLength: 2000
 *           description: Assignment description
 *         course:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           description: Course ID
 *         faculty:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           description: Faculty ID
 *         assignmentType:
 *           type: string
 *           enum: [Homework, Project, Quiz, Exam, Lab, Presentation, Essay, Research]
 *           default: Homework
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Assignment due date (must be in the future)
 *         extendedDueDate:
 *           type: string
 *           format: date-time
 *           description: Extended due date (must be after original due date)
 *         requirements:
 *           type: object
 *           properties:
 *             maxFileSize:
 *               type: number
 *               minimum: 1
 *               default: 10
 *               description: Maximum file size in MB
 *             allowedFileTypes:
 *               type: array
 *               items:
 *                 type: string
 *               description: Allowed file types
 *             maxSubmissions:
 *               type: number
 *               minimum: 1
 *               default: 1
 *             allowLateSubmission:
 *               type: boolean
 *               default: false
 *             latePenalty:
 *               type: number
 *               minimum: 0
 *               maximum: 100
 *               default: 0
 *               description: Late penalty percentage
 *         gradingCriteria:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - criterion
 *               - maxPoints
 *             properties:
 *               criterion:
 *                 type: string
 *                 maxLength: 100
 *               maxPoints:
 *                 type: number
 *                 minimum: 0
 *               description:
 *                 type: string
 *                 maxLength: 500
 *         totalPoints:
 *           type: number
 *           minimum: 1
 *           maximum: 1000
 *         status:
 *           type: string
 *           enum: [draft, published, submission_closed, grading, completed, archived]
 *           default: draft
 *         isVisible:
 *           type: boolean
 *           default: false
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *             maxLength: 50
 *         difficulty:
 *           type: string
 *           enum: [Easy, Medium, Hard, Expert]
 *           default: Medium
 *         estimatedTime:
 *           type: number
 *           minimum: 0.5
 *           maximum: 100
 *           description: Estimated time in hours
 *     AssignmentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Assignment'
 *     AssignmentListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             assignments:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Assignment'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: number
 *                 limit:
 *                   type: number
 *                 total:
 *                   type: number
 *                 pages:
 *                   type: number
 */

/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: Assignment management endpoints
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Assignment'
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Course or faculty not found
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'faculty']),
  validateAssignmentCreation,
  assignmentController.createAssignment
);

/**
 * @swagger
 * /api/v1/assignments:
 *   get:
 *     summary: Get assignments with filtering and pagination
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by course ID
 *       - in: query
 *         name: faculty
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by faculty ID
 *       - in: query
 *         name: assignmentType
 *         schema:
 *           type: string
 *           enum: [Homework, Project, Quiz, Exam, Lab, Presentation, Essay, Research]
 *         description: Filter by assignment type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, submission_closed, grading, completed, archived]
 *         description: Filter by status
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [Easy, Medium, Hard, Expert]
 *         description: Filter by difficulty
 *       - in: query
 *         name: isVisible
 *         schema:
 *           type: boolean
 *         description: Filter by visibility
 *       - in: query
 *         name: dueDateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by due date from
 *       - in: query
 *         name: dueDateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by due date to
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, dueDate, createdAt, totalPoints, difficulty, assignmentType]
 *           default: dueDate
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in title and description
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *     responses:
 *       200:
 *         description: Assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentListResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateAssignmentQuery,
  assignmentController.getAssignments
);

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
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Assignment not found
 */
router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateAssignmentId,
  assignmentController.getAssignmentById
);

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
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Assignment'
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Assignment not found
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'faculty']),
  validateAssignmentId,
  validateAssignmentUpdate,
  assignmentController.updateAssignment
);

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
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Assignment not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'faculty']),
  validateAssignmentId,
  assignmentController.deleteAssignment
);

/**
 * @swagger
 * /api/v1/assignments/{id}/files:
 *   post:
 *     summary: Add file to assignment
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               fileName:
 *                 type: string
 *                 description: File name (if not uploading file)
 *               fileSize:
 *                 type: number
 *                 description: File size in bytes (if not uploading file)
 *               fileType:
 *                 type: string
 *                 description: File MIME type (if not uploading file)
 *               fileUrl:
 *                 type: string
 *                 description: File URL (if not uploading file)
 *     responses:
 *       200:
 *         description: File added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Assignment not found
 */
router.post(
  '/:id/files',
  authenticate,
  authorize(['admin', 'faculty']),
  validateAssignmentId,
  validateFileUpload,
  assignmentController.addFileToAssignment
);

/**
 * @swagger
 * /api/v1/assignments/{id}/files:
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
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileUrl
 *             properties:
 *               fileUrl:
 *                 type: string
 *                 description: URL of the file to remove
 *     responses:
 *       200:
 *         description: File removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Assignment or file not found
 */
router.delete(
  '/:id/files',
  authenticate,
  authorize(['admin', 'faculty']),
  validateAssignmentId,
  assignmentController.removeFileFromAssignment
);

/**
 * @swagger
 * /api/v1/assignments/{id}/status:
 *   patch:
 *     summary: Update assignment status
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, published, submission_closed, grading, completed, archived]
 *     responses:
 *       200:
 *         description: Assignment status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Assignment not found
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize(['admin', 'faculty']),
  validateAssignmentId,
  validateStatusUpdate,
  assignmentController.updateAssignmentStatus
);

/**
 * @swagger
 * /api/v1/assignments/course/{courseId}:
 *   get:
 *     summary: Get assignments by course
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Course not found
 */
router.get(
  '/course/:courseId',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  assignmentController.getAssignmentsByCourse
);

/**
 * @swagger
 * /api/v1/assignments/faculty/{facultyId}:
 *   get:
 *     summary: Get assignments by faculty
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facultyId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Faculty ID
 *     responses:
 *       200:
 *         description: Faculty assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  '/faculty/:facultyId',
  authenticate,
  authorize(['admin', 'faculty']),
  assignmentController.getAssignmentsByFaculty
);

/**
 * @swagger
 * /api/v1/assignments/stats:
 *   get:
 *     summary: Get assignment statistics
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assignment statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalAssignments:
 *                           type: number
 *                         publishedAssignments:
 *                           type: number
 *                         draftAssignments:
 *                           type: number
 *                         completedAssignments:
 *                           type: number
 *                         overdueAssignments:
 *                           type: number
 *                     byType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *                     byDifficulty:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - students cannot access statistics
 */
router.get(
  '/stats',
  authenticate,
  authorize(['admin', 'faculty']),
  assignmentController.getAssignmentStats
);

/**
 * @swagger
 * /api/v1/assignments/bulk:
 *   post:
 *     summary: Perform bulk operations on assignments
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *               - assignmentIds
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [publish, archive, delete, updateStatus]
 *               assignmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: '^[0-9a-fA-F]{24}$'
 *                 minItems: 1
 *                 maxItems: 100
 *               status:
 *                 type: string
 *                 enum: [draft, published, submission_closed, grading, completed, archived]
 *                 description: Required when operation is updateStatus
 *     responses:
 *       200:
 *         description: Bulk operation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     operation:
 *                       type: string
 *                     processedCount:
 *                       type: number
 *                     totalCount:
 *                       type: number
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post(
  '/bulk',
  authenticate,
  authorize(['admin', 'faculty']),
  validateBulkOperation,
  assignmentController.bulkOperation
);

/**
 * @swagger
 * /api/v1/assignments/overdue:
 *   get:
 *     summary: Get overdue assignments
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Assignment'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/overdue',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  assignmentController.getOverdueAssignments
);

/**
 * @swagger
 * /api/v1/assignments/{id}/statistics:
 *   patch:
 *     summary: Update assignment statistics
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalSubmissions:
 *                 type: number
 *               onTimeSubmissions:
 *                 type: number
 *               lateSubmissions:
 *                 type: number
 *               averageScore:
 *                 type: number
 *     responses:
 *       200:
 *         description: Assignment statistics updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Assignment not found
 */
router.patch(
  '/:id/statistics',
  authenticate,
  authorize(['admin', 'faculty']),
  validateAssignmentId,
  assignmentController.updateAssignmentStatistics
);

/**
 * @swagger
 * /api/v1/assignments/my:
 *   get:
 *     summary: Get my assignments (for faculty)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: My assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only faculty can access
 */
router.get(
  '/my',
  authenticate,
  authorize(['faculty']),
  validateAssignmentQuery,
  assignmentController.getMyAssignments
);

/**
 * @swagger
 * /api/v1/assignments/my-courses:
 *   get:
 *     summary: Get assignments for my courses (for students)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Course assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only students can access
 */
router.get(
  '/my-courses',
  authenticate,
  authorize(['student']),
  validateAssignmentQuery,
  assignmentController.getMyCourseAssignments
);

/**
 * @swagger
 * /api/v1/assignments/search:
 *   get:
 *     summary: Search assignments
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search term
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentListResponse'
 *       400:
 *         description: Search term is required
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/search',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateAssignmentQuery,
  assignmentController.searchAssignments
);

/**
 * @swagger
 * /api/v1/assignments/type/{type}:
 *   get:
 *     summary: Get assignments by type
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Homework, Project, Quiz, Exam, Lab, Presentation, Essay, Research]
 *         description: Assignment type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Assignments by type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentListResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/type/:type',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateAssignmentQuery,
  assignmentController.getAssignmentsByType
);

/**
 * @swagger
 * /api/v1/assignments/difficulty/{difficulty}:
 *   get:
 *     summary: Get assignments by difficulty
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: difficulty
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Easy, Medium, Hard, Expert]
 *         description: Assignment difficulty
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Assignments by difficulty retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentListResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/difficulty/:difficulty',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateAssignmentQuery,
  assignmentController.getAssignmentsByDifficulty
);

/**
 * @swagger
 * /api/v1/assignments/tags:
 *   get:
 *     summary: Get assignments by tags
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tags
 *         required: true
 *         schema:
 *           type: string
 *         description: Tags to filter by (comma-separated)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         description: Tagged assignments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentListResponse'
 *       400:
 *         description: Tags parameter is required
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/tags',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateAssignmentQuery,
  assignmentController.getAssignmentsByTags
);

module.exports = router; 