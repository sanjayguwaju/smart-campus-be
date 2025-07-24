const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'faculty', 'student'],
    default: 'student'
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined values
    trim: true,
    minlength: [5, 'Student ID must be at least 5 characters long'],
    maxlength: [20, 'Student ID cannot exceed 20 characters'],
    match: [/^[A-Z0-9]+$/, 'Student ID must contain only uppercase letters and numbers']
  },
  facultyId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: [5, 'Faculty ID must be at least 5 characters long'],
    maxlength: [20, 'Faculty ID cannot exceed 20 characters'],
    match: [/^[A-Z0-9]+$/, 'Faculty ID must contain only uppercase letters and numbers']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  refreshToken: {
    type: String,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  // Email verification fields
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  // Password tracking
  lastPasswordChanged: {
    type: Date,
    default: Date.now
  },
  // Date of birth
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  // Profile and address information
  profile: {
    bio: {
      type: String,
      trim: true,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
      default: 'prefer-not-to-say'
    },
    nationality: {
      type: String,
      trim: true,
      maxlength: 50
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
        maxlength: 100
      },
      relationship: {
        type: String,
        trim: true,
        maxlength: 50
      },
      phone: {
        type: String,
        trim: true,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
      }
    }
  },
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
  // Audit trail
  auditTrail: [{
    action: {
      type: String,
      required: true,
      enum: ['login', 'password_change', 'profile_update', 'email_verification', 'account_activation', 'account_deactivation']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    details: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.fullName;
});

// Virtual for age calculation
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  
  const parts = [
    this.address.street,
    this.address.city,
    this.address.state,
    this.address.postalCode,
    this.address.country
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Virtual for user identifier
userSchema.virtual('identifier').get(function() {
  if (this.role === 'student' && this.studentId) {
    return this.studentId;
  }
  if (this.role === 'faculty' && this.facultyId) {
    return this.facultyId;
  }
  return this.email;
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ department: 1 });
userSchema.index({ studentId: 1 });
userSchema.index({ facultyId: 1 });
userSchema.index({ 'profile.gender': 1 });
userSchema.index({ dateOfBirth: 1 });
userSchema.index({ lastLogin: 1 });
userSchema.index({ lastPasswordChanged: 1 });
userSchema.index({ isEmailVerified: 1 });

// Pre-save middleware to hash password and track changes
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (this.isModified('password')) {
    try {
      // Hash password with cost of 12
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      // Update last password changed timestamp
      this.lastPasswordChanged = new Date();
    } catch (error) {
      return next(error);
    }
  }
  
  // Ensure IDs are uppercase
  if (this.isModified('studentId') && this.studentId) {
    this.studentId = this.studentId.toUpperCase();
  }
  if (this.isModified('facultyId') && this.facultyId) {
    this.facultyId = this.facultyId.toUpperCase();
  }
  
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Instance method to check if user is faculty
userSchema.methods.isFaculty = function() {
  return this.role === 'faculty';
};

// Instance method to check if user is student
userSchema.methods.isStudent = function() {
  return this.role === 'student';
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Static method to find by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// Static method to find by department
userSchema.statics.findByDepartment = function(departmentId) {
  return this.find({ department: departmentId, isActive: true });
};

// Static method to find unverified users
userSchema.statics.findUnverified = function() {
  return this.find({ isEmailVerified: false, isActive: true });
};

// Static method to find users by age range
userSchema.statics.findByAgeRange = function(minAge, maxAge) {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
  
  return this.find({
    dateOfBirth: { $gte: minDate, $lte: maxDate },
    isActive: true
  });
};

// Instance method to add audit trail entry
userSchema.methods.addAuditEntry = function(action, ipAddress = null, userAgent = null, details = null) {
  this.auditTrail.push({
    action,
    timestamp: new Date(),
    ipAddress,
    userAgent,
    details
  });
  
  // Keep only last 50 audit entries to prevent unlimited growth
  if (this.auditTrail.length > 50) {
    this.auditTrail = this.auditTrail.slice(-50);
  }
  
  return this.save();
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function(ipAddress = null, userAgent = null) {
  this.lastLogin = new Date();
  this.addAuditEntry('login', ipAddress, userAgent);
  return this.save();
};

// Instance method to verify email
userSchema.methods.verifyEmail = function() {
  this.isEmailVerified = true;
  this.emailVerificationToken = null;
  this.emailVerificationExpires = null;
  this.addAuditEntry('email_verification');
  return this.save();
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return this.save();
};

// Instance method to check if email verification token is valid
userSchema.methods.isEmailVerificationTokenValid = function(token) {
  return this.emailVerificationToken === token && 
         this.emailVerificationExpires > new Date();
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  this.passwordResetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return this.save();
};

// Instance method to check if password reset token is valid
userSchema.methods.isPasswordResetTokenValid = function(token) {
  return this.passwordResetToken === token && 
         this.passwordResetExpires > new Date();
};

// Instance method to clear password reset token
userSchema.methods.clearPasswordResetToken = function() {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
  return this.save();
};

// Instance method to get recent audit entries
userSchema.methods.getRecentAuditEntries = function(limit = 10) {
  return this.auditTrail
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

module.exports = mongoose.model('User', userSchema); 