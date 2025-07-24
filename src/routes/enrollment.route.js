const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  validateEnrollmentCreation,
  validateEnrollmentUpdate,
  validateEnrollmentId,
  validateEnrollmentQuery,
  validateCourseEnrollment,
  validateEnrollmentStatusUpdate,
  validateGPAUpdate,
  validateDocumentUpload,
  validateBulkEnrollmentOperation
} = require('../validation/enrollment.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Enrollment:
 *       type: object
 *       required:
 *         - student
 *         - program
 *         - semester
 *         - semesterTerm
 *         - academicYear
 *       properties:
 *         student:
 *           type: string
 *           description: Student ID (ObjectId reference to User)
 *         program:
 *           type: string
 *           description: Program ID (ObjectId reference to Program)
 *         semester:
 *           type: number
 *           minimum: 1
 *           maximum: 12
 *           description: Semester number
 *         semesterTerm:
 *           type: string
 *           enum: [Fall, Spring, Summer, Winter]
 *           description: Semester term
 *         academicYear:
 *           type: string
 *           pattern: '^\\d{4}-\\d{4}$'
 *           description: Academic year in format YYYY-YYYY
 *         courses:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of course IDs
 *         status:
 *           type: string
 *           enum: [active, completed, dropped, suspended, graduated]
 *           default: active
 *         enrollmentType:
 *           type: string
 *           enum: [full_time, part_time, audit, transfer]
 *           default: full_time
 *         totalCredits:
 *           type: number
 *           minimum: 0
 *           maximum: 30
 *           default: 0
 *         gpa:
 *           type: number
 *           minimum: 0.0
 *           maximum: 4.0
 *           default: 0.0
 *         cgpa:
 *           type: number
 *           minimum: 0.0
 *           maximum: 4.0
 *           default: 0.0
 *         academicStanding:
 *           type: string
 *           enum: [good_standing, academic_warning, academic_probation, academic_suspension]
 *           default: good_standing
 *         financialStatus:
 *           type: string
 *           enum: [paid, partial, unpaid, scholarship]
 *           default: unpaid
 *         scholarship:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               enum: [merit, need_based, athletic, academic, other]
 *             amount:
 *               type: number
 *               minimum: 0
 *             description:
 *               type: string
 *               maxLength: 500
 *         advisor:
 *           type: string
 *           description: Advisor ID (ObjectId reference to User)
 *         notes:
 *           type: string
 *           maxLength: 1000
 *         documents:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [transcript, id_card, medical_form, financial_aid, other]
 *               fileName:
 *                 type: string
 *               fileUrl:
 *                 type: string
 *               fileSize:
 *                 type: number
 *       example:
 *         student: "507f1f77bcf86cd799439011"
 *         program: "507f1f77bcf86cd799439012"
 *         semester: 1
 *         semesterTerm: "Fall"
 *         academicYear: "2024-2025"
 *         courses: ["507f1f77bcf86cd799439013"]
 *         status: "active"
 *         enrollmentType: "full_time"
 *         advisor: "507f1f77bcf86cd799439014"
 */

/**
 * @swagger
 * /api/enrollments:
 *   post:
 *     summary: Create a new enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Enrollment'
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Student, program, or course not found
 *       409:
 *         description: Duplicate enrollment
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'faculty']),
  validateEnrollmentCreation,
  enrollmentController.createEnrollment
);

/**
 * @swagger
 * /api/enrollments:
 *   get:
 *     summary: Get all enrollments with pagination and filtering
 *     tags: [Enrollments]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for notes
 *       - in: query
 *         name: student
 *         schema:
 *           type: string
 *         description: Filter by student ID
 *       - in: query
 *         name: program
 *         schema:
 *           type: string
 *         description: Filter by program ID
 *       - in: query
 *         name: semester
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Filter by semester
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, dropped, suspended, graduated]
 *         description: Filter by status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [enrolledAt, semester, academicYear, status, gpa, totalCredits, student, program, createdAt, updatedAt]
 *           default: enrolledAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     enrollments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Enrollment'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateEnrollmentQuery,
  enrollmentController.getEnrollments
);

/**
 * @swagger
 * /api/enrollments/{id}:
 *   get:
 *     summary: Get enrollment by ID
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *                 message:
 *                   type: string
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateEnrollmentId,
  enrollmentController.getEnrollmentById
);

/**
 * @swagger
 * /api/enrollments/{id}:
 *   put:
 *     summary: Update enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Enrollment'
 *     responses:
 *       200:
 *         description: Enrollment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'faculty']),
  validateEnrollmentId,
  validateEnrollmentUpdate,
  enrollmentController.updateEnrollment
);

/**
 * @swagger
 * /api/enrollments/{id}:
 *   delete:
 *     summary: Delete enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  validateEnrollmentId,
  enrollmentController.deleteEnrollment
);

/**
 * @swagger
 * /api/enrollments/{id}/courses:
 *   post:
 *     summary: Add course to enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: Course ID to add
 *     responses:
 *       200:
 *         description: Course added to enrollment successfully
 *       400:
 *         description: Student cannot enroll in this course
 *       404:
 *         description: Enrollment or course not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/courses',
  authenticate,
  authorize(['admin', 'faculty']),
  validateEnrollmentId,
  validateCourseEnrollment,
  enrollmentController.addCourseToEnrollment
);

/**
 * @swagger
 * /api/enrollments/{id}/courses/{courseId}:
 *   delete:
 *     summary: Remove course from enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID to remove
 *     responses:
 *       200:
 *         description: Course removed from enrollment successfully
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/:id/courses/:courseId',
  authenticate,
  authorize(['admin', 'faculty']),
  validateEnrollmentId,
  enrollmentController.removeCourseFromEnrollment
);

/**
 * @swagger
 * /api/enrollments/{id}/status:
 *   patch:
 *     summary: Update enrollment status
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
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
 *                 enum: [active, completed, dropped, suspended, graduated]
 *               details:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Enrollment status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize(['admin', 'faculty']),
  validateEnrollmentId,
  validateEnrollmentStatusUpdate,
  enrollmentController.updateEnrollmentStatus
);

/**
 * @swagger
 * /api/enrollments/{id}/gpa:
 *   patch:
 *     summary: Update GPA
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gpa
 *             properties:
 *               gpa:
 *                 type: number
 *                 minimum: 0.0
 *                 maximum: 4.0
 *               cgpa:
 *                 type: number
 *                 minimum: 0.0
 *                 maximum: 4.0
 *     responses:
 *       200:
 *         description: GPA updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  '/:id/gpa',
  authenticate,
  authorize(['admin', 'faculty']),
  validateEnrollmentId,
  validateGPAUpdate,
  enrollmentController.updateGPA
);

/**
 * @swagger
 * /api/enrollments/{id}/documents:
 *   post:
 *     summary: Add document to enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - fileName
 *               - fileUrl
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [transcript, id_card, medical_form, financial_aid, other]
 *               fileName:
 *                 type: string
 *                 maxLength: 255
 *               fileUrl:
 *                 type: string
 *                 format: uri
 *               fileSize:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Document added to enrollment successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/documents',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateEnrollmentId,
  validateDocumentUpload,
  enrollmentController.addDocumentToEnrollment
);

/**
 * @swagger
 * /api/enrollments/{id}/documents/{documentId}:
 *   delete:
 *     summary: Remove document from enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Enrollment ID
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID to remove
 *     responses:
 *       200:
 *         description: Document removed from enrollment successfully
 *       404:
 *         description: Enrollment not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/:id/documents/:documentId',
  authenticate,
  authorize(['admin', 'faculty']),
  validateEnrollmentId,
  enrollmentController.removeDocumentFromEnrollment
);

/**
 * @swagger
 * /api/enrollments/student/{studentId}:
 *   get:
 *     summary: Get enrollments by student
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student enrollments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Enrollment'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/student/:studentId',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  enrollmentController.getEnrollmentsByStudent
);

/**
 * @swagger
 * /api/enrollments/program/{programId}:
 *   get:
 *     summary: Get enrollments by program
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: programId
 *         required: true
 *         schema:
 *           type: string
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Program enrollments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Enrollment'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/program/:programId',
  authenticate,
  authorize(['admin', 'faculty']),
  enrollmentController.getEnrollmentsByProgram
);

/**
 * @swagger
 * /api/enrollments/stats:
 *   get:
 *     summary: Get enrollment statistics
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollment statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     byStatus:
 *                       type: object
 *                       properties:
 *                         active:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         dropped:
 *                           type: integer
 *                         suspended:
 *                           type: integer
 *                         graduated:
 *                           type: integer
 *                     byEnrollmentType:
 *                       type: object
 *                       properties:
 *                         fullTime:
 *                           type: integer
 *                         partTime:
 *                           type: integer
 *                     byAcademicStanding:
 *                       type: object
 *                       properties:
 *                         goodStanding:
 *                           type: integer
 *                         warning:
 *                           type: integer
 *                         probation:
 *                           type: integer
 *                         suspension:
 *                           type: integer
 *                     activePercentage:
 *                       type: integer
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/stats',
  authenticate,
  authorize(['admin', 'faculty']),
  enrollmentController.getEnrollmentStats
);

/**
 * @swagger
 * /api/enrollments/bulk:
 *   post:
 *     summary: Perform bulk operations on enrollments
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enrollmentIds
 *               - operation
 *             properties:
 *               enrollmentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: Array of enrollment IDs
 *               operation:
 *                 type: string
 *                 enum: [activate, suspend, complete, drop, update_status, update_gpa]
 *                 description: Operation to perform
 *               data:
 *                 type: object
 *                 description: Additional data for the operation
 *     responses:
 *       200:
 *         description: Bulk operation completed successfully
 *       400:
 *         description: Validation error or invalid operation
 *       404:
 *         description: One or more enrollments not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/bulk',
  authenticate,
  authorize(['admin']),
  validateBulkEnrollmentOperation,
  enrollmentController.bulkEnrollmentOperation
);

/**
 * @swagger
 * /api/enrollments/my-enrollments:
 *   get:
 *     summary: Get current user's enrollments (for students)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's enrollments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Enrollment'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my-enrollments',
  authenticate,
  authorize(['student']),
  enrollmentController.getMyEnrollments
);

/**
 * @swagger
 * /api/enrollments/my-advisees:
 *   get:
 *     summary: Get enrollments by advisor (for faculty)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Advisor's enrollments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     enrollments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Enrollment'
 *                     pagination:
 *                       type: object
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/my-advisees',
  authenticate,
  authorize(['faculty']),
  enrollmentController.getMyAdvisees
);

module.exports = router; 