const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  // Content fields
  content: {
    type: String,
    required: [true, 'Blog content is required'],
    minlength: [50, 'Content must be at least 50 characters long']
  },
  summary: {
    type: String,
    required: [true, 'Blog summary is required'],
    trim: true,
    maxlength: [500, 'Summary cannot exceed 500 characters']
  },
  excerpt: {
    type: String,
    trim: true,
    maxlength: [200, 'Excerpt cannot exceed 200 characters']
  },
  // Media and attachments
  coverImage: {
    url: {
      type: String,
      trim: true
    },
    alt: {
      type: String,
      trim: true,
      maxlength: [100, 'Alt text cannot exceed 100 characters']
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [200, 'Caption cannot exceed 200 characters']
    }
  },
  attachments: [{
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters']
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      min: [0, 'File size cannot be negative']
    },
    fileType: {
      type: String,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Categorization and tags
  category: {
    type: String,
    enum: ['News', 'Events', 'Academic', 'Student Life', 'Faculty', 'Research', 'Technology', 'General'],
    default: 'General'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  // Publishing and status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'scheduled', 'review'],
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date <= new Date();
      },
      message: 'Published date cannot be in the future'
    }
  },
  scheduledAt: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > new Date();
      },
      message: 'Scheduled date must be in the future'
    }
  },
  // SEO and metadata
  seo: {
    metaTitle: {
      type: String,
      trim: true,
      maxlength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [50, 'Keyword cannot exceed 50 characters']
    }],
    canonicalUrl: {
      type: String,
      trim: true
    }
  },
  // Engagement and analytics
  engagement: {
    views: {
      type: Number,
      default: 0,
      min: [0, 'Views cannot be negative']
    },
    likes: {
      type: Number,
      default: 0,
      min: [0, 'Likes cannot be negative']
    },
    shares: {
      type: Number,
      default: 0,
      min: [0, 'Shares cannot be negative']
    },
    comments: {
      type: Number,
      default: 0,
      min: [0, 'Comments cannot be negative']
    },
    readingTime: {
      type: Number,
      min: [1, 'Reading time must be at least 1 minute'],
      max: [120, 'Reading time cannot exceed 120 minutes']
    }
  },
  // Comments system
  allowComments: {
    type: Boolean,
    default: true
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Related content
  relatedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  }],
  // Credits and attribution
  credits: {
    type: String,
    trim: true,
    maxlength: [200, 'Credits cannot exceed 200 characters']
  },
  source: {
    type: String,
    trim: true,
    maxlength: [200, 'Source cannot exceed 200 characters']
  },
  // Review and approval
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Review notes cannot exceed 1000 characters']
  },
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
blogSchema.index({ author: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ publishedAt: 1 });
blogSchema.index({ scheduledAt: 1 });
blogSchema.index({ isPublished: 1 });
blogSchema.index({ 'engagement.views': 1 });
blogSchema.index({ 'engagement.likes': 1 });
blogSchema.index({ createdAt: 1 });
blogSchema.index({ title: 'text', content: 'text', summary: 'text' });

// Pre-save middleware to generate slug and update timestamps
blogSchema.pre('save', function(next) {
  // Generate slug from title if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Auto-generate excerpt from summary if not provided
  if (!this.excerpt && this.summary) {
    this.excerpt = this.summary.length > 200 
      ? this.summary.substring(0, 197) + '...' 
      : this.summary;
  }
  
  // Auto-generate SEO fields if not provided
  if (!this.seo.metaTitle && this.title) {
    this.seo.metaTitle = this.title.length > 60 
      ? this.title.substring(0, 57) + '...' 
      : this.title;
  }
  
  if (!this.seo.metaDescription && this.summary) {
    this.seo.metaDescription = this.summary.length > 160 
      ? this.summary.substring(0, 157) + '...' 
      : this.summary;
  }
  
  // Calculate reading time if not provided
  if (!this.engagement.readingTime && this.content) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.engagement.readingTime = Math.ceil(wordCount / wordsPerMinute);
  }
  
  // Update published status and timestamp
  if (this.status === 'published' && !this.isPublished) {
    this.isPublished = true;
    this.publishedAt = this.publishedAt || new Date();
  }
  
  // Update last modified by if not set
  if (this.isModified() && !this.lastModifiedBy) {
    this.lastModifiedBy = this.createdBy;
  }
  
  next();
});

// Virtual for blog URL
blogSchema.virtual('url').get(function() {
  return `/blog/${this.slug}`;
});

// Virtual for cover image URL
blogSchema.virtual('coverImageUrl').get(function() {
  return this.coverImage?.url || null;
});

// Virtual for engagement score
blogSchema.virtual('engagementScore').get(function() {
  const views = this.engagement.views || 0;
  const likes = this.engagement.likes || 0;
  const shares = this.engagement.shares || 0;
  const comments = this.engagement.comments || 0;
  
  return views + (likes * 2) + (shares * 3) + (comments * 2);
});

// Virtual for approval status
blogSchema.virtual('isApproved').get(function() {
  return this.status === 'published' && this.isPublished;
});

// Virtual for is scheduled
blogSchema.virtual('isScheduled').get(function() {
  return this.status === 'scheduled' && this.scheduledAt && this.scheduledAt > new Date();
});

// Virtual for comment count
blogSchema.virtual('approvedCommentCount').get(function() {
  return this.comments ? this.comments.filter(comment => comment.isApproved).length : 0;
});

// Virtual for blog age
blogSchema.virtual('blogAge').get(function() {
  if (!this.publishedAt) return null;
  
  const now = new Date();
  const published = new Date(this.publishedAt);
  const diffTime = Math.abs(now - published);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

// Static method to find published blogs
blogSchema.statics.findPublished = function() {
  return this.find({ status: 'published', isPublished: true }).sort({ publishedAt: -1 });
};

// Static method to find blogs by author
blogSchema.statics.findByAuthor = function(authorId) {
  return this.find({ author: authorId }).sort({ createdAt: -1 });
};

// Static method to find blogs by category
blogSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'published', isPublished: true }).sort({ publishedAt: -1 });
};

// Static method to find blogs by tag
blogSchema.statics.findByTag = function(tag) {
  return this.find({ 
    tags: tag.toLowerCase(), 
    status: 'published', 
    isPublished: true 
  }).sort({ publishedAt: -1 });
};

// Static method to find scheduled blogs
blogSchema.statics.findScheduled = function() {
  return this.find({ 
    status: 'scheduled',
    scheduledAt: { $gt: new Date() }
  }).sort({ scheduledAt: 1 });
};

// Static method to find popular blogs
blogSchema.statics.findPopular = function(limit = 10) {
  return this.find({ 
    status: 'published', 
    isPublished: true 
  })
  .sort({ 'engagement.views': -1 })
  .limit(limit);
};

// Static method to find recent blogs
blogSchema.statics.findRecent = function(limit = 10) {
  return this.find({ 
    status: 'published', 
    isPublished: true 
  })
  .sort({ publishedAt: -1 })
  .limit(limit);
};

// Static method to search blogs
blogSchema.statics.search = function(query) {
  return this.find({
    $text: { $search: query },
    status: 'published',
    isPublished: true
  }).sort({ score: { $meta: 'textScore' } });
};

// Static method to find blogs for review
blogSchema.statics.findForReview = function() {
  return this.find({ status: 'review' }).sort({ createdAt: 1 });
};

// Instance method to publish blog
blogSchema.methods.publish = function() {
  this.status = 'published';
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
};

// Instance method to schedule blog
blogSchema.methods.schedule = function(scheduledDate) {
  this.status = 'scheduled';
  this.scheduledAt = scheduledDate;
  return this.save();
};

// Instance method to archive blog
blogSchema.methods.archive = function() {
  this.status = 'archived';
  this.isPublished = false;
  return this.save();
};

// Instance method to submit for review
blogSchema.methods.submitForReview = function() {
  this.status = 'review';
  return this.save();
};

// Instance method to approve blog
blogSchema.methods.approve = function(reviewedBy, notes = null) {
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  this.status = 'published';
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
};

// Instance method to reject blog
blogSchema.methods.reject = function(reviewedBy, notes) {
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  this.reviewNotes = notes;
  this.status = 'draft';
  return this.save();
};

// Instance method to increment views
blogSchema.methods.incrementViews = function() {
  this.engagement.views += 1;
  return this.save();
};

// Instance method to like blog
blogSchema.methods.like = function() {
  this.engagement.likes += 1;
  return this.save();
};

// Instance method to unlike blog
blogSchema.methods.unlike = function() {
  if (this.engagement.likes > 0) {
    this.engagement.likes -= 1;
  }
  return this.save();
};

// Instance method to add comment
blogSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content,
    isApproved: false,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  this.engagement.comments += 1;
  return this.save();
};

// Instance method to approve comment
blogSchema.methods.approveComment = function(commentId) {
  const comment = this.comments.id(commentId);
  if (comment) {
    comment.isApproved = true;
    comment.updatedAt = new Date();
  }
  return this.save();
};

// Instance method to remove comment
blogSchema.methods.removeComment = function(commentId) {
  this.comments = this.comments.filter(comment => comment._id.toString() !== commentId);
  this.engagement.comments = Math.max(0, this.engagement.comments - 1);
  return this.save();
};

// Instance method to add attachment
blogSchema.methods.addAttachment = function(fileName, fileUrl, fileSize, fileType) {
  this.attachments.push({
    fileName,
    fileUrl,
    fileSize,
    fileType,
    uploadedAt: new Date()
  });
  return this.save();
};

// Instance method to remove attachment
blogSchema.methods.removeAttachment = function(fileUrl) {
  this.attachments = this.attachments.filter(attachment => attachment.fileUrl !== fileUrl);
  return this.save();
};

// Instance method to get blog summary
blogSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    slug: this.slug,
    author: this.author,
    category: this.category,
    status: this.status,
    isPublished: this.isPublished,
    publishedAt: this.publishedAt,
    scheduledAt: this.scheduledAt,
    engagement: this.engagement,
    tags: this.tags,
    url: this.url,
    blogAge: this.blogAge,
    engagementScore: this.engagementScore
  };
};

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

module.exports = mongoose.model('Blog', blogSchema); 