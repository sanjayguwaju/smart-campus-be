const express = require('express');
const router = express.Router();
const programController = require('../controllers/program.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  validateProgramCreation,
  validateProgramUpdate,
  validateProgramId,
  validateDepartmentId,
  validateLevel,
  validateProgramQuery,
  validateSearchQuery,
  validatePublishProgram
} = require('../validation/program.validation');

/**
 * @swagger
 * /api/v1/programs:
 *   get:
 *     summary: Get all programs with pagination and filters
 *     tags: [Programs]
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
 *         description: Number of programs per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for program name or description
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department ID
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [Undergraduate, Postgraduate]
 *         description: Filter by program level
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by program status
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *         description: Filter by published status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, level, duration, semesters, createdAt, updatedAt]
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
 *         description: Programs retrieved successfully
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
 *                       department:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           code:
 *                             type: string
 *                       level:
 *                         type: string
 *                       duration:
 *                         type: string
 *                       semesters:
 *                         type: integer
 *                       description:
 *                         type: string
 *                       prerequisites:
 *                         type: array
 *                         items:
 *                           type: string
 *                       image:
 *                         type: string
 *                       brochureUrl:
 *                         type: string
 *                       isPublished:
 *                         type: boolean
 *                       status:
 *                         type: string
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
router.get('/', validateProgramQuery, programController.getPrograms);

/**
 * @swagger
 * /api/v1/programs:
 *   post:
 *     summary: Create a new program
 *     tags: [Programs]
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
 *               - department
 *               - level
 *               - duration
 *               - semesters
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Program name (letters, spaces, hyphens, and ampersands only)
 *               department:
 *                 type: string
 *                 description: Department ID (MongoDB ObjectId)
 *               level:
 *                 type: string
 *                 enum: [Undergraduate, Postgraduate]
 *                 description: Program level
 *               duration:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Program duration (e.g., "4 years")
 *               semesters:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 description: Number of semesters
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Program description
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of prerequisites
 *               image:
 *                 type: string
 *                 format: uri
 *                 description: Program image URL
 *               brochureUrl:
 *                 type: string
 *                 format: uri
 *                 description: Program brochure URL
 *               isPublished:
 *                 type: boolean
 *                 default: false
 *                 description: Whether the program is published
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *                 description: Program status
 *     responses:
 *       201:
 *         description: Program created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', authenticate, requireAdmin, validateProgramCreation, programController.createProgram);

/**
 * @swagger
 * /api/v1/programs/published:
 *   get:
 *     summary: Get all published programs
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Published programs retrieved successfully
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.get('/published', authenticate, programController.getPublishedPrograms);

/**
 * @swagger
 * /api/v1/programs/search:
 *   get:
 *     summary: Search programs by name or description
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term for program name or description
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Program search completed successfully
 *       400:
 *         description: Search term is required
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.get('/search', authenticate, validateSearchQuery, programController.searchPrograms);

/**
 * @swagger
 * /api/v1/programs/stats:
 *   get:
 *     summary: Get program statistics
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Program statistics retrieved successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/stats', authenticate, requireAdmin, programController.getProgramStats);

/**
 * @swagger
 * /api/v1/programs/department/{departmentId}:
 *   get:
 *     summary: Get programs by department
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Programs retrieved successfully
 *       400:
 *         description: Invalid department ID format
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.get('/department/:departmentId', authenticate, validateDepartmentId, programController.getProgramsByDepartment);

/**
 * @swagger
 * /api/v1/programs/level/{level}:
 *   get:
 *     summary: Get programs by level
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: level
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Undergraduate, Postgraduate]
 *         description: Program level
 *     responses:
 *       200:
 *         description: Programs retrieved successfully
 *       400:
 *         description: Invalid level parameter
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.get('/level/:level', authenticate, validateLevel, programController.getProgramsByLevel);

/**
 * @swagger
 * /api/v1/programs/{id}:
 *   get:
 *     summary: Get a program by ID
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Program retrieved successfully
 *       400:
 *         description: Invalid program ID format
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Program not found
 */
router.get('/:id', authenticate, validateProgramId, programController.getProgramById);

/**
 * @swagger
 * /api/v1/programs/{id}:
 *   put:
 *     summary: Update a program
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Program ID
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
 *                 description: Program name
 *               department:
 *                 type: string
 *                 description: Department ID
 *               level:
 *                 type: string
 *                 enum: [Undergraduate, Postgraduate]
 *                 description: Program level
 *               duration:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Program duration
 *               semesters:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 description: Number of semesters
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Program description
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of prerequisites
 *               image:
 *                 type: string
 *                 format: uri
 *                 description: Program image URL
 *               brochureUrl:
 *                 type: string
 *                 format: uri
 *                 description: Program brochure URL
 *               isPublished:
 *                 type: boolean
 *                 description: Whether the program is published
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 description: Program status
 *     responses:
 *       200:
 *         description: Program updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Program not found
 */
router.put('/:id', authenticate, requireAdmin, validateProgramId, validateProgramUpdate, programController.updateProgram);

/**
 * @swagger
 * /api/v1/programs/{id}/publish:
 *   put:
 *     summary: Publish or unpublish a program
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Program ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isPublished
 *             properties:
 *               isPublished:
 *                 type: boolean
 *                 description: Whether to publish (true) or unpublish (false) the program
 *     responses:
 *       200:
 *         description: Program published/unpublished successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Program not found
 */
router.put('/:id/publish', authenticate, requireAdmin, validatePublishProgram, programController.publishProgram);

/**
 * @swagger
 * /api/v1/programs/{id}:
 *   delete:
 *     summary: Delete a program
 *     tags: [Programs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Program ID
 *     responses:
 *       200:
 *         description: Program deleted successfully
 *       400:
 *         description: Invalid program ID format or cannot delete published program
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Program not found
 */
router.delete('/:id', authenticate, requireAdmin, validateProgramId, programController.deleteProgram);

module.exports = router; 