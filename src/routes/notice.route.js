const express = require("express");
const router = express.Router();
const noticeController = require("../controllers/notice.controller");
const authMiddleware = require("../middleware/auth.middleware");
const {
  validateNotice,
  validateNoticeUpdate,
  validateNoticeId,
  validateNoticeQuery,
  validateComment,
  validateCommentUpdate,
  validateCommentId,
  validateEngagementAction,
  validateBulkOperation,
  validateStatisticsQuery,
} = require("../validation/notice.validation");

/**
 * @swagger
 * components:
 *   schemas:
 *     Notice:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - type
 *         - category
 *         - author
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated notice ID
 *         title:
 *           type: string
 *           description: Notice title
 *           maxLength: 200
 *         content:
 *           type: string
 *           description: Notice content
 *         summary:
 *           type: string
 *           description: Notice summary
 *           maxLength: 500
 *         type:
 *           type: string
 *           enum: [announcement, academic, administrative, event, emergency, maintenance, other]
 *           description: Type of notice
 *         category:
 *           type: string
 *           enum: [undergraduate, graduate, faculty, staff, all]
 *           description: Target category
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *         status:
 *           type: string
 *           enum: [draft, published, archived, expired]
 *           default: draft
 *         visibility:
 *           type: string
 *           enum: [public, private, restricted]
 *           default: public
 *         author:
 *           type: object
 *           required:
 *             - id
 *             - name
 *             - email
 *             - role
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *               enum: [admin, faculty, staff]
 *         targetAudience:
 *           type: object
 *           properties:
 *             departments:
 *               type: array
 *               items:
 *                 type: string
 *             roles:
 *               type: array
 *               items:
 *                 type: string
 *                 enum: [admin, faculty, staff, student]
 *             specificUsers:
 *               type: array
 *               items:
 *                 type: string
 *             yearLevels:
 *               type: array
 *               items:
 *                 type: string
 *                 enum: [first, second, third, fourth, fifth, graduate]
 *         publishDate:
 *           type: string
 *           format: date-time
 *           description: Publication date
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           description: Expiry date
 *         effectiveDate:
 *           type: string
 *           format: date-time
 *           description: Effective date
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               type:
 *                 type: string
 *               size:
 *                 type: number
 *               uploadedAt:
 *                 type: string
 *                 format: date-time
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               alt:
 *                 type: string
 *               caption:
 *                 type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         relatedNotices:
 *           type: array
 *           items:
 *             type: string
 *         contactInfo:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *             office:
 *               type: string
 *             website:
 *               type: string
 *         location:
 *           type: object
 *           properties:
 *             building:
 *               type: string
 *             room:
 *               type: string
 *             address:
 *               type: string
 *         statistics:
 *           type: object
 *           properties:
 *             views:
 *               type: number
 *             uniqueViews:
 *               type: number
 *             downloads:
 *               type: number
 *             shares:
 *               type: number
 *         engagement:
 *           type: object
 *           properties:
 *             likes:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   likedAt:
 *                     type: string
 *                     format: date-time
 *             bookmarks:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   bookmarkedAt:
 *                     type: string
 *                     format: date-time
 *             comments:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   userName:
 *                     type: string
 *                   content:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   isEdited:
 *                     type: boolean
 *                   editedAt:
 *                     type: string
 *                     format: date-time
 *         settings:
 *           type: object
 *           properties:
 *             allowComments:
 *               type: boolean
 *               default: true
 *             requireAcknowledgement:
 *               type: boolean
 *               default: false
 *             sendNotification:
 *               type: boolean
 *               default: true
 *             pinToTop:
 *               type: boolean
 *               default: false
 *             featured:
 *               type: boolean
 *               default: false
 *         metadata:
 *           type: object
 *           properties:
 *             language:
 *               type: string
 *               default: en
 *             version:
 *               type: number
 *               default: 1
 *             lastModifiedBy:
 *               type: string
 *             revisionHistory:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   version:
 *                     type: number
 *                   modifiedBy:
 *                     type: string
 *                   modifiedAt:
 *                     type: string
 *                     format: date-time
 *                   changes:
 *                     type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/notices:
 *   get:
 *     summary: Get all notices with filtering and pagination
 *     tags: [Notices]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of notices per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notice type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter by author ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and content
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter notices from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter notices until this date
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter featured notices
 *       - in: query
 *         name: pinned
 *         schema:
 *           type: boolean
 *         description: Filter pinned notices
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: publishDate
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
 *         description: List of notices
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
 *                     notices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notice'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 */
