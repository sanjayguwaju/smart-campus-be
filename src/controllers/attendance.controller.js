const attendanceService = require('../services/attendance.service');
const ResponseHandler = require('../utils/responseHandler');

class AttendanceController {
  // Mark attendance for a single student
  async markAttendance(req, res) {
    try {
      const { courseId, studentId, date, status } = req.body;
      const markedBy = req.user._id;
      const attendance = await attendanceService.markAttendance({ courseId, studentId, date, status, markedBy });
      return ResponseHandler.success(res, 200, 'Attendance marked', attendance);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  // Bulk mark attendance
  async bulkMarkAttendance(req, res) {
    try {
      const { courseId, date, records } = req.body; // records: [{ studentId, status }]
      const markedBy = req.user._id;
      const result = await attendanceService.bulkMarkAttendance({ courseId, date, records, markedBy });
      return ResponseHandler.success(res, 200, 'Bulk attendance marked', result);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  // Get student attendance for a course
  async getStudentAttendance(req, res) {
    try {
      const { courseId, studentId } = req.query;
      const records = await attendanceService.getStudentAttendance({ courseId, studentId });
      return ResponseHandler.success(res, 200, 'Attendance records fetched', records);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  // Get course attendance for a date
  async getCourseAttendance(req, res) {
    try {
      const { courseId, date } = req.query;
      const records = await attendanceService.getCourseAttendance({ courseId, date });
      return ResponseHandler.success(res, 200, 'Course attendance fetched', records);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  // Get monthly attendance percentage for a student
  async getMonthlyPercentage(req, res) {
    try {
      const { courseId, studentId, month, year } = req.query;
      const percent = await attendanceService.getMonthlyPercentage({ courseId, studentId, month, year });
      return ResponseHandler.success(res, 200, 'Monthly attendance percentage', { percent });
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }
}

module.exports = new AttendanceController(); 