const feedbackService = require('../services/feedback.service');
const ResponseHandler = require('../utils/responseHandler');

class FeedbackController {
  // Submit feedback
  async submitFeedback(req, res) {
    try {
      const { type, category, content, isAnonymous } = req.body;
      const submittedBy = req.user ? req.user._id : null;
      const feedback = await feedbackService.submitFeedback({ type, category, content, submittedBy, isAnonymous });
      return ResponseHandler.success(res, 201, 'Feedback submitted', feedback);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  // Get all feedback (admin)
  async getAllFeedback(req, res) {
    try {
      const feedback = await feedbackService.getAllFeedback();
      return ResponseHandler.success(res, 200, 'All feedback fetched', feedback);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  // Get feedback by user
  async getUserFeedback(req, res) {
    try {
      const userId = req.user._id;
      const feedback = await feedbackService.getUserFeedback(userId);
      return ResponseHandler.success(res, 200, 'User feedback fetched', feedback);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  // Admin reply to feedback
  async replyToFeedback(req, res) {
    try {
      const { feedbackId } = req.params;
      const { reply } = req.body;
      const feedback = await feedbackService.replyToFeedback(feedbackId, reply);
      return ResponseHandler.success(res, 200, 'Replied to feedback', feedback);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  // Update feedback status (admin)
  async updateStatus(req, res) {
    try {
      const { feedbackId } = req.params;
      const { status } = req.body;
      const feedback = await feedbackService.updateStatus(feedbackId, status);
      return ResponseHandler.success(res, 200, 'Feedback status updated', feedback);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }
}

module.exports = new FeedbackController(); 