const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/user.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');
const Program = require('../models/program.model');
const Department = require('../models/department.model');
const courseController = require('../controllers/course.controller');
const { ResponseHandler } = require('../utils/responseHandler');

let mongoServer;
let studentId;
let courseIds = [];

describe('Student Courses API', () => {
  // Database connection is handled by setup.js

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Program.deleteMany({});
    await Department.deleteMany({});

    // Create test data
    const department = await Department.create({
      name: 'Computer Science',
      code: 'CS',
      description: 'Computer Science Department',
      createdBy: new mongoose.Types.ObjectId()
    });

    const program = await Program.create({
      name: 'Bachelor of Computer Science',
      level: 'Undergraduate',
      duration: '4 years',
      semesters: 8,
      description: 'A comprehensive program in computer science',
      department: department._id,
      createdBy: new mongoose.Types.ObjectId()
    });

    // Create faculty user
    const faculty = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@university.edu',
      password: 'Password123!',
      role: 'faculty',
      facultyId: 'FAC001',
      department: department._id
    });

    // Create student user
    const student = await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@university.edu',
      password: 'Password123!',
      role: 'student',
      studentId: 'STU001',
      department: department._id
    });

    studentId = student._id;

    // Create courses
    const course1 = await Course.create({
      name: 'Introduction to Programming',
      title: 'Introduction to Programming',
      code: 'CS101',
      courseType: 'Core',
      program: program._id,
      department: department._id,
      faculty: faculty._id,
      description: 'Basic programming concepts',
      creditHours: 3,
      semester: 1,
      year: 2024,
      maxStudents: 50,
      status: 'active',
      createdBy: faculty._id
    });

    const course2 = await Course.create({
      name: 'Data Structures',
      title: 'Data Structures',
      code: 'CS201',
      courseType: 'Core',
      program: program._id,
      department: department._id,
      faculty: faculty._id,
      description: 'Advanced data structures',
      creditHours: 4,
      semester: 2,
      year: 2024,
      maxStudents: 40,
      status: 'active',
      createdBy: faculty._id
    });

    courseIds = [course1._id, course2._id];

          // Create enrollment for student
      await Enrollment.create({
        student: student._id,
        program: program._id,
        semester: 1,
        academicYear: '2024-2025',
        courses: courseIds,
        status: 'active',
        enrollmentType: 'full_time',
        createdBy: faculty._id
      });
  });

  describe('getStudentCourses', () => {
    it('should retrieve all courses for a student', async () => {
      // Mock request and response objects
      const req = {
        params: { studentId: studentId.toString() },
        query: {}
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      // Mock ResponseHandler methods
      ResponseHandler.success = jest.fn();
      ResponseHandler.notFound = jest.fn();
      ResponseHandler.error = jest.fn();

      // Call the controller method
      await courseController.getStudentCourses(req, res);

      // Verify ResponseHandler.success was called
      expect(ResponseHandler.success).toHaveBeenCalled();
      
      // Get the arguments passed to ResponseHandler.success
      const successCall = ResponseHandler.success.mock.calls[0];
      expect(successCall[1]).toBe(200); // status code
      expect(successCall[2]).toBe('Courses retrieved successfully'); // message
      
      // Check that data is an array with 2 courses
      const data = successCall[3];
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      
      // Check pagination
      const pagination = successCall[4];
      expect(pagination).toBeDefined();
      expect(pagination.total).toBe(2);
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(10);
      expect(pagination.pages).toBe(1);

      // Check course data structure
      const course = data[0];
      expect(course).toHaveProperty('course_id');
      expect(course).toHaveProperty('course_name');
      expect(course).toHaveProperty('faculty_id');
      expect(course).toHaveProperty('semester');
      expect(course).toHaveProperty('code');
      expect(course).toHaveProperty('creditHours');
      expect(course).toHaveProperty('year');
      expect(course).toHaveProperty('status');
      expect(course).toHaveProperty('faculty');
    });

    it('should return 404 for non-existent student', async () => {
      const fakeStudentId = new mongoose.Types.ObjectId();
      
      const req = {
        params: { studentId: fakeStudentId.toString() },
        query: {}
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      ResponseHandler.success = jest.fn();
      ResponseHandler.notFound = jest.fn();
      ResponseHandler.error = jest.fn();

      await courseController.getStudentCourses(req, res);

      expect(ResponseHandler.notFound).toHaveBeenCalledWith(res, 'Student not found');
    });

    it('should return empty array for student with no courses', async () => {
      // Create a new student without enrollments
      const newDepartment = await Department.create({
        name: 'Test Department',
        code: 'TEST',
        description: 'Test Department',
        createdBy: new mongoose.Types.ObjectId()
      });

      const newStudent = await User.create({
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@university.edu',
        password: 'Password123!',
        role: 'student',
        studentId: 'STU002',
        department: newDepartment._id
      });

      const req = {
        params: { studentId: newStudent._id.toString() },
        query: {}
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      ResponseHandler.success = jest.fn();
      ResponseHandler.notFound = jest.fn();
      ResponseHandler.error = jest.fn();

      await courseController.getStudentCourses(req, res);

      expect(ResponseHandler.success).toHaveBeenCalled();
      const successCall = ResponseHandler.success.mock.calls[0];
      const data = successCall[3];
      const pagination = successCall[4];
      
      expect(data).toHaveLength(0);
      expect(pagination.total).toBe(0);
    });

    it('should support pagination', async () => {
      // Create more courses to test pagination
      const department = await Department.findOne();
      const program = await Program.findOne();
      const faculty = await User.findOne({ role: 'faculty' });

      const additionalCourses = [];
      for (let i = 3; i <= 12; i++) {
        const course = await Course.create({
          name: `Course ${i}`,
          title: `Course ${i}`,
          code: `CS${i}01`,
          courseType: 'Core',
          program: program._id,
          department: department._id,
          faculty: faculty._id,
          description: `Course ${i} description`,
          creditHours: 3,
          semester: i,
          year: 2024,
          maxStudents: 50,
          status: 'active',
          createdBy: faculty._id
        });
        additionalCourses.push(course._id);
      }

      // Update enrollment to include more courses
      await Enrollment.findOneAndUpdate(
        { student: studentId },
        { $push: { courses: { $each: additionalCourses } } }
      );

      const req = {
        params: { studentId: studentId.toString() },
        query: { page: '2', limit: '5' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      ResponseHandler.success = jest.fn();
      ResponseHandler.notFound = jest.fn();
      ResponseHandler.error = jest.fn();

      await courseController.getStudentCourses(req, res);

      expect(ResponseHandler.success).toHaveBeenCalled();
      const successCall = ResponseHandler.success.mock.calls[0];
      const pagination = successCall[4];
      const data = successCall[3];
      
      expect(pagination.page).toBe(2);
      expect(pagination.limit).toBe(5);
      expect(pagination.total).toBe(12);
      expect(pagination.pages).toBe(3);
      expect(data).toHaveLength(5);
    });

    it('should support filtering by status', async () => {
      // Create an inactive course
      const department = await Department.findOne();
      const program = await Program.findOne();
      const faculty = await User.findOne({ role: 'faculty' });

      const inactiveCourse = await Course.create({
        name: 'Inactive Course',
        title: 'Inactive Course',
        code: 'CS301',
        courseType: 'Core',
        program: program._id,
        department: department._id,
        faculty: faculty._id,
        description: 'Inactive course',
        creditHours: 3,
        semester: 3,
        year: 2024,
        maxStudents: 50,
        status: 'inactive',
        createdBy: faculty._id
      });

      // Add inactive course to enrollment
      await Enrollment.findOneAndUpdate(
        { student: studentId },
        { $push: { courses: inactiveCourse._id } }
      );

      // Test filtering by active status
      const activeReq = {
        params: { studentId: studentId.toString() },
        query: { status: 'active' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      ResponseHandler.success = jest.fn();
      ResponseHandler.notFound = jest.fn();
      ResponseHandler.error = jest.fn();

      await courseController.getStudentCourses(activeReq, res);

      expect(ResponseHandler.success).toHaveBeenCalled();
      const successCall = ResponseHandler.success.mock.calls[0];
      const data = successCall[3];
      
      expect(data).toHaveLength(2);
      expect(data.every(course => course.status === 'active')).toBe(true);

      // Test filtering by inactive status
      const inactiveReq = {
        params: { studentId: studentId.toString() },
        query: { status: 'inactive' }
      };

      ResponseHandler.success.mockClear();
      await courseController.getStudentCourses(inactiveReq, res);

      expect(ResponseHandler.success).toHaveBeenCalled();
      const inactiveSuccessCall = ResponseHandler.success.mock.calls[0];
      const inactiveData = inactiveSuccessCall[3];
      
      expect(inactiveData).toHaveLength(1);
      expect(inactiveData[0].status).toBe('inactive');
    });

    it('should support sorting', async () => {
      const req = {
        params: { studentId: studentId.toString() },
        query: { sortBy: 'code', sortOrder: 'desc' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };

      ResponseHandler.success = jest.fn();
      ResponseHandler.notFound = jest.fn();
      ResponseHandler.error = jest.fn();

      await courseController.getStudentCourses(req, res);

      expect(ResponseHandler.success).toHaveBeenCalled();
      const successCall = ResponseHandler.success.mock.calls[0];
      const data = successCall[3];
      
      expect(data[0].code).toBe('CS201');
      expect(data[1].code).toBe('CS101');
    });
  });
}); 