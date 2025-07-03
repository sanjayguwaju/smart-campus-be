const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  author: { type: String, required: true },
  coverImage: { type: String }, // URL or file path
  content: { type: String, required: true },
  summary: { type: String, required: true },
  tags: [{ type: String }],
  isPublished: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  credits: { type: String },
  attachments: [{ type: String }], // Array of file URLs/paths
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);

// Drop old 'seo.slug_1' index if it exists
if (process.env.NODE_ENV !== 'production') {
  mongoose.connection.on('open', async () => {
    try {
      const indexes = await mongoose.connection.db.collection('blogs').indexes();
      if (indexes.some(idx => idx.name === 'seo.slug_1')) {
        await mongoose.connection.db.collection('blogs').dropIndex('seo.slug_1');
        console.log('Dropped old index: seo.slug_1');
      }
    } catch (err) {
      // Ignore if index doesn't exist
    }
  });
} 