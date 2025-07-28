const noticeService = require("../services/notice.service");
const { ResponseHandler } = require("../utils/responseHandler");
const logger = require("../utils/logger");

/**
 * Create a new notice.
 */
const createNotice = async (req, res) => {
  try {
    const result = await noticeService.createNotice(req.body, req.user);

    if (!result.success) {
      return ResponseHandler.error(res, result.statusCode || 400, result.message);
    }

    return ResponseHandler.success(res, 201, 'Notice created successfully', result.data);
  } catch (error) {
    logger.error("Error in createNotice controller:", error);
    return ResponseHandler.error(res, 500, 'Error creating notice');
  }
};

/**
 * Get all notices with filtering and pagination.
 */
const getAllNotices = async (req, res) => {
  try {
    const result = await noticeService.getAllNotices({}, req.query);
    return ResponseHandler.success(res, 200, 'Notices retrieved successfully', result.data.notices, result.data.pagination);
  } catch (error) {
    logger.error("Error in getAllNotices controller:", error);
    return ResponseHandler.error(res, 500, 'Error retrieving notices');
  }
};

/**
 * Get notice by ID.
 */
const getNoticeById = async (req, res) => {
  try {
    const result = await noticeService.getNoticeById(
      req.params.id,
      req.user?._id
    );

    if (!result.success) {
      return ResponseHandler.error(res, result.statusCode || 404, result.message);
    }

    return ResponseHandler.success(res, 200, 'Notice retrieved successfully', result.data);
  } catch (error) {
    logger.error("Error in getNoticeById controller:", error);
    return ResponseHandler.error(res, 500, 'Error retrieving notice');
  }
};

/**
 * Update notice by ID.
 */
const updateNotice = async (req, res) => {
  try {
    const result = await noticeService.updateNotice(
      req.params.id,
      req.body,
      req.user
    );

    if (!result.success) {
      return ResponseHandler.error(res, result.statusCode || 400, result.message);
    }

    return ResponseHandler.success(res, 200, 'Notice updated successfully', result.data);
  } catch (error) {
    logger.error("Error in updateNotice controller:", error);
    return ResponseHandler.error(res, 500, 'Error updating notice');
  }
};

/**
 * Delete notice by ID.
 */
const deleteNotice = async (req, res) => {
  try {
    const result = await noticeService.deleteNotice(req.params.id, req.user);

    if (!result.success) {
      return ResponseHandler.error(res, result.statusCode || 400, result.message);
    }

    return ResponseHandler.success(res, 200, 'Notice deleted successfully', result.data);
  } catch (error) {
    logger.error("Error in deleteNotice controller:", error);
    return ResponseHandler.error(res, 500, 'Error deleting notice');
  }
};

/**
 * Toggle like on notice.
 */
const toggleLike = async (req, res) => {
  try {
    const result = await noticeService.toggleLike(req.params.id, req.user._id);

    if (!result.success) {
      return ResponseHandler.error(res, result.statusCode || 400, result.message);
    }

    return ResponseHandler.success(res, 200, 'Like toggled successfully', result.data);
  } catch (error) {
    logger.error("Error in toggleLike controller:", error);
    return ResponseHandler.error(res, 500, 'Error toggling like');
  }
};

/**
 * Toggle bookmark on notice.
 */
const toggleBookmark = async (req, res) => {
  try {
    const result = await noticeService.toggleBookmark(
      req.params.id,
      req.user._id
    );

    if (!result.success) {
      return ResponseHandler.error(res, result.statusCode || 400, result.message);
    }

    return ResponseHandler.success(res, 200, 'Bookmark toggled successfully', result.data);
  } catch (error) {
    logger.error("Error in toggleBookmark controller:", error);
    return ResponseHandler.error(res, 500, 'Error toggling bookmark');
  }
};

/**
 * Add comment to notice.
 */
const addComment = async (req, res) => {
  try {
    const result = await noticeService.addComment(
      req.params.id,
      req.user._id,
      req.body.content
    );

    if (!result.success) {
      return ResponseHandler.error(res, result.statusCode || 400, result.message);
    }

    return ResponseHandler.success(res, 201, 'Comment added successfully', result.data);
  } catch (error) {
    logger.error("Error in addComment controller:", error);
    return ResponseHandler.error(res, 500, 'Error adding comment');
  }
};

