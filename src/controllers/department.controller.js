const Department = require('../models/department.model');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

// Create a new department
async function createDepartment(req, res) {
  try {
    const departmentData = {
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
      headOfDepartment: req.body.headOfDepartment,
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone,
      location: req.body.location,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    // Check if department with same name or code already exists
    const existingDepartment = await Department.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${req.body.name}$`, 'i') } },
        ...(req.body.code ? [{ code: req.body.code.toUpperCase() }] : [])
      ]
    });

    if (existingDepartment) {
      return ResponseHandler.badRequest(res, 'Department with this name or code already exists');
    }

    const department = await Department.create(departmentData);
    logger.info(`Department created: ${department.name} by user: ${req.user.email}`);
    
    ResponseHandler.created(res, 'Department created successfully', department);
  } catch (err) {
    logger.error('Error creating department:', err);
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
      isActive,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const departments = await Department.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Department.countDocuments(query);
    const pages = Math.ceil(total / parseInt(limit));

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages
    };

    logger.info(`Departments retrieved: ${departments.length} departments by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 'Departments retrieved successfully', {
      data: departments,
      pagination
    });
  } catch (error) {
    logger.error('Error retrieving departments:', error);
    ResponseHandler.error(res, 500, 'Error retrieving departments');
  }
}

// Get a department by ID
async function getDepartmentById(req, res) {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return ResponseHandler.notFound(res, 'Department not found');
    }

    logger.info(`Department retrieved: ${department.name} by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 'Department retrieved successfully', department);
  } catch (error) {
    logger.error('Error retrieving department:', error);
    ResponseHandler.error(res, 500, 'Error retrieving department');
  }
}

// Update a department
async function updateDepartment(req, res) {
  try {
    const updateData = {};
    
    // Only include fields that are provided
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.code !== undefined) updateData.code = req.body.code;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.headOfDepartment !== undefined) updateData.headOfDepartment = req.body.headOfDepartment;
    if (req.body.contactEmail !== undefined) updateData.contactEmail = req.body.contactEmail;
    if (req.body.contactPhone !== undefined) updateData.contactPhone = req.body.contactPhone;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

    // Check if department with same name or code already exists (excluding current department)
    if (req.body.name || req.body.code) {
      const existingQuery = {
        _id: { $ne: req.params.id },
        $or: []
      };

      if (req.body.name) {
        existingQuery.$or.push({ name: { $regex: new RegExp(`^${req.body.name}$`, 'i') } });
      }
      if (req.body.code) {
        existingQuery.$or.push({ code: req.body.code.toUpperCase() });
      }

      const existingDepartment = await Department.findOne(existingQuery);
      if (existingDepartment) {
        return ResponseHandler.badRequest(res, 'Department with this name or code already exists');
      }
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!department) {
      return ResponseHandler.notFound(res, 'Department not found');
    }

    logger.info(`Department updated: ${department.name} by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 'Department updated successfully', department);
  } catch (error) {
    logger.error('Error updating department:', error);
    ResponseHandler.error(res, 500, 'Error updating department');
  }
}

// Delete a department
async function deleteDepartment(req, res) {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return ResponseHandler.notFound(res, 'Department not found');
    }

    // Check if department is being used by any courses or users
    const Course = require('../models/course.model');
    const User = require('../models/user.model');

    const [coursesUsingDept, usersUsingDept] = await Promise.all([
      Course.countDocuments({ department: req.params.id }),
      User.countDocuments({ department: req.params.id })
    ]);

    if (coursesUsingDept > 0 || usersUsingDept > 0) {
      return ResponseHandler.badRequest(
        res, 
        `Cannot delete department. It is being used by ${coursesUsingDept} courses and ${usersUsingDept} users.`
      );
    }

    await Department.findByIdAndDelete(req.params.id);
    
    logger.info(`Department deleted: ${department.name} by user: ${req.user.email}`);
    
    ResponseHandler.success(res, 'Department deleted successfully');
  } catch (error) {
    logger.error('Error deleting department:', error);
    ResponseHandler.error(res, 500, 'Error deleting department');
  }
}

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
}; 