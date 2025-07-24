const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Assignment is required']
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  // Submission files
  files: [{
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
  // Submission metadata
  submissionNumber: {
    type: Number,
    default: 1,
    min: [1, 'Submission number must be at least 1']
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  // Submission status
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'graded', 'returned', 'late', 'rejected'],
    default: 'submitted'
  },
  // Late submission tracking
  isLate: {
    type: Boolean,
    default: false
  },
  latePenalty: {
    type: Number,
    default: 0,
    min: [0, 'Late penalty cannot be negative'],
    max: [100, 'Late penalty cannot exceed 100%']
  },
  // Grading information
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'Incomplete', 'Pass', 'Fail'],
    validate: {
      validator: function(grade) {
        return !grade || ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'Incomplete', 'Pass', 'Fail'].includes(grade);
      },
      message: 'Invalid grade format'
    }
  },
  numericalScore: {
    type: Number,
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  // Detailed grading by criteria
  criteriaScores: [{
    criterion: {
      type: String,
      required: true,
      trim: true
    },
    maxPoints: {
      type: Number,
      required: true,
      min: [0, 'Max points cannot be negative']
    },
    earnedPoints: {
      type: Number,
      required: true,
      min: [0, 'Earned points cannot be negative']
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [500, 'Criteria feedback cannot exceed 500 characters']
    }
  }],
  // Feedback system
  feedback: {
    general: {
      type: String,
      trim: true,
      maxlength: [2000, 'General feedback cannot exceed 2000 characters']
    },
    strengths: [{
      type: String,
      trim: true,
      maxlength: [200, 'Strength comment cannot exceed 200 characters']
    }],
    improvements: [{
      type: String,
      trim: true,
      maxlength: [200, 'Improvement comment cannot exceed 200 characters']
    }],
    rubric: {
      type: String,
      trim: true,
      maxlength: [1000, 'Rubric feedback cannot exceed 1000 characters']
    }
  },
  // Review information
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  // Comments and notes
  studentComments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Student comments cannot exceed 1000 characters']
  },
  instructorNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Instructor notes cannot exceed 1000 characters']
  },
  // Plagiarism detection
  plagiarismCheck: {
    isChecked: {
      type: Boolean,
      default: false
    },
    similarityScore: {
      type: Number,
      min: [0, 'Similarity score cannot be negative'],
      max: [100, 'Similarity score cannot exceed 100']
    },
    flagged: {
      type: Boolean,
      default: false
    },
    reportUrl: {
      type: String,
      trim: true
    },
    checkedAt: {
      type: Date
    }
  },
  // Submission verification
  verification: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    },
    verificationNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Verification notes cannot exceed 500 characters']
    }
  },
  // Submission history
  submissionHistory: [{
    action: {
      type: String,
      enum: ['submitted', 'resubmitted', 'graded', 'returned', 'late_penalty_applied', 'plagiarism_checked'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: {
      type: String,
      trim: true,
      maxlength: [500, 'History details cannot exceed 500 characters']
    }
  }],
  // Additional metadata
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
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
submissionSchema.index({ assignment: 1 });
submissionSchema.index({ student: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ submittedAt: 1 });
submissionSchema.index({ reviewedBy: 1 });
submissionSchema.index({ grade: 1 });
submissionSchema.index({ isLate: 1 });
submissionSchema.index({ 'plagiarismCheck.flagged': 1 });
submissionSchema.index({ assignment: 1, student: 1 });
submissionSchema.index({ assignment: 1, status: 1 });
submissionSchema.index({ student: 1, status: 1 });

// Pre-save middleware to validate submission
submissionSchema.pre('save', function(next) {
  // Validate that earned points don't exceed max points in criteria scores
  if (this.criteriaScores && this.criteriaScores.length > 0) {
    for (const criteria of this.criteriaScores) {
      if (criteria.earnedPoints > criteria.maxPoints) {
        return next(new Error(`Earned points (${criteria.earnedPoints}) cannot exceed max points (${criteria.maxPoints}) for criterion: ${criteria.criterion}`));
      }
    }
  }
  
  // Update last modified by if not set
  if (this.isModified() && !this.lastModifiedBy) {
    this.lastModifiedBy = this.createdBy;
  }
  
  // Auto-calculate late status
  if (this.submittedAt && this.assignment) {
    // This would need to be implemented with assignment due date lookup
    // For now, we'll rely on the isLate field being set manually
  }
  
  next();
});

// Virtual for submission percentage score
submissionSchema.virtual('percentageScore').get(function() {
  if (!this.numericalScore) return null;
  return `${this.numericalScore}%`;
});

// Virtual for total earned points
submissionSchema.virtual('totalEarnedPoints').get(function() {
  if (!this.criteriaScores || this.criteriaScores.length === 0) return 0;
  return this.criteriaScores.reduce((sum, criteria) => sum + criteria.earnedPoints, 0);
});

// Virtual for total max points
submissionSchema.virtual('totalMaxPoints').get(function() {
  if (!this.criteriaScores || this.criteriaScores.length === 0) return 0;
  return this.criteriaScores.reduce((sum, criteria) => sum + criteria.maxPoints, 0);
});

// Virtual for calculated score percentage
submissionSchema.virtual('calculatedScore').get(function() {
  const totalEarned = this.totalEarnedPoints;
  const totalMax = this.totalMaxPoints;
  
  if (totalMax === 0) return 0;
  
  let percentage = (totalEarned / totalMax) * 100;
  
  // Apply late penalty if applicable
  if (this.isLate && this.latePenalty > 0) {
    percentage = percentage * (1 - this.latePenalty / 100);
  }
  
  return Math.round(percentage * 100) / 100; // Round to 2 decimal places
});

// Virtual for submission age
submissionSchema.virtual('submissionAge').get(function() {
  if (!this.submittedAt) return null;
  
  const now = new Date();
  const submitted = new Date(this.submittedAt);
  const diffTime = Math.abs(now - submitted);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

// Virtual for review time
submissionSchema.virtual('reviewTime').get(function() {
  if (!this.submittedAt || !this.reviewedAt) return null;
  
  const submitted = new Date(this.submittedAt);
  const reviewed = new Date(this.reviewedAt);
  const diffTime = Math.abs(reviewed - submitted);
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  
  if (diffHours < 24) return `${diffHours} hours`;
  const diffDays = Math.ceil(diffHours / 24);
  return `${diffDays} days`;
});

// Virtual for grade letter
submissionSchema.virtual('gradeLetter').get(function() {
  if (!this.numericalScore) return this.grade || 'Not Graded';
  
  if (this.numericalScore >= 97) return 'A+';
  if (this.numericalScore >= 93) return 'A';
  if (this.numericalScore >= 90) return 'A-';
  if (this.numericalScore >= 87) return 'B+';
  if (this.numericalScore >= 83) return 'B';
  if (this.numericalScore >= 80) return 'B-';
  if (this.numericalScore >= 77) return 'C+';
  if (this.numericalScore >= 73) return 'C';
  if (this.numericalScore >= 70) return 'C-';
  if (this.numericalScore >= 67) return 'D+';
  if (this.numericalScore >= 63) return 'D';
  if (this.numericalScore >= 60) return 'D-';
  return 'F';
});

// Static method to find submissions by assignment
submissionSchema.statics.findByAssignment = function(assignmentId) {
  return this.find({ assignment: assignmentId }).sort({ submittedAt: -1 });
};

// Static method to find submissions by student
submissionSchema.statics.findByStudent = function(studentId) {
  return this.find({ student: studentId }).sort({ submittedAt: -1 });
};

// Static method to find late submissions
submissionSchema.statics.findLate = function() {
  return this.find({ isLate: true }).sort({ submittedAt: -1 });
};

// Static method to find ungraded submissions
submissionSchema.statics.findUngraded = function() {
  return this.find({ 
    status: { $in: ['submitted', 'under_review'] },
    grade: { $exists: false }
  }).sort({ submittedAt: 1 });
};

// Static method to find graded submissions
submissionSchema.statics.findGraded = function() {
  return this.find({ 
    status: 'graded',
    grade: { $exists: true, $ne: null }
  }).sort({ reviewedAt: -1 });
};

// Static method to find submissions by status
submissionSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ submittedAt: -1 });
};

// Static method to find submissions by grade range
submissionSchema.statics.findByGradeRange = function(minGrade, maxGrade) {
  const gradeOrder = ['F', 'D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];
  const minIndex = gradeOrder.indexOf(minGrade);
  const maxIndex = gradeOrder.indexOf(maxGrade);
  
  if (minIndex === -1 || maxIndex === -1) {
    throw new Error('Invalid grade range');
  }
  
  const validGrades = gradeOrder.slice(minIndex, maxIndex + 1);
  return this.find({ grade: { $in: validGrades } }).sort({ submittedAt: -1 });
};

// Static method to find flagged plagiarism submissions
submissionSchema.statics.findPlagiarismFlagged = function() {
  return this.find({ 'plagiarismCheck.flagged': true }).sort({ submittedAt: -1 });
};

// Instance method to add submission history entry
submissionSchema.methods.addHistoryEntry = function(action, performedBy, details = null) {
  this.submissionHistory.push({
    action,
    timestamp: new Date(),
    performedBy,
    details
  });
  
  // Keep only last 20 history entries to prevent unlimited growth
  if (this.submissionHistory.length > 20) {
    this.submissionHistory = this.submissionHistory.slice(-20);
  }
  
  return this.save();
};

// Instance method to grade submission
submissionSchema.methods.gradeSubmission = function(gradingData, reviewedBy) {
  this.grade = gradingData.grade;
  this.numericalScore = gradingData.numericalScore;
  this.criteriaScores = gradingData.criteriaScores || [];
  this.feedback = gradingData.feedback || {};
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  this.status = 'graded';
  
  this.addHistoryEntry('graded', reviewedBy, `Graded with score: ${this.numericalScore}%`);
  
  return this.save();
};

// Instance method to return submission for revision
submissionSchema.methods.returnForRevision = function(feedback, returnedBy) {
  this.status = 'returned';
  this.feedback = feedback || this.feedback;
  this.reviewedBy = returnedBy;
  this.reviewedAt = new Date();
  
  this.addHistoryEntry('returned', returnedBy, 'Returned for revision');
  
  return this.save();
};

// Instance method to mark as late
submissionSchema.methods.markAsLate = function(penalty, markedBy) {
  this.isLate = true;
  this.latePenalty = penalty || 0;
  this.status = 'late';
  
  this.addHistoryEntry('late_penalty_applied', markedBy, `Late penalty applied: ${penalty}%`);
  
  return this.save();
};

// Instance method to check plagiarism
submissionSchema.methods.checkPlagiarism = function(similarityScore, reportUrl, checkedBy) {
  this.plagiarismCheck.isChecked = true;
  this.plagiarismCheck.similarityScore = similarityScore;
  this.plagiarismCheck.flagged = similarityScore > 30; // Flag if similarity > 30%
  this.plagiarismCheck.reportUrl = reportUrl;
  this.plagiarismCheck.checkedAt = new Date();
  
  this.addHistoryEntry('plagiarism_checked', checkedBy, `Plagiarism check completed: ${similarityScore}% similarity`);
  
  return this.save();
};

// Instance method to verify submission
submissionSchema.methods.verifySubmission = function(verifiedBy, notes = null) {
  this.verification.isVerified = true;
  this.verification.verifiedBy = verifiedBy;
  this.verification.verifiedAt = new Date();
  this.verification.verificationNotes = notes;
  
  return this.save();
};

// Instance method to add file
submissionSchema.methods.addFile = function(fileName, fileUrl, fileSize, fileType) {
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
submissionSchema.methods.removeFile = function(fileUrl) {
  this.files = this.files.filter(file => file.fileUrl !== fileUrl);
  return this.save();
};

// Instance method to get submission summary
submissionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    assignment: this.assignment,
    student: this.student,
    status: this.status,
    grade: this.grade,
    numericalScore: this.numericalScore,
    calculatedScore: this.calculatedScore,
    isLate: this.isLate,
    latePenalty: this.latePenalty,
    submittedAt: this.submittedAt,
    reviewedAt: this.reviewedAt,
    reviewedBy: this.reviewedBy,
    plagiarismFlagged: this.plagiarismCheck.flagged,
    submissionAge: this.submissionAge,
    reviewTime: this.reviewTime
  };
};

// Instance method to calculate final score with late penalty
submissionSchema.methods.calculateFinalScore = function() {
  if (!this.numericalScore) return null;
  
  let finalScore = this.numericalScore;
  
  if (this.isLate && this.latePenalty > 0) {
    finalScore = finalScore * (1 - this.latePenalty / 100);
  }
  
  return Math.round(finalScore * 100) / 100;
};

module.exports = mongoose.model('Submission', submissionSchema);