const mongoose = require('mongoose');

const courseGradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
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
  semester: {
    type: Number,
    required: true,
    min: [1, 'Semester must be at least 1'],
    max: [12, 'Semester cannot exceed 12']
  },
  academicYear: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  // Final course grade
  finalGrade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'I', 'W', 'P', 'NP'],
    required: [true, 'Final grade is required']
  },
  // Numerical grade (0-100)
  numericalGrade: {
    type: Number,
    min: [0, 'Numerical grade cannot be negative'],
    max: [100, 'Numerical grade cannot exceed 100'],
    required: [true, 'Numerical grade is required']
  },
  // Grade points for GPA calculation
  gradePoints: {
    type: Number,
    min: [0, 'Grade points cannot be negative'],
    max: [4.0, 'Grade points cannot exceed 4.0'],
    required: [true, 'Grade points are required']
  },
  // Course credits
  credits: {
    type: Number,
    required: true,
    min: [1, 'Credits must be at least 1'],
    max: [6, 'Credits cannot exceed 6']
  },
  // Quality points (gradePoints * credits)
  qualityPoints: {
    type: Number,
    min: [0, 'Quality points cannot be negative']
  },
  // Grading method
  gradingMethod: {
    type: String,
    enum: ['letter', 'pass_fail', 'audit'],
    default: 'letter'
  },
  // Assignment breakdown
  assignmentGrades: [{
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment'
    },
    title: {
      type: String,
      required: true
    },
    weight: {
      type: Number,
      required: true,
      min: [0, 'Weight cannot be negative'],
      max: [100, 'Weight cannot exceed 100']
    },
    grade: {
      type: Number,
      required: true,
      min: [0, 'Grade cannot be negative'],
      max: [100, 'Grade cannot exceed 100']
    },
    maxPoints: {
      type: Number,
      required: true,
      min: [1, 'Max points must be at least 1']
    }
  }],
  // Attendance and participation
  attendance: {
    type: Number,
    min: [0, 'Attendance cannot be negative'],
    max: [100, 'Attendance cannot exceed 100']
  },
  participation: {
    type: Number,
    min: [0, 'Participation cannot be negative'],
    max: [100, 'Participation cannot exceed 100']
  },
  // Comments and feedback
  facultyComments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Faculty comments cannot exceed 1000 characters']
  },
  studentComments: {
    type: String,
    trim: true,
    maxlength: [1000, 'Student comments cannot exceed 1000 characters']
  },
  // Grade status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'disputed', 'final'],
    default: 'draft'
  },
  // Grade submission info
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  // Audit trail
  gradeHistory: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'submitted', 'approved', 'disputed', 'finalized'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    previousGrade: {
      type: String
    },
    newGrade: {
      type: String
    },
    comments: {
      type: String,
      trim: true,
      maxlength: [500, 'Comments cannot exceed 500 characters']
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
courseGradeSchema.index({ student: 1, course: 1, semester: 1, academicYear: 1 }, { unique: true });
courseGradeSchema.index({ faculty: 1, semester: 1, academicYear: 1 });
courseGradeSchema.index({ course: 1, semester: 1, academicYear: 1 });
courseGradeSchema.index({ status: 1 });
courseGradeSchema.index({ submittedAt: -1 });

// Pre-save middleware
courseGradeSchema.pre('save', function(next) {
  
  // Ensure gradePoints is set from finalGrade if not provided
  if (!this.gradePoints && this.finalGrade) {
    this.gradePoints = this.getGradePoints(this.finalGrade);
  }
  
  // Ensure gradePoints is set (default to 0 if not provided)
  if (!this.gradePoints) {
    this.gradePoints = 0;
  }
  
  // Calculate numerical grade from grade points if not provided
  if (!this.numericalGrade && this.gradePoints) {
    this.numericalGrade = this.getNumericalGrade(this.gradePoints);
  }
  
  // Ensure credits is set (default to 3 if not provided)
  if (!this.credits) {
    this.credits = 3;
  }
  
  // Calculate quality points
  this.qualityPoints = this.gradePoints * this.credits;
  
  next();
});

// Static method to get grade points from letter grade
courseGradeSchema.statics.getGradePoints = function(letterGrade) {
  const gradePointMap = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0, 'I': 0.0, 'W': 0.0,
    'P': 0.0, 'NP': 0.0
  };
  return gradePointMap[letterGrade] || 0.0;
};

// Static method to get numerical grade from grade points
courseGradeSchema.statics.getNumericalGrade = function(gradePoints) {
  if (gradePoints >= 3.7) return 95; // A
  if (gradePoints >= 3.3) return 87; // B+
  if (gradePoints >= 3.0) return 83; // B
  if (gradePoints >= 2.7) return 80; // B-
  if (gradePoints >= 2.3) return 77; // C+
  if (gradePoints >= 2.0) return 73; // C
  if (gradePoints >= 1.7) return 70; // C-
  if (gradePoints >= 1.3) return 67; // D+
  if (gradePoints >= 1.0) return 63; // D
  if (gradePoints >= 0.7) return 60; // D-
  return 0; // F
};

