const Blog = require('../models/blog.model');
const ResponseHandler = require('../utils/responseHandler');

const BlogController = {
  async getAll(req, res) {
    try {
      const blogs = await Blog.find().sort({ createdAt: -1 });
      return ResponseHandler.success(res, 200, 'Blogs fetched successfully', blogs);
    } catch (error) {
      return ResponseHandler.error(res, 500, error.message);
    }
  },

  async getById(req, res) {
    try {
      const blog = await Blog.findById(req.params.id);
      if (!blog) return ResponseHandler.error(res, 404, 'Blog not found');
      return ResponseHandler.success(res, 200, 'Blog fetched successfully', blog);
    } catch (error) {
      return ResponseHandler.error(res, 500, error.message);
    }
  },

  async create(req, res) {
    try {
      const { title, slug, author, content, summary, tags, isPublished, status, credits } = req.body;
      const coverImage = req.file ? req.file.path : undefined;
      const blog = await Blog.create({
        title,
        slug,
        author,
        content,
        summary,
        tags: tags ? JSON.parse(tags) : [],
        isPublished: isPublished === 'true' || isPublished === true || status === 'published',
        status: status || (isPublished ? 'published' : 'draft'),
        credits,
        coverImage,
      });
      return ResponseHandler.success(res, 201, 'Blog created successfully', blog);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  },

  async update(req, res) {
    try {
      const { title, slug, author, content, summary, tags, isPublished, status, credits } = req.body;
      const coverImage = req.file ? req.file.path : undefined;
      const updateData = {
        title,
        slug,
        author,
        content,
        summary,
        tags: tags ? JSON.parse(tags) : [],
        isPublished: isPublished === 'true' || isPublished === true || status === 'published',
        status: status || (isPublished ? 'published' : 'draft'),
        credits,
      };
      if (coverImage) updateData.coverImage = coverImage;
      const blog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!blog) return ResponseHandler.error(res, 404, 'Blog not found');
      return ResponseHandler.success(res, 200, 'Blog updated successfully', blog);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  },

  async publish(req, res) {
    try {
      const { isPublished } = req.body;
      if (typeof isPublished !== 'boolean') {
        return ResponseHandler.error(res, 400, 'isPublished must be a boolean');
      }
      const blog = await Blog.findById(req.params.id);
      if (!blog) return ResponseHandler.error(res, 404, 'Blog not found');
      blog.isPublished = isPublished;
      blog.status = isPublished ? 'published' : 'draft';
      await blog.save();
      return ResponseHandler.success(res, 200, `Blog ${isPublished ? 'published' : 'unpublished'} successfully`, blog);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  },

  async delete(req, res) {
    try {
      const blog = await Blog.findByIdAndDelete(req.params.id);
      if (!blog) return ResponseHandler.error(res, 404, 'Blog not found');
      return ResponseHandler.success(res, 200, 'Blog deleted successfully', blog);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }
};

module.exports = BlogController; 