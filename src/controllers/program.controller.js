const ProgramService = require('../services/program.service');
const ResponseHandler = require('../utils/responseHandler');
const createError = require('../utils/createError');
const Program = require('../models/program.model');
const Department = require('../models/department.model');

// --- CRUD functions used by the router ---

async function getPrograms(req, res) {
  try {
    const programs = await Program.find().populate('department', 'name');
    res.json({ success: true, data: programs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getProgramById(req, res) {
  try {
    const program = await Program.findById(req.params.id).populate('department', 'name');
    if (!program) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: program });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function createProgram(req, res) {
  try {
    const program = new Program(req.body);
    await program.save();
    res.status(201).json({ success: true, data: program });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

async function updateProgram(req, res) {
  try {
    const program = await Program.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('department');
    if (!program) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: program });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

async function deleteProgram(req, res) {
  try {
    const program = await Program.findByIdAndDelete(req.params.id);
    if (!program) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, message: 'Program deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

async function publishProgram(req, res) {
  try {
    const { isPublished } = req.body;
    if (typeof isPublished !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isPublished must be a boolean' });
    }
    const program = await Program.findByIdAndUpdate(
      req.params.id,
      { isPublished },
      { new: true }
    );
    if (!program) return res.status(404).json({ success: false, error: 'Program not found' });
    res.json({ success: true, data: program });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}

// --- (Optional) Other advanced functions can be exported as needed ---

module.exports = {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  publishProgram,
  // Add other exports as needed
}; 