const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  program: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Program', 
    required: true 
  },
  semester: { 
    type: Number, 
    required: true,
    min: 1,
    max: 12
  },
  semesterTerm: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer', 'Winter'],
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  courses: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course' 
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'suspended', 'graduated'],
    default: 'active'
  },
  enrollmentType: {
    type: String,
    enum: ['full_time', 'part_time', 'audit', 'transfer'],
    default: 'full_time'
  },
  totalCredits: {
    type: Number,
    default: 0,
    min: 0,
    max: 30
  },
  gpa: {
    type: Number,
    default: 0.0,
    min: 0.0,
    max: 4.0
  },
  cgpa: {
    type: Number,
    default: 0.0,
    min: 0.0,
    max: 4.0
  },
  academicStanding: {
    type: String,
    enum: ['good_standing', 'academic_warning', 'academic_probation', 'academic_suspension'],
    default: 'good_standing'
  },
  financialStatus: {
    type: String,
    enum: ['paid', 'partial', 'unpaid', 'scholarship'],
    default: 'unpaid'
  },
  scholarship: {
    type: {
      type: String,
      enum: ['merit', 'need_based', 'athletic', 'academic', 'other'],
      default: 'merit'
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    description: {
      type: String,
      maxlength: 500
    }
  },
  advisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  documents: [{
    type: {
      type: String,
      enum: ['transcript', 'id_card', 'medical_form', 'financial_aid', 'other'],
      required: true
    },
    fileName: {
      type: String,
      required: true,
      maxlength: 255
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      min: 0
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  auditTrail: [{
    action: {
      type: String,
      enum: ['enrolled', 'course_added', 'course_dropped', 'status_changed', 'gpa_updated', 'document_uploaded'],
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
    details: {
      type: String,
      maxlength: 500
    }
  }],
  enrolledAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: {
    type: Date
  },
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

// Indexes for better performance
enrollmentSchema.index({ student: 1, program: 1 });
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ program: 1, semester: 1 });
enrollmentSchema.index({ program: 1, academicYear: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentType: 1 });
enrollmentSchema.index({ academicStanding: 1 });
enrollmentSchema.index({ financialStatus: 1 });
enrollmentSchema.index({ advisor: 1 });
enrollmentSchema.index({ enrolledAt: 1 });
enrollmentSchema.index({ 'auditTrail.timestamp': -1 });

// Compound indexes
enrollmentSchema.index({ student: 1, program: 1, semester: 1, academicYear: 1 }, { unique: true });
enrollmentSchema.index({ program: 1, semester: 1, semesterTerm: 1, academicYear: 1 });

// Pre-save middleware
enrollmentSchema.pre('save', function(next) {
  // Set lastModifiedBy if not set
  if (this.isModified() && !this.lastModifiedBy) {
    this.lastModifiedBy = this.createdBy;
  }
  
  // Validate academic year format
  if (this.academicYear && !/^\d{4}-\d{4}$/.test(this.academicYear)) {
    const error = new Error('Academic year must be in format YYYY-YYYY');
    error.name = 'ValidationError';
    return next(error);
  }
  
  next();
});

// Virtual for enrollment duration
enrollmentSchema.virtual('enrollmentDuration').get(function() {
  if (!this.enrolledAt) return 0;
  const endDate = this.completedAt || new Date();
  return Math.floor((endDate - this.enrolledAt) / (1000 * 60 * 60 * 24 * 365.25));
});

// Virtual for current semester
enrollmentSchema.virtual('currentSemester').get(function() {
  return `${this.semester}${this.semesterTerm ? ' - ' + this.semesterTerm : ''}`;
});

// Virtual for full academic period
enrollmentSchema.virtual('academicPeriod').get(function() {
  return `${this.academicYear} - ${this.currentSemester}`;
});

// Virtual for enrollment status summary
enrollmentSchema.virtual('statusSummary').get(function() {
  return {
    isActive: this.status === 'active',
    isCompleted: this.status === 'completed',
    isGraduated: this.status === 'graduated',
    isSuspended: this.status === 'suspended',
    isDropped: this.status === 'dropped'
  };
});

// Virtual for document count by type
enrollmentSchema.virtual('documentCounts').get(function() {
  const counts = {};
  this.documents.forEach(doc => {
    counts[doc.type] = (counts[doc.type] || 0) + 1;
  });
  return counts;
});

// Static methods
enrollmentSchema.statics.findByStudent = function(studentId) {
  return this.find({ student: studentId }).populate('program courses advisor');
};

enrollmentSchema.statics.findByProgram = function(programId) {
  return this.find({ program: programId }).populate('student courses advisor');
};

enrollmentSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).populate('student program courses advisor');
};

enrollmentSchema.statics.findBySemester = function(semester, academicYear) {
  const query = { semester };
  if (academicYear) query.academicYear = academicYear;
  return this.find(query).populate('student program courses advisor');
};

enrollmentSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('student program courses advisor');
};

