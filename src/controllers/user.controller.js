const userService = require('../services/user.service');
const { ResponseHandler } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * User Controller
 */
class UserController {
  /**
   * Get all users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUsers(req, res) {
    try {
      const filters = {
        role: req.query.role,
        department: req.query.department,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await userService.getUsers(filters, pagination);

      // Return users data with pagination at the same level
      return ResponseHandler.success(res, 200, 'Users retrieved successfully', result.users, result.pagination);
    } catch (error) {
      logger.error('Get users error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve users');
    }
  }

  /**
   * Get user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserById(req, res) {
    try {
      const { userId } = req.params;
      const user = await userService.getUserById(userId);

      return ResponseHandler.success(res, 200, 'User retrieved successfully', user);
    } catch (error) {
      logger.error('Get user by ID error:', error);
      if (error.message === 'User not found') {
        return ResponseHandler.notFound(res, 'User not found');
      }
      return ResponseHandler.error(res, 500, 'Failed to retrieve user');
    }
  }

  /**
   * Create new user (Admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createUser(req, res) {
    try {
      const userData = req.body;
      const user = await userService.createUser(userData);

      return ResponseHandler.success(res, 201, 'User created successfully', user);
    } catch (error) {
      logger.error('Create user error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Create new admin account (Super Admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createAdmin(req, res) {
    try {
      const userData = {
        ...req.body,
        role: 'admin', // Force role to be admin
        isActive: true
      };
      
      const user = await userService.createUser(userData);

      return ResponseHandler.success(res, 201, 'Admin account created successfully', user);
    } catch (error) {
      logger.error('Create admin error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Update user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const updateData = req.body;
      const user = await userService.updateUser(userId, updateData);

      return ResponseHandler.success(res, 200, 'User updated successfully', user);
    } catch (error) {
      logger.error('Update user error:', error);
      if (error.message === 'User not found') {
        return ResponseHandler.notFound(res, 'User not found');
      }
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Delete user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      await userService.deleteUser(userId);

      return ResponseHandler.success(res, 200, 'User deleted successfully');
    } catch (error) {
      logger.error('Delete user error:', error);
      if (error.message === 'User not found') {
        return ResponseHandler.notFound(res, 'User not found');
      }
      return ResponseHandler.error(res, 500, 'Failed to delete user');
    }
  }

  /**
   * Get users by role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUsersByRole(req, res) {
    try {
      const { role } = req.params;
      const users = await userService.getUsersByRole(role);

      return ResponseHandler.success(res, 200, 'Users retrieved successfully', users);
    } catch (error) {
      logger.error('Get users by role error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve users');
    }
  }

  /**
   * Get user statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserStats(req, res) {
    try {
      const stats = await userService.getUserStats();

      return ResponseHandler.success(res, 200, 'User statistics retrieved successfully', stats);
    } catch (error) {
      logger.error('Get user stats error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve user statistics');
    }
  }

  /**
   * Activate/Deactivate user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async toggleUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      const user = await userService.updateUser(userId, { isActive });
      const status = isActive ? 'activated' : 'deactivated';

      return ResponseHandler.success(res, 200, `User ${status} successfully`, user);
    } catch (error) {
      logger.error('Toggle user status error:', error);
      if (error.message === 'User not found') {
        return ResponseHandler.notFound(res, 'User not found');
      }
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Deactivate user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deactivateUser(req, res) {
    try {
      const { userId } = req.params;
      const adminUserId = req.user._id;

      const result = await userService.deactivateUser(userId, adminUserId);

      return ResponseHandler.success(res, 200, result.message, result.user);
    } catch (error) {
      logger.error('Deactivate user error:', error);
      return ResponseHandler.error(res, error.statusCode || 400, error.message);
    }
  }

  /**
   * Activate user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async activateUser(req, res) {
    try {
      const { userId } = req.params;
      const adminUserId = req.user._id;

      const result = await userService.activateUser(userId, adminUserId);

      return ResponseHandler.success(res, 200, result.message, result.user);
    } catch (error) {
      logger.error('Activate user error:', error);
      return ResponseHandler.error(res, error.statusCode || 400, error.message);
    }
  }

  /**
   * Bulk update users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async bulkUpdateUsers(req, res) {
    try {
      const { userIds, updateData } = req.body;
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return ResponseHandler.error(res, 400, 'User IDs array is required');
      }

      const results = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          const user = await userService.updateUser(userId, updateData);
          results.push(user);
        } catch (error) {
          errors.push({ userId, error: error.message });
        }
      }

      const response = {
        updated: results,
        errors: errors.length > 0 ? errors : undefined
      };

      return ResponseHandler.success(res, 200, 'Bulk update completed', response);
    } catch (error) {
      logger.error('Bulk update users error:', error);
      return ResponseHandler.error(res, 500, 'Failed to perform bulk update');
    }
  }

  /**
   * Search users
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchUsers(req, res) {
    try {
      const { q: searchQuery, role, department } = req.query;

      if (!searchQuery) {
        return ResponseHandler.error(res, 400, 'Search query is required');
      }

      const filters = {
        search: searchQuery,
        role,
        department
      };

      const pagination = {
        page: 1,
        limit: 20,
        sortBy: 'firstName',
        sortOrder: 'asc'
      };

      const result = await userService.getUsers(filters, pagination);

      // Return users data with pagination at the same level
      return ResponseHandler.success(res, 200, 'Search completed successfully', result.users, result.pagination);
    } catch (error) {
      logger.error('Search users error:', error);
      return ResponseHandler.error(res, 500, 'Failed to search users');
    }
  }

  /**
   * Export users (CSV/JSON)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async exportUsers(req, res) {
    try {
      const { format = 'json', role, department } = req.query;

      const filters = {
        role,
        department,
        isActive: true
      };

      const pagination = {
        page: 1,
        limit: 1000, // Large limit for export
        sortBy: 'firstName',
        sortOrder: 'asc'
      };

      const result = await userService.getUsers(filters, pagination);

      if (format === 'csv') {
        // TODO: Implement CSV export
        return ResponseHandler.error(res, 501, 'CSV export not implemented yet');
      }

      // Return users data with pagination at the same level
      return ResponseHandler.success(res, 200, 'Users exported successfully', result.users, result.pagination);
    } catch (error) {
      logger.error('Export users error:', error);
      return ResponseHandler.error(res, 500, 'Failed to export users');
    }
  }
}

module.exports = new UserController(); 