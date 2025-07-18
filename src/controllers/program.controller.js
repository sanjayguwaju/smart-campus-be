const programService = require('../services/program.service');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

// Get all programs with pagination and filters
async function getPrograms(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      department,
      level,
      status,
      isPublished,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const filters = { search, department, level, status, isPublished };
    const pagination = { page, limit, sortBy, sortOrder };

    const result = await programService.getPrograms(filters, pagination);
    
    logger.info(`Programs retrieved: ${result?.data?.length} programs by user: ${req?.user?.email}`);

    // Return programs data with pagination at the same level
    ResponseHandler.success(res, 200, 'Programs retrieved successfully', result.data, result.pagination);
  } catch (error) {
    logger.error('Error retrieving programs:', error);
    ResponseHandler.error(res, 500, 'Error retrieving programs');
  }
}

// Get a program by ID
async function getProgramById(req, res) {
  try {
    const program = await programService.getProgramById(req.params.id);
    
    logger.info(`Program retrieved: ${program.name} by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 200, 'Program retrieved successfully', program);
  } catch (error) {
    logger.error('Error retrieving program:', error);
    if (error.message === 'Program not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    ResponseHandler.error(res, 500, 'Error retrieving program');
  }
}

// Create a new program
async function createProgram(req, res) {
  try {
    console.log('req.user:', req.user);
    const program = await programService.createProgram({
      ...req.body,
      createdBy: req.user && req.user._id ? req.user._id : undefined
    });
    logger.info(`Program created: ${program.name} by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 201, 'Program created successfully', program);
  } catch (err) {
    logger.error('Error creating program:', err);
    if (err.message.includes('already exists')) {
      return ResponseHandler.error(res, 400, err.message);
    }
    if (err.message === 'Department not found') {
      return ResponseHandler.error(res, 400, err.message);
    }
    ResponseHandler.error(res, 500, 'Error creating program');
  }
}

// Update a program
async function updateProgram(req, res) {
  try {
    const program = await programService.updateProgram(req.params.id, req.body);
    
    logger.info(`Program updated: ${program.name} by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 200, 'Program updated successfully', program);
  } catch (error) {
    logger.error('Error updating program:', error);
    if (error.message === 'Program not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    if (error.message.includes('already exists')) {
      return ResponseHandler.error(res, 400, error.message);
    }
    if (error.message === 'Department not found') {
      return ResponseHandler.error(res, 400, error.message);
    }
    ResponseHandler.error(res, 500, 'Error updating program');
  }
}

// Delete a program
async function deleteProgram(req, res) {
  try {
    const result = await programService.deleteProgram(req.params.id);
    
    logger.info(`Program deleted by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 200, result.message);
  } catch (error) {
    logger.error('Error deleting program:', error);
    if (error.message === 'Program not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    if (error.message.includes('Cannot delete a published program')) {
      return ResponseHandler.error(res, 400, error.message);
    }
    ResponseHandler.error(res, 500, 'Error deleting program');
  }
}

// Publish or unpublish a program
async function publishProgram(req, res) {
  try {
    const { isPublished } = req.body;
    
    if (typeof isPublished !== 'boolean') {
      return ResponseHandler.error(res, 400, 'isPublished must be a boolean');
    }

    const program = await programService.publishProgram(req.params.id, isPublished);
    
    logger.info(`Program ${isPublished ? 'published' : 'unpublished'}: ${program.name} by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 200, `Program ${isPublished ? 'published' : 'unpublished'} successfully`, program);
  } catch (error) {
    logger.error('Error publishing/unpublishing program:', error);
    if (error.message === 'Program not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    ResponseHandler.error(res, 500, 'Error publishing/unpublishing program');
  }
}

// Get published programs only
async function getPublishedPrograms(req, res) {
  try {
    const programs = await programService.getPublishedPrograms();
    
    logger.info(`Published programs retrieved: ${programs.length} programs by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 200, 'Published programs retrieved successfully', programs);
  } catch (error) {
    logger.error('Error retrieving published programs:', error);
    ResponseHandler.error(res, 500, 'Error retrieving published programs');
  }
}

// Get programs by department
async function getProgramsByDepartment(req, res) {
  try {
    const programs = await programService.getProgramsByDepartment(req.params.departmentId);
    
    logger.info(`Programs retrieved for department: ${programs.length} programs by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 200, 'Programs retrieved successfully', programs);
  } catch (error) {
    logger.error('Error retrieving programs by department:', error);
    ResponseHandler.error(res, 500, 'Error retrieving programs by department');
  }
}

// Search programs
async function searchPrograms(req, res) {
  try {
    const { q: searchTerm, limit = 10 } = req.query;
    
    if (!searchTerm) {
      return ResponseHandler.error(res, 400, 'Search term is required');
    }

    const programs = await programService.searchPrograms(searchTerm, parseInt(limit));
    
    logger.info(`Program search completed: ${programs.length} results for "${searchTerm}" by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 200, 'Program search completed successfully', programs);
  } catch (error) {
    logger.error('Error searching programs:', error);
    ResponseHandler.error(res, 500, 'Error searching programs');
  }
}

// Get program statistics
async function getProgramStats(req, res) {
  try {
    const stats = await programService.getProgramStats();
    
    logger.info(`Program statistics retrieved by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 200, 'Program statistics retrieved successfully', stats);
  } catch (error) {
    logger.error('Error retrieving program statistics:', error);
    ResponseHandler.error(res, 500, 'Error retrieving program statistics');
  }
}

// Get programs by level
async function getProgramsByLevel(req, res) {
  try {
    const { level } = req.params;
    
    if (!['Undergraduate', 'Postgraduate'].includes(level)) {
      return ResponseHandler.error(res, 400, 'Level must be either "Undergraduate" or "Postgraduate"');
    }

    const programs = await programService.getProgramsByLevel(level);
    
    logger.info(`Programs retrieved for level ${level}: ${programs.length} programs by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 200, 'Programs retrieved successfully', programs);
  } catch (error) {
    logger.error('Error retrieving programs by level:', error);
    ResponseHandler.error(res, 500, 'Error retrieving programs by level');
  }
}

module.exports = {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  publishProgram,
  getPublishedPrograms,
  getProgramsByDepartment,
  searchPrograms,
  getProgramStats,
  getProgramsByLevel,
}; 