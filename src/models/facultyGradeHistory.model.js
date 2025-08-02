const mongoose = require('mongoose');

const facultyGradeHistorySchema = new mongoose.Schema({
  // Original grade information
  originalGradeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseGrade',
    required: true
  },
  
  // Student information
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  
  // Course information
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  courseCode: {
    type: String,
    required: true
  },
  
  // Grade details
  finalGrade: {
    type: String,
    required: true
  },
  numericalGrade: {
    type: Number,
    required: true
  },
  gradePoints: {
    type: Number,
    required: true
  },
  credits: {
    type: Number,
    required: true
  },
  
  // Academic period
  semester: {
    type: Number,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  
  // Status when deleted
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'final'],
    required: true
  },
  
  // Faculty information
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  facultyName: {
    type: String,
    required: true
  },
  
  // Operation details
  operation: {
    type: String,
    enum: ['deleted', 'bulk_deleted'],
    required: true
  },
  reason: {
    type: String,
    default: 'Semester cleanup - students have their history'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: Date.now
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
facultyGradeHistorySchema.index({ facultyId: 1, deletedAt: -1 });
facultyGradeHistorySchema.index({ courseId: 1, semester: 1, academicYear: 1 });
facultyGradeHistorySchema.index({ studentId: 1 });
facultyGradeHistorySchema.index({ operation: 1 });

// Static method to create history entry
facultyGradeHistorySchema.statics.createHistoryEntry = async function(gradeData, facultyData, operation = 'deleted', reason = 'Semester cleanup - students have their history') {
  const historyEntry = new this({
    originalGradeId: gradeData._id,
    studentId: gradeData.student._id || gradeData.student,
    studentName: `${gradeData.student.firstName || gradeData.studentName} ${gradeData.student.lastName || ''}`,
    studentId: gradeData.student.studentId || 'N/A',
    courseId: gradeData.course._id || gradeData.course,
    courseName: gradeData.course.name || gradeData.courseName,
    courseCode: gradeData.course.code || gradeData.courseCode,
    finalGrade: gradeData.finalGrade,
    numericalGrade: gradeData.numericalGrade,
    gradePoints: gradeData.gradePoints,
    credits: gradeData.credits,
    semester: gradeData.semester,
    academicYear: gradeData.academicYear,
    status: gradeData.status,
    facultyId: facultyData._id || facultyData,
    facultyName: `${facultyData.firstName || facultyData.facultyName} ${facultyData.lastName || ''}`,
    operation,
    reason,
    metadata: {
      attendance: gradeData.attendance,
      participation: gradeData.participation,
      facultyComments: gradeData.facultyComments,
      submittedAt: gradeData.submittedAt
    }
  });
  
  return await historyEntry.save();
};

// Static method to get faculty history
facultyGradeHistorySchema.statics.getFacultyHistory = async function(facultyId, filters = {}) {
  const query = { facultyId };
  
  if (filters.semester) query.semester = filters.semester;
  if (filters.academicYear) query.academicYear = filters.academicYear;
  if (filters.course) query.courseId = filters.course;
  if (filters.operation) query.operation = filters.operation;
  if (filters.status) query.status = filters.status;
  
  return await this.find(query)
    .populate('studentId', 'firstName lastName studentId email')
    .populate('courseId', 'name code creditHours')
    .sort({ deletedAt: -1 });
};

// Static method to get bulk delete statistics
facultyGradeHistorySchema.statics.getBulkDeleteStats = async function(facultyId) {
  const stats = await this.aggregate([
    { $match: { facultyId: new mongoose.Types.ObjectId(facultyId) } },
    {
      $group: {
        _id: {
          semester: '$semester',
          academicYear: '$academicYear',
          operation: '$operation'
        },
        count: { $sum: 1 },
        courses: { $addToSet: '$courseId' },
        students: { $addToSet: '$studentId' }
      }
    },
    {
      $group: {
        _id: {
          semester: '$_id.semester',
          academicYear: '$_id.academicYear'
        },
        operations: {
          $push: {
            operation: '$_id.operation',
            count: '$count',
            courses: '$courses',
            students: '$students'
          }
        },
        totalDeleted: { $sum: '$count' }
      }
    },
    { $sort: { '_id.academicYear': -1, '_id.semester': -1 } }
  ]);
  
  return stats;
};

module.exports = mongoose.model('FacultyGradeHistory', facultyGradeHistorySchema); 