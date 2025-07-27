const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String },
  code: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{2,4}\d{3,4}$/, 'Course code must be 2-4 letters followed by 3-4 numbers (e.g., CS101, MATH201)']
  },
  courseType: {
    type: String,
    enum: ['Core', 'Elective', 'Lab', 'Seminar', 'Workshop', 'Project', 'Thesis', 'Internship'],
    default: 'Core'
  },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: { 
    type: Number, 
    required: true,
    min: [1, 'Semester must be at least 1'],
    max: [12, 'Semester cannot exceed 12']
  },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { 
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  creditHours: { 
    type: Number, 
    required: true,
    min: [1, 'Credit hours must be at least 1'],
    max: [6, 'Credit hours cannot exceed 6']
  },
  year: { 
    type: Number, 
    required: true,
    min: [2020, 'Year must be 2020 or later'],
    max: [2030, 'Year cannot exceed 2030']
  },
  maxStudents: { 
    type: Number, 
    required: true,
    min: [1, 'Maximum students must be at least 1'],
    max: [200, 'Maximum students cannot exceed 200']
  },
  currentEnrollment: {
    type: Number,
    default: 0,
    min: [0, 'Current enrollment cannot be negative']
  },
  prerequisites: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    grade: { 
      type: String, 
      enum: ['A', 'B', 'C', 'D', 'Pass'],
      default: 'C'
    },
    isRequired: { type: Boolean, default: true }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived', 'draft'],
    default: 'active'
  },
  location: {
    building: {
      type: String,
      trim: true,
      maxlength: 50
    },
    room: {
      type: String,
      trim: true,
      maxlength: 20
    },
    capacity: {
      type: Number,
      min: [1, 'Room capacity must be at least 1']
    }
  },
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
    },
    type: {
      type: String,
      enum: ['Lecture', 'Lab', 'Tutorial', 'Discussion'],
      default: 'Lecture'
    }
  }],
  syllabus: {
    objectives: [{
      type: String,
      trim: true,
      maxlength: 200
    }],
    topics: [{
      week: { type: Number, min: 1, max: 16 },
      title: { type: String, trim: true, maxlength: 100 },
      description: { type: String, trim: true, maxlength: 500 }
    }],
    textbooks: [{
      title: { type: String, trim: true, maxlength: 200 },
      author: { type: String, trim: true, maxlength: 100 },
      isbn: { type: String, trim: true, maxlength: 20 },
      isRequired: { type: Boolean, default: true }
    }],
    gradingPolicy: {
      assignments: { type: Number, min: 0, max: 100, default: 30 },
      midterm: { type: Number, min: 0, max: 100, default: 30 },
      final: { type: Number, min: 0, max: 100, default: 40 },
      participation: { type: Number, min: 0, max: 100, default: 0 }
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
courseSchema.index({ program: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ faculty: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ courseType: 1 });
courseSchema.index({ semester: 1, year: 1 });
courseSchema.index({ 'location.building': 1, 'location.room': 1 });

// Middleware to always set 'name' from 'title'
courseSchema.pre('validate', function(next) {
  if (this.title) {
    this.name = this.title;
  }
  next();
});

// Pre-save middleware to ensure code is uppercase
courseSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Virtual for full course name with code
courseSchema.virtual('fullName').get(function() {
  return `${this.code} - ${this.name}`;
});

// Virtual for course availability
courseSchema.virtual('isAvailable').get(function() {
  return this.status === 'active' && this.currentEnrollment < this.maxStudents;
});

// Virtual for enrollment percentage
courseSchema.virtual('enrollmentPercentage').get(function() {
  return this.maxStudents > 0 ? Math.round((this.currentEnrollment / this.maxStudents) * 100) : 0;
});

// Virtual for available seats
courseSchema.virtual('availableSeats').get(function() {
  return Math.max(0, this.maxStudents - this.currentEnrollment);
});

// Virtual for full location
courseSchema.virtual('fullLocation').get(function() {
  if (!this.location || !this.location.building) return '';
  return this.location.room ? `${this.location.building} - ${this.location.room}` : this.location.building;
});

// Static method to find active courses
courseSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).sort({ code: 1 });
};

// Static method to find by department
courseSchema.statics.findByDepartment = function(departmentId) {
  return this.find({ department: departmentId, status: 'active' }).sort({ code: 1 });
};

// Static method to find by program
courseSchema.statics.findByProgram = function(programId) {
  return this.find({ program: programId, status: 'active' }).sort({ code: 1 });
};

// Static method to find by faculty
courseSchema.statics.findByFaculty = function(facultyId) {
  return this.find({ faculty: facultyId, status: 'active' }).sort({ code: 1 });
};

// Static method to find by course type
courseSchema.statics.findByType = function(courseType) {
  return this.find({ courseType, status: 'active' }).sort({ code: 1 });
};

// Static method to find available courses
courseSchema.statics.findAvailable = function() {
  return this.find({ 
    status: 'active',
    $expr: { $lt: ['$currentEnrollment', '$maxStudents'] }
  }).sort({ code: 1 });
};

// Static method to find courses by semester
courseSchema.statics.findBySemester = function(semester, term, year) {
  const query = { status: 'active' };
  if (semester) query.semester = semester;
  if (year) query.year = year;
  
  return this.find(query).sort({ code: 1 });
};

// Instance method to check if course can be enrolled
courseSchema.methods.canEnroll = function() {
  return this.status === 'active' && this.currentEnrollment < this.maxStudents;
};

// Instance method to increment enrollment
courseSchema.methods.incrementEnrollment = function() {
  if (this.currentEnrollment < this.maxStudents) {
    this.currentEnrollment += 1;
    return this.save();
  }
  throw new Error('Course is at maximum capacity');
};

// Instance method to decrement enrollment
courseSchema.methods.decrementEnrollment = function() {
  if (this.currentEnrollment > 0) {
    this.currentEnrollment -= 1;
    return this.save();
  }
  throw new Error('Current enrollment cannot be negative');
};

// Instance method to check prerequisites
courseSchema.methods.checkPrerequisites = async function(studentId) {
  if (!this.prerequisites || this.prerequisites.length === 0) {
    return { canEnroll: true, missingPrerequisites: [] };
  }

  // This would need to be implemented with enrollment/grade records
  // For now, returning a placeholder structure
  return {
    canEnroll: true,
    missingPrerequisites: [],
    message: 'Prerequisite checking requires enrollment system integration'
  };
};

// Instance method to activate course
courseSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

// Instance method to deactivate course
courseSchema.methods.deactivate = function() {
  this.status = 'inactive';
  return this.save();
};

// Instance method to archive course
courseSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Instance method to get schedule summary
courseSchema.methods.getScheduleSummary = function() {
  if (!this.schedule || this.schedule.length === 0) {
    return 'No schedule available';
  }
  
  return this.schedule.map(session => 
    `${session.day} ${session.startTime}-${session.endTime} (${session.type})`
  ).join(', ');
};

// Instance method to check for schedule conflicts
courseSchema.methods.hasScheduleConflict = function(otherCourse) {
  if (!this.schedule || !otherCourse.schedule) return false;
  
  for (const session1 of this.schedule) {
    for (const session2 of otherCourse.schedule) {
      if (session1.day === session2.day) {
        const start1 = session1.startTime;
        const end1 = session1.endTime;
        const start2 = session2.startTime;
        const end2 = session2.endTime;
        
        // Check for time overlap
        if (start1 < end2 && start2 < end1) {
          return true;
        }
      }
    }
  }
  return false;
};

module.exports = mongoose.model('Course', courseSchema); 