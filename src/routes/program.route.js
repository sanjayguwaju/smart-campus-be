const express = require('express');
const router = express.Router();
const ProgramController = require('../controllers/program.controller');

// GET all programs
router.get('/', ProgramController.getAll);

// GET program by ID
router.get('/:id', ProgramController.getById);

// POST create new program
router.post('/', ProgramController.create);

// PUT update program
router.put('/:id', ProgramController.update);

// PUT publish/unpublish program
router.put('/:id/publish', ProgramController.publish);

// DELETE program
router.delete('/:id', ProgramController.delete);

module.exports = router; 