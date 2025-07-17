const Department = require('../models/department.model');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Department Service Class
 */
class DepartmentService {
  /**
   * Create a new department
   * @param {Object} departmentData - Department data
   * @returns {Promise<Object>} Created department
   */
  async createDepartment(departmentData) {
    try {
      const data = {
        name: departmentData.name,
        code: departmentData.code,
        description: departmentData.description,
        headOfDepartment: departmentData.headOfDepartment,
        contactEmail: departmentData.contactEmail,
        contactPhone: departmentData.contactPhone,
        location: departmentData.location,
        isActive: departmentData.isActive !== undefined ? departmentData.isActive : true
      };

      // Check if department with same name or code already exists
      const existingDepartment = await Department.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${data.name}$`, 'i') } },
          ...(data.code ? [{ code: data.code.toUpperCase() }] : [])
        ]
      });

      if (existingDepartment) {
        throw new Error('Department with this name or code already exists');
      }

      const department = await Department.create(data);
      logger.info(`Department created: ${department.name}`);
      return department;
    } catch (error) {
      logger.error('Error creating department:', error);
      throw error;
    }
  }

  /**
   * Get all departments with pagination and filters
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Departments with pagination info
   */
  async getDepartments(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = pagination;
      const { search, isActive } = filters;

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
        .limit(parseInt(limit))
        .lean();

      // Get total count for pagination
      const total = await Department.countDocuments(query);
      const pages = Math.ceil(total / parseInt(limit));

      const paginationInfo = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      };

      logger.info(`Departments retrieved: ${departments.length} departments`);
      return {
        data: departments,
        pagination: paginationInfo
      };
    } catch (error) {
      logger.error('Error retrieving departments:', error);
      throw error;
    }
  }

  /**
   * Get a department by ID
   * @param {string} departmentId - Department ID
   * @returns {Promise<Object>} Department object
   */
  async getDepartmentById(departmentId) {
    try {
      const department = await Department.findById(departmentId);
      
      if (!department) {
        throw new Error('Department not found');
      }

      logger.info(`Department retrieved: ${department.name}`);
      return department;
    } catch (error) {
      logger.error('Error retrieving department:', error);
      throw error;
    }
  }

  /**
   * Update a department
   * @param {string} departmentId - Department ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated department
   */
  async updateDepartment(departmentId, updateData) {
    try {
      const data = {};
      
      // Only include fields that are provided
      if (updateData.name !== undefined) data.name = updateData.name;
      if (updateData.code !== undefined) data.code = updateData.code;
      if (updateData.description !== undefined) data.description = updateData.description;
      if (updateData.headOfDepartment !== undefined) data.headOfDepartment = updateData.headOfDepartment;
      if (updateData.contactEmail !== undefined) data.contactEmail = updateData.contactEmail;
      if (updateData.contactPhone !== undefined) data.contactPhone = updateData.contactPhone;
      if (updateData.location !== undefined) data.location = updateData.location;
      if (updateData.isActive !== undefined) data.isActive = updateData.isActive;

      // Check if department with same name or code already exists (excluding current department)
      if (updateData.name || updateData.code) {
        const existingQuery = {
          _id: { $ne: departmentId },
          $or: []
        };

        if (updateData.name) {
          existingQuery.$or.push({ name: { $regex: new RegExp(`^${updateData.name}$`, 'i') } });
        }
        if (updateData.code) {
          existingQuery.$or.push({ code: updateData.code.toUpperCase() });
        }

        const existingDepartment = await Department.findOne(existingQuery);
        if (existingDepartment) {
          throw new Error('Department with this name or code already exists');
        }
      }

      const department = await Department.findByIdAndUpdate(
        departmentId,
        data,
        { new: true, runValidators: true }
      );

      if (!department) {
        throw new Error('Department not found');
      }

      logger.info(`Department updated: ${department.name}`);
      return department;
    } catch (error) {
      logger.error('Error updating department:', error);
      throw error;
    }
  }

  /**
   * Delete a department
   * @param {string} departmentId - Department ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteDepartment(departmentId) {
    try {
      const department = await Department.findById(departmentId);
      
      if (!department) {
        throw new Error('Department not found');
      }

      // Check if department is being used by any courses or users
      const [coursesUsingDept, usersUsingDept] = await Promise.all([
        Course.countDocuments({ department: departmentId }),
        User.countDocuments({ department: departmentId })
      ]);

      if (coursesUsingDept > 0 || usersUsingDept > 0) {
        throw new Error(
          `Cannot delete department. It is being used by ${coursesUsingDept} courses and ${usersUsingDept} users.`
        );
      }

      await Department.findByIdAndDelete(departmentId);
      
      logger.info(`Department deleted: ${department.name}`);
      return { success: true, message: 'Department deleted successfully' };
    } catch (error) {
      logger.error('Error deleting department:', error);
      throw error;
    }
  }

  /**
   * Get active departments only
   * @returns {Promise<Array>} Active departments
   */
  async getActiveDepartments() {
    try {
      const departments = await Department.findActive();
      logger.info(`Active departments retrieved: ${departments.length} departments`);
      return departments;
    } catch (error) {
      logger.error('Error retrieving active departments:', error);
      throw error;
    }
  }

  /**
   * Check if department can be deleted
   * @param {string} departmentId - Department ID
   * @returns {Promise<Object>} Deletion check result
   */
  async checkDepartmentDeletionEligibility(departmentId) {
    try {
      const department = await Department.findById(departmentId);
      
      if (!department) {
        throw new Error('Department not found');
      }

      const canBeDeleted = await department.canBeDeleted();
      
      if (!canBeDeleted) {
        const [coursesUsingDept, usersUsingDept] = await Promise.all([
          Course.countDocuments({ department: departmentId }),
          User.countDocuments({ department: departmentId })
        ]);

        return {
          canBeDeleted: false,
          coursesUsingDept,
          usersUsingDept,
          message: `Department is being used by ${coursesUsingDept} courses and ${usersUsingDept} users`
        };
      }

      return {
        canBeDeleted: true,
        coursesUsingDept: 0,
        usersUsingDept: 0,
        message: 'Department can be safely deleted'
      };
    } catch (error) {
      logger.error('Error checking department deletion eligibility:', error);
      throw error;
    }
  }

  /**
   * Get department statistics
   * @returns {Promise<Object>} Department statistics
   */
  async getDepartmentStats() {
    try {
      const [totalDepartments, activeDepartments, inactiveDepartments] = await Promise.all([
        Department.countDocuments(),
        Department.countDocuments({ isActive: true }),
        Department.countDocuments({ isActive: false })
      ]);

      const stats = {
        total: totalDepartments,
        active: activeDepartments,
        inactive: inactiveDepartments,
        activePercentage: totalDepartments > 0 ? Math.round((activeDepartments / totalDepartments) * 100) : 0
      };

      logger.info('Department statistics retrieved');
      return stats;
    } catch (error) {
      logger.error('Error retrieving department statistics:', error);
      throw error;
    }
  }

  /**
   * Search departments by name or code
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Matching departments
   */
  async searchDepartments(searchTerm, limit = 10) {
    try {
      const departments = await Department.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { code: { $regex: searchTerm, $options: 'i' } }
        ],
        isActive: true
      })
      .sort({ name: 1 })
      .limit(limit);

      logger.info(`Department search completed: ${departments.length} results for "${searchTerm}"`);
      return departments;
    } catch (error) {
      logger.error('Error searching departments:', error);
      throw error;
    }
  }
}

module.exports = new DepartmentService(); 