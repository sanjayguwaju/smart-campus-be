const ProgramApplication = require('../models/programApplication.model');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');

class ProgramApplicationController {
  // Student applies to a program
  async applyToProgram(req, res) {
    try {
      const { program, studentId, idCardUrl } = req.body;
      // Prevent duplicate applications by studentId and program
      const existing = await ProgramApplication.findOne({ studentId, program, status: { $in: ['pending', 'approved'] } });
      if (existing) {
        return ResponseHandler.error(res, 400, 'You have already applied or been approved for this program.');
      }
      const student = req.user._id;
      const application = await ProgramApplication.create({
        student,
        program,
        studentId,
        idCardUrl,
        status: 'pending',
        appliedAt: new Date()
      });
      return ResponseHandler.success(res, 201, 'Application submitted', application);
    } catch (error) {
      logger.error('Apply to program error:', error);
      return ResponseHandler.error(res, 500, 'Failed to submit application');
    }
  }

  // Admin lists all applications
  async listApplications(req, res) {
    try {
      const { status, program, student } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (program) filter.program = program;
      if (student) filter.student = student;
      const applications = await ProgramApplication.find(filter)
        .populate('student', 'firstName lastName email studentId')
        .populate('program', 'name department');
      return ResponseHandler.success(res, 200, 'Applications retrieved', applications);
    } catch (error) {
      logger.error('List applications error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve applications');
    }
  }

  // Admin approves an application
  async approveApplication(req, res) {
    try {
      const { id } = req.params;
      const admin = req.user._id;
      const application = await ProgramApplication.findById(id);
      if (!application) return ResponseHandler.notFound(res, 'Application not found');
      if (application.status !== 'pending') return ResponseHandler.error(res, 400, 'Application already processed');
      application.status = 'approved';
      application.reviewedAt = new Date();
      application.reviewedBy = admin;
      await application.save();
      return ResponseHandler.success(res, 200, 'Application approved', application);
    } catch (error) {
      logger.error('Approve application error:', error);
      return ResponseHandler.error(res, 500, 'Failed to approve application');
    }
  }

  // Admin rejects an application
  async rejectApplication(req, res) {
    try {
      const { id } = req.params;
      const { reason, studentId } = req.body;
      const admin = req.user._id;
      const application = await ProgramApplication.findByIdAndUpdate(
        id,
        {
          status: 'rejected',
          reviewedAt: new Date(),
          reviewedBy: admin,
          reason,
          ...(studentId && { studentId }),
        },
        { new: true, runValidators: false }
      );
      if (!application) return ResponseHandler.notFound(res, 'Application not found');
      return ResponseHandler.success(res, 200, 'Application rejected', application);
    } catch (error) {
      logger.error('Reject application error:', error);
      return ResponseHandler.error(res, 500, 'Failed to reject application');
    }
  }
}

module.exports = new ProgramApplicationController(); 