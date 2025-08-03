const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  validateSubmissionCreation,
  validateSubmissionUpdate,
  validateSubmissionId,
  validateSubmissionQuery,
  validateFileUpload,
  validateGrading,
  validatePlagiarismCheck,
  validateBulkOperation
} = require('../validation/submission.validation');

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
 *         files:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *               fileUrl:
 *                 type: string
 *               fileSize:
 *                 type: number
 *               fileType:
 *                 type: string
 *         submissionNumber:
 *           type: number
 *           default: 1
 *         status:
 *           type: string
 *           enum: [submitted, under_review, graded, returned, late, rejected]
 *           default: submitted
 *         isLate:
 *           type: boolean
 *           default: false
 *         latePenalty:
 *           type: number
 *           default: 0
 *         grade:
 *           type: string
 *           enum: [A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, Incomplete, Pass, Fail]
 *         numericalScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         criteriaScores:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               criterion:
 *                 type: string
 *               maxPoints:
 *                 type: number
 *               earnedPoints:
 *                 type: number
 *               feedback:
 *                 type: string
 *         feedback:
 *           type: object
 *           properties:
 *             general:
 *               type: string
 *             strengths:
 *               type: array
 *               items:
 *                 type: string
 *             improvements:
 *               type: array
 *               items:
 *                 type: string
 *             rubric:
 *               type: string
 *         studentComments:
 *           type: string
 *         instructorNotes:
 *           type: string
 *         plagiarismCheck:
 *           type: object
 *           properties:
 *             isChecked:
 *               type: boolean
 *             similarityScore:
 *               type: number
 *             flagged:
 *               type: boolean
 *             reportUrl:
 *               type: string
 *         verification:
 *           type: object
 *           properties:
 *             isVerified:
 *               type: boolean
 *             verifiedBy:
 *               type: string
 *             verificationNotes:
 *               type: string
 *     
 *     SubmissionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Submission'
 *     
 *     SubmissionListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             submissions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Submission'
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
 *     
 *     GradingData:
 *       type: object
 *       required:
 *         - grade
 *         - numericalScore
 *       properties:
 *         grade:
 *           type: string
 *           enum: [A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, Incomplete, Pass, Fail]
 *         numericalScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         criteriaScores:
 *           type: array
 *           items:
 *             type: object
 *         feedback:
 *           type: object
 *     
 *     PlagiarismData:
 *       type: object
 *       required:
 *         - similarityScore
 *       properties:
 *         similarityScore:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *         reportUrl:
 *           type: string
 *     
 *     BulkOperationData:
 *       type: object
 *       required:
 *         - operation
 *         - submissionIds
 *       properties:
 *         operation:
 *           type: string
 *           enum: [grade, return, markLate, checkPlagiarism, verify, delete]
 *         submissionIds:
 *           type: array
 *           items:
 *             type: string
 *         data:
 *           type: object
 */

/**
 * @swagger
 * /api/v1/submissions:
 *   post:
 *     summary: Create a new submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Submission'
 *     responses:
 *       201:
 *         description: Submission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Assignment or student not found
 */
router.post(
  '/',
  authenticate,
  authorize(['student']),
  validateSubmissionCreation,
  submissionController.createSubmission
);

/**
 * @swagger
 * /api/v1/submissions:
 *   get:
 *     summary: Get submissions with filtering and pagination
 *     tags: [Submissions]
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
 *         name: assignment
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by assignment ID
 *       - in: query
 *         name: student
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by student ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [submitted, under_review, graded, returned, late, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: grade
 *         schema:
 *           type: string
 *           enum: [A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, Incomplete, Pass, Fail]
 *         description: Filter by grade
 *       - in: query
 *         name: isLate
 *         schema:
 *           type: boolean
 *         description: Filter by late submissions
 *       - in: query
 *         name: plagiarismFlagged
 *         schema:
 *           type: boolean
 *         description: Filter by plagiarism flagged submissions
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [submittedAt, reviewedAt, numericalScore, grade, status]
 *           default: submittedAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in file names, comments, and notes
 *     responses:
 *       200:
 *         description: Submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionListResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateSubmissionQuery,
  submissionController.getSubmissions
);

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
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Submission not found
 */
router.get(
  '/:id',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateSubmissionId,
  submissionController.getSubmissionById
);

/**
 * @swagger
 * /api/v1/submissions/{id}:
 *   put:
 *     summary: Update submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Submission'
 *     responses:
 *       200:
 *         description: Submission updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Submission not found
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateSubmissionId,
  validateSubmissionUpdate,
  submissionController.updateSubmission
);

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
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Submission not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'faculty']),
  validateSubmissionId,
  submissionController.deleteSubmission
);

/**
 * @swagger
 * /api/v1/submissions/{id}/files:
 *   post:
 *     summary: Add file to submission
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *             properties:
 *               fileName:
 *                 type: string
 *               fileUrl:
 *                 type: string
 *               fileSize:
 *                 type: number
 *               fileType:
 *                 type: string
 *     responses:
 *       200:
 *         description: File added to submission successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Submission not found
 */
