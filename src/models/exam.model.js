const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['midterm', 'final', 'quiz', 'practical', 'other'],
    default: 'other'
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  results: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    marks: {
      type: Number,
      required: true
    },
    grade: {
      type: String,
      trim: true
    },
    remarks: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

examSchema.index({ course: 1, date: 1 });

module.exports = mongoose.model('Exam', examSchema); 