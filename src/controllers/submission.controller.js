const submissionService = require('../services/submission.service');
const { ResponseHandler } = require('../utils/responseHandler');
const logger = require('../utils/logger');

class SubmissionController {
  /**
   * Create a new submission
   */
  async createSubmission(req, res) {
    try {
      const submission = await submissionService.createSubmission(req.body, req.user._id);
      ResponseHandler.success(res, 201, 'Submission created successfully', submission);
    } catch (error) {
      logger.error('Error in createSubmission controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get submissions with filtering and pagination
   */
  async getSubmissions(req, res) {
    try {
      const result = await submissionService.getSubmissions(req.query, req.user);
      ResponseHandler.success(res, 200, 'Submissions retrieved successfully', result);
    } catch (error) {
      logger.error('Error in getSubmissions controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get submission by ID
   */
  async getSubmissionById(req, res) {
    try {
      const submission = await submissionService.getSubmissionById(req.params.id, req.user);
      ResponseHandler.success(res, 200, 'Submission retrieved successfully', submission);
    } catch (error) {
      logger.error('Error in getSubmissionById controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Update submission
   */
  async updateSubmission(req, res) {
    try {
      const submission = await submissionService.updateSubmission(req.params.id, req.body, req.user._id);
      ResponseHandler.success(res, 200, 'Submission updated successfully', submission);
    } catch (error) {
      logger.error('Error in updateSubmission controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Delete submission
   */
  async deleteSubmission(req, res) {
    try {
      const result = await submissionService.deleteSubmission(req.params.id, req.user._id);
      ResponseHandler.success(res, 200, 'Submission deleted successfully', result);
    } catch (error) {
      logger.error('Error in deleteSubmission controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Add file to submission
   */
  async addFileToSubmission(req, res) {
    try {
      const submission = await submissionService.addFileToSubmission(req.params.id, req.body, req.user._id);
      ResponseHandler.success(res, 200, 'File added to submission successfully', submission);
    } catch (error) {
      logger.error('Error in addFileToSubmission controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Remove file from submission
   */
  async removeFileFromSubmission(req, res) {
    try {
      const submission = await submissionService.removeFileFromSubmission(req.params.id, req.body.fileUrl, req.user._id);
      ResponseHandler.success(res, 200, 'File removed from submission successfully', submission);
    } catch (error) {
      logger.error('Error in removeFileFromSubmission controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Grade submission
   */
  async gradeSubmission(req, res) {
    try {
      const submission = await submissionService.gradeSubmission(req.params.id, req.body, req.user._id);
      ResponseHandler.success(res, 200, 'Submission graded successfully', submission);
    } catch (error) {
      logger.error('Error in gradeSubmission controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Return submission for revision
   */
  async returnSubmissionForRevision(req, res) {
    try {
      const submission = await submissionService.returnSubmissionForRevision(req.params.id, req.body.feedback, req.user._id);
      ResponseHandler.success(res, 200, 'Submission returned for revision successfully', submission);
    } catch (error) {
      logger.error('Error in returnSubmissionForRevision controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Mark submission as late
   */
  async markSubmissionAsLate(req, res) {
    try {
      const submission = await submissionService.markSubmissionAsLate(req.params.id, req.body.penalty, req.user._id);
      ResponseHandler.success(res, 200, 'Submission marked as late successfully', submission);
    } catch (error) {
      logger.error('Error in markSubmissionAsLate controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Check plagiarism
   */
  async checkPlagiarism(req, res) {
    try {
      const submission = await submissionService.checkPlagiarism(req.params.id, req.body, req.user._id);
      ResponseHandler.success(res, 200, 'Plagiarism check completed successfully', submission);
    } catch (error) {
      logger.error('Error in checkPlagiarism controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Verify submission
   */
  async verifySubmission(req, res) {
    try {
      const submission = await submissionService.verifySubmission(req.params.id, req.body.notes, req.user._id);
      ResponseHandler.success(res, 200, 'Submission verified successfully', submission);
    } catch (error) {
      logger.error('Error in verifySubmission controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get submissions by assignment
   */
  async getSubmissionsByAssignment(req, res) {
    try {
      const submissions = await submissionService.getSubmissionsByAssignment(req.params.assignmentId, req.user);
      ResponseHandler.success(res, 200, 'Assignment submissions retrieved successfully', submissions);
    } catch (error) {
      logger.error('Error in getSubmissionsByAssignment controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get submissions by student
   */
  async getSubmissionsByStudent(req, res) {
    try {
      const submissions = await submissionService.getSubmissionsByStudent(req.params.studentId, req.user);
      ResponseHandler.success(res, 200, 'Student submissions retrieved successfully', submissions);
    } catch (error) {
      logger.error('Error in getSubmissionsByStudent controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get submission statistics
   */
  async getSubmissionStats(req, res) {
    try {
      const stats = await submissionService.getSubmissionStats(req.user);
      ResponseHandler.success(res, 200, 'Submission statistics retrieved successfully', stats);
    } catch (error) {
      logger.error('Error in getSubmissionStats controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Bulk operations on submissions
   */
  async bulkOperation(req, res) {
    try {
      const result = await submissionService.bulkOperation(req.body, req.user._id);
      ResponseHandler.success(res, 200, 'Bulk operation completed successfully', result);
    } catch (error) {
      logger.error('Error in bulkOperation controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get late submissions
   */
  async getLateSubmissions(req, res) {
    try {
      const submissions = await submissionService.getLateSubmissions(req.user);
      ResponseHandler.success(res, 200, 'Late submissions retrieved successfully', submissions);
    } catch (error) {
      logger.error('Error in getLateSubmissions controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get ungraded submissions
   */
  async getUngradedSubmissions(req, res) {
    try {
      const submissions = await submissionService.getUngradedSubmissions(req.user);
      ResponseHandler.success(res, 200, 'Ungraded submissions retrieved successfully', submissions);
    } catch (error) {
      logger.error('Error in getUngradedSubmissions controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get plagiarism flagged submissions
   */
  async getPlagiarismFlaggedSubmissions(req, res) {
    try {
      const submissions = await submissionService.getPlagiarismFlaggedSubmissions(req.user);
      ResponseHandler.success(res, 200, 'Plagiarism flagged submissions retrieved successfully', submissions);
    } catch (error) {
      logger.error('Error in getPlagiarismFlaggedSubmissions controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get my submissions (for students)
   */
  async getMySubmissions(req, res) {
    try {
      const result = await submissionService.getSubmissions(req.query, req.user);
      ResponseHandler.success(res, 200, 'My submissions retrieved successfully', result);
    } catch (error) {
      logger.error('Error in getMySubmissions controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get my graded submissions (for students)
   */
  async getMyGradedSubmissions(req, res) {
    try {
      const query = { ...req.query, status: 'graded' };
      const result = await submissionService.getSubmissions(query, req.user);
      ResponseHandler.success(res, 200, 'My graded submissions retrieved successfully', result);
    } catch (error) {
      logger.error('Error in getMyGradedSubmissions controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get my late submissions (for students)
   */
  async getMyLateSubmissions(req, res) {
    try {
      const query = { ...req.query, isLate: true };
      const result = await submissionService.getSubmissions(query, req.user);
      ResponseHandler.success(res, 200, 'My late submissions retrieved successfully', result);
    } catch (error) {
      logger.error('Error in getMyLateSubmissions controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Search submissions
   */
  async searchSubmissions(req, res) {
    try {
      const result = await submissionService.getSubmissions(req.query, req.user);
      ResponseHandler.success(res, 200, 'Submissions search completed successfully', result);
    } catch (error) {
      logger.error('Error in searchSubmissions controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get submissions by status
   */
  async getSubmissionsByStatus(req, res) {
    try {
      const query = { ...req.query, status: req.params.status };
      const result = await submissionService.getSubmissions(query, req.user);
      ResponseHandler.success(res, 200, `Submissions with status ${req.params.status} retrieved successfully`, result);
    } catch (error) {
      logger.error('Error in getSubmissionsByStatus controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get submissions by grade
   */
  async getSubmissionsByGrade(req, res) {
    try {
      const query = { ...req.query, grade: req.params.grade };
      const result = await submissionService.getSubmissions(query, req.user);
      ResponseHandler.success(res, 200, `Submissions with grade ${req.params.grade} retrieved successfully`, result);
    } catch (error) {
      logger.error('Error in getSubmissionsByGrade controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get submission history
   */
  async getSubmissionHistory(req, res) {
    try {
      const submission = await submissionService.getSubmissionById(req.params.id, req.user);
      ResponseHandler.success(res, 200, 'Submission history retrieved successfully', submission.submissionHistory);
    } catch (error) {
      logger.error('Error in getSubmissionHistory controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Get submission summary
   */
  async getSubmissionSummary(req, res) {
    try {
      const submission = await submissionService.getSubmissionById(req.params.id, req.user);
      const summary = submission.getSummary();
      ResponseHandler.success(res, 200, 'Submission summary retrieved successfully', summary);
    } catch (error) {
      logger.error('Error in getSubmissionSummary controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
  
  /**
   * Calculate final score
   */
  async calculateFinalScore(req, res) {
    try {
      const submission = await submissionService.getSubmissionById(req.params.id, req.user);
      const finalScore = submission.calculateFinalScore();
      ResponseHandler.success(res, 200, 'Final score calculated successfully', { finalScore });
    } catch (error) {
      logger.error('Error in calculateFinalScore controller:', error);
      ResponseHandler.error(res, error.status || 500, error.message);
    }
  }
}

module.exports = new SubmissionController(); 