router.post(
  '/:id/files',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateSubmissionId,
  validateFileUpload,
  submissionController.addFileToSubmission
);

/**
 * @swagger
 * /api/v1/submissions/{id}/files:
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
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
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
 *         description: File removed from submission successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Submission or file not found
 */
router.delete(
  '/:id/files',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateSubmissionId,
  submissionController.removeFileFromSubmission
);

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
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GradingData'
 *     responses:
 *       200:
 *         description: Submission graded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only faculty can grade
 *       404:
 *         description: Submission not found
 */
router.post(
  '/:id/grade',
  authenticate,
  authorize(['admin', 'faculty']),
  validateSubmissionId,
  validateGrading,
  submissionController.gradeSubmission
);

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
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback
 *             properties:
 *               feedback:
 *                 type: object
 *                 properties:
 *                   general:
 *                     type: string
 *                   strengths:
 *                     type: array
 *                     items:
 *                       type: string
 *                   improvements:
 *                     type: array
 *                     items:
 *                       type: string
 *                   rubric:
 *                     type: string
 *     responses:
 *       200:
 *         description: Submission returned for revision successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only faculty can return submissions
 *       404:
 *         description: Submission not found
 */
router.post(
  '/:id/return',
  authenticate,
  authorize(['admin', 'faculty']),
  validateSubmissionId,
  submissionController.returnSubmissionForRevision
);

/**
 * @swagger
 * /api/v1/submissions/{id}/late:
 *   post:
 *     summary: Mark submission as late
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - penalty
 *             properties:
 *               penalty:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Late penalty percentage
 *     responses:
 *       200:
 *         description: Submission marked as late successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only faculty can mark submissions as late
 *       404:
 *         description: Submission not found
 */
router.post(
  '/:id/late',
  authenticate,
  authorize(['admin', 'faculty']),
  validateSubmissionId,
  submissionController.markSubmissionAsLate
);

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
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlagiarismData'
 *     responses:
 *       200:
 *         description: Plagiarism check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only faculty can check plagiarism
 *       404:
 *         description: Submission not found
 */
router.post(
  '/:id/plagiarism',
  authenticate,
  authorize(['admin', 'faculty']),
  validateSubmissionId,
  validatePlagiarismCheck,
  submissionController.checkPlagiarism
);

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
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Verification notes
 *     responses:
 *       200:
 *         description: Submission verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Submission not found
 */
router.post(
  '/:id/verify',
  authenticate,
  authorize(['admin', 'faculty']),
  validateSubmissionId,
  submissionController.verifySubmission
);

/**
 * @swagger
 * /api/v1/submissions/assignment/{assignmentId}:
 *   get:
 *     summary: Get submissions by assignment
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment submissions retrieved successfully
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
 *                     $ref: '#/components/schemas/Submission'
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
  '/assignment/:assignmentId',
  authenticate,
  authorize(['admin', 'faculty']),
  submissionController.getSubmissionsByAssignment
);

/**
 * @swagger
 * /api/v1/submissions/student/{studentId}:
 *   get:
 *     summary: Get submissions by student
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student submissions retrieved successfully
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
 *                     $ref: '#/components/schemas/Submission'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get(
  '/student/:studentId',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  submissionController.getSubmissionsByStudent
);

/**
 * @swagger
 * /api/v1/submissions/stats:
 *   get:
 *     summary: Get submission statistics
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Submission statistics retrieved successfully
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
 *                     totalSubmissions:
 *                       type: number
 *                     gradedSubmissions:
 *                       type: number
 *                     lateSubmissions:
 *                       type: number
 *                     plagiarismFlagged:
 *                       type: number
 *                     averageScore:
 *                       type: number
 *                     verifiedSubmissions:
 *                       type: number
 *                     pendingSubmissions:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/stats',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  submissionController.getSubmissionStats
);

/**
 * @swagger
 * /api/v1/submissions/faculty/{facultyId}:
 *   get:
 *     summary: Get submissions for faculty's assignments
 *     tags: [Submissions]
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
 *         name: assignment
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by assignment ID
 *       - in: query
 *         name: student
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by student ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [submitted, under_review, graded, returned, late, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: grade
 *         schema:
 *           type: string
 *           enum: [A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, Incomplete, Pass, Fail]
 *         description: Filter by grade
 *       - in: query
 *         name: isLate
 *         schema:
 *           type: boolean
 *         description: Filter by late submissions
 *       - in: query
 *         name: plagiarismFlagged
 *         schema:
 *           type: boolean
 *         description: Filter by plagiarism flagged submissions
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [submittedAt, reviewedAt, numericalScore, grade, status]
 *           default: submittedAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in file names, comments, and notes
 *     responses:
 *       200:
 *         description: Faculty submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionListResponse'
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
  submissionController.getSubmissionsByFaculty
);

/**
 * @swagger
 * /api/v1/submissions/bulk:
 *   post:
 *     summary: Perform bulk operations on submissions
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkOperationData'
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
 *                     success:
 *                       type: array
 *                       items:
 *                         type: string
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: number
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - students cannot perform bulk operations
 */
