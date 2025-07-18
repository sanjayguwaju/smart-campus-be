const Notice = require("../models/notice.model");
const User = require("../models/user.model");
const logger = require("../utils/logger");

class NoticeService {
  /**
   * Create a new notice
   * @param {Object} noticeData - Notice data
   * @param {Object} author - Author information
   * @returns {Promise<Object>} Created notice
   */
  async createNotice(noticeData, author) {
    try {
      // Set author information
      const notice = new Notice({
        ...noticeData,
        author: {
          id: author._id,
          name: `${author.firstName} ${author.lastName}`,
          email: author.email,
          role: author.role,
        },
        metadata: {
          ...noticeData.metadata,
          lastModifiedBy: author._id,
        },
      });

      const savedNotice = await notice.save();
      logger.info(`Notice created: ${savedNotice._id} by ${author.email}`);

      return {
        success: true,
        message: "Notice created successfully",
        data: savedNotice,
      };
    } catch (error) {
      logger.error("Error creating notice:", error);
      throw error;
    }
  }

  /**
   * Get all notices with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Pagination and sorting options
   * @returns {Promise<Object>} Notices with pagination
   */
  async getAllNotices(filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        category,
        priority,
        status,
        author,
        search,
        startDate,
        endDate,
        featured,
        pinned,
        sortBy = "publishDate",
        sortOrder = "desc",
      } = options;

      // Build query
      const query = {};

      if (type) query.type = type;
      if (category) query.category = category;
      if (priority) query.priority = priority;
      if (status) query.status = status;
      if (author) query["author.id"] = author;
      if (featured !== undefined) query["settings.featured"] = featured;
      if (pinned !== undefined) query["settings.pinToTop"] = pinned;

      // Date range filter
      if (startDate || endDate) {
        query.publishDate = {};
        if (startDate) query.publishDate.$gte = new Date(startDate);
        if (endDate) query.publishDate.$lte = new Date(endDate);
      }

