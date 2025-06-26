const userService = require('../services/user.service');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Authentication Controller
 */
class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      const userData = req.body;
      const user = await userService.createUser(userData);

      return ResponseHandler.success(res, 201, 'User registered successfully', user);
    } catch (error) {
      logger.error('Registration error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await userService.authenticateUser(email, password);

      return ResponseHandler.success(res, 200, 'Login successful', result);
    } catch (error) {
      logger.error('Login error:', error);
      return ResponseHandler.error(res, 401, error.message);
    }
  }

  /**
   * Refresh access token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      const result = await userService.refreshAccessToken(refreshToken);

      return ResponseHandler.success(res, 200, 'Token refreshed successfully', result);
    } catch (error) {
      logger.error('Token refresh error:', error);
      return ResponseHandler.error(res, 401, error.message);
    }
  }

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      const userId = req.user._id;
      await userService.logoutUser(userId);

      return ResponseHandler.success(res, 200, 'Logout successful');
    } catch (error) {
      logger.error('Logout error:', error);
      return ResponseHandler.error(res, 500, 'Logout failed');
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProfile(req, res) {
    try {
      const userId = req.user._id;
      const user = await userService.getUserById(userId);

      return ResponseHandler.success(res, 200, 'Profile retrieved successfully', user);
    } catch (error) {
      logger.error('Get profile error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve profile');
    }
  }

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user._id;
      const updateData = req.body;
      const user = await userService.updateUser(userId, updateData);

      return ResponseHandler.success(res, 200, 'Profile updated successfully', user);
    } catch (error) {
      logger.error('Update profile error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async changePassword(req, res) {
    try {
      const userId = req.user._id;
      const { currentPassword, newPassword } = req.body;
      await userService.changePassword(userId, currentPassword, newPassword);

      return ResponseHandler.success(res, 200, 'Password changed successfully');
    } catch (error) {
      logger.error('Change password error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Forgot password (send reset email)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      await userService.forgotPassword(email);
      return ResponseHandler.success(res, 200, 'Password reset email sent successfully');
    } catch (error) {
      logger.error('Forgot password error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Reset password with token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      await userService.resetPassword(token, newPassword);
      return ResponseHandler.success(res, 200, 'Password reset successfully');
    } catch (error) {
      logger.error('Reset password error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Verify email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;
      
      // TODO: Implement email verification
      // For now, just return success message
      logger.info(`Email verification with token: ${token}`);

      return ResponseHandler.success(res, 200, 'Email verified successfully');
    } catch (error) {
      logger.error('Email verification error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  /**
   * Resend verification email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resendVerification(req, res) {
    try {
      const { email } = req.body;
      
      // TODO: Implement email service to resend verification
      // For now, just return success message
      logger.info(`Verification email resent to: ${email}`);

      return ResponseHandler.success(res, 200, 'Verification email sent successfully');
    } catch (error) {
      logger.error('Resend verification error:', error);
      return ResponseHandler.error(res, 500, 'Failed to send verification email');
    }
  }

  /**
   * Upload or update profile picture
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async uploadProfilePicture(req, res) {
    try {
      if (!req.file) {
        return ResponseHandler.error(res, 400, 'No file uploaded');
      }
      const userId = req.user._id;
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      const user = await userService.updateUser(userId, { avatar: avatarPath });
      return ResponseHandler.success(res, 200, 'Profile picture uploaded successfully', user);
    } catch (error) {
      logger.error('Upload profile picture error:', error);
      return ResponseHandler.error(res, 400, error.message);
    }
  }
}

module.exports = new AuthController(); 