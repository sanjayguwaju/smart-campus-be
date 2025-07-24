const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Faculty is required']
  },
  assignmentType: {
    type: String,
    enum: ['Homework', 'Project', 'Quiz', 'Exam', 'Lab', 'Presentation', 'Essay', 'Research'],
    default: 'Homework'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  // Extended due date for late submissions
  extendedDueDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > this.dueDate;
      },
      message: 'Extended due date must be after the original due date'
    }
  },
  // Assignment files
  files: [{
    fileName: {
      type: String,
      required: true,
      trim: true
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
  // Assignment requirements and instructions
  requirements: {
    maxFileSize: {
      type: Number,
      default: 10, // MB
      min: [1, 'Maximum file size must be at least 1 MB']
    },
    allowedFileTypes: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    maxSubmissions: {
      type: Number,
      default: 1,
      min: [1, 'Maximum submissions must be at least 1']
    },
    allowLateSubmission: {
      type: Boolean,
      default: false
    },
    latePenalty: {
      type: Number,
      default: 0,
      min: [0, 'Late penalty cannot be negative'],
      max: [100, 'Late penalty cannot exceed 100%']
    }
  },
  // Grading criteria
  gradingCriteria: [{
    criterion: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Criterion name cannot exceed 100 characters']
    },
    maxPoints: {
      type: Number,
      required: true,
      min: [0, 'Points cannot be negative']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Criterion description cannot exceed 500 characters']
    }
  }],
  totalPoints: {
    type: Number,
    required: true,
    min: [1, 'Total points must be at least 1'],
    max: [1000, 'Total points cannot exceed 1000']
  },
  // Assignment status
  status: {
    type: String,
    enum: ['draft', 'published', 'submission_closed', 'grading', 'completed', 'archived'],
    default: 'draft'
  },
  // Visibility settings
  isVisible: {
    type: Boolean,
    default: false
  },
  // Assignment statistics
  statistics: {
    totalSubmissions: {
      type: Number,
      default: 0,
      min: [0, 'Total submissions cannot be negative']
    },
    onTimeSubmissions: {
      type: Number,
      default: 0,
      min: [0, 'On-time submissions cannot be negative']
    },
    lateSubmissions: {
      type: Number,
      default: 0,
      min: [0, 'Late submissions cannot be negative']
    },
    averageScore: {
      type: Number,
      default: 0,
      min: [0, 'Average score cannot be negative']
    }
  },
  // Additional metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Expert'],
    default: 'Medium'
  },
  estimatedTime: {
    type: Number, // in hours
    min: [0.5, 'Estimated time must be at least 0.5 hours'],
    max: [100, 'Estimated time cannot exceed 100 hours']
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
assignmentSchema.index({ course: 1 });
assignmentSchema.index({ faculty: 1 });
assignmentSchema.index({ status: 1 });
assignmentSchema.index({ assignmentType: 1 });
assignmentSchema.index({ dueDate: 1 });
assignmentSchema.index({ isVisible: 1 });
assignmentSchema.index({ 'statistics.totalSubmissions': 1 });
assignmentSchema.index({ difficulty: 1 });
assignmentSchema.index({ tags: 1 });

// Pre-save middleware to validate grading criteria
assignmentSchema.pre('save', function(next) {
  // Validate that total points match grading criteria
  if (this.gradingCriteria && this.gradingCriteria.length > 0) {
    const criteriaPoints = this.gradingCriteria.reduce((sum, criteria) => sum + criteria.maxPoints, 0);
    if (criteriaPoints !== this.totalPoints) {
      return next(new Error('Total points must match the sum of grading criteria points'));
    }
  }
  
  // Update last modified by if not set
  if (this.isModified() && !this.lastModifiedBy) {
    this.lastModifiedBy = this.createdBy;
  }
  
  next();
});

// Virtual for assignment status
assignmentSchema.virtual('isOverdue').get(function() {
  const now = new Date();
  const effectiveDueDate = this.extendedDueDate || this.dueDate;
  return now > effectiveDueDate;
});

// Virtual for time remaining
assignmentSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const effectiveDueDate = this.extendedDueDate || this.dueDate;
  const timeDiff = effectiveDueDate - now;
  
  if (timeDiff <= 0) return 'Overdue';
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} days, ${hours} hours`;
  return `${hours} hours`;
});

// Virtual for submission rate
assignmentSchema.virtual('submissionRate').get(function() {
  // This would need to be calculated based on course enrollment
  // For now, returning a placeholder
  return this.statistics.totalSubmissions;
});

// Virtual for average grade
assignmentSchema.virtual('averageGrade').get(function() {
  if (this.statistics.totalSubmissions === 0) return 'No submissions';
  return `${this.statistics.averageScore.toFixed(1)}%`;
});

// Static method to find published assignments
assignmentSchema.statics.findPublished = function() {
  return this.find({ status: 'published', isVisible: true }).sort({ dueDate: 1 });
};

// Static method to find assignments by course
assignmentSchema.statics.findByCourse = function(courseId) {
  return this.find({ course: courseId }).sort({ dueDate: 1 });
};

// Static method to find assignments by faculty
assignmentSchema.statics.findByFaculty = function(facultyId) {
  return this.find({ faculty: facultyId }).sort({ dueDate: 1 });
};

// Static method to find overdue assignments
assignmentSchema.statics.findOverdue = function() {
  const now = new Date();
  return this.find({
    $or: [
      { dueDate: { $lt: now } },
      { extendedDueDate: { $lt: now } }
    ],
    status: { $in: ['published', 'submission_closed'] }
  }).sort({ dueDate: 1 });
};

// Static method to find assignments by type
assignmentSchema.statics.findByType = function(type) {
  return this.find({ assignmentType: type, status: 'published' }).sort({ dueDate: 1 });
};

// Static method to find assignments by difficulty
assignmentSchema.statics.findByDifficulty = function(difficulty) {
  return this.find({ difficulty, status: 'published' }).sort({ dueDate: 1 });
};

// Instance method to publish assignment
assignmentSchema.methods.publish = function() {
  this.status = 'published';
  this.isVisible = true;
  return this.save();
};

// Instance method to close submissions
assignmentSchema.methods.closeSubmissions = function() {
  this.status = 'submission_closed';
  return this.save();
};

// Instance method to start grading
assignmentSchema.methods.startGrading = function() {
  this.status = 'grading';
  return this.save();
};

// Instance method to complete assignment
assignmentSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

// Instance method to archive assignment
assignmentSchema.methods.archive = function() {
  this.status = 'archived';
  this.isVisible = false;
  return this.save();
};

// Instance method to add file
assignmentSchema.methods.addFile = function(fileName, fileUrl, fileSize, fileType) {
  this.files.push({
    fileName,
    fileUrl,
    fileSize,
    fileType,
    uploadedAt: new Date()
  });
  return this.save();
};

// Instance method to remove file
assignmentSchema.methods.removeFile = function(fileUrl) {
  this.files = this.files.filter(file => file.fileUrl !== fileUrl);
  return this.save();
};

// Instance method to update statistics
assignmentSchema.methods.updateStatistics = function(submissionData) {
  this.statistics.totalSubmissions = submissionData.totalSubmissions || 0;
  this.statistics.onTimeSubmissions = submissionData.onTimeSubmissions || 0;
  this.statistics.lateSubmissions = submissionData.lateSubmissions || 0;
  this.statistics.averageScore = submissionData.averageScore || 0;
  return this.save();
};

// Instance method to check if student can submit
assignmentSchema.methods.canSubmit = function(studentId, submissionCount = 0) {
  if (this.status !== 'published') return false;
  if (submissionCount >= this.requirements.maxSubmissions) return false;
  
  const now = new Date();
  const effectiveDueDate = this.extendedDueDate || this.dueDate;
  
  if (now > effectiveDueDate && !this.requirements.allowLateSubmission) {
    return false;
  }
  
  return true;
};

// Instance method to calculate late penalty
assignmentSchema.methods.calculateLatePenalty = function(submissionDate) {
  if (!this.requirements.allowLateSubmission || !this.requirements.latePenalty) {
    return 0;
  }
  
  const effectiveDueDate = this.extendedDueDate || this.dueDate;
  if (submissionDate <= effectiveDueDate) return 0;
  
  const hoursLate = (submissionDate - effectiveDueDate) / (1000 * 60 * 60);
  const daysLate = Math.ceil(hoursLate / 24);
  
  return Math.min(this.requirements.latePenalty * daysLate, 100);
};

// Instance method to get assignment summary
assignmentSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    course: this.course,
    faculty: this.faculty,
    type: this.assignmentType,
    dueDate: this.dueDate,
    extendedDueDate: this.extendedDueDate,
    totalPoints: this.totalPoints,
    status: this.status,
    isVisible: this.isVisible,
    statistics: this.statistics,
    timeRemaining: this.timeRemaining,
    isOverdue: this.isOverdue
  };
};

module.exports = mongoose.model('Assignment', assignmentSchema); 