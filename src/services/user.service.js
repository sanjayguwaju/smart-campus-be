const User = require('../models/user.model');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * User Service Class
 */
class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create user
      const user = new User(userData);
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info(`User created: ${user.email}`);
      return userResponse;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User with tokens
   */
  async authenticateUser(email, password) {
    try {
      // Find user with password
      const user = await User.findByEmail(email).select('+password');
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: user.role
      };

      const accessToken = generateToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      // Remove sensitive data from response
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.refreshToken;

      logger.info(`User logged in: ${user.email}`);
      return {
        user: userResponse,
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New access token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const { verifyRefreshToken } = require('../utils/jwt');
      const decoded = verifyRefreshToken(refreshToken);

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive || user.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: user.role
      };

      const newAccessToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      // Update refresh token
      user.refreshToken = newRefreshToken;
      await user.save();

      logger.info(`Token refreshed for user: ${user.email}`);
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User object
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password -refreshToken');
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get all users with pagination and filters
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Users with pagination info
   */
  async getUsers(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const { role, department, isActive, search } = filters;

      // Build query
      const query = {};
      if (role) query.role = role;
      if (department) query.department = { $regex: department, $options: 'i' };
      if (isActive !== undefined) query.isActive = isActive;
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const skip = (page - 1) * limit;
      const users = await User.find(query)
        .select('-password -refreshToken')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Get total count
      const total = await User.countDocuments(query);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if email is being updated and if it already exists
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findByEmail(updateData.email);
        if (existingUser) {
          throw new Error('Email already exists');
        }
      }

      // Update user
      Object.assign(user, updateData);
      await user.save();

      // Remove sensitive data from response
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.refreshToken;

      logger.info(`User updated: ${user.email}`);
      return userResponse;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await User.findByIdAndDelete(userId);
      logger.info(`User deleted: ${user.email}`);
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
      return true;
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Logout user (invalidate refresh token)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async logoutUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.refreshToken = null;
      await user.save();

      logger.info(`User logged out: ${user.email}`);
      return true;
    } catch (error) {
      logger.error('Error logging out user:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Promise<Array>} Users with specified role
   */
  async getUsersByRole(role) {
    try {
      const users = await User.findByRole(role).select('-password -refreshToken');
      return users;
    } catch (error) {
      logger.error('Error getting users by role:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: ['$isActive', 1, 0] }
            }
          }
        }
      ]);

      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });

      return {
        total: totalUsers,
        active: activeUsers,
        byRole: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            total: stat.count,
            active: stat.activeCount
          };
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Admin reset user password (admin only)
   * @param {string} targetUserId - Target user ID whose password to reset
   * @param {string} newPassword - New password
   * @param {string} adminUserId - Admin user ID performing the reset
   * @returns {Promise<Object>} Success status and user info
   */
  async adminResetPassword(targetUserId, newPassword, adminUserId) {
    try {
      // Verify admin user exists and is admin
      const adminUser = await User.findById(adminUserId);
      if (!adminUser) {
        throw new Error('Admin user not found');
      }
      if (adminUser.role !== 'admin') {
        throw new Error('Only admin users can reset passwords');
      }

      // Find target user
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        throw new Error('Target user not found');
      }

      // Update password
      targetUser.password = newPassword;
      await targetUser.save();

      // Log the action
      logger.info(`Password reset by admin ${adminUser.email} for user ${targetUser.email}`);

      // Return success response without sensitive data
      const userResponse = targetUser.toObject();
      delete userResponse.password;
      delete userResponse.refreshToken;

      return {
        success: true,
        message: 'Password reset successfully',
        user: userResponse
      };
    } catch (error) {
      logger.error('Error in admin password reset:', error);
      throw error;
    }
  }

  /**
   * Deactivate user (admin only)
   * @param {string} userId - User ID to deactivate
   * @param {string} adminUserId - Admin user ID performing the deactivation
   * @returns {Promise<Object>} Success status and user info
   */
  async deactivateUser(userId, adminUserId) {
    try {
      // Verify admin user exists and is admin
      const adminUser = await User.findById(adminUserId);
      if (!adminUser) {
        throw new Error('Admin user not found');
      }
      if (adminUser.role !== 'admin') {
        throw new Error('Only admin users can deactivate users');
      }

      // Find target user
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new Error('Target user not found');
      }

      // Prevent admin from deactivating themselves
      if (targetUser._id.toString() === adminUserId) {
        throw new Error('Admin cannot deactivate their own account');
      }

      // Prevent deactivating other admins (optional security measure)
      if (targetUser.role === 'admin') {
        throw new Error('Cannot deactivate admin accounts');
      }

      // Deactivate user
      targetUser.isActive = false;
      await targetUser.save();

      // Log the action
      logger.info(`User deactivated by admin ${adminUser.email}: ${targetUser.email}`);

      // Return success response without sensitive data
      const userResponse = targetUser.toObject();
      delete userResponse.password;
      delete userResponse.refreshToken;

      return {
        success: true,
        message: 'User deactivated successfully',
        user: userResponse
      };
    } catch (error) {
      logger.error('Error in user deactivation:', error);
      throw error;
    }
  }

  /**
   * Activate user (admin only)
   * @param {string} userId - User ID to activate
   * @param {string} adminUserId - Admin user ID performing the activation
   * @returns {Promise<Object>} Success status and user info
   */
  async activateUser(userId, adminUserId) {
    try {
      // Verify admin user exists and is admin
      const adminUser = await User.findById(adminUserId);
      if (!adminUser) {
        throw new Error('Admin user not found');
      }
      if (adminUser.role !== 'admin') {
        throw new Error('Only admin users can activate users');
      }

      // Find target user
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new Error('Target user not found');
      }

      // Activate user
      targetUser.isActive = true;
      await targetUser.save();

      // Log the action
      logger.info(`User activated by admin ${adminUser.email}: ${targetUser.email}`);

      // Return success response without sensitive data
      const userResponse = targetUser.toObject();
      delete userResponse.password;
      delete userResponse.refreshToken;

      return {
        success: true,
        message: 'User activated successfully',
        user: userResponse
      };
    } catch (error) {
      logger.error('Error in user activation:', error);
      throw error;
    }
  }
}

module.exports = new UserService(); 