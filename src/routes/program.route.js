const express = require('express');
const router = express.Router();
const programController = require('../controllers/program.controller');

// GET all programs
router.get('/', programController.getPrograms);

// GET program by ID
router.get('/:id', programController.getProgramById);

// POST create new program
router.post('/', programController.createProgram);

// PUT update program
router.put('/:id', programController.updateProgram);

// PUT publish program
router.put('/:id/publish', programController.publishProgram);

// DELETE program
router.delete('/:id', programController.deleteProgram);

module.exports = router; 