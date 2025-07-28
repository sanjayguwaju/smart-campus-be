const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { authenticate, requireFacultyOrAdmin, canAccessCourse, canModifyCourse } = require('../middleware/auth.middleware');
const {
  validateCourseCreation,
  validateCourseUpdate,
  validateCourseId,
  validateCourseQuery,
  validateCourseEnrollment,
  validateCourseMaterial,
  validateCourseAssignment,
  validateAssignmentSubmission,
  validateAssignmentGrading
} = require('../validation/course.validation');

/**
 * @swagger
 * /api/v1/courses:
 *   get:
 *     summary: Get all courses with pagination and filters
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *           enum: [Fall, Spring, Summer, Winter]
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: instructor
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 */
router.get('/', authenticate, validateCourseQuery, courseController.getCourses);

/**
 * @swagger
 * /api/v1/courses/{courseId}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course retrieved successfully
 *       404:
 *         description: Course not found
 */
router.get('/:courseId', authenticate, validateCourseId, canAccessCourse, courseController.getCourseById);

/**
 * @swagger
 * /api/v1/courses:
 *   post:
 *     summary: Create new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - code
 *               - description
 *               - faculty
 *               - department
 *               - credits
 *               - semester
 *               - year
 *               - maxStudents
 *             properties:
 *               title:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               faculty:
 *                 type: string
 *               department:
 *                 type: string
 *               credits:
 *                 type: integer
 *               semester:
 *                 type: string
 *                 enum: [Fall, Spring, Summer, Winter]
 *               year:
 *                 type: integer
 *               maxStudents:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, requireFacultyOrAdmin, validateCourseCreation, courseController.createCourse);

/**
 * @swagger
 * /api/v1/courses/{courseId}:
 *   put:
 *     summary: Update course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               faculty:
 *                 type: string
 *               department:
 *                 type: string
 *               credits:
 *                 type: integer
 *               semester:
 *                 type: string
 *                 enum: [Fall, Spring, Summer, Winter]
 *               year:
 *                 type: integer
 *               maxStudents:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 */
router.put('/:courseId', authenticate, validateCourseId, canModifyCourse, validateCourseUpdate, courseController.updateCourse);

/**
 * @swagger
 * /api/v1/courses/{courseId}:
 *   delete:
 *     summary: Delete course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       404:
 *         description: Course not found
 */
router.delete('/:courseId', authenticate, validateCourseId, canModifyCourse, courseController.deleteCourse);

/**
 * @swagger
 * /api/v1/courses/{courseId}/enroll:
 *   post:
 *     summary: Enroll student in course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student enrolled successfully
 */
router.post('/:courseId/enroll', authenticate, validateCourseId, validateCourseEnrollment, courseController.enrollStudent);

/**
 * @swagger
 * /api/v1/courses/{courseId}/remove-student:
 *   post:
 *     summary: Remove student from course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student removed successfully
 */
router.post('/:courseId/remove-student', authenticate, validateCourseId, validateCourseEnrollment, courseController.removeStudent);

/**
 * @swagger
 * /api/v1/courses/{courseId}/materials:
 *   post:
 *     summary: Add course material
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - fileUrl
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               fileUrl:
 *                 type: string
 *               fileType:
 *                 type: string
 *                 enum: [pdf, doc, docx, ppt, pptx, video, image, other]
 *     responses:
 *       200:
 *         description: Material added successfully
 */
router.post('/:courseId/materials', authenticate, validateCourseId, canModifyCourse, validateCourseMaterial, courseController.addCourseMaterial);

/**
 * @swagger
 * /api/v1/courses/{courseId}/materials/{materialId}:
 *   delete:
 *     summary: Remove course material
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material removed successfully
 */
router.delete('/:courseId/materials/:materialId', authenticate, validateCourseId, canModifyCourse, courseController.removeCourseMaterial);

/**
 * @swagger
 * /api/v1/courses/{courseId}/assignments:
 *   post:
 *     summary: Add course assignment
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - dueDate
 *               - totalPoints
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               totalPoints:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Assignment added successfully
 */
router.post('/:courseId/assignments', authenticate, validateCourseId, canModifyCourse, validateCourseAssignment, courseController.addCourseAssignment);

/**
 * @swagger
 * /api/v1/courses/{courseId}/assignments/{assignmentId}/submit:
 *   post:
 *     summary: Submit assignment
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Assignment submitted successfully
 */
router.post('/:courseId/assignments/:assignmentId/submit', authenticate, validateCourseId, validateAssignmentSubmission, courseController.submitAssignment);

/**
 * @swagger
 * /api/v1/courses/{courseId}/assignments/{assignmentId}/grade/{studentId}:
 *   post:
 *     summary: Grade assignment
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: assignmentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - grade
 *             properties:
 *               grade:
 *                 type: number
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment graded successfully
 */
router.post('/:courseId/assignments/:assignmentId/grade/:studentId', authenticate, validateCourseId, canModifyCourse, validateAssignmentGrading, courseController.gradeAssignment);

/**
 * @swagger
 * /api/v1/courses/instructor/{instructorId}:
 *   get:
 *     summary: Get courses by instructor
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: instructorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 */
router.get('/instructor/:instructorId', authenticate, courseController.getCoursesByInstructor);

