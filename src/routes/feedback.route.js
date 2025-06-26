const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { authenticate, requireAdmin, requireStudent } = require('../middleware/auth.middleware');

// Submit feedback (student)
router.post('/', authenticate, requireStudent, feedbackController.submitFeedback);

// Get all feedback (admin)
router.get('/', authenticate, requireAdmin, feedbackController.getAllFeedback);

// Get feedback by user (student)
router.get('/me', authenticate, requireStudent, feedbackController.getUserFeedback);

// Admin reply to feedback
router.post('/:feedbackId/reply', authenticate, requireAdmin, feedbackController.replyToFeedback);

// Admin update feedback status
router.patch('/:feedbackId/status', authenticate, requireAdmin, feedbackController.updateStatus);

module.exports = router; 