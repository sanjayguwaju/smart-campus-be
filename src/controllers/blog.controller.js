const blogService = require('../services/blog.service');
const { ResponseHandler } = require('../utils/responseHandler');
const logger = require('../utils/logger');

// Get all blogs with pagination and filters
async function getBlogs(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      author,
      status,
      isPublished,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = { search, author, status, isPublished, tags };
    const pagination = { page, limit, sortBy, sortOrder };

    const result = await blogService.getBlogs(filters, pagination);
        
    // Return blogs data with pagination at the same level
    return ResponseHandler.success(res, 200, 'Blogs retrieved successfully', result.data, result.pagination);
  } catch (error) {
    logger.error('Error retrieving blogs:', error);
    return ResponseHandler.error(res, 500, 'Error retrieving blogs');
  }
}

// Get a blog by ID
async function getBlogById(req, res) {
  try {
    const blog = await blogService.getBlogById(req.params.id);
    
    logger.info(`Blog retrieved: ${blog.title} by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 200, 'Blog retrieved successfully', blog);
  } catch (error) {
    logger.error('Error retrieving blog:', error);
    if (error.message === 'Blog not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    return ResponseHandler.error(res, 500, 'Error retrieving blog');
  }
}

// Get a blog by slug
async function getBlogBySlug(req, res) {
  try {
    const blog = await blogService.getBlogBySlug(req.params.slug);
    
    logger.info(`Blog retrieved by slug: ${blog.title} by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 200, 'Blog retrieved successfully', blog);
  } catch (error) {
    logger.error('Error retrieving blog by slug:', error);
    if (error.message === 'Blog not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    return ResponseHandler.error(res, 500, 'Error retrieving blog');
  }
}

// Create a new blog
async function createBlog(req, res) {
  try {
    // Ensure tags is always an array
    if (req.body.tags && !Array.isArray(req.body.tags)) {
      req.body.tags = [req.body.tags];
    }
    
    // Handle coverImage - could be a file upload or a URL string
    let coverImage = null;
    if (req.file) {
      // File was uploaded via multer
      coverImage = req.file.path;
    } else if (req.body.coverImage) {
      // URL was sent as string in form data
      coverImage = req.body.coverImage;
    }
    
    const blogData = {
      ...req.body,
      coverImage: coverImage
    };

    const blog = await blogService.createBlog(blogData);
    logger.info(`Blog created: ${blog.title} by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 201, 'Blog created successfully', blog);
  } catch (err) {
    logger.error('Error creating blog:', err);
    if (err.message.includes('already exists')) {
      return ResponseHandler.error(res, 400, err.message);
    }
    return ResponseHandler.error(res, 500, 'Error creating blog');
  }
}

// Update a blog
async function updateBlog(req, res) {
  try {
    // Handle coverImage - could be a file upload or a URL string
    let coverImage = null;
    if (req.file) {
      // File was uploaded via multer
      coverImage = req.file.path;
    } else if (req.body.coverImage) {
      // URL was sent as string in form data
      coverImage = req.body.coverImage;
    }
    
    const updateData = {
      ...req.body,
      coverImage: coverImage
    };

    const blog = await blogService.updateBlog(req.params.id, updateData);
    
    logger.info(`Blog updated: ${blog.title} by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 200, 'Blog updated successfully', blog);
  } catch (error) {
    logger.error('Error updating blog:', error);
    if (error.message === 'Blog not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    if (error.message.includes('already exists')) {
      return ResponseHandler.error(res, 400, error.message);
    }
    return ResponseHandler.error(res, 500, 'Error updating blog');
  }
}

// Delete a blog
async function deleteBlog(req, res) {
  try {
    const result = await blogService.deleteBlog(req.params.id);
    
    logger.info(`Blog deleted by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 200, result.message);
  } catch (error) {
    logger.error('Error deleting blog:', error);
    if (error.message === 'Blog not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    if (error.message.includes('Cannot delete a published blog')) {
      return ResponseHandler.error(res, 400, error.message);
    }
    return ResponseHandler.error(res, 500, 'Error deleting blog');
  }
}

// Publish or unpublish a blog
async function publishBlog(req, res) {
  try {
    const { isPublished } = req.body;
    
    if (typeof isPublished !== 'boolean') {
      return ResponseHandler.error(res, 400, 'isPublished must be a boolean');
    }

    const blog = await blogService.publishBlog(req.params.id, isPublished);
    
    logger.info(`Blog ${isPublished ? 'published' : 'unpublished'}: ${blog.title} by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 200, `Blog ${isPublished ? 'published' : 'unpublished'} successfully`, blog);
  } catch (error) {
    logger.error('Error publishing/unpublishing blog:', error);
    if (error.message === 'Blog not found') {
      return ResponseHandler.notFound(res, error.message);
    }
    return ResponseHandler.error(res, 500, 'Error publishing/unpublishing blog');
  }
}

// Get published blogs only
async function getPublishedBlogs(req, res) {
  try {
    const blogs = await blogService.getPublishedBlogs();
    
    logger.info(`Published blogs retrieved: ${blogs.length} blogs by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 200, 'Published blogs retrieved successfully', blogs);
  } catch (error) {
    logger.error('Error retrieving published blogs:', error);
    return ResponseHandler.error(res, 500, 'Error retrieving published blogs');
  }
}

// Get blogs by author
async function getBlogsByAuthor(req, res) {
  try {
    const blogs = await blogService.getBlogsByAuthor(req.params.author);
    
    logger.info(`Blogs retrieved for author ${req.params.author}: ${blogs.length} blogs by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 200, 'Blogs retrieved successfully', blogs);
  } catch (error) {
    logger.error('Error retrieving blogs by author:', error);
    return ResponseHandler.error(res, 500, 'Error retrieving blogs by author');
  }
}

// Search blogs
async function searchBlogs(req, res) {
  try {
    const { q: searchTerm, limit = 10 } = req.query;
    
    if (!searchTerm) {
      return ResponseHandler.error(res, 400, 'Search term is required');
    }

    const blogs = await blogService.searchBlogs(searchTerm, parseInt(limit));
    
    logger.info(`Blog search completed: ${blogs.length} results for "${searchTerm}" by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 200, 'Blog search completed successfully', blogs);
  } catch (error) {
    logger.error('Error searching blogs:', error);
    return ResponseHandler.error(res, 500, 'Error searching blogs');
  }
}

// Get blogs by tags
async function getBlogsByTags(req, res) {
  try {
    const { tags } = req.query;
    
    if (!tags) {
      return ResponseHandler.error(res, 400, 'Tags parameter is required');
    }

    const tagsArray = Array.isArray(tags) ? tags : [tags];
    const blogs = await blogService.getBlogsByTags(tagsArray);
    
    logger.info(`Blogs retrieved for tags [${tagsArray.join(', ')}]: ${blogs.length} blogs by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 200, 'Blogs retrieved successfully', blogs);
  } catch (error) {
    logger.error('Error retrieving blogs by tags:', error);
    return ResponseHandler.error(res, 500, 'Error retrieving blogs by tags');
  }
}

// Get blog statistics
async function getBlogStats(req, res) {
  try {
    const stats = await blogService.getBlogStats();
    
    logger.info(`Blog statistics retrieved by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 200, 'Blog statistics retrieved successfully', stats);
  } catch (error) {
    logger.error('Error retrieving blog statistics:', error);
    return ResponseHandler.error(res, 500, 'Error retrieving blog statistics');
  }
}

// Get recent blogs
async function getRecentBlogs(req, res) {
  try {
    const { limit = 5 } = req.query;
    const blogs = await blogService.getRecentBlogs(parseInt(limit));
    
    logger.info(`Recent blogs retrieved: ${blogs.length} blogs by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 200, 'Recent blogs retrieved successfully', blogs);
  } catch (error) {
    logger.error('Error retrieving recent blogs:', error);
    return ResponseHandler.error(res, 500, 'Error retrieving recent blogs');
  }
}

// Get popular tags
async function getPopularTags(req, res) {
  try {
    const { limit = 10 } = req.query;
    const tags = await blogService.getPopularTags(parseInt(limit));
    
    logger.info(`Popular tags retrieved: ${tags.length} tags by user: ${req.user.email}`);
    
    return ResponseHandler.success(res, 200, 'Popular tags retrieved successfully', tags);
  } catch (error) {
    logger.error('Error retrieving popular tags:', error);
    return ResponseHandler.error(res, 500, 'Error retrieving popular tags');
  }
}

module.exports = {
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
}; 