router.get("/", validateNoticeQuery, noticeController.getAllNotices);

/**
 * @swagger
 * /api/notices/{id}:
 *   get:
 *     summary: Get notice by ID
 *     tags: [Notices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notice ID
 *     responses:
 *       200:
 *         description: Notice details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Notice'
 *       404:
 *         description: Notice not found
 */
router.get("/:id", validateNoticeId, noticeController.getNoticeById);

/**
 * @swagger
 * /api/notices:
 *   post:
 *     summary: Create a new notice
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - type
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               summary:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [announcement, academic, administrative, event, emergency, maintenance, other]
 *               category:
 *                 type: string
 *                 enum: [undergraduate, graduate, faculty, staff, all]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived, expired]
 *               visibility:
 *                 type: string
 *                 enum: [public, private, restricted]
 *               publishDate:
 *                 type: string
 *                 format: date-time
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *               targetAudience:
 *                 type: object
 *               attachments:
 *                 type: array
 *               images:
 *                 type: array
 *               tags:
 *                 type: array
 *               relatedNotices:
 *                 type: array
 *               contactInfo:
 *                 type: object
 *               location:
 *                 type: object
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Notice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Notice'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post(
  "/",
  authMiddleware.authenticate,
  authMiddleware.authorize(["admin", "faculty", "staff"]),
  validateNotice,
  noticeController.createNotice
);

/**
 * @swagger
 * /api/notices/{id}:
 *   put:
 *     summary: Update notice by ID
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               summary:
 *                 type: string
 *               type:
 *                 type: string
 *               category:
 *                 type: string
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *               visibility:
 *                 type: string
 *               publishDate:
 *                 type: string
 *                 format: date-time
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Notice updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Notice'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Notice not found
 */
router.put(
  "/:id",
  authMiddleware.authenticate,
  authMiddleware.authorize(["admin", "faculty", "staff"]),
  validateNoticeUpdate,
  noticeController.updateNotice
);

/**
 * @swagger
 * /api/notices/{id}:
 *   delete:
 *     summary: Delete notice by ID
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notice ID
 *     responses:
 *       200:
 *         description: Notice deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Notice not found
 */
router.delete(
  "/:id",
  authMiddleware.authenticate,
  authMiddleware.authorize(["admin", "faculty", "staff"]),
  validateNoticeId,
  noticeController.deleteNotice
);

/**
 * @swagger
 * /api/notices/{id}/like:
 *   post:
 *     summary: Toggle like on notice
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notice ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
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
 *                     isLiked:
 *                       type: boolean
 *                     likeCount:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notice not found
 */
router.post(
  "/:id/like",
  authMiddleware.authenticate,
  validateEngagementAction,
  noticeController.toggleLike
);

/**
 * @swagger
 * /api/notices/{id}/bookmark:
 *   post:
 *     summary: Toggle bookmark on notice
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notice ID
 *     responses:
 *       200:
 *         description: Bookmark toggled successfully
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
 *                     isBookmarked:
 *                       type: boolean
 *                     bookmarkCount:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notice not found
 */
router.post(
  "/:id/bookmark",
  authMiddleware.authenticate,
  validateEngagementAction,
  noticeController.toggleBookmark
);

/**
 * @swagger
 * /api/notices/{id}/comments:
 *   post:
 *     summary: Add comment to notice
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Comment added successfully
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
 *                     userId:
 *                       type: string
 *                     userName:
 *                       type: string
 *                     content:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Comments not allowed
 *       404:
 *         description: Notice not found
 */
