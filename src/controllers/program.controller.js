const ProgramService = require('../services/program.service');
const ResponseHandler = require('../utils/responseHandler');
const createError = require('../utils/createError');

const ProgramController = {
  async getAll(req, res) {
    try {
      const programs = await ProgramService.getAllPrograms();
      console.log('Fetched programs:', programs);
      return ResponseHandler.success(res, 200, 'Programs fetched successfully', programs);
    } catch (error) {
      return ResponseHandler.error(res, 500, error.message);
    }
  },

  async getById(req, res) {
    try {
      const program = await ProgramService.getProgramById(req.params.id);
      if (!program) return ResponseHandler.error(res, 404, 'Program not found');
      return ResponseHandler.success(res, 200, 'Program fetched successfully', program);
    } catch (error) {
      return ResponseHandler.error(res, 500, error.message);
    }
  },

  async create(req, res) {
    try {
      const program = await ProgramService.createProgram(req.body);
      return ResponseHandler.success(res, 201, 'Program created successfully', program);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  },

  async update(req, res) {
    try {
      const program = await ProgramService.updateProgram(req.params.id, req.body);
      if (!program) return ResponseHandler.error(res, 404, 'Program not found');
      return ResponseHandler.success(res, 200, 'Program updated successfully', program);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  },

  async delete(req, res) {
    try {
      const program = await ProgramService.deleteProgram(req.params.id);
      if (!program) return ResponseHandler.error(res, 404, 'Program not found');
      return ResponseHandler.success(res, 200, 'Program deleted successfully', program);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }
};

module.exports = ProgramController; 