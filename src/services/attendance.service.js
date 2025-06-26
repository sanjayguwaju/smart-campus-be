const Attendance = require('../models/attendance.model');
const User = require('../models/user.model');
const Course = require('../models/course.model');

class AttendanceService {
  // Mark attendance for a single student on a date
  async markAttendance({ courseId, studentId, date, status, markedBy }) {
    try {
      const attendance = await Attendance.findOneAndUpdate(
        { course: courseId, student: studentId, date },
        { status, markedBy },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return attendance;
    } catch (error) {
      throw error;
    }
  }

  // Bulk mark attendance for multiple students on a date
  async bulkMarkAttendance({ courseId, date, records, markedBy }) {
    const results = [];
    for (const rec of records) {
      const att = await this.markAttendance({
        courseId,
        studentId: rec.studentId,
        date,
        status: rec.status,
        markedBy
      });
      results.push(att);
    }
    return results;
  }

  // Get attendance records for a student in a course
  async getStudentAttendance({ courseId, studentId }) {
    return Attendance.find({ course: courseId, student: studentId }).sort({ date: 1 });
  }

  // Get attendance records for a course on a date
  async getCourseAttendance({ courseId, date }) {
    return Attendance.find({ course: courseId, date }).populate('student', 'firstName lastName email');
  }

  // Get monthly attendance percentage for a student in a course
  async getMonthlyPercentage({ courseId, studentId, month, year }) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const records = await Attendance.find({
      course: courseId,
      student: studentId,
      date: { $gte: start, $lte: end }
    });
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }
}

module.exports = new AttendanceService(); 