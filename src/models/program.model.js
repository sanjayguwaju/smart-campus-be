const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  level: {
    type: String,
    required: true,
    enum: ['undergraduate', 'postgraduate', 'professional'],
    trim: true
  },
  duration: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Program', programSchema); 