router.post(
  "/:id/comments",
  authMiddleware.authenticate,
  validateComment,
  noticeController.addComment
);

/**
 * @swagger
 * /api/notices/{id}/comments/{commentId}:
 *   put:
 *     summary: Update comment
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notice ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Notice or comment not found
 */
router.put(
  "/:id/comments/:commentId",
  authMiddleware.authenticate,
  validateCommentUpdate,
  noticeController.updateComment
);

/**
 * @swagger
 * /api/notices/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete comment
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notice ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Notice or comment not found
 */
router.delete(
  "/:id/comments/:commentId",
  authMiddleware.authenticate,
  validateCommentId,
  noticeController.deleteComment
);

/**
 * @swagger
 * /api/notices/urgent:
 *   get:
 *     summary: Get urgent notices
 *     tags: [Notices]
 *     responses:
 *       200:
 *         description: List of urgent notices
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
 *                     $ref: '#/components/schemas/Notice'
 */
router.get("/urgent", noticeController.getUrgentNotices);

/**
 * @swagger
 * /api/notices/featured:
 *   get:
 *     summary: Get featured notices
 *     tags: [Notices]
 *     responses:
 *       200:
 *         description: List of featured notices
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
 *                     $ref: '#/components/schemas/Notice'
 */
router.get("/featured", noticeController.getFeaturedNotices);

/**
 * @swagger
 * /api/notices/search:
 *   get:
 *     summary: Search notices
 *     tags: [Notices]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Search results
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
 *                     $ref: '#/components/schemas/Notice'
 *       400:
 *         description: Search term is required
 */
router.get("/search", noticeController.searchNotices);

/**
 * @swagger
 * /api/notices/bookmarked:
 *   get:
 *     summary: Get user's bookmarked notices
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of notices per page
 *     responses:
 *       200:
 *         description: List of bookmarked notices
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
 *                     notices:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notice'
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/bookmarked",
  authMiddleware.authenticate,
  noticeController.getBookmarkedNotices
);

/**
 * @swagger
 * /api/notices/{id}/statistics:
 *   get:
 *     summary: Get notice statistics
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notice ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *     responses:
 *       200:
 *         description: Notice statistics
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
 *                     views:
 *                       type: number
 *                     uniqueViews:
 *                       type: number
 *                     downloads:
 *                       type: number
 *                     shares:
 *                       type: number
 *                     likes:
 *                       type: number
 *                     comments:
 *                       type: number
 *                     bookmarks:
 *                       type: number
 *                     isActive:
 *                       type: boolean
 *                     isExpired:
 *                       type: boolean
 *                     daysSincePublished:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Notice not found
 */
router.get(
  "/:id/statistics",
  authMiddleware.authenticate,
  authMiddleware.authorize(["admin", "faculty", "staff"]),
  validateStatisticsQuery,
  noticeController.getNoticeStatistics
);

/**
 * @swagger
 * /api/notices/bulk:
 *   post:
 *     summary: Perform bulk operations on notices
 *     tags: [Notices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - noticeIds
 *               - action
 *             properties:
 *               noticeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of notice IDs
 *               action:
 *                 type: string
 *                 enum: [publish, archive, delete, pin, unpin, feature, unfeature]
 *                 description: Action to perform
 *     responses:
 *       200:
 *         description: Bulk operation completed successfully
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
 *                     modifiedCount:
 *                       type: number
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
// Bulk operations route
router.post(
  "/bulk",
  authMiddleware.authenticate,
  authMiddleware.authorize(["admin", "faculty"]),
  validateBulkOperation,
  noticeController.bulkOperation
);

// Individual notice publish route - support both PUT and PATCH methods
router.patch(
  "/:id/publish",
  authMiddleware.authenticate,
  authMiddleware.authorize(["admin", "faculty"]),
  validateNoticeId,
  noticeController.publishNotice
);
router.put(
  "/:id/publish",
  authMiddleware.authenticate,
  authMiddleware.authorize(["admin", "faculty"]),
  validateNoticeId,
  noticeController.publishNotice
);

module.exports = router;
