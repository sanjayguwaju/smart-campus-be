const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  publishDate: { type: Date, default: Date.now },
  category: { type: String, required: true },
  image: { type: String },
  tags: [{ type: String }],
  readTime: { type: String },
});

module.exports = mongoose.model('Blog', blogSchema); 