/**
 * Update comment.
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
      return ResponseHandler.error(res, result.statusCode || 400, result.message);
    }

    return ResponseHandler.success(res, 200, 'Comment updated successfully', result.data);
  } catch (error) {
    logger.error("Error in updateComment controller:", error);
    return ResponseHandler.error(res, 500, 'Error updating comment');
  }
};

/**
 * Delete comment.
 */
const deleteComment = async (req, res) => {
  try {
    const result = await noticeService.deleteComment(
      req.params.id,
      req.params.commentId,
      req.user._id
    );

    if (!result.success) {
      return ResponseHandler.error(res, result.statusCode || 400, result.message);
    }

    return ResponseHandler.success(res, 200, 'Comment deleted successfully', result.data);
  } catch (error) {
    logger.error("Error in deleteComment controller:", error);
    return ResponseHandler.error(res, 500, 'Error deleting comment');
  }
};

/**
 * Get urgent notices.
 */
const getUrgentNotices = async (req, res) => {
  try {
    const result = await noticeService.getUrgentNotices();
    return ResponseHandler.success(res, 200, 'Urgent notices retrieved successfully', result);
  } catch (error) {
    logger.error("Error in getUrgentNotices controller:", error);
    return ResponseHandler.error(res, 500, 'Error retrieving urgent notices');
  }
};

/**
 * Get featured notices.
 */
const getFeaturedNotices = async (req, res) => {
  try {
    const result = await noticeService.getFeaturedNotices();
    return ResponseHandler.success(res, 200, 'Featured notices retrieved successfully', result);
  } catch (error) {
    logger.error("Error in getFeaturedNotices controller:", error);
    return ResponseHandler.error(res, 500, 'Error retrieving featured notices');
  }
};

/**
 * Search notices.
 */
const searchNotices = async (req, res) => {
  try {
    const { q: searchTerm, type, category } = req.query;

    if (!searchTerm) {
      return ResponseHandler.error(res, 400, 'Search term is required');
    }

    const result = await noticeService.searchNotices(searchTerm, {
      type,
      category,
    });
    return ResponseHandler.success(res, 200, 'Search completed successfully', result);
  } catch (error) {
    logger.error("Error in searchNotices controller:", error);
    return ResponseHandler.error(res, 500, 'Error searching notices');
  }
};

/**
 * Get user's bookmarked notices.
 */
const getBookmarkedNotices = async (req, res) => {
  try {
    const result = await noticeService.getBookmarkedNotices(
      req.user._id,
      req.query
    );
    return ResponseHandler.success(res, 200, 'Bookmarked notices retrieved successfully', result);
  } catch (error) {
    logger.error("Error in getBookmarkedNotices controller:", error);
    return ResponseHandler.error(res, 500, 'Error retrieving bookmarked notices');
  }
};

/**
 * Get notice statistics.
 */
const getNoticeStatistics = async (req, res) => {
  try {
    const result = await noticeService.getNoticeStatistics(
      req.params.id,
      req.query
    );

    if (!result.success) {
      return ResponseHandler.error(res, result.statusCode || 400, result.message);
    }

    return ResponseHandler.success(res, 200, 'Notice statistics retrieved successfully', result.data);
  } catch (error) {
    logger.error("Error in getNoticeStatistics controller:", error);
    return ResponseHandler.error(res, 500, 'Error retrieving notice statistics');
  }
};

/**
 * Publish a specific notice.
 */
const publishNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await noticeService.publishNotice(id, req.user);

    if (!result.success) {
      return ResponseHandler.error(res, result.statusCode || 400, result.message);
    }

    return ResponseHandler.success(res, 200, 'Notice published successfully', result.data);
  } catch (error) {
    logger.error("Error in publishNotice controller:", error);
    return ResponseHandler.error(res, 500, 'Error publishing notice');
  }
};

/**
 * Perform bulk operations on notices.
 */
const bulkOperation = async (req, res) => {
  try {
    const { noticeIds, action } = req.body;
    const result = await noticeService.bulkOperation(
      noticeIds,
      action,
      req.user
    );

    if (!result.success) {
      return ResponseHandler.error(res, result.statusCode || 400, result.message);
    }

    return ResponseHandler.success(res, 200, 'Bulk operation completed successfully', result.data);
  } catch (error) {
    logger.error("Error in bulkOperation controller:", error);
    return ResponseHandler.error(res, 500, 'Error performing bulk operation');
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
  publishNotice,
  bulkOperation,
};