      // Text search
      if (search) {
        query.$text = { $search: search };
      }

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Execute query
      const [notices, total] = await Promise.all([
        Notice.find(query)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .populate("author.id", "firstName lastName email role")
          .populate("relatedNotices", "title type status")
          .lean(),
        Notice.countDocuments(query),
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      };

      logger.info(`Retrieved ${notices.length} notices out of ${total}`);

      return {
        success: true,
        message: "Notices retrieved successfully",
        data: { notices, pagination },
      };
    } catch (error) {
      logger.error("Error retrieving notices:", error);
      throw error;
    }
  }

  /**
   * Get notice by ID
   * @param {string} noticeId - Notice ID
   * @param {string} userId - User ID for view tracking
   * @returns {Promise<Object>} Notice details
   */
  async getNoticeById(noticeId, userId = null) {
    try {
      const notice = await Notice.findById(noticeId)
        .populate("author.id", "firstName lastName email role department")
        .populate("relatedNotices", "title type status publishDate")
        .populate(
          "targetAudience.specificUsers",
          "firstName lastName email role"
        )
        .lean();

      if (!notice) {
        return {
          success: false,
          message: "Notice not found",
          data: null,
          status: 404,
        };
      }

      // Increment view count if user is provided
      if (userId) {
        await Notice.findByIdAndUpdate(noticeId, {
          $inc: { "statistics.views": 1 },
        });
      }

      logger.info(`Notice retrieved: ${noticeId}`);

      return {
        success: true,
        message: "Notice retrieved successfully",
        data: notice,
      };
    } catch (error) {
      logger.error("Error retrieving notice:", error);
      throw error;
    }
  }

  /**
   * Update notice
   * @param {string} noticeId - Notice ID
   * @param {Object} updateData - Update data
   * @param {Object} user - User performing the update
   * @returns {Promise<Object>} Updated notice
   */
  async updateNotice(noticeId, updateData, user) {
    try {
      const notice = await Notice.findById(noticeId);

      if (!notice) {
        return {
          success: false,
          message: "Notice not found",
          data: null,
          status: 404,
        };
      }

      // Check if user has permission to update
      if (
        notice.author.id.toString() !== user._id.toString() &&
        user.role !== "admin"
      ) {
        return {
          success: false,
          message: "Unauthorized to update this notice",
          data: null,
          status: 403,
        };
      }

      // Update metadata
      updateData.metadata = {
        ...updateData.metadata,
        lastModifiedBy: user._id,
      };

      const updatedNotice = await Notice.findByIdAndUpdate(
        noticeId,
        updateData,
        { new: true, runValidators: true }
      ).populate("author.id", "firstName lastName email role");

      logger.info(`Notice updated: ${noticeId} by ${user.email}`);

      return {
        success: true,
        message: "Notice updated successfully",
        data: updatedNotice,
      };
    } catch (error) {
      logger.error("Error updating notice:", error);
      throw error;
    }
  }

  /**
   * Delete notice
   * @param {string} noticeId - Notice ID
   * @param {Object} user - User performing the deletion
   * @returns {Promise<Object>} Deletion result
   */
  async deleteNotice(noticeId, user) {
    try {
      const notice = await Notice.findById(noticeId);

      if (!notice) {
        return {
          success: false,
          message: "Notice not found",
          data: null,
          status: 404,
        };
      }

      // Check if user has permission to delete
      if (
        notice.author.id.toString() !== user._id.toString() &&
        user.role !== "admin"
      ) {
        return {
          success: false,
          message: "Unauthorized to delete this notice",
          data: null,
          status: 403,
        };
      }

      await Notice.findByIdAndDelete(noticeId);

      logger.info(`Notice deleted: ${noticeId} by ${user.email}`);

      return { success: true, message: "Notice deleted successfully" };
    } catch (error) {
      logger.error("Error deleting notice:", error);
      throw error;
    }
  }

  /**
   * Toggle like on notice
   * @param {string} noticeId - Notice ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Like status
   */
  async toggleLike(noticeId, userId) {
    try {
      const notice = await Notice.findById(noticeId);

      if (!notice) {
        return {
          success: false,
          message: "Notice not found",
          data: null,
          status: 404,
        };
      }

      await notice.toggleLike(userId);

      const isLiked = notice.engagement.likes.some(
        (like) => like.userId.toString() === userId
      );

      logger.info(`Notice like toggled: ${noticeId} by ${userId}`);

      return {
        success: true,
        message: `Notice ${isLiked ? "liked" : "unliked"} successfully`,
        data: { isLiked, likeCount: notice.engagement.likes.length },
      };
    } catch (error) {
      logger.error("Error toggling like:", error);
      throw error;
    }
  }

  /**
   * Toggle bookmark on notice
   * @param {string} noticeId - Notice ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Bookmark status
   */
  async toggleBookmark(noticeId, userId) {
    try {
      const notice = await Notice.findById(noticeId);

      if (!notice) {
        return {
          success: false,
          message: "Notice not found",
          data: null,
          status: 404,
        };
      }

      await notice.toggleBookmark(userId);

      const isBookmarked = notice.engagement.bookmarks.some(
        (bookmark) => bookmark.userId.toString() === userId
      );

      logger.info(`Notice bookmark toggled: ${noticeId} by ${userId}`);

      return {
        success: true,
        message: `Notice ${
          isBookmarked ? "bookmarked" : "unbookmarked"
        } successfully`,
        data: {
          isBookmarked,
          bookmarkCount: notice.engagement.bookmarks.length,
        },
      };
    } catch (error) {
      logger.error("Error toggling bookmark:", error);
      throw error;
    }
  }

  /**
   * Add comment to notice
   * @param {string} noticeId - Notice ID
   * @param {string} userId - User ID
   * @param {string} content - Comment content
   * @returns {Promise<Object>} Added comment
   */
  async addComment(noticeId, userId, content) {
    try {
      const notice = await Notice.findById(noticeId);

      if (!notice) {
        return {
          success: false,
          message: "Notice not found",
          data: null,
          status: 404,
        };
      }

      // Check if comments are allowed
      if (!notice.settings.allowComments) {
        return {
          success: false,
          message: "Comments are not allowed on this notice",
          data: null,
          status: 403,
        };
      }

      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found",
          data: null,
          status: 404,
        };
      }

      await notice.addComment(
        userId,
        `${user.firstName} ${user.lastName}`,
        content
      );

      const newComment =
        notice.engagement.comments[notice.engagement.comments.length - 1];

      logger.info(`Comment added to notice: ${noticeId} by ${user.email}`);

      return {
        success: true,
        message: "Comment added successfully",
        data: newComment,
      };
    } catch (error) {
      logger.error("Error adding comment:", error);
      throw error;
    }
  }

  /**
   * Update comment
   * @param {string} noticeId - Notice ID
   * @param {string} commentId - Comment ID
   * @param {string} content - Updated content
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated comment
   */
  async updateComment(noticeId, commentId, content, userId) {
    try {
      const notice = await Notice.findById(noticeId);

      if (!notice) {
        return {
          success: false,
          message: "Notice not found",
          data: null,
          status: 404,
        };
      }

      const comment = notice.engagement.comments.id(commentId);
      if (!comment) {
        return {
          success: false,
          message: "Comment not found",
          data: null,
          status: 404,
        };
      }

      // Check if user owns the comment or is admin
      if (comment.userId.toString() !== userId) {
        const user = await User.findById(userId);
        if (!user || user.role !== "admin") {
          return {
            success: false,
            message: "Unauthorized to update this comment",
            data: null,
            status: 403,
          };
        }
      }

      await notice.updateComment(commentId, content);

      const updatedComment = notice.engagement.comments.id(commentId);

      logger.info(`Comment updated: ${commentId} on notice ${noticeId}`);

      return {
        success: true,
        message: "Comment updated successfully",
        data: updatedComment,
      };
    } catch (error) {
      logger.error("Error updating comment:", error);
      throw error;
    }
  }

  /**
   * Delete comment
   * @param {string} noticeId - Notice ID
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteComment(noticeId, commentId, userId) {
    try {
      const notice = await Notice.findById(noticeId);

      if (!notice) {
        return {
          success: false,
          message: "Notice not found",
          data: null,
          status: 404,
        };
      }

      const comment = notice.engagement.comments.id(commentId);
      if (!comment) {
        return {
          success: false,
          message: "Comment not found",
          data: null,
          status: 404,
        };
      }

      // Check if user owns the comment or is admin
      if (comment.userId.toString() !== userId) {
        const user = await User.findById(userId);
        if (!user || user.role !== "admin") {
          return {
            success: false,
            message: "Unauthorized to delete this comment",
            data: null,
            status: 403,
          };
        }
      }

      await notice.deleteComment(commentId);

      logger.info(`Comment deleted: ${commentId} from notice ${noticeId}`);

      return { success: true, message: "Comment deleted successfully" };
    } catch (error) {
      logger.error("Error deleting comment:", error);
      throw error;
    }
  }

  /**
   * Get urgent notices
   * @returns {Promise<Object>} Urgent notices
   */
  async getUrgentNotices() {
    try {
      const notices = await Notice.getUrgentNotices()
        .populate("author.id", "firstName lastName email role")
        .lean();

      logger.info(`Retrieved ${notices.length} urgent notices`);

      return {
        success: true,
        message: "Urgent notices retrieved successfully",
        data: notices,
      };
    } catch (error) {
      logger.error("Error retrieving urgent notices:", error);
      throw error;
    }
  }

  /**
   * Get featured notices
   * @returns {Promise<Object>} Featured notices
   */
  async getFeaturedNotices() {
    try {
      const notices = await Notice.getFeaturedNotices()
        .populate("author.id", "firstName lastName email role")
        .lean();

      logger.info(`Retrieved ${notices.length} featured notices`);

      return {
        success: true,
        message: "Featured notices retrieved successfully",
        data: notices,
      };
    } catch (error) {
      logger.error("Error retrieving featured notices:", error);
      throw error;
    }
  }

  /**
   * Search notices
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchNotices(searchTerm, options = {}) {
    try {
      const notices = await Notice.searchNotices(searchTerm, options)
        .populate("author.id", "firstName lastName email role")
        .lean();

      logger.info(
        `Search completed for term: "${searchTerm}" - found ${notices.length} results`
      );

      return {
        success: true,
        message: "Search completed successfully",
        data: notices,
      };
    } catch (error) {
      logger.error("Error searching notices:", error);
      throw error;
    }
  }

  /**
   * Get user's bookmarked notices
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Bookmarked notices
   */
  async getBookmarkedNotices(userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const [notices, total] = await Promise.all([
        Notice.find({
          "engagement.bookmarks.userId": userId,
          status: "published",
        })
          .sort({ publishDate: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate("author.id", "firstName lastName email role")
          .lean(),
        Notice.countDocuments({
          "engagement.bookmarks.userId": userId,
          status: "published",
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(
        `Retrieved ${notices.length} bookmarked notices for user ${userId}`
      );

      return {
        success: true,
        message: "Bookmarked notices retrieved successfully",
        data: {
          notices,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages,
          },
        },
      };
    } catch (error) {
      logger.error("Error retrieving bookmarked notices:", error);
      throw error;
    }
  }

  /**
   * Get notice statistics
   * @param {string} noticeId - Notice ID
   * @param {Object} dateRange - Date range for statistics
   * @returns {Promise<Object>} Notice statistics
   */
  async getNoticeStatistics(noticeId, dateRange = {}) {
    try {
      const notice = await Notice.findById(noticeId);

      if (!notice) {
        return {
          success: false,
          message: "Notice not found",
          data: null,
          status: 404,
        };
      }

      const statistics = {
        views: notice.statistics.views,
        uniqueViews: notice.statistics.uniqueViews,
        downloads: notice.statistics.downloads,
        shares: notice.statistics.shares,
        likes: notice.engagement.likes.length,
        comments: notice.engagement.comments.length,
        bookmarks: notice.engagement.bookmarks.length,
        isActive: notice.isActive,
        isExpired: notice.isExpired,
        daysSincePublished: Math.floor(
          (new Date() - notice.publishDate) / (1000 * 60 * 60 * 24)
        ),
      };

      logger.info(`Statistics retrieved for notice: ${noticeId}`);

      return {
        success: true,
        message: "Statistics retrieved successfully",
        data: statistics,
      };
    } catch (error) {
      logger.error("Error retrieving notice statistics:", error);
      throw error;
    }
  }

  /**
   * Publish a specific notice
   * @param {string} noticeId - Notice ID to publish
   * @param {Object} user - User performing the action
   * @returns {Promise<Object>} Operation result
   */
  async publishNotice(noticeId, user) {
    try {
      // Check if notice exists
      const notice = await Notice.findById(noticeId);
      if (!notice) {
        return { success: false, message: "Notice not found", statusCode: 404 };
      }

      // Check if notice is already published
      if (notice.status === "published") {
        return {
          success: false,
          message: "Notice is already published",
          statusCode: 400,
        };
      }

      // Update notice to published status
      const updateData = {
        status: "published",
        publishDate: new Date(),
        "metadata.lastModifiedBy": user._id,
      };

      const updatedNotice = await Notice.findByIdAndUpdate(
        noticeId,
        updateData,
        { new: true, runValidators: true }
      );

      logger.info(`Notice ${noticeId} published by ${user.email}`);

      return {
        success: true,
        message: "Notice published successfully",
        data: updatedNotice,
      };
    } catch (error) {
      logger.error("Error publishing notice:", error);
      throw error;
    }
  }

  /**
   * Bulk operations on notices
   * @param {Array} noticeIds - Array of notice IDs
   * @param {string} action - Action to perform
   * @param {Object} user - User performing the action
   * @returns {Promise<Object>} Operation result
   */
  async bulkOperation(noticeIds, action, user) {
    try {
      let updateData = {};
      let message = "";

      switch (action) {
        case "publish":
          updateData = { status: "published", publishDate: new Date() };
          message = "notices published";
          break;
        case "archive":
          updateData = { status: "archived" };
          message = "notices archived";
          break;
        case "pin":
          updateData = { "settings.pinToTop": true };
          message = "notices pinned";
          break;
        case "unpin":
          updateData = { "settings.pinToTop": false };
          message = "notices unpinned";
          break;
        case "feature":
          updateData = { "settings.featured": true };
          message = "notices featured";
          break;
        case "unfeature":
          updateData = { "settings.featured": false };
          message = "notices unfeatured";
          break;
        default:
          return {
            success: false,
            message: "Invalid action",
            data: null,
            status: 400,
          };
      }

      // Add metadata
      updateData.metadata = {
        lastModifiedBy: user._id,
      };

      const result = await Notice.updateMany(
        { _id: { $in: noticeIds } },
        updateData
      );

      logger.info(
        `Bulk operation ${action} performed on ${result.modifiedCount} notices by ${user.email}`
      );

      return {
        success: true,
        message: `${result.modifiedCount} ${message} successfully`,
        data: { modifiedCount: result.modifiedCount },
      };
    } catch (error) {
      logger.error("Error performing bulk operation:", error);
      throw error;
    }
  }
}

module.exports = new NoticeService();
