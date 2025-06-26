const Feedback = require('../models/feedback.model');

class FeedbackService {
  // Submit feedback (anonymous or with user)
  async submitFeedback({ type, category, content, submittedBy, isAnonymous }) {
    const feedback = new Feedback({
      type,
      category,
      content,
      submittedBy: isAnonymous ? null : submittedBy,
      isAnonymous: !!isAnonymous
    });
    await feedback.save();
    return feedback;
  }

  // Get all feedback (admin)
  async getAllFeedback() {
    return Feedback.find().sort({ createdAt: -1 }).populate('submittedBy', 'firstName lastName email role');
  }

  // Get feedback submitted by a user
  async getUserFeedback(userId) {
    return Feedback.find({ submittedBy: userId }).sort({ createdAt: -1 });
  }

  // Admin reply to feedback
  async replyToFeedback(feedbackId, reply) {
    const feedback = await Feedback.findByIdAndUpdate(feedbackId, { adminReply: reply, status: 'resolved' }, { new: true });
    if (!feedback) throw new Error('Feedback not found');
    return feedback;
  }

  // Update feedback status (admin)
  async updateStatus(feedbackId, status) {
    const feedback = await Feedback.findByIdAndUpdate(feedbackId, { status }, { new: true });
    if (!feedback) throw new Error('Feedback not found');
    return feedback;
  }
}

module.exports = new FeedbackService(); 