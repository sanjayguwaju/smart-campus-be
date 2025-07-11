const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Import controllers
const {
  getBlogs,
  getBlogById,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  getPublishedBlogs,
  getBlogsByAuthor,
  searchBlogs,
  getBlogsByTags,
  getBlogStats,
  getRecentBlogs,
  getPopularTags,
} = require('../controllers/blog.controller');

// Import middleware
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Import validation
const {
  validateBlogCreation,
  validateBlogUpdate,
  validateBlogId,
  validateBlogSlug,
  validateAuthor,
  validateBlogQuery,
  validateSearchQuery,
  validateTagsQuery,
  validateRecentBlogsQuery,
  validatePopularTagsQuery,
  validatePublishBlog,
} = require('../validation/blog.validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Blog:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - content
 *         - summary
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the blog
 *         title:
 *           type: string
 *           description: The title of the blog
 *           minLength: 5
 *           maxLength: 200
 *         slug:
 *           type: string
 *           description: URL-friendly version of the title
 *           minLength: 3
 *           maxLength: 100
 *         author:
 *           type: string
 *           description: The author of the blog
 *           minLength: 2
 *           maxLength: 100
 *         content:
 *           type: string
 *           description: The main content of the blog
 *           minLength: 50
 *           maxLength: 50000
 *         summary:
 *           type: string
 *           description: A brief summary of the blog
 *           minLength: 20
 *           maxLength: 500
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of tags for the blog
 *           maxItems: 20
 *         coverImage:
 *           type: string
 *           description: URL of the cover image
 *         isPublished:
 *           type: boolean
 *           description: Whether the blog is published
 *           default: false
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           description: The status of the blog
 *           default: draft
 *         credits:
 *           type: string
 *           description: Credits or acknowledgments
 *           maxLength: 500
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of attachment URLs
 *           maxItems: 10
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the blog was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the blog was last updated
 *     BlogStats:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *           description: Total number of blogs
 *         published:
 *           type: number
 *           description: Number of published blogs
 *         draft:
 *           type: number
 *           description: Number of draft blogs
 *         archived:
 *           type: number
 *           description: Number of archived blogs
 *         totalAuthors:
 *           type: number
 *           description: Number of unique authors
 *         publishedPercentage:
 *           type: number
 *           description: Percentage of published blogs
 *     PaginatedBlogs:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Blog'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *             limit:
 *               type: number
 *             total:
 *               type: number
 *             pages:
 *               type: number
 *     PopularTag:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The tag name
 *         count:
 *           type: number
 *           description: Number of blogs with this tag
 */

/**
 * @swagger
 * tags:
 *   name: Blogs
 *   description: Blog management API
 */

/**
 * @swagger
 * /api/blogs:
 *   get:
 *     summary: Get all blogs with pagination and filters
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of blogs per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title, content, or summary
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by status
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by published status
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, author, createdAt, updatedAt]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Blogs retrieved successfully
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
 *                   $ref: '#/components/schemas/PaginatedBlogs'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticate, validateBlogQuery, getBlogs);

/**
 * @swagger
 * /api/blogs/published:
 *   get:
 *     summary: Get all published blogs
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Published blogs retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/published', authenticate, getPublishedBlogs);

/**
 * @swagger
 * /api/blogs/search:
 *   get:
 *     summary: Search blogs by title, content, or summary
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search term
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search completed successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Bad request - search term required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/search', authenticate, validateSearchQuery, searchBlogs);

/**
 * @swagger
 * /api/blogs/tags:
 *   get:
 *     summary: Get blogs by tags
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tags
 *         required: true
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Array of tags to filter by
 *     responses:
 *       200:
 *         description: Blogs retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Bad request - tags parameter required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/tags', authenticate, validateTagsQuery, getBlogsByTags);

/**
 * @swagger
 * /api/blogs/recent:
 *   get:
 *     summary: Get recent published blogs
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 5
 *         description: Number of recent blogs to retrieve
 *     responses:
 *       200:
 *         description: Recent blogs retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/recent', authenticate, validateRecentBlogsQuery, getRecentBlogs);

/**
 * @swagger
 * /api/blogs/popular-tags:
 *   get:
 *     summary: Get popular tags with counts
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of popular tags to retrieve
 *     responses:
 *       200:
 *         description: Popular tags retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PopularTag'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/popular-tags', authenticate, validatePopularTagsQuery, getPopularTags);

/**
 * @swagger
 * /api/blogs/stats:
 *   get:
 *     summary: Get blog statistics
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blog statistics retrieved successfully
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
 *                   $ref: '#/components/schemas/BlogStats'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/stats', authenticate, authorize(['admin', 'moderator']), getBlogStats);

/**
 * @swagger
 * /api/blogs/author/{author}:
 *   get:
 *     summary: Get blogs by author
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: author
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Author name
 *     responses:
 *       200:
 *         description: Blogs retrieved successfully
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
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Bad request - invalid author parameter
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/author/:author', authenticate, validateAuthor, getBlogsByAuthor);

/**
 * @swagger
 * /api/blogs/slug/{slug}:
 *   get:
 *     summary: Get a blog by slug
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *         description: Blog slug
 *     responses:
 *       200:
 *         description: Blog retrieved successfully
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
 *                   $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Bad request - invalid slug parameter
 *       404:
 *         description: Blog not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/slug/:slug', authenticate, validateBlogSlug, getBlogBySlug);

/**
 * @swagger
 * /api/blogs/{id}:
 *   get:
 *     summary: Get a blog by ID
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog retrieved successfully
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
 *                   $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Bad request - invalid ID format
 *       404:
 *         description: Blog not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authenticate, validateBlogId, getBlogById);

/**
 * @swagger
 * /api/blogs:
 *   post:
 *     summary: Create a new blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - author
 *               - content
 *               - summary
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 description: Blog title
 *               slug:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: URL-friendly slug (auto-generated if not provided)
 *               author:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Author name
 *               content:
 *                 type: string
 *                 minLength: 50
 *                 maxLength: 50000
 *                 description: Blog content
 *               summary:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 500
 *                 description: Blog summary
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 20
 *                 description: Array of tags
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Cover image file
 *               isPublished:
 *                 type: boolean
 *                 description: Whether to publish immediately
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 description: Blog status
 *               credits:
 *                 type: string
 *                 maxLength: 500
 *                 description: Credits or acknowledgments
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *                 description: Array of attachment URLs
 *     responses:
 *       201:
 *         description: Blog created successfully
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
 *                   $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post('/', 
  authenticate, 
  authorize(['admin', 'moderator', 'author']), 
  upload.single('coverImage'),
  validateBlogCreation, 
  createBlog
);

/**
 * @swagger
 * /api/blogs/{id}:
 *   put:
 *     summary: Update a blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Blog ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 description: Blog title
 *               slug:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: URL-friendly slug
 *               author:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Author name
 *               content:
 *                 type: string
 *                 minLength: 50
 *                 maxLength: 50000
 *                 description: Blog content
 *               summary:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 500
 *                 description: Blog summary
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 20
 *                 description: Array of tags
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Cover image file
 *               isPublished:
 *                 type: boolean
 *                 description: Whether to publish
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 description: Blog status
 *               credits:
 *                 type: string
 *                 maxLength: 500
 *                 description: Credits or acknowledgments
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *                 description: Array of attachment URLs
 *     responses:
 *       200:
 *         description: Blog updated successfully
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
 *                   $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', 
  authenticate, 
  authorize(['admin', 'moderator', 'author']), 
  upload.single('coverImage'),
  validateBlogId,
  validateBlogUpdate, 
  updateBlog
);

/**
 * @swagger
 * /api/blogs/{id}/publish:
 *   put:
 *     summary: Publish or unpublish a blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Blog ID
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
 *                 description: Whether to publish (true) or unpublish (false) the blog
 *     responses:
 *       200:
 *         description: Blog published/unpublished successfully
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
 *                   $ref: '#/components/schemas/Blog'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/publish', 
  authenticate, 
  authorize(['admin', 'moderator']), 
  validatePublishBlog, 
  publishBlog
);

/**
 * @swagger
 * /api/blogs/{id}:
 *   delete:
 *     summary: Delete a blog
 *     tags: [Blogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: objectId
 *         description: Blog ID
 *     responses:
 *       200:
 *         description: Blog deleted successfully
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
 *         description: Bad request - cannot delete published blog
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Blog not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', 
  authenticate, 
  authorize(['admin', 'moderator']), 
  validateBlogId, 
  deleteBlog
);

module.exports = router; 