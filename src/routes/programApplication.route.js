const express = require('express');
const router = express.Router();
const programApplicationController = require('../controllers/programApplication.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Student applies to a program
router.post('/', authenticate, authorize(['student']), programApplicationController.applyToProgram);

// Admin lists all applications
router.get('/', authenticate, authorize(['admin']), programApplicationController.listApplications);

// Admin approves an application
router.patch('/:id/approve', authenticate, authorize(['admin']), programApplicationController.approveApplication);

// Admin rejects an application
router.patch('/:id/reject', authenticate, authorize(['admin']), programApplicationController.rejectApplication);

module.exports = router; 