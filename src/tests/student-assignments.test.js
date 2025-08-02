const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/user.model');
const Course = require('../models/course.model');
const Assignment = require('../models/assignment.model');
const Enrollment = require('../models/enrollment.model');
const Program = require('../models/program.model');

let mongoServer;
let studentToken;
let facultyToken;
let adminToken;
let studentId;
let facultyId;
let courseId;
let assignmentId;

describe('Student Assignments API', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Course.deleteMany({});
    await Assignment.deleteMany({});
    await Enrollment.deleteMany({});
    await Program.deleteMany({});

    // Create test program
    const program = await Program.create({
      name: 'Computer Science',
      code: 'CS',
      description: 'Computer Science Program',
      duration: 4,
      totalCredits: 120,
      createdBy: new mongoose.Types.ObjectId()
    });

    // Create test faculty
    const faculty = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'faculty@test.com',
      password: 'password123',
      role: 'faculty',
      department: new mongoose.Types.ObjectId()
    });
    facultyId = faculty._id;

    // Create test student
    const student = await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      department: new mongoose.Types.ObjectId()
    });
    studentId = student._id;

    // Create test admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      department: new mongoose.Types.ObjectId()
    });

    // Create test course
    const course = await Course.create({
      name: 'Introduction to Programming',
      code: 'CS101',
      description: 'Basic programming concepts',
      faculty: facultyId,
      credits: 3,
      createdBy: facultyId
    });
    courseId = course._id;

    // Create test assignment
    const assignment = await Assignment.create({
      title: 'Programming Assignment 1',
      description: 'Create a simple calculator program',
      course: courseId,
      faculty: facultyId,
      assignmentType: 'Homework',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      totalPoints: 100,
      status: 'published',
      isVisible: true,
      createdBy: facultyId
    });
    assignmentId = assignment._id;

    // Create enrollment for student
    await Enrollment.create({
      student: studentId,
      program: program._id,
      semester: 1,
      academicYear: '2024-2025',
      courses: [courseId],
      status: 'active',
      createdBy: admin._id
    });

    // Get tokens
    const facultyResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'faculty@test.com',
        password: 'password123'
      });
    facultyToken = facultyResponse.body.data.token;

    const studentResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@test.com',
        password: 'password123'
      });
    studentToken = studentResponse.body.data.token;

    const adminResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });
    adminToken = adminResponse.body.data.token;
  });

  describe('GET /api/v1/assignments/my-courses', () => {
    it('should get assignments for authenticated student', async () => {
      const response = await request(app)
        .get('/api/v1/assignments/my-courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Programming Assignment 1');
      expect(response.body.data[0].course._id).toBe(courseId.toString());
    });

    it('should return 403 for non-student users', async () => {
      await request(app)
        .get('/api/v1/assignments/my-courses')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('should filter assignments by course', async () => {
      const response = await request(app)
        .get(`/api/v1/assignments/my-courses?course=${courseId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should return empty array for student with no enrollments', async () => {
      // Create a new student without enrollment
      const newStudent = await User.create({
        firstName: 'New',
        lastName: 'Student',
        email: 'newstudent@test.com',
        password: 'password123',
        role: 'student',
        department: new mongoose.Types.ObjectId()
      });

      const newStudentResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'newstudent@test.com',
          password: 'password123'
        });

      const response = await request(app)
        .get('/api/v1/assignments/my-courses')
        .set('Authorization', `Bearer ${newStudentResponse.body.data.token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/assignments/student/:studentId', () => {
    it('should get assignments for specific student (admin)', async () => {
      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Programming Assignment 1');
    });

    it('should get assignments for specific student (faculty)', async () => {
      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should return 403 for student trying to access other student assignments', async () => {
      await request(app)
        .get(`/api/v1/assignments/student/${studentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent student', async () => {
      const fakeStudentId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/v1/assignments/student/${fakeStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should filter assignments by course', async () => {
      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}?course=${courseId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
    });

    it('should include student info in response', async () => {
      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.studentInfo).toBeDefined();
      expect(response.body.studentInfo.studentId).toBe(studentId.toString());
      expect(response.body.studentInfo.studentName).toBe('Jane Smith');
      expect(response.body.studentInfo.enrolledCourses).toBe(1);
    });
  });

  describe('Assignment filtering and search', () => {
    beforeEach(async () => {
      // Create additional assignments for testing
      await Assignment.create([
        {
          title: 'Quiz 1',
          description: 'Basic programming quiz',
          course: courseId,
          faculty: facultyId,
          assignmentType: 'Quiz',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          totalPoints: 50,
          status: 'published',
          isVisible: true,
          difficulty: 'Easy',
          createdBy: facultyId
        },
        {
          title: 'Final Project',
          description: 'Comprehensive programming project',
          course: courseId,
          faculty: facultyId,
          assignmentType: 'Project',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          totalPoints: 200,
          status: 'published',
          isVisible: true,
          difficulty: 'Hard',
          tags: ['final', 'project'],
          createdBy: facultyId
        }
      ]);
    });

    it('should filter by assignment type', async () => {
      const response = await request(app)
        .get('/api/v1/assignments/my-courses?assignmentType=Quiz')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].assignmentType).toBe('Quiz');
    });

    it('should filter by difficulty', async () => {
      const response = await request(app)
        .get('/api/v1/assignments/my-courses?difficulty=Hard')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].difficulty).toBe('Hard');
    });

    it('should search by title', async () => {
      const response = await request(app)
        .get('/api/v1/assignments/my-courses?search=Quiz')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toContain('Quiz');
    });

    it('should filter by tags', async () => {
      const response = await request(app)
        .get('/api/v1/assignments/my-courses?tags=final,project')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Final Project');
    });

    it('should sort by due date', async () => {
      const response = await request(app)
        .get('/api/v1/assignments/my-courses?sortBy=dueDate&sortOrder=asc')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      // Check that assignments are sorted by due date (ascending)
      const dueDates = response.body.data.map(a => new Date(a.dueDate));
      expect(dueDates[0] <= dueDates[1]).toBe(true);
      expect(dueDates[1] <= dueDates[2]).toBe(true);
    });
  });
}); 