const express = require('express');
const router = express.Router();
const courseGradeController = require('../controllers/courseGrade.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validateCourseGrade, validateCourseGradeUpdate } = require('../validation/courseGrade.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     CourseGrade:
 *       type: object
 *       required:
 *         - student
 *         - course
 *         - semester
 *         - academicYear
 *         - finalGrade
 *         - numericalGrade
 *         - credits
 *       properties:
 *         student:
 *           type: string
 *           description: Student ID
 *         course:
 *           type: string
 *           description: Course ID
 *         semester:
 *           type: number
 *           description: Semester number (1-12)
 *         academicYear:
 *           type: string
 *           description: Academic year in format YYYY-YYYY
 *         finalGrade:
 *           type: string
 *           enum: [A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F, I, W, P, NP]
 *           description: Final letter grade
 *         numericalGrade:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Numerical grade (0-100)
 *         credits:
 *           type: number
 *           minimum: 1
 *           maximum: 6
 *           description: Course credits
 *         attendance:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Attendance percentage
 *         participation:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Participation percentage
 *         facultyComments:
 *           type: string
 *           maxLength: 1000
 *           description: Faculty comments
 *         assignmentGrades:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               assignment:
 *                 type: string
 *                 description: Assignment ID
 *               title:
 *                 type: string
 *                 description: Assignment title
 *               weight:
 *                 type: number
 *                 description: Assignment weight percentage
 *               grade:
 *                 type: number
 *                 description: Assignment grade
 *               maxPoints:
 *                 type: number
 *                 description: Maximum points for assignment
 */

/**
 * @swagger
 * /api/v1/course-grades:
 *   post:
 *     summary: Create a new course grade
 *     tags: [Course Grades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseGrade'
 *     responses:
 *       201:
 *         description: Course grade created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - faculty can only grade their own courses
 */
router.post('/', 
  authenticate, 
  authorize(['faculty', 'admin']), 
  validateCourseGrade, 
  courseGradeController.createCourseGrade
);

/**
 * @swagger
 * /api/v1/course-grades/faculty:
 *   get:
 *     summary: Get course grades by faculty
 *     tags: [Course Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semester
 *         schema:
 *           type: number
 *         description: Semester filter
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Academic year filter
 *       - in: query
 *         name: course
 *         schema:
 *           type: string
 *         description: Course ID filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved, final]
 *         description: Grade status filter
 *     responses:
 *       200:
 *         description: Course grades retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/faculty', 
  authenticate, 
  authorize(['faculty', 'admin']), 
  courseGradeController.getCourseGradesByFaculty
);

/**
 * @swagger
 * /api/v1/course-grades/course/{courseId}:
 *   get:
 *     summary: Get course grades by course
 *     tags: [Course Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: query
 *         name: semester
 *         schema:
 *           type: number
 *         description: Semester filter
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Academic year filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved, final]
 *         description: Grade status filter
 *     responses:
 *       200:
 *         description: Course grades retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - faculty can only view grades for their own courses
 *       404:
 *         description: Course not found
 */
router.get('/course/:courseId', 
  authenticate, 
  authorize(['faculty', 'admin']), 
  courseGradeController.getCourseGradesByCourse
);

/**
 * @swagger
 * /api/v1/course-grades/{gradeId}:
 *   put:
 *     summary: Update course grade
 *     tags: [Course Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gradeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Grade ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseGrade'
 *     responses:
 *       200:
 *         description: Course grade updated successfully
 *       400:
 *         description: Validation error or grade already submitted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - faculty can only update their own grades
 *       404:
 *         description: Grade not found
 */
router.put('/:gradeId', 
  authenticate, 
  authorize(['faculty', 'admin']), 
  validateCourseGradeUpdate, 
  courseGradeController.updateCourseGrade
);

/**
 * @swagger
 * /api/v1/course-grades/{gradeId}/submit:
 *   post:
 *     summary: Submit course grade
 *     tags: [Course Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gradeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Grade ID
 *     responses:
 *       200:
 *         description: Course grade submitted successfully
 *       400:
 *         description: Grade already submitted or finalized
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - faculty can only submit their own grades
 *       404:
 *         description: Grade not found
 */
router.post('/:gradeId/submit', 
  authenticate, 
  authorize(['faculty', 'admin']), 
  courseGradeController.submitCourseGrade
);

/**
 * @swagger
 * /api/v1/course-grades/course/{courseId}/bulk-submit:
 *   post:
 *     summary: Bulk submit course grades
 *     tags: [Course Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gradeIds
 *             properties:
 *               gradeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of grade IDs to submit
 *     responses:
 *       200:
 *         description: Bulk grade submission completed
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - faculty can only submit grades for their own courses
 *       404:
 *         description: Course not found
 */
router.post('/course/:courseId/bulk-submit', 
  authenticate, 
  authorize(['faculty', 'admin']), 
  courseGradeController.bulkSubmitCourseGrades
);

/**
 * @swagger
 * /api/v1/course-grades/course/{courseId}/auto-calculate:
 *   post:
 *     summary: Auto-calculate grades from assignments
 *     tags: [Course Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - semester
 *               - academicYear
 *             properties:
 *               semester:
 *                 type: number
 *                 description: Semester number
 *               academicYear:
 *                 type: string
 *                 description: Academic year in format YYYY-YYYY
 *     responses:
 *       200:
 *         description: Grades auto-calculated successfully
 *       400:
 *         description: No graded assignments found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - faculty can only calculate grades for their own courses
 *       404:
 *         description: Course not found
 */
router.post('/course/:courseId/auto-calculate', 
  authenticate, 
  authorize(['faculty', 'admin']), 
  courseGradeController.autoCalculateGrades
);

/**
 * @swagger
 * /api/v1/course-grades/course/{courseId}/statistics:
 *   get:
 *     summary: Get grade statistics for a course
 *     tags: [Course Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *       - in: query
 *         name: semester
 *         schema:
 *           type: number
 *         description: Semester filter
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *         description: Academic year filter
 *     responses:
 *       200:
 *         description: Grade statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - faculty can only view statistics for their own courses
 *       404:
 *         description: Course not found
 */
router.get('/course/:courseId/statistics', 
  authenticate, 
  authorize(['faculty', 'admin']), 
  courseGradeController.getGradeStatistics
);

/**
 * @swagger
 * /api/v1/course-grades/{gradeId}:
 *   delete:
 *     summary: Delete course grade
 *     tags: [Course Grades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gradeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Grade ID
 *     responses:
 *       200:
 *         description: Course grade deleted successfully
 *       400:
 *         description: Cannot delete submitted or finalized grade
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - faculty can only delete their own grades
 *       404:
 *         description: Grade not found
 */
router.delete('/:gradeId', 
  authenticate, 
  authorize(['faculty', 'admin']), 
  courseGradeController.deleteCourseGrade
);

module.exports = router; 