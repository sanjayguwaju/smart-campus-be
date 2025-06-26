const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['feedback', 'complaint', 'suggestion', 'other'],
    default: 'feedback',
    required: true
  },
  category: {
    type: String,
    enum: ['academic', 'facilities', 'harassment', 'other'],
    default: 'other',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'viewed', 'resolved'],
    default: 'pending'
  },
  adminReply: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Feedback', feedbackSchema); 