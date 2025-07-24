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
    default: '',
    maxlength: 10
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  headOfDepartment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
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
    maxlength: 20,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  // Structured address fields
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      trim: true,
      maxlength: 100
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'Nepal'
    }
  },
  logo: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  isActive: {
    type: Boolean,
    default: false
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

// Index for better search performance
departmentSchema.index({ name: 'text', code: 'text', description: 'text' });
departmentSchema.index({ status: 1 });
departmentSchema.index({ headOfDepartment: 1 });
departmentSchema.index({ isActive: 1 });

// Pre-save middleware to ensure code is uppercase
departmentSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Pre-remove middleware to prevent deletion if department is in use
departmentSchema.pre('remove', async function(next) {
  const canBeDeleted = await this.canBeDeleted();
  if (!canBeDeleted) {
    const error = new Error('Cannot delete department: It is being used by courses or users');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Virtual for full department name with code
departmentSchema.virtual('fullName').get(function() {
  return this.code ? `${this.name} (${this.code})` : this.name;
});

// Virtual for full address
departmentSchema.virtual('fullAddress').get(function() {
  if (!this.address) return this.location || '';
  
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.postalCode,
    this.address.country
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Static method to find active departments
departmentSchema.statics.findActive = function() {
  return this.find({ status: 'active', isActive: true }).sort({ name: 1 });
};

// Static method to find by status
departmentSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ name: 1 });
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

// Instance method to archive department
departmentSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Instance method to activate department
departmentSchema.methods.activate = function() {
  this.status = 'active';
  return this.save();
};

// Instance method to deactivate department
departmentSchema.methods.deactivate = function() {
  this.status = 'inactive';
  return this.save();
};
 
module.exports = mongoose.model('Department', departmentSchema); 