const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const { authenticate, requireFacultyOrAdmin, requireStudent } = require('../middleware/auth.middleware');

// Create exam (faculty/admin)
router.post('/', authenticate, requireFacultyOrAdmin, examController.createExam);

// Update exam (faculty/admin)
router.put('/:examId', authenticate, requireFacultyOrAdmin, examController.updateExam);

// Delete exam (faculty/admin)
router.delete('/:examId', authenticate, requireFacultyOrAdmin, examController.deleteExam);

// Set student result (faculty/admin)
router.post('/set-result', authenticate, requireFacultyOrAdmin, examController.setStudentResult);

// Get all exams for a course (faculty/admin)
router.get('/course', authenticate, requireFacultyOrAdmin, examController.getCourseExams);

// Get student's exam timetable (student)
router.get('/timetable/me', authenticate, requireStudent, examController.getStudentExamTimetable);

// Get student's results (student)
router.get('/results/me', authenticate, requireStudent, examController.getStudentResults);

// Get student's GPA/percentage (student)
router.get('/gpa/me', authenticate, requireStudent, examController.getStudentGPA);

module.exports = router; 