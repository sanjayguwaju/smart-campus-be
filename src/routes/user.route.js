const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireAdmin, canAccessOwnResource, authenticateAdmin } = require('../middleware/auth.middleware');
const { ResponseHandler } = require('../utils/responseHandler');
const {
  validateUserRegistration,
  validateUserUpdate,
  validateUserId,
  validateUserQuery,
  validateAdminRegistration,
  validateBulkUserCreation
} = require('../validation/user.validation');

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users with pagination and filters
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, faculty, student]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/', authenticate, requireAdmin, validateUserQuery, userController.getUsers);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/:userId', authenticate, validateUserId, canAccessOwnResource('userId'), userController.getUserById);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, faculty, student]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, requireAdmin, validateUserRegistration, userController.createUser);

/**
 * @swagger
 * /api/v1/users/bulk:
 *   post:
 *     summary: Create multiple users in bulk (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - users
 *             properties:
 *               users:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - firstName
 *                     - lastName
 *                     - role
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       description: User's first name
 *                     lastName:
 *                       type: string
 *                       description: User's last name
 *                     role:
 *                       type: string
 *                       enum: [admin, faculty, student]
 *                       description: User's role
 *                     department:
 *                       type: string
 *                       description: User's department (optional)
 *                     studentId:
 *                       type: string
 *                       description: Student ID (optional, for students)
 *                     facultyId:
 *                       type: string
 *                       description: Faculty ID (optional, for faculty)
 *     responses:
 *       201:
 *         description: Users created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: array
 *                       description: Successfully created users
 *                     failed:
 *                       type: array
 *                       description: Users that failed to create
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/bulk', authenticate, requireAdmin, validateBulkUserCreation, userController.createBulkUsers);

/**
 * @swagger
 * /api/v1/users/admin:
 *   post:
 *     summary: Create new admin account (Super Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Must contain uppercase, lowercase, number, and special character
 *               department:
 *                 type: string
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin account created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Admin access required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post('/admin', authenticateAdmin, validateAdminRegistration, userController.createAdmin);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               department:
 *                 type: string
 *               phone:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put('/:userId', authenticate, validateUserId, canAccessOwnResource('userId'), validateUserUpdate, userController.updateUser);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete('/:userId', authenticate, requireAdmin, validateUserId, userController.deleteUser);

/**
 * @swagger
 * /api/v1/users/role/{role}:
 *   get:
 *     summary: Get users by role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, faculty, student]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/role/:role', authenticate, (req, res, next) => {
  // Allow faculty to get other faculty members, but require admin for other roles
  const { role } = req.params;
  const userRole = req.user.role;
  
  if (role === 'faculty' && userRole === 'faculty') {
    // Faculty can get other faculty members
    return next();
  }
  
  // For all other cases, require admin
  if (userRole !== 'admin') {
    return ResponseHandler.forbidden(res, 'Insufficient permissions');
  }
  
  next();
}, userController.getUsersByRole);

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 */
router.get('/stats', authenticate, requireAdmin, userController.getUserStats);

/**
 * @swagger
 * /api/v1/users/{userId}/toggle-status:
 *   patch:
 *     summary: Activate/Deactivate user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated successfully
 */
router.patch('/:userId/toggle-status', authenticate, requireAdmin, validateUserId, userController.toggleUserStatus);

/**
 * @swagger
 * /api/v1/users/{userId}/deactivate:
 *   patch:
 *     summary: Deactivate user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user to deactivate
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       400:
 *         description: Validation error or user not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admin users can deactivate users
 */
router.patch('/:userId/deactivate', authenticate, requireAdmin, validateUserId, userController.deactivateUser);

/**
 * @swagger
 * /api/v1/users/{userId}/activate:
 *   patch:
 *     summary: Activate user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user to activate
 *     responses:
 *       200:
 *         description: User activated successfully
 *       400:
 *         description: Validation error or user not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admin users can activate users
 */
router.patch('/:userId/activate', authenticate, requireAdmin, validateUserId, userController.activateUser);

/**
 * @swagger
 * /api/v1/users/bulk-update:
 *   patch:
 *     summary: Bulk update users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *               - updateData
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               updateData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Bulk update completed
 */
router.patch('/bulk-update', authenticate, requireAdmin, userController.bulkUpdateUsers);

/**
 * @swagger
 * /api/v1/users/search:
 *   get:
 *     summary: Search users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, faculty, student]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search completed successfully
 */
router.get('/search', authenticate, requireAdmin, userController.searchUsers);

/**
 * @swagger
 * /api/v1/users/export:
 *   get:
 *     summary: Export users (CSV/JSON)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, faculty, student]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users exported successfully
 */
router.get('/export', authenticate, requireAdmin, userController.exportUsers);

module.exports = router; 