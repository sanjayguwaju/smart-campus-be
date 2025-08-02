const Blog = require('../models/blog.model');
const logger = require('../utils/logger');

/**
 * Blog Service Class
 */
class BlogService {
  /**
   * Create a new blog
   * @param {Object} blogData - Blog data
   * @returns {Promise<Object>} Created blog
   */
  async createBlog(blogData) {
    try {
      const data = {
        title: blogData.title,
        slug: blogData.slug,
        author: blogData.author, // This should now be set by the controller
        createdBy: blogData.createdBy, // This should now be set by the controller
        content: blogData.content,
        summary: blogData.summary,
        tags: blogData.tags || [],
        isPublished: blogData.isPublished !== undefined ? blogData.isPublished : false,
        status: blogData.status || 'draft',
        credits: blogData.credits,
        coverImage: blogData.coverImage,
        attachments: blogData.attachments || []
      };

      // Check if blog with same slug already exists
      const existingBlog = await Blog.findOne({
        slug: { $regex: new RegExp(`^${data.slug}$`, 'i') }
      });

      if (existingBlog) {
        throw new Error('Blog with this slug already exists');
      }

      // Generate slug from title if not provided
      if (!data.slug) {
        data.slug = this.generateSlug(data.title);
      }

      const blog = await Blog.create(data);
      
      logger.info(`Blog created: ${blog.title} by author: ${blog.author}`);
      return blog;
    } catch (error) {
      logger.error('Error creating blog:', error);
      throw error;
    }
  }