// Instance method to add grade history entry
courseGradeSchema.methods.addHistoryEntry = function(action, performedBy, previousGrade = null, newGrade = null, comments = null) {
  this.gradeHistory.push({
    action,
    performedBy,
    previousGrade,
    newGrade,
    comments
  });
  
  // Keep only last 20 history entries
  if (this.gradeHistory.length > 20) {
    this.gradeHistory = this.gradeHistory.slice(-20);
  }
  
  return this.save();
};

// Instance method to submit grade
courseGradeSchema.methods.submitGrade = function(submittedBy) {
  this.status = 'submitted';
  this.submittedBy = submittedBy;
  this.submittedAt = new Date();
  
  this.addHistoryEntry('submitted', submittedBy, null, this.finalGrade, 'Grade submitted');
  
  return this.save();
};

// Instance method to approve grade
courseGradeSchema.methods.approveGrade = function(approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  
  this.addHistoryEntry('approved', approvedBy, null, this.finalGrade, 'Grade approved');
  
  return this.save();
};

// Instance method to finalize grade
courseGradeSchema.methods.finalizeGrade = function(finalizedBy) {
  this.status = 'final';
  
  this.addHistoryEntry('finalized', finalizedBy, null, this.finalGrade, 'Grade finalized');
  
  return this.save();
};

// Instance method to calculate weighted grade from assignments
courseGradeSchema.methods.calculateWeightedGrade = function() {
  if (!this.assignmentGrades || this.assignmentGrades.length === 0) {
    return this.numericalGrade;
  }
  
  let totalWeightedGrade = 0;
  let totalWeight = 0;
  
  this.assignmentGrades.forEach(assignment => {
    totalWeightedGrade += (assignment.grade / assignment.maxPoints) * assignment.weight;
    totalWeight += assignment.weight;
  });
  
  // Add attendance and participation if they exist
  if (this.attendance !== undefined) {
    totalWeightedGrade += this.attendance * 0.1; // 10% weight for attendance
    totalWeight += 10;
  }
  
  if (this.participation !== undefined) {
    totalWeightedGrade += this.participation * 0.1; // 10% weight for participation
    totalWeight += 10;
  }
  
  return totalWeight > 0 ? (totalWeightedGrade / totalWeight) * 100 : 0;
};

// Virtual for grade letter from numerical grade
courseGradeSchema.virtual('calculatedLetterGrade').get(function() {
  const numerical = this.numericalGrade;
  if (numerical >= 97) return 'A+';
  if (numerical >= 93) return 'A';
  if (numerical >= 90) return 'A-';
  if (numerical >= 87) return 'B+';
  if (numerical >= 83) return 'B';
  if (numerical >= 80) return 'B-';
  if (numerical >= 77) return 'C+';
  if (numerical >= 73) return 'C';
  if (numerical >= 70) return 'C-';
  if (numerical >= 67) return 'D+';
  if (numerical >= 63) return 'D';
  if (numerical >= 60) return 'D-';
  return 'F';
});

// Virtual for is passing
courseGradeSchema.virtual('isPassing').get(function() {
  return this.gradePoints >= 1.0 || this.finalGrade === 'P';
});

// Static methods
courseGradeSchema.statics.findByStudent = function(studentId) {
  return this.find({ student: studentId })
    .populate('course', 'name code')
    .populate('faculty', 'firstName lastName')
    .sort({ semester: -1, academicYear: -1 });
};

courseGradeSchema.statics.findByFaculty = function(facultyId, semester = null, academicYear = null) {
  const query = { faculty: facultyId };
  if (semester) query.semester = semester;
  if (academicYear) query.academicYear = academicYear;
  
  return this.find(query)
    .populate('student', 'firstName lastName studentId')
    .populate('course', 'name code')
    .sort({ submittedAt: -1 });
};

courseGradeSchema.statics.findByCourse = function(courseId, semester = null, academicYear = null) {
  const query = { course: courseId };
  if (semester) query.semester = semester;
  if (academicYear) query.academicYear = academicYear;
  
  return this.find(query)
    .populate('student', 'firstName lastName studentId')
    .populate('faculty', 'firstName lastName')
    .sort({ 'student.firstName': 1 });
};

courseGradeSchema.statics.findPendingApproval = function() {
  return this.find({ status: 'submitted' })
    .populate('student', 'firstName lastName studentId')
    .populate('course', 'name code')
    .populate('faculty', 'firstName lastName')
    .sort({ submittedAt: 1 });
};

module.exports = mongoose.model('CourseGrade', courseGradeSchema); 