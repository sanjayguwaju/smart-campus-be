const departmentService = require('../services/department.service');
const { ResponseHandler } = require('../utils/responseHandler');
const logger = require('../utils/logger');

// Create a new department
async function createDepartment(req, res) {
  try {
    const department = await departmentService.createDepartment(req.body, req.user._id);
    logger.info(`Department created: ${department.name} by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 201, 'Department created successfully', department);
  } catch (err) {
    logger.error('Error creating department:', err);
    if (err.message.includes('already exists')) {
      return ResponseHandler.error(res, 400, err.message);
    }
    ResponseHandler.error(res, 500, 'Error creating department');
  }
}

// Get all departments with pagination and filters
async function getDepartments(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      isActive,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const filters = { search, status, isActive };
    const pagination = { page, limit, sortBy, sortOrder };

    const result = await departmentService.getDepartments(filters, pagination);
    
    logger.info(`Departments retrieved: ${result.data.length} departments by user: ${req.user.email}`);
    
    // Return departments data with pagination at the same level
    ResponseHandler.success(res, 200,'Departments retrieved successfully', result.data, result.pagination);
  } catch (error) {
    logger.error('Error retrieving departments:', error);
    ResponseHandler.error(res, 500, 'Error retrieving departments');
  }
}

// Get a department by ID
async function getDepartmentById(req, res) {
  try {
    const department = await departmentService.getDepartmentById(req.params.id);
    
    logger.info(`Department retrieved: ${department.name} by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 'Department retrieved successfully', department);
  } catch (error) {
    logger.error('Error retrieving department:', error);
    if (error.message === 'Department not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    ResponseHandler.error(res, 500, 'Error retrieving department');
  }
}

// Update a department
async function updateDepartment(req, res) {
  try {
    const updateData = {
      ...req.body,
      lastModifiedBy: req.user._id
    };
    
    const department = await departmentService.updateDepartment(req.params.id, updateData);
    
    logger.info(`Department updated: ${department.name} by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 200, 'Department updated successfully', department);
  } catch (error) {
    logger.error('Error updating department:', error);
    if (error.message === 'Department not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    if (error.message.includes('already exists')) {
      return ResponseHandler.error(res, 400, error.message);
    }
    ResponseHandler.error(res, 500, 'Error updating department');
  }
}

// Delete a department
async function deleteDepartment(req, res) {
  try {
    const result = await departmentService.deleteDepartment(req.params.id);
    
    logger.info(`Department deleted by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 200, result.message);
  } catch (error) {
    logger.error('Error deleting department:', error);
    if (error.message === 'Department not found') {
      return ResponseHandler.notFound(res, 'The department you are trying to delete does not exist or has already been deleted.');
    }
    if (error.message.includes('Cannot delete department')) {
      return ResponseHandler.error(res, 400, error.message);
    }
    // Improved: Return the actual error message for unexpected errors
    return ResponseHandler.error(res, 500, error.message || 'An unexpected error occurred while deleting the department.');
  }
}

// Get active departments only
async function getActiveDepartments(req, res) {
  try {
    const departments = await departmentService.getActiveDepartments();
    
    logger.info(`Active departments retrieved: ${departments.length} departments by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 'Active departments retrieved successfully', departments);
  } catch (error) {
    logger.error('Error retrieving active departments:', error);
    ResponseHandler.error(res, 500, 'Error retrieving active departments');
  }
}

// Check department deletion eligibility
async function checkDepartmentDeletionEligibility(req, res) {
  try {
    const result = await departmentService.checkDepartmentDeletionEligibility(req.params.id);
    
    logger.info(`Department deletion eligibility checked by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 'Department deletion eligibility checked successfully', result);
  } catch (error) {
    logger.error('Error checking department deletion eligibility:', error);
    if (error.message === 'Department not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    ResponseHandler.error(res, 500, 'Error checking department deletion eligibility');
  }
}

// Get department statistics
async function getDepartmentStats(req, res) {
  try {
    const stats = await departmentService.getDepartmentStats();
    
    logger.info(`Department statistics retrieved by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 'Department statistics retrieved successfully', stats);
  } catch (error) {
    logger.error('Error retrieving department statistics:', error);
    ResponseHandler.error(res, 500, 'Error retrieving department statistics');
  }
}

// Search departments
async function searchDepartments(req, res) {
  try {
    const { q: searchTerm, limit = 10 } = req.query;
    
    if (!searchTerm) {
      return ResponseHandler.error(res, 400, 'Search term is required');
    }

    const departments = await departmentService.searchDepartments(searchTerm, parseInt(limit));
    
    logger.info(`Department search completed: ${departments.length} results for "${searchTerm}" by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 'Department search completed successfully', departments);
  } catch (error) {
    logger.error('Error searching departments:', error);
    ResponseHandler.error(res, 500, 'Error searching departments');
  }
}

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getActiveDepartments,
  checkDepartmentDeletionEligibility,
  getDepartmentStats,
  searchDepartments,
}; 