  /**
   * Get all blogs with pagination and filters
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Blogs with pagination info
   */
  async getBlogs(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const { search, author, status, isPublished, tags } = filters;

      // Build query
      const query = {};
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { summary: { $regex: search, $options: 'i' } }
        ];
      }

      if (author) {
        query.author = { $regex: author, $options: 'i' };
      }

      if (status) {
        query.status = status;
      }

      if (isPublished !== undefined) {
        query.isPublished = isPublished === 'true';
      }

      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Execute query with pagination
      const blogs = await Blog.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await Blog.countDocuments(query);
      const pages = Math.ceil(total / parseInt(limit));

      const paginationInfo = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      };

      logger.info(`Blogs retrieved: ${blogs.length} blogs`);
      return {
        data: blogs,
        pagination: paginationInfo
      };
    } catch (error) {
      logger.error('Error retrieving blogs:', error);
      throw error;
    }
  }

  /**
   * Get a blog by ID
   * @param {string} blogId - Blog ID
   * @returns {Promise<Object>} Blog object
   */
  async getBlogById(blogId) {
    try {
      const blog = await Blog.findById(blogId);
      
      if (!blog) {
        throw new Error('Blog not found');
      }

      logger.info(`Blog retrieved: ${blog.title}`);
      return blog;
    } catch (error) {
      logger.error('Error retrieving blog:', error);
      throw error;
    }
  }

  /**
   * Get a blog by slug
   * @param {string} slug - Blog slug
   * @returns {Promise<Object>} Blog object
   */
  async getBlogBySlug(slug) {
    try {
      const blog = await Blog.findOne({ slug: { $regex: new RegExp(`^${slug}$`, 'i') } });
      
      if (!blog) {
        throw new Error('Blog not found');
      }

      logger.info(`Blog retrieved by slug: ${blog.title}`);
      return blog;
    } catch (error) {
      logger.error('Error retrieving blog by slug:', error);
      throw error;
    }
  }

  /**
   * Update a blog
   * @param {string} blogId - Blog ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated blog
   */
  async updateBlog(blogId, updateData) {
    try {
      const data = {};
      
      // Only include fields that are provided
      if (updateData.title !== undefined) data.title = updateData.title;
      if (updateData.slug !== undefined) data.slug = updateData.slug;
      if (updateData.author !== undefined) data.author = updateData.author;
      if (updateData.content !== undefined) data.content = updateData.content;
      if (updateData.summary !== undefined) data.summary = updateData.summary;
      if (updateData.tags !== undefined) data.tags = updateData.tags;
      if (updateData.isPublished !== undefined) data.isPublished = updateData.isPublished;
      if (updateData.status !== undefined) data.status = updateData.status;
      if (updateData.credits !== undefined) data.credits = updateData.credits;
      if (updateData.coverImage !== undefined) data.coverImage = updateData.coverImage;
      if (updateData.attachments !== undefined) data.attachments = updateData.attachments;

      // Generate slug from title if title is updated and slug is not provided
      if (data.title && !data.slug) {
        data.slug = this.generateSlug(data.title);
      }

      // Check if blog with same slug already exists (excluding current blog)
      if (data.slug) {
        const existingBlog = await Blog.findOne({
          slug: { $regex: new RegExp(`^${data.slug}$`, 'i') },
          _id: { $ne: blogId }
        });

        if (existingBlog) {
          throw new Error('Blog with this slug already exists');
        }
      }

      const blog = await Blog.findByIdAndUpdate(
        blogId,
        data,
        { new: true, runValidators: true }
      );

      if (!blog) {
        throw new Error('Blog not found');
      }

      logger.info(`Blog updated: ${blog.title}`);
      return blog;
    } catch (error) {
      logger.error('Error updating blog:', error);
      throw error;
    }
  }

  /**
   * Delete a blog
   * @param {string} blogId - Blog ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteBlog(blogId) {
    try {
      const blog = await Blog.findById(blogId);
      
      if (!blog) {
        throw new Error('Blog not found');
      }

      // Check if blog is published (prevent deletion of published blogs)
      if (blog.isPublished) {
        throw new Error('Cannot delete a published blog. Please unpublish it first.');
      }

      await Blog.findByIdAndDelete(blogId);
      
      logger.info(`Blog deleted: ${blog.title}`);
      return { success: true, message: 'Blog deleted successfully' };
    } catch (error) {
      logger.error('Error deleting blog:', error);
      throw error;
    }
  }

  /**
   * Publish or unpublish a blog
   * @param {string} blogId - Blog ID
   * @param {boolean} isPublished - Whether to publish or unpublish
   * @returns {Promise<Object>} Updated blog
   */
  async publishBlog(blogId, isPublished) {
    try {
      const blog = await Blog.findById(blogId);
      
      if (!blog) {
        throw new Error('Blog not found');
      }

      blog.isPublished = isPublished;
      blog.status = isPublished ? 'published' : 'draft';
      await blog.save();

      logger.info(`Blog ${isPublished ? 'published' : 'unpublished'}: ${blog.title}`);
      return blog;
    } catch (error) {
      logger.error('Error publishing/unpublishing blog:', error);
      throw error;
    }
  }

  /**
   * Get published blogs only
   * @returns {Promise<Array>} Published blogs
   */
  async getPublishedBlogs() {
    try {
      const blogs = await Blog.find({ 
        isPublished: true, 
        status: 'published' 
      })
      .sort({ createdAt: -1 });

      logger.info(`Published blogs retrieved: ${blogs.length} blogs`);
      return blogs;
    } catch (error) {
      logger.error('Error retrieving published blogs:', error);
      throw error;
    }
  }

  /**
   * Get blogs by author
   * @param {string} author - Author name
   * @returns {Promise<Array>} Blogs by author
   */
  async getBlogsByAuthor(author) {
    try {
      const blogs = await Blog.find({ 
        author: { $regex: author, $options: 'i' },
        isPublished: true 
      })
      .sort({ createdAt: -1 });

      logger.info(`Blogs retrieved for author ${author}: ${blogs.length} blogs`);
      return blogs;
    } catch (error) {
      logger.error('Error retrieving blogs by author:', error);
      throw error;
    }
  }

  /**
   * Search blogs by title, content, or summary
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Matching blogs
   */
  async searchBlogs(searchTerm, limit = 10) {
    try {
      const blogs = await Blog.find({
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { content: { $regex: searchTerm, $options: 'i' } },
          { summary: { $regex: searchTerm, $options: 'i' } }
        ],
        isPublished: true
      })
      .sort({ createdAt: -1 })
      .limit(limit);

      logger.info(`Blog search completed: ${blogs.length} results for "${searchTerm}"`);
      return blogs;
    } catch (error) {
      logger.error('Error searching blogs:', error);
      throw error;
    }
  }

  /**
   * Get blogs by tags
   * @param {Array} tags - Array of tags
   * @returns {Promise<Array>} Blogs with matching tags
   */
  async getBlogsByTags(tags) {
    try {
      const blogs = await Blog.find({
        tags: { $in: tags },
        isPublished: true
      })
      .sort({ createdAt: -1 });

      logger.info(`Blogs retrieved for tags [${tags.join(', ')}]: ${blogs.length} blogs`);
      return blogs;
    } catch (error) {
      logger.error('Error retrieving blogs by tags:', error);
      throw error;
    }
  }

  /**
   * Get blog statistics
   * @returns {Promise<Object>} Blog statistics
   */
  async getBlogStats() {
    try {
      const [
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        archivedBlogs,
        totalAuthors
      ] = await Promise.all([
        Blog.countDocuments(),
        Blog.countDocuments({ isPublished: true, status: 'published' }),
        Blog.countDocuments({ isPublished: false, status: 'draft' }),
        Blog.countDocuments({ status: 'archived' }),
        Blog.distinct('author').then(authors => authors.length)
      ]);

      const stats = {
        total: totalBlogs,
        published: publishedBlogs,
        draft: draftBlogs,
        archived: archivedBlogs,
        totalAuthors,
        publishedPercentage: totalBlogs > 0 ? Math.round((publishedBlogs / totalBlogs) * 100) : 0
      };

      logger.info('Blog statistics retrieved');
      return stats;
    } catch (error) {
      logger.error('Error retrieving blog statistics:', error);
      throw error;
    }
  }

  /**
   * Get recent blogs
   * @param {number} limit - Number of recent blogs to retrieve
   * @returns {Promise<Array>} Recent blogs
   */
  async getRecentBlogs(limit = 5) {
    try {
      const blogs = await Blog.find({ 
        isPublished: true 
      })
      .sort({ createdAt: -1 })
      .limit(limit);

      logger.info(`Recent blogs retrieved: ${blogs.length} blogs`);
      return blogs;
    } catch (error) {
      logger.error('Error retrieving recent blogs:', error);
      throw error;
    }
  }

  /**
   * Get popular tags
   * @param {number} limit - Number of popular tags to retrieve
   * @returns {Promise<Array>} Popular tags with counts
   */
  async getPopularTags(limit = 10) {
    try {
      const tags = await Blog.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);

      logger.info(`Popular tags retrieved: ${tags.length} tags`);
      return tags;
    } catch (error) {
      logger.error('Error retrieving popular tags:', error);
      throw error;
    }
  }

  /**
   * Generate slug from title
   * @param {string} title - Blog title
   * @returns {string} Generated slug
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim('-'); // Remove leading/trailing hyphens
  }
}

module.exports = new BlogService(); 