enrollmentSchema.statics.findByAcademicStanding = function(standing) {
  return this.find({ academicStanding: standing }).populate('student program courses advisor');
};

enrollmentSchema.statics.findByFinancialStatus = function(financialStatus) {
  return this.find({ financialStatus }).populate('student program courses advisor');
};

enrollmentSchema.statics.findByAdvisor = function(advisorId) {
  return this.find({ advisor: advisorId }).populate('student program courses advisor');
};

enrollmentSchema.statics.findOverdueDocuments = function() {
  return this.find({
    'documents': { $exists: true, $ne: [] },
    status: 'active'
  }).populate('student program');
};

// Instance methods
enrollmentSchema.methods.addAuditEntry = function(action, performedBy, details = '') {
  this.auditTrail.push({
    action,
    performedBy,
    details
  });
  return this.save();
};

enrollmentSchema.methods.addCourse = function(courseId, performedBy) {
  if (!this.courses.includes(courseId)) {
    this.courses.push(courseId);
    this.addAuditEntry('course_added', performedBy, `Course ${courseId} added`);
  }
  return this.save();
};

enrollmentSchema.methods.removeCourse = function(courseId, performedBy) {
  const index = this.courses.indexOf(courseId);
  if (index > -1) {
    this.courses.splice(index, 1);
    this.addAuditEntry('course_dropped', performedBy, `Course ${courseId} removed`);
  }
  return this.save();
};

enrollmentSchema.methods.updateStatus = function(newStatus, performedBy, details = '') {
  this.status = newStatus;
  if (newStatus === 'completed' || newStatus === 'graduated') {
    this.completedAt = new Date();
  }
  this.addAuditEntry('status_changed', performedBy, `Status changed to ${newStatus}. ${details}`);
  return this.save();
};

enrollmentSchema.methods.updateGPA = function(newGPA, performedBy) {
  this.gpa = newGPA;
  this.addAuditEntry('gpa_updated', performedBy, `GPA updated to ${newGPA}`);
  return this.save();
};

enrollmentSchema.methods.addDocument = function(documentData, performedBy) {
  this.documents.push({
    ...documentData,
    uploadedAt: new Date()
  });
  this.addAuditEntry('document_uploaded', performedBy, `Document ${documentData.fileName} uploaded`);
  return this.save();
};

enrollmentSchema.methods.removeDocument = function(documentId, performedBy) {
  const index = this.documents.findIndex(doc => doc._id.toString() === documentId);
  if (index > -1) {
    const fileName = this.documents[index].fileName;
    this.documents.splice(index, 1);
    this.addAuditEntry('document_uploaded', performedBy, `Document ${fileName} removed`);
  }
  return this.save();
};

enrollmentSchema.methods.getSummary = function() {
  return {
    id: this._id,
    student: this.student,
    program: this.program,
    semester: this.semester,
    semesterTerm: this.semesterTerm,
    academicYear: this.academicYear,
    status: this.status,
    enrollmentType: this.enrollmentType,
    totalCredits: this.totalCredits,
    gpa: this.gpa,
    cgpa: this.cgpa,
    academicStanding: this.academicStanding,
    financialStatus: this.financialStatus,
    courseCount: this.courses.length,
    documentCount: this.documents.length,
    enrolledAt: this.enrolledAt,
    enrollmentDuration: this.enrollmentDuration,
    currentSemester: this.currentSemester,
    academicPeriod: this.academicPeriod
  };
};

enrollmentSchema.methods.canEnrollInCourse = function(courseId) {
  // Check if student is active and not at course limit
  if (this.status !== 'active') return false;
  
  // Check if course is already enrolled
  if (this.courses.includes(courseId)) return false;
  
  // Add more business logic as needed
  return true;
};

enrollmentSchema.methods.calculateTotalCredits = async function() {
  const Course = require('./course.model');
  let totalCredits = 0;
  
  for (const courseId of this.courses) {
    const course = await Course.findById(courseId);
    if (course) {
      totalCredits += course.creditHours || 0;
    }
  }
  
  this.totalCredits = totalCredits;
  return this.save();
};

module.exports = mongoose.model('Enrollment', enrollmentSchema); 