/**
 * @swagger
 * /api/v1/courses/faculty/{facultyId}:
 *   get:
 *     summary: Get courses assigned to a specific faculty
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facultyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the faculty member
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
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
 *                     $ref: '#/components/schemas/Course'
 *       404:
 *         description: Faculty not found
 *       500:
 *         description: Internal server error
 */
router.get('/faculty/:facultyId', authenticate, courseController.getCoursesByFaculty);

/**
 * @swagger
 * /api/v1/courses/faculty/{facultyId}/students:
 *   get:
 *     summary: Get all students enrolled in faculty's courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facultyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the faculty member
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of students per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [firstName, lastName, email, studentId, gpa]
 *           default: firstName
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by specific course ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search students by name, email, or student ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, dropped, suspended, graduated]
 *           default: active
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: Students retrieved successfully
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
 *                       _id:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       studentId:
 *                         type: string
 *                       department:
 *                         type: object
 *                       courses:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             code:
 *                               type: string
 *                       totalCredits:
 *                         type: number
 *                       gpa:
 *                         type: number
 *                       enrollmentStatus:
 *                         type: string
 *                       enrollmentType:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalStudents:
 *                       type: integer
 *                     totalCourses:
 *                       type: integer
 *                     averageStudentsPerCourse:
 *                       type: number
 *       404:
 *         description: Faculty not found
 *       500:
 *         description: Internal server error
 */
router.get('/faculty/:facultyId/students', authenticate, courseController.getStudentsByFaculty);

/**
 * @swagger
 * /api/v1/courses/faculty/{facultyId}/students/aggregated:
 *   get:
 *     summary: Get faculty students data using efficient aggregation pipeline
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: facultyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the faculty member
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of students per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [firstName, lastName, email, studentId, gpa, totalCredits, courseCount]
 *           default: firstName
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filter by specific course ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search students by name, email, or student ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, dropped, suspended, graduated]
 *           default: active
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: Faculty students data retrieved successfully
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
 *                       _id:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       studentId:
 *                         type: string
 *                       department:
 *                         type: object
 *                       phone:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                       courses:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             title:
 *                               type: string
 *                             code:
 *                               type: string
 *                             courseType:
 *                               type: string
 *                             creditHours:
 *                               type: number
 *                             semester:
 *                               type: number
 *                             year:
 *                               type: number
 *                             currentEnrollment:
 *                               type: number
 *                             maxStudents:
 *                               type: number
 *                       totalCredits:
 *                         type: number
 *                       courseCount:
 *                         type: number
 *                       enrollmentStatus:
 *                         type: string
 *                       enrollmentType:
 *                         type: string
 *                       gpa:
 *                         type: number
 *                       cgpa:
 *                         type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalStudents:
 *                       type: integer
 *                     totalCourses:
 *                       type: integer
 *                     averageStudentsPerCourse:
 *                       type: number
 *                     faculty:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         facultyId:
 *                           type: string
 *                         department:
 *                           type: object
 *       404:
 *         description: Faculty not found
 *       500:
 *         description: Internal server error
 */
router.get('/faculty/:facultyId/students/aggregated', authenticate, courseController.getFacultyStudentsAggregated);

/**
 * @swagger
 * /api/v1/courses/department/{department}:
 *   get:
 *     summary: Get courses by department
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: department
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
 */
router.get('/department/:department', authenticate, courseController.getCoursesByDepartment);

/**
 * @swagger
 * /api/v1/courses/available:
 *   get:
 *     summary: Get available courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Available courses retrieved successfully
 */
router.get('/available', authenticate, courseController.getAvailableCourses);

/**
 * @swagger
 * /api/v1/courses/stats:
 *   get:
 *     summary: Get course statistics
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course statistics retrieved successfully
 */
router.get('/stats', authenticate, requireFacultyOrAdmin, courseController.getCourseStats);

/**
 * @swagger
 * /api/v1/courses/{courseId}/toggle-publish:
 *   patch:
 *     summary: Publish/Unpublish course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isPublished
 *             properties:
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Course publish status updated successfully
 */
router.patch('/:courseId/toggle-publish', authenticate, validateCourseId, canModifyCourse, courseController.toggleCoursePublish);

/**
 * @swagger
 * /api/v1/courses/{courseId}/toggle-status:
 *   patch:
 *     summary: Activate/Deactivate course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Course status updated successfully
 */
router.patch('/:courseId/toggle-status', authenticate, validateCourseId, canModifyCourse, courseController.toggleCourseStatus);

/**
 * @swagger
 * /api/v1/courses/search:
 *   get:
 *     summary: Search courses
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *           enum: [Fall, Spring, Summer, Winter]
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search completed successfully
 */
router.get('/search', authenticate, courseController.searchCourses);

/**
 * @swagger
 * /api/v1/courses/{courseId}/enrollment-status:
 *   get:
 *     summary: Get course enrollment status for current user
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment status retrieved successfully
 */
router.get('/:courseId/enrollment-status', authenticate, validateCourseId, courseController.getEnrollmentStatus);

module.exports = router; 