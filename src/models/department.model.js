const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  code: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    uppercase: true,
    minlength: 2,
    maxlength: 10
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  headOfDepartment: {
    type: String,
    trim: true,
    maxlength: 100
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactPhone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better search performance
departmentSchema.index({ name: 'text', code: 'text', description: 'text' });

// Pre-save middleware to ensure code is uppercase
departmentSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Virtual for full department name with code
departmentSchema.virtual('fullName').get(function() {
  return this.code ? `${this.name} (${this.code})` : this.name;
});

// Static method to find active departments
departmentSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Instance method to check if department can be deleted
departmentSchema.methods.canBeDeleted = async function() {
  const Course = require('./course.model');
  const User = require('./user.model');
  
  const [coursesUsingDept, usersUsingDept] = await Promise.all([
    Course.countDocuments({ department: this._id }),
    User.countDocuments({ department: this._id })
  ]);
  
  return coursesUsingDept === 0 && usersUsingDept === 0;
};
 
module.exports = mongoose.model('Department', departmentSchema); 