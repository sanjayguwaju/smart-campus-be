const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Department', 
    required: true 
  },
  level: { 
    type: String, 
    enum: ['Certificate', 'Diploma', 'Undergraduate', 'Postgraduate', 'Doctorate'],
    required: true 
  },
  duration: { 
    type: String, 
    required: true 
  },
  semesters: { 
    type: Number, 
    required: true 
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  prerequisites: [{
    type: String,
    trim: true,
    maxlength: 100
  }],
  image: {
    type: String,
    trim: true
  },
  brochureUrl: {
    type: String,
    trim: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Program', programSchema); 