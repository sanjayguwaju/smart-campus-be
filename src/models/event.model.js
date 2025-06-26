const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Event title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Event description cannot exceed 1000 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: ['academic', 'cultural', 'sports', 'technical', 'social', 'workshop', 'seminar', 'conference', 'other'],
    default: 'other'
  },
  category: {
    type: String,
    required: [true, 'Event category is required'],
    enum: ['student', 'faculty', 'admin', 'public', 'invitation-only'],
    default: 'public'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  location: {
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true
    },
    room: {
      type: String,
      trim: true
    },
    building: {
      type: String,
      trim: true
    },
    campus: {
      type: String,
      trim: true
    }
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer is required']
  },
  coOrganizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled', 'waitlist'],
      default: 'registered'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxAttendees: {
    type: Number,
    min: [1, 'Maximum attendees must be at least 1'],
    default: null
  },
  currentAttendees: {
    type: Number,
    default: 0,
    min: 0
  },
  registrationDeadline: {
    type: Date
  },
  isRegistrationRequired: {
    type: Boolean,
    default: false
  },
  isRegistrationOpen: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
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
      type: String
    },
    size: {
      type: Number
    }
  }],
  contactInfo: {
    email: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed', 'postponed'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  featured: {
    type: Boolean,
    default: false
  },
  highlights: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }],
  externalLinks: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  statistics: {
    views: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    registrations: {
      type: Number,
      default: 0
    },
    attendance: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ status: 1, visibility: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ eventType: 1, category: 1 });
eventSchema.index({ featured: 1, priority: 1 });

// Virtual for checking if event is ongoing
eventSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
});

// Virtual for checking if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  const now = new Date();
  return this.startDate > now;
});

// Virtual for checking if event is past
eventSchema.virtual('isPast').get(function() {
  const now = new Date();
  return this.endDate < now;
});

// Virtual for checking if registration is still open
eventSchema.virtual('canRegister').get(function() {
  if (!this.isRegistrationRequired || !this.isRegistrationOpen) {
    return false;
  }
  
  if (this.registrationDeadline && new Date() > this.registrationDeadline) {
    return false;
  }
  
  if (this.maxAttendees && this.currentAttendees >= this.maxAttendees) {
    return false;
  }
  
  return true;
});

// Pre-save middleware to update current attendees count
eventSchema.pre('save', function(next) {
  if (this.attendees) {
    this.currentAttendees = this.attendees.filter(attendee => 
      attendee.status === 'registered' || attendee.status === 'attended'
    ).length;
  }
  next();
});

// Pre-save middleware to update average rating
eventSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
    this.totalReviews = this.reviews.length;
  }
  next();
});

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function(limit = 10) {
  return this.find({
    startDate: { $gt: new Date() },
    status: 'published',
    visibility: 'public'
  })
  .sort({ startDate: 1 })
  .limit(limit)
  .populate('organizer', 'firstName lastName email avatar')
  .populate('coOrganizers', 'firstName lastName email avatar');
};

// Static method to find featured events
eventSchema.statics.findFeatured = function(limit = 5) {
  return this.find({
    featured: true,
    status: 'published',
    visibility: 'public'
  })
  .sort({ startDate: 1 })
  .limit(limit)
  .populate('organizer', 'firstName lastName email avatar');
};

// Instance method to register user for event
eventSchema.methods.registerUser = function(userId) {
  if (!this.canRegister) {
    throw new Error('Registration is not available for this event');
  }
  
  const existingRegistration = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );
  
  if (existingRegistration) {
    throw new Error('User is already registered for this event');
  }
  
  this.attendees.push({
    user: userId,
    status: 'registered',
    registeredAt: new Date()
  });
  
  return this.save();
};

// Instance method to cancel user registration
eventSchema.methods.cancelRegistration = function(userId) {
  const registration = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );
  
  if (!registration) {
    throw new Error('User is not registered for this event');
  }
  
  if (registration.status === 'attended') {
    throw new Error('Cannot cancel registration for attended event');
  }
  
  registration.status = 'cancelled';
  return this.save();
};

// Instance method to mark user as attended
eventSchema.methods.markAttended = function(userId) {
  const registration = this.attendees.find(
    attendee => attendee.user.toString() === userId.toString()
  );
  
  if (!registration) {
    throw new Error('User is not registered for this event');
  }
  
  registration.status = 'attended';
  return this.save();
};

// Instance method to add review
eventSchema.methods.addReview = function(userId, rating, comment) {
  const existingReview = this.reviews.find(
    review => review.user.toString() === userId.toString()
  );
  
  if (existingReview) {
    throw new Error('User has already reviewed this event');
  }
  
  this.reviews.push({
    user: userId,
    rating,
    comment
  });
  
  return this.save();
};

module.exports = mongoose.model('Event', eventSchema); 