router.post(
  '/bulk',
  authenticate,
  authorize(['admin', 'faculty']),
  validateBulkOperation,
  submissionController.bulkOperation
);

/**
 * @swagger
 * /api/v1/submissions/late:
 *   get:
 *     summary: Get late submissions
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Late submissions retrieved successfully
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
 *                     $ref: '#/components/schemas/Submission'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/late',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  submissionController.getLateSubmissions
);

/**
 * @swagger
 * /api/v1/submissions/ungraded:
 *   get:
 *     summary: Get ungraded submissions
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ungraded submissions retrieved successfully
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
 *                     $ref: '#/components/schemas/Submission'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/ungraded',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  submissionController.getUngradedSubmissions
);

/**
 * @swagger
 * /api/v1/submissions/plagiarism-flagged:
 *   get:
 *     summary: Get plagiarism flagged submissions
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plagiarism flagged submissions retrieved successfully
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
 *                     $ref: '#/components/schemas/Submission'
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/plagiarism-flagged',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  submissionController.getPlagiarismFlaggedSubmissions
);

/**
 * @swagger
 * /api/v1/submissions/my:
 *   get:
 *     summary: Get my submissions (for students)
 *     tags: [Submissions]
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
 *         description: My submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only students can access
 */
router.get(
  '/my',
  authenticate,
  authorize(['student']),
  validateSubmissionQuery,
  submissionController.getMySubmissions
);

/**
 * @swagger
 * /api/v1/submissions/my/graded:
 *   get:
 *     summary: Get my graded submissions (for students)
 *     tags: [Submissions]
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
 *         description: My graded submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only students can access
 */
router.get(
  '/my/graded',
  authenticate,
  authorize(['student']),
  validateSubmissionQuery,
  submissionController.getMyGradedSubmissions
);

/**
 * @swagger
 * /api/v1/submissions/my/late:
 *   get:
 *     summary: Get my late submissions (for students)
 *     tags: [Submissions]
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
 *         description: My late submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionListResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only students can access
 */
router.get(
  '/my/late',
  authenticate,
  authorize(['student']),
  validateSubmissionQuery,
  submissionController.getMyLateSubmissions
);

/**
 * @swagger
 * /api/v1/submissions/search:
 *   get:
 *     summary: Search submissions
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
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
 *         description: Submissions search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionListResponse'
 *       400:
 *         description: Search term is required
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/search',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateSubmissionQuery,
  submissionController.searchSubmissions
);

/**
 * @swagger
 * /api/v1/submissions/status/{status}:
 *   get:
 *     summary: Get submissions by status
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [submitted, under_review, graded, returned, late, rejected]
 *         description: Submission status
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
 *         description: Submissions by status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionListResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/status/:status',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateSubmissionQuery,
  submissionController.getSubmissionsByStatus
);

/**
 * @swagger
 * /api/v1/submissions/grade/{grade}:
 *   get:
 *     summary: Get submissions by grade
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grade
 *         required: true
 *         schema:
 *           type: string
 *           enum: [A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, Incomplete, Pass, Fail]
 *         description: Submission grade
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
 *         description: Submissions by grade retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SubmissionListResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/grade/:grade',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateSubmissionQuery,
  submissionController.getSubmissionsByGrade
);

/**
 * @swagger
 * /api/v1/submissions/{id}/history:
 *   get:
 *     summary: Get submission history
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission history retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       action:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       performedBy:
 *                         type: string
 *                       details:
 *                         type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Submission not found
 */
router.get(
  '/:id/history',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateSubmissionId,
  submissionController.getSubmissionHistory
);

/**
 * @swagger
 * /api/v1/submissions/{id}/summary:
 *   get:
 *     summary: Get submission summary
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission summary retrieved successfully
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
 *                     id:
 *                       type: string
 *                     assignment:
 *                       type: string
 *                     student:
 *                       type: string
 *                     status:
 *                       type: string
 *                     grade:
 *                       type: string
 *                     numericalScore:
 *                       type: number
 *                     calculatedScore:
 *                       type: number
 *                     isLate:
 *                       type: boolean
 *                     latePenalty:
 *                       type: number
 *                     submittedAt:
 *                       type: string
 *                       format: date-time
 *                     reviewedAt:
 *                       type: string
 *                       format: date-time
 *                     reviewedBy:
 *                       type: string
 *                     plagiarismFlagged:
 *                       type: boolean
 *                     submissionAge:
 *                       type: string
 *                     reviewTime:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Submission not found
 */
router.get(
  '/:id/summary',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateSubmissionId,
  submissionController.getSubmissionSummary
);

/**
 * @swagger
 * /api/v1/submissions/{id}/final-score:
 *   get:
 *     summary: Calculate final score with late penalty
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Final score calculated successfully
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
 *                     finalScore:
 *                       type: number
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Submission not found
 */
router.get(
  '/:id/final-score',
  authenticate,
  authorize(['admin', 'faculty', 'student']),
  validateSubmissionId,
  submissionController.calculateFinalScore
);

module.exports = router; 