const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  validateDepartmentCreation,
  validateDepartmentUpdate,
  validateDepartmentId,
  validateDepartmentQuery
} = require('../validation/department.validation');

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     summary: Get all departments with pagination and filters
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of departments per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for department name or code
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, code, createdAt, updatedAt]
 *           default: name
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Departments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       description:
 *                         type: string
 *                       contactEmail:
 *                         type: string
 *                       contactPhone:
 *                         type: string
 *                       location:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.get('/', authenticate, validateDepartmentQuery, departmentController.getDepartments);

/**
 * @swagger
 * /api/v1/departments:
 *   post:
 *     summary: Create a new department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Department name (letters, spaces, hyphens, and ampersands only)
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 10
 *                 description: Department code (uppercase letters and numbers only)
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Department description
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 description: Contact email for the department
 *               contactPhone:
 *                 type: string
 *                 description: Contact phone number for the department
 *               location:
 *                 type: string
 *                 maxLength: 200
 *                 description: Physical location of the department
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the department is active
 *     responses:
 *       201:
 *         description: Department created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     code:
 *                       type: string
 *                     description:
 *                       type: string
 *                     contactEmail:
 *                       type: string
 *                     contactPhone:
 *                       type: string
 *                     location:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', authenticate, requireAdmin, validateDepartmentCreation, departmentController.createDepartment);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   get:
 *     summary: Get a department by ID
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     code:
 *                       type: string
 *                     description:
 *                       type: string
 *                     contactEmail:
 *                       type: string
 *                     contactPhone:
 *                       type: string
 *                     location:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid department ID format
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Department not found
 */
router.get('/:id', authenticate, validateDepartmentId, departmentController.getDepartmentById);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   put:
 *     summary: Update a department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Department name (letters, spaces, hyphens, and ampersands only)
 *               code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 10
 *                 description: Department code (uppercase letters and numbers only)
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Department description
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 description: Contact email for the department
 *               contactPhone:
 *                 type: string
 *                 description: Contact phone number for the department
 *               location:
 *                 type: string
 *                 maxLength: 200
 *                 description: Physical location of the department
 *               isActive:
 *                 type: boolean
 *                 description: Whether the department is active
 *     responses:
 *       200:
 *         description: Department updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     code:
 *                       type: string
 *                     description:
 *                       type: string
 *                     contactEmail:
 *                       type: string
 *                     contactPhone:
 *                       type: string
 *                     location:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Department not found
 */
router.put('/:id', authenticate, requireAdmin, validateDepartmentId, validateDepartmentUpdate, departmentController.updateDepartment);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   delete:
 *     summary: Delete a department
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid department ID format
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Department not found
 */
router.delete('/:id', authenticate, requireAdmin, validateDepartmentId, departmentController.deleteDepartment);

/**
 * @swagger
 * /api/v1/departments/active:
 *   get:
 *     summary: Get all active departments
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active departments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       description:
 *                         type: string
 *                       contactEmail:
 *                         type: string
 *                       contactPhone:
 *                         type: string
 *                       location:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.get('/active', authenticate, departmentController.getActiveDepartments);

/**
 * @swagger
 * /api/v1/departments/search:
 *   get:
 *     summary: Search departments by name or code
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for department name or code
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Department search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       code:
 *                         type: string
 *                       description:
 *                         type: string
 *                       contactEmail:
 *                         type: string
 *                       contactPhone:
 *                         type: string
 *                       location:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *       400:
 *         description: Search term is required
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.get('/search', authenticate, departmentController.searchDepartments);

/**
 * @swagger
 * /api/v1/departments/stats:
 *   get:
 *     summary: Get department statistics
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Department statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of departments
 *                     active:
 *                       type: integer
 *                       description: Number of active departments
 *                     inactive:
 *                       type: integer
 *                       description: Number of inactive departments
 *                     activePercentage:
 *                       type: integer
 *                       description: Percentage of active departments
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/stats', authenticate, requireAdmin, departmentController.getDepartmentStats);

/**
 * @swagger
 * /api/v1/departments/{id}/check-deletion:
 *   get:
 *     summary: Check if a department can be deleted
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department deletion eligibility checked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     canBeDeleted:
 *                       type: boolean
 *                       description: Whether the department can be deleted
 *                     coursesUsingDept:
 *                       type: integer
 *                       description: Number of courses using this department
 *                     usersUsingDept:
 *                       type: integer
 *                       description: Number of users using this department
 *                     message:
 *                       type: string
 *                       description: Explanation message
 *       400:
 *         description: Invalid department ID format
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Department not found
 */
router.get('/:id/check-deletion', authenticate, requireAdmin, validateDepartmentId, departmentController.checkDepartmentDeletionEligibility);

module.exports = router; 