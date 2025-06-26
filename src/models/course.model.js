const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [100, 'Course title cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Course code cannot exceed 20 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    maxlength: [1000, 'Course description cannot exceed 1000 characters']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Course instructor is required'],
    validate: {
      validator: async function(instructorId) {
        const User = mongoose.model('User');
        const user = await User.findById(instructorId);
        return user && user.role === 'faculty';
      },
      message: 'Instructor must be a faculty member'
    }
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(studentId) {
        const User = mongoose.model('User');
        const user = await User.findById(studentId);
        return user && user.role === 'student';
      },
      message: 'Students must have student role'
    }
  }],
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  credits: {
    type: Number,
    required: [true, 'Course credits are required'],
    min: [1, 'Course must have at least 1 credit'],
    max: [6, 'Course cannot have more than 6 credits']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['Fall', 'Spring', 'Summer', 'Winter']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later'],
    max: [2030, 'Year cannot be more than 2030']
  },
  maxStudents: {
    type: Number,
    required: [true, 'Maximum number of students is required'],
    min: [1, 'Course must allow at least 1 student'],
    max: [200, 'Course cannot have more than 200 students']
  },
  currentStudents: {
    type: Number,
    default: 0,
    min: [0, 'Current students cannot be negative']
  },
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    startTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
    },
    room: {
      type: String,
      trim: true
    }
  },
  materials: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'video', 'image', 'other']
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assignments: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    totalPoints: {
      type: Number,
      required: true,
      min: [1, 'Assignment must have at least 1 point']
    },
    submissions: [{
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      submittedAt: {
        type: Date,
        default: Date.now
      },
      fileUrl: {
        type: String,
        required: true
      },
      grade: {
        type: Number,
        min: [0, 'Grade cannot be negative'],
        max: [100, 'Grade cannot exceed 100']
      },
      feedback: {
        type: String,
        trim: true
      }
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for course availability
courseSchema.virtual('isAvailable').get(function() {
  return this.currentStudents < this.maxStudents && this.isActive && this.isPublished;
});

// Virtual for enrollment percentage
courseSchema.virtual('enrollmentPercentage').get(function() {
  return Math.round((this.currentStudents / this.maxStudents) * 100);
});

// Virtual for course duration
courseSchema.virtual('duration').get(function() {
  if (this.schedule.startTime && this.schedule.endTime) {
    const start = new Date(`2000-01-01T${this.schedule.startTime}:00`);
    const end = new Date(`2000-01-01T${this.schedule.endTime}:00`);
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  }
  return null;
});

// Indexes for better query performance
courseSchema.index({ code: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ semester: 1, year: 1 });
courseSchema.index({ isActive: 1, isPublished: 1 });
courseSchema.index({ students: 1 });

// Pre-save middleware to update current students count
courseSchema.pre('save', function(next) {
  if (this.isModified('students')) {
    this.currentStudents = this.students.length;
  }
  next();
});

// Instance method to add student
courseSchema.methods.addStudent = async function(studentId) {
  if (this.currentStudents >= this.maxStudents) {
    throw new Error('Course is full');
  }
  
  if (this.students.includes(studentId)) {
    throw new Error('Student is already enrolled');
  }
  
  this.students.push(studentId);
  this.currentStudents = this.students.length;
  return this.save();
};

// Instance method to remove student
courseSchema.methods.removeStudent = async function(studentId) {
  const index = this.students.indexOf(studentId);
  if (index === -1) {
    throw new Error('Student is not enrolled in this course');
  }
  
  this.students.splice(index, 1);
  this.currentStudents = this.students.length;
  return this.save();
};

// Instance method to check if student is enrolled
courseSchema.methods.isStudentEnrolled = function(studentId) {
  return this.students.includes(studentId);
};

// Static method to find available courses
courseSchema.statics.findAvailable = function() {
  return this.find({
    isActive: true,
    isPublished: true,
    $expr: { $lt: ['$currentStudents', '$maxStudents'] }
  });
};

// Static method to find courses by instructor
courseSchema.statics.findByInstructor = function(instructorId) {
  return this.find({ instructor: instructorId, isActive: true });
};

// Static method to find courses by department
courseSchema.statics.findByDepartment = function(department) {
  return this.find({ department, isActive: true, isPublished: true });
};

module.exports = mongoose.model('Course', courseSchema); 