const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, requireFacultyOrAdmin, requireStudent } = require('../middleware/auth.middleware');

// Mark attendance for a single student (faculty/admin)
router.post('/mark', authenticate, requireFacultyOrAdmin, attendanceController.markAttendance);

// Bulk mark attendance for multiple students (faculty/admin)
router.post('/bulk-mark', authenticate, requireFacultyOrAdmin, attendanceController.bulkMarkAttendance);

// Get student attendance for a course (student or faculty/admin)
router.get('/student', authenticate, attendanceController.getStudentAttendance);

// Get course attendance for a date (faculty/admin)
router.get('/course', authenticate, requireFacultyOrAdmin, attendanceController.getCourseAttendance);

// Get monthly attendance percentage for a student (student or faculty/admin)
router.get('/monthly-percentage', authenticate, attendanceController.getMonthlyPercentage);

module.exports = router; 