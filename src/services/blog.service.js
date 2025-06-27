const Blog = require('../models/blog.model');

exports.getAllBlogs = () => Blog.find();
exports.getBlogById = (id) => Blog.findById(id);
exports.createBlog = (data) => Blog.create(data);
exports.updateBlog = (id, data) => Blog.findByIdAndUpdate(id, data, { new: true });
exports.deleteBlog = (id) => Blog.findByIdAndDelete(id); 