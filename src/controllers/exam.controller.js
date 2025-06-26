const examService = require('../services/exam.service');
const ResponseHandler = require('../utils/responseHandler');

class ExamController {
  async createExam(req, res) {
    try {
      const data = { ...req.body, createdBy: req.user._id };
      const exam = await examService.createExam(data);
      return ResponseHandler.success(res, 201, 'Exam created', exam);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  async updateExam(req, res) {
    try {
      const { examId } = req.params;
      const exam = await examService.updateExam(examId, req.body);
      return ResponseHandler.success(res, 200, 'Exam updated', exam);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  async deleteExam(req, res) {
    try {
      const { examId } = req.params;
      await examService.deleteExam(examId);
      return ResponseHandler.success(res, 200, 'Exam deleted');
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  async setStudentResult(req, res) {
    try {
      const { examId, studentId, marks, grade, remarks } = req.body;
      const exam = await examService.setStudentResult({ examId, studentId, marks, grade, remarks });
      return ResponseHandler.success(res, 200, 'Result updated', exam);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  async getCourseExams(req, res) {
    try {
      const { courseId } = req.query;
      const exams = await examService.getCourseExams(courseId);
      return ResponseHandler.success(res, 200, 'Course exams fetched', exams);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  async getStudentExamTimetable(req, res) {
    try {
      const studentId = req.user._id;
      const exams = await examService.getStudentExamTimetable(studentId);
      return ResponseHandler.success(res, 200, 'Student exam timetable fetched', exams);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  async getStudentResults(req, res) {
    try {
      const studentId = req.user._id;
      const results = await examService.getStudentResults(studentId);
      return ResponseHandler.success(res, 200, 'Student results fetched', results);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }

  async getStudentGPA(req, res) {
    try {
      const studentId = req.user._id;
      const gpa = await examService.getStudentGPA(studentId);
      return ResponseHandler.success(res, 200, 'Student GPA/percentage', gpa);
    } catch (error) {
      return ResponseHandler.error(res, 400, error.message);
    }
  }
}

module.exports = new ExamController(); 