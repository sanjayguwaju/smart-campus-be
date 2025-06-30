const noticeService = require('../services/notice.service');
const logger = require('../utils/logger');

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
 *                 properties:
 *                   departments:
 *                     type: array
 *                     items:
 *                       type: string
 *                   roles:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [admin, faculty, staff, student]
 *                   specificUsers:
 *                     type: array
 *                     items:
 *                       type: string
 *                   yearLevels:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [first, second, third, fourth, fifth, graduate]
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *                     size:
 *                       type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     alt:
 *                       type: string
 *                     caption:
 *                       type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               relatedNotices:
 *                 type: array
 *                 items:
 *                   type: string
 *               contactInfo:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   office:
 *                     type: string
 *                   website:
 *                     type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   building:
 *                     type: string
 *                   room:
 *                     type: string
 *                   address:
 *                     type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   allowComments:
 *                     type: boolean
 *                   requireAcknowledgement:
 *                     type: boolean
 *                   sendNotification:
 *                     type: boolean
 *                   pinToTop:
 *                     type: boolean
 *                   featured:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Notice created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
const createNotice = async (req, res) => {
  try {
    const result = await noticeService.createNotice(req.body, req.user);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error in createNotice controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
 */
const getAllNotices = async (req, res) => {
  try {
    const result = await noticeService.getAllNotices({}, req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error in getAllNotices controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
 *       404:
 *         description: Notice not found
 */
const getNoticeById = async (req, res) => {
  try {
    const result = await noticeService.getNoticeById(req.params.id, req.user?._id);
    
    if (!result.success) {
      return res.status(result.statusCode || 404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getNoticeById controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Notice not found
 */
const updateNotice = async (req, res) => {
  try {
    const result = await noticeService.updateNotice(req.params.id, req.body, req.user);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error in updateNotice controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Notice not found
 */
const deleteNotice = async (req, res) => {
  try {
    const result = await noticeService.deleteNotice(req.params.id, req.user);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error in deleteNotice controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notice not found
 */
const toggleLike = async (req, res) => {
  try {
    const result = await noticeService.toggleLike(req.params.id, req.user._id);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error in toggleLike controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notice not found
 */
const toggleBookmark = async (req, res) => {
  try {
    const result = await noticeService.toggleBookmark(req.params.id, req.user._id);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error in toggleBookmark controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Comments not allowed
 *       404:
 *         description: Notice not found
 */
const addComment = async (req, res) => {
  try {
    const result = await noticeService.addComment(req.params.id, req.user._id, req.body.content);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error in addComment controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
const updateComment = async (req, res) => {
  try {
    const result = await noticeService.updateComment(
      req.params.id,
      req.params.commentId,
      req.body.content,
      req.user._id
    );
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error in updateComment controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
const deleteComment = async (req, res) => {
  try {
    const result = await noticeService.deleteComment(
      req.params.id,
      req.params.commentId,
      req.user._id
    );
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error in deleteComment controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/notices/urgent:
 *   get:
 *     summary: Get urgent notices
 *     tags: [Notices]
 *     responses:
 *       200:
 *         description: List of urgent notices
 */
const getUrgentNotices = async (req, res) => {
  try {
    const result = await noticeService.getUrgentNotices();
    res.json(result);
  } catch (error) {
    logger.error('Error in getUrgentNotices controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/notices/featured:
 *   get:
 *     summary: Get featured notices
 *     tags: [Notices]
 *     responses:
 *       200:
 *         description: List of featured notices
 */
const getFeaturedNotices = async (req, res) => {
  try {
    const result = await noticeService.getFeaturedNotices();
    res.json(result);
  } catch (error) {
    logger.error('Error in getFeaturedNotices controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
 */
const searchNotices = async (req, res) => {
  try {
    const { q: searchTerm, type, category } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({ success: false, message: 'Search term is required' });
    }
    
    const result = await noticeService.searchNotices(searchTerm, { type, category });
    res.json(result);
  } catch (error) {
    logger.error('Error in searchNotices controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
 *       401:
 *         description: Unauthorized
 */
const getBookmarkedNotices = async (req, res) => {
  try {
    const result = await noticeService.getBookmarkedNotices(req.user._id, req.query);
    res.json(result);
  } catch (error) {
    logger.error('Error in getBookmarkedNotices controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Notice not found
 */
const getNoticeStatistics = async (req, res) => {
  try {
    const result = await noticeService.getNoticeStatistics(req.params.id, req.query);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error in getNoticeStatistics controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

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
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
const bulkOperation = async (req, res) => {
  try {
    const { noticeIds, action } = req.body;
    const result = await noticeService.bulkOperation(noticeIds, action, req.user);
    
    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    logger.error('Error in bulkOperation controller:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  createNotice,
  getAllNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
  toggleLike,
  toggleBookmark,
  addComment,
  updateComment,
  deleteComment,
  getUrgentNotices,
  getFeaturedNotices,
  searchNotices,
  getBookmarkedNotices,
  getNoticeStatistics,
  bulkOperation
}; 