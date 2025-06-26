const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notice title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Notice content is required'],
    trim: true
  },
  summary: {
    type: String,
    trim: true,
    maxlength: [500, 'Summary cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['announcement', 'academic', 'administrative', 'event', 'emergency', 'maintenance', 'other'],
    default: 'announcement',
    required: true
  },
  category: {
    type: String,
    enum: ['undergraduate', 'graduate', 'faculty', 'staff', 'all'],
    default: 'all',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'expired'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'faculty', 'staff'],
      required: true
    }
  },
  targetAudience: {
    departments: [{
      type: String,
      trim: true
    }],
    roles: [{
      type: String,
      enum: ['admin', 'faculty', 'staff', 'student']
    }],
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    yearLevels: [{
      type: String,
      enum: ['first', 'second', 'third', 'fourth', 'fifth', 'graduate']
    }]
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: function() {
      // Default expiry: 30 days from publish date
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  attachments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String
    },
    caption: {
      type: String
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  relatedNotices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notice'
  }],
  contactInfo: {
    email: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    office: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  location: {
    building: {
      type: String,
      trim: true
    },
    room: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  statistics: {
    views: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  engagement: {
    likes: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      likedAt: {
        type: Date,
        default: Date.now
      }
    }],
    bookmarks: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      bookmarkedAt: {
        type: Date,
        default: Date.now
      }
    }],
    comments: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      userName: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true,
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      isEdited: {
        type: Boolean,
        default: false
      },
      editedAt: {
        type: Date
      }
    }]
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    requireAcknowledgement: {
      type: Boolean,
      default: false
    },
    sendNotification: {
      type: Boolean,
      default: true
    },
    pinToTop: {
      type: Boolean,
      default: false
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  metadata: {
    language: {
      type: String,
      default: 'en'
    },
    version: {
      type: Number,
      default: 1
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    revisionHistory: [{
      version: {
        type: Number,
        required: true
      },
      modifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      modifiedAt: {
        type: Date,
        default: Date.now
      },
      changes: {
        type: String
      }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
noticeSchema.index({ title: 'text', content: 'text', summary: 'text' });
noticeSchema.index({ type: 1, status: 1 });
noticeSchema.index({ category: 1, status: 1 });
noticeSchema.index({ priority: 1, status: 1 });
noticeSchema.index({ 'author.id': 1 });
noticeSchema.index({ publishDate: -1 });
noticeSchema.index({ expiryDate: 1 });
noticeSchema.index({ status: 1, publishDate: -1 });
noticeSchema.index({ 'settings.pinToTop': -1, publishDate: -1 });
noticeSchema.index({ 'settings.featured': -1, publishDate: -1 });

// Virtual for checking if notice is active
noticeSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'published' && 
         this.publishDate <= now && 
         (this.expiryDate === null || this.expiryDate > now);
});

// Virtual for checking if notice is expired
noticeSchema.virtual('isExpired').get(function() {
  const now = new Date();
  return this.expiryDate && this.expiryDate <= now;
});

// Virtual for getting view count
noticeSchema.virtual('viewCount').get(function() {
  return this.statistics.views;
});

// Virtual for getting like count
noticeSchema.virtual('likeCount').get(function() {
  return this.engagement.likes.length;
});

// Virtual for getting comment count
noticeSchema.virtual('commentCount').get(function() {
  return this.engagement.comments.length;
});

// Virtual for getting bookmark count
noticeSchema.virtual('bookmarkCount').get(function() {
  return this.engagement.bookmarks.length;
});

// Instance method to increment view count
noticeSchema.methods.incrementView = function(userId = null) {
  this.statistics.views += 1;
  
  // Track unique views if userId is provided
  if (userId) {
    // This is a simplified approach - in production, you might want to track unique views more sophisticatedly
    this.statistics.uniqueViews += 1;
  }
  
  return this.save();
};

// Instance method to like/unlike notice
noticeSchema.methods.toggleLike = function(userId) {
  const existingLike = this.engagement.likes.find(like => like.userId.toString() === userId.toString());
  
  if (existingLike) {
    // Unlike
    this.engagement.likes = this.engagement.likes.filter(like => like.userId.toString() !== userId.toString());
  } else {
    // Like
    this.engagement.likes.push({ userId });
  }
  
  return this.save();
};

// Instance method to bookmark/unbookmark notice
noticeSchema.methods.toggleBookmark = function(userId) {
  const existingBookmark = this.engagement.bookmarks.find(bookmark => bookmark.userId.toString() === userId.toString());
  
  if (existingBookmark) {
    // Remove bookmark
    this.engagement.bookmarks = this.engagement.bookmarks.filter(bookmark => bookmark.userId.toString() !== userId.toString());
  } else {
    // Add bookmark
    this.engagement.bookmarks.push({ userId });
  }
  
  return this.save();
};

// Instance method to add comment
noticeSchema.methods.addComment = function(userId, userName, content) {
  this.engagement.comments.push({
    userId,
    userName,
    content
  });
  
  return this.save();
};

// Instance method to update comment
noticeSchema.methods.updateComment = function(commentId, content) {
  const comment = this.engagement.comments.id(commentId);
  if (comment) {
    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();
  }
  
  return this.save();
};

// Instance method to delete comment
noticeSchema.methods.deleteComment = function(commentId) {
  this.engagement.comments = this.engagement.comments.filter(comment => comment._id.toString() !== commentId);
  return this.save();
};

// Static method to get active notices
noticeSchema.statics.getActiveNotices = function() {
  const now = new Date();
  return this.find({
    status: 'published',
    publishDate: { $lte: now },
    $or: [
      { expiryDate: { $gt: now } },
      { expiryDate: null }
    ]
  }).sort({ 'settings.pinToTop': -1, publishDate: -1 });
};

// Static method to get notices by type
noticeSchema.statics.getNoticesByType = function(type, options = {}) {
  const query = { type, status: 'published' };
  
  if (options.category) {
    query.category = options.category;
  }
  
  return this.find(query).sort({ publishDate: -1 });
};

// Static method to get urgent notices
noticeSchema.statics.getUrgentNotices = function() {
  const now = new Date();
  return this.find({
    priority: 'urgent',
    status: 'published',
    publishDate: { $lte: now },
    $or: [
      { expiryDate: { $gt: now } },
      { expiryDate: null }
    ]
  }).sort({ publishDate: -1 });
};

// Static method to get featured notices
noticeSchema.statics.getFeaturedNotices = function() {
  const now = new Date();
  return this.find({
    'settings.featured': true,
    status: 'published',
    publishDate: { $lte: now },
    $or: [
      { expiryDate: { $gt: now } },
      { expiryDate: null }
    ]
  }).sort({ publishDate: -1 });
};

// Static method to search notices
noticeSchema.statics.searchNotices = function(searchTerm, options = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'published'
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, publishDate: -1 });
};

// Pre-save middleware to handle versioning
noticeSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    // Increment version
    this.metadata.version += 1;
    
    // Add to revision history
    this.metadata.revisionHistory.push({
      version: this.metadata.version,
      modifiedBy: this.metadata.lastModifiedBy,
      modifiedAt: new Date(),
      changes: 'Notice updated'
    });
  }
  
  next();
});

// Pre-save middleware to validate dates
noticeSchema.pre('save', function(next) {
  if (this.expiryDate && this.publishDate && this.expiryDate <= this.publishDate) {
    return next(new Error('Expiry date must be after publish date'));
  }
  
  if (this.effectiveDate && this.publishDate && this.effectiveDate < this.publishDate) {
    return next(new Error('Effective date cannot be before publish date'));
  }
  
  next();
});

module.exports = mongoose.model('Notice', noticeSchema); 