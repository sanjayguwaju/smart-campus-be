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

describe('Student Assignments Aggregation API', () => {
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

    // Create test assignments with different statuses
    const assignments = await Assignment.create([
      {
        title: 'Active Assignment 1',
        description: 'This is an active assignment',
        course: courseId,
        faculty: facultyId,
        assignmentType: 'Homework',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        totalPoints: 100,
        status: 'published',
        isVisible: true,
        createdBy: facultyId
      },
      {
        title: 'Draft Assignment',
        description: 'This is a draft assignment',
        course: courseId,
        faculty: facultyId,
        assignmentType: 'Quiz',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        totalPoints: 50,
        status: 'draft',
        isVisible: false,
        createdBy: facultyId
      },
      {
        title: 'Archived Assignment',
        description: 'This is an archived assignment',
        course: courseId,
        faculty: facultyId,
        assignmentType: 'Project',
        dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        totalPoints: 200,
        status: 'archived',
        isVisible: false,
        createdBy: facultyId
      }
    ]);

    assignmentId = assignments[0]._id;

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

  describe('GET /api/v1/assignments/student/:studentId/active', () => {
    it('should get only active assignments for a student using aggregation', async () => {
      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}/active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // Only the published assignment
      expect(response.body.data[0].title).toBe('Active Assignment 1');
      expect(response.body.data[0].status).toBe('published');
      expect(response.body.data[0].isVisible).toBe(true);
    });

    it('should return 403 for student trying to access aggregation endpoint', async () => {
      await request(app)
        .get(`/api/v1/assignments/student/${studentId}/active`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should return 404 for non-existent student', async () => {
      const fakeStudentId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/v1/assignments/student/${fakeStudentId}/active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should include student info in response', async () => {
      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}/active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.studentInfo).toBeDefined();
      expect(response.body.studentInfo.studentId).toBe(studentId.toString());
      expect(response.body.studentInfo.studentName).toBe('Jane Smith');
      expect(response.body.studentInfo.enrolledCourses).toBe(1);
      expect(response.body.studentInfo.currentSemester).toBe(1);
      expect(response.body.studentInfo.academicYear).toBe('2024-2025');
    });

    it('should filter by assignment type', async () => {
      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}/active?assignmentType=Homework`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].assignmentType).toBe('Homework');
    });

    it('should return empty array for student with no active enrollments', async () => {
      // Create a new student without enrollment
      const newStudent = await User.create({
        firstName: 'New',
        lastName: 'Student',
        email: 'newstudent@test.com',
        password: 'password123',
        role: 'student',
        department: new mongoose.Types.ObjectId()
      });

      const response = await request(app)
        .get(`/api/v1/assignments/student/${newStudent._id}/active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('should include computed fields (isOverdue, daysUntilDue)', async () => {
      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}/active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data[0].isOverdue).toBeDefined();
      expect(typeof response.body.data[0].isOverdue).toBe('boolean');
      expect(response.body.data[0].daysUntilDue).toBeDefined();
      expect(typeof response.body.data[0].daysUntilDue).toBe('number');
    });

    it('should populate course and faculty information', async () => {
      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}/active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data[0].course).toBeDefined();
      expect(response.body.data[0].course.name).toBe('Introduction to Programming');
      expect(response.body.data[0].course.code).toBe('CS101');
      
      expect(response.body.data[0].faculty).toBeDefined();
      expect(response.body.data[0].faculty.firstName).toBe('John');
      expect(response.body.data[0].faculty.lastName).toBe('Doe');
    });

    it('should support pagination', async () => {
      // Create more assignments to test pagination
      await Assignment.create([
        {
          title: 'Active Assignment 2',
          description: 'Second active assignment',
          course: courseId,
          faculty: facultyId,
          assignmentType: 'Quiz',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          totalPoints: 75,
          status: 'published',
          isVisible: true,
          createdBy: facultyId
        },
        {
          title: 'Active Assignment 3',
          description: 'Third active assignment',
          course: courseId,
          faculty: facultyId,
          assignmentType: 'Project',
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          totalPoints: 150,
          status: 'published',
          isVisible: true,
          createdBy: facultyId
        }
      ]);

      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}/active?page=1&limit=2`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.pages).toBe(2);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}/active?sortBy=title&sortOrder=asc`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data[0].title).toBe('Active Assignment 1');
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}/active?search=active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toContain('Active');
    });
  });

  describe('Aggregation Pipeline Performance', () => {
    it('should handle multiple courses efficiently', async () => {
      // Create additional courses and enrollments
      const course2 = await Course.create({
        name: 'Data Structures',
        code: 'CS201',
        description: 'Advanced programming concepts',
        faculty: facultyId,
        credits: 3,
        createdBy: facultyId
      });

      const course3 = await Course.create({
        name: 'Algorithms',
        code: 'CS301',
        description: 'Algorithm design and analysis',
        faculty: facultyId,
        credits: 3,
        createdBy: facultyId
      });

      // Update enrollment to include multiple courses
      await Enrollment.findOneAndUpdate(
        { student: studentId },
        { courses: [courseId, course2._id, course3._id] }
      );

      // Create assignments for all courses
      await Assignment.create([
        {
          title: 'Course 2 Assignment',
          description: 'Assignment for course 2',
          course: course2._id,
          faculty: facultyId,
          assignmentType: 'Homework',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          totalPoints: 80,
          status: 'published',
          isVisible: true,
          createdBy: facultyId
        },
        {
          title: 'Course 3 Assignment',
          description: 'Assignment for course 3',
          course: course3._id,
          faculty: facultyId,
          assignmentType: 'Project',
          dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
          totalPoints: 120,
          status: 'published',
          isVisible: true,
          createdBy: facultyId
        }
      ]);

      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}/active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.studentInfo.enrolledCourses).toBe(3);
    });

    it('should exclude non-active assignments correctly', async () => {
      // Verify that draft and archived assignments are not included
      const response = await request(app)
        .get(`/api/v1/assignments/student/${studentId}/active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const assignmentTitles = response.body.data.map(a => a.title);
      expect(assignmentTitles).not.toContain('Draft Assignment');
      expect(assignmentTitles).not.toContain('Archived Assignment');
      expect(assignmentTitles).toContain('Active Assignment 1');
    });
  });
}); 