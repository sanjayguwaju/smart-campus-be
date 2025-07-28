const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Adjust path as needed
const User = require('../models/user.model');
const Course = require('../models/course.model');
const Enrollment = require('../models/enrollment.model');
const Department = require('../models/department.model');
const Program = require('../models/program.model');

describe('Faculty Students Aggregated API', () => {
  let faculty, student1, student2, course1, course2, enrollment1, enrollment2, department, program;
  let authToken;

  beforeAll(async () => {
    // Create test department
    department = await Department.create({
      name: 'Computer Science',
      code: 'CS',
      description: 'Computer Science Department'
    });

    // Create test program
    program = await Program.create({
      name: 'Bachelor of Computer Science',
      code: 'BCS',
      level: 'undergraduate',
      duration: 4,
      semesters: 8,
      department: department._id
    });

    // Create test faculty
    faculty = await User.create({
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      email: 'jane.smith@test.com',
      password: 'password123',
      role: 'faculty',
      facultyId: 'FAC001',
      department: department._id,
      isActive: true,
      isEmailVerified: true
    });

    // Create test students
    student1 = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@test.com',
      password: 'password123',
      role: 'student',
      studentId: 'STU001',
      department: department._id,
      isActive: true,
      isEmailVerified: true
    });

    student2 = await User.create({
      firstName: 'Jane',
      lastName: 'Wilson',
      email: 'jane.wilson@test.com',
      password: 'password123',
      role: 'student',
      studentId: 'STU002',
      department: department._id,
      isActive: true,
      isEmailVerified: true
    });

    // Create test courses
    course1 = await Course.create({
      name: 'Introduction to Programming',
      title: 'Introduction to Programming',
      code: 'CS101',
      courseType: 'Core',
      program: program._id,
      department: department._id,
      faculty: faculty._id,
      semester: 1,
      year: 2024,
      creditHours: 3,
      maxStudents: 30,
      currentEnrollment: 2,
      status: 'active',
      createdBy: faculty._id
    });

    course2 = await Course.create({
      name: 'Data Structures',
      title: 'Data Structures',
      code: 'CS201',
      courseType: 'Core',
      program: program._id,
      department: department._id,
      faculty: faculty._id,
      semester: 2,
      year: 2024,
      creditHours: 4,
      maxStudents: 25,
      currentEnrollment: 1,
      status: 'active',
      createdBy: faculty._id
    });

    // Create test enrollments
    enrollment1 = await Enrollment.create({
      student: student1._id,
      program: program._id,
      semester: 1,
      academicYear: '2024-2025',
      courses: [course1._id, course2._id],
      status: 'active',
      enrollmentType: 'full_time',
      totalCredits: 7,
      gpa: 3.5,
      cgpa: 3.4,
      createdBy: faculty._id
    });

    enrollment2 = await Enrollment.create({
      student: student2._id,
      program: program._id,
      semester: 1,
      academicYear: '2024-2025',
      courses: [course1._id],
      status: 'active',
      enrollmentType: 'full_time',
      totalCredits: 3,
      gpa: 3.8,
      cgpa: 3.7,
      createdBy: faculty._id
    });

    // Get auth token (you may need to adjust this based on your auth implementation)
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'jane.smith@test.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $in: ['jane.smith@test.com', 'john.doe@test.com', 'jane.wilson@test.com'] } });
    await Course.deleteMany({ code: { $in: ['CS101', 'CS201'] } });
    await Enrollment.deleteMany({ student: { $in: [student1._id, student2._id] } });
    await Department.deleteMany({ code: 'CS' });
    await Program.deleteMany({ code: 'BCS' });
    await mongoose.connection.close();
  });

  describe('GET /api/v1/courses/faculty/:facultyId/students/aggregated', () => {
    it('should return aggregated faculty students data', async () => {
      const response = await request(app)
        .get(`/api/v1/courses/faculty/${faculty._id}/students/aggregated`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Faculty students data retrieved successfully');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);

      // Check first student data
      const firstStudent = response.body.data[0];
      expect(firstStudent).toHaveProperty('_id');
      expect(firstStudent).toHaveProperty('firstName');
      expect(firstStudent).toHaveProperty('lastName');
      expect(firstStudent).toHaveProperty('email');
      expect(firstStudent).toHaveProperty('studentId');
      expect(firstStudent).toHaveProperty('courses');
      expect(firstStudent).toHaveProperty('totalCredits');
      expect(firstStudent).toHaveProperty('courseCount');
      expect(firstStudent).toHaveProperty('enrollmentStatus');
      expect(firstStudent).toHaveProperty('gpa');

      // Check courses array
      expect(firstStudent.courses).toBeInstanceOf(Array);
      expect(firstStudent.courses.length).toBeGreaterThan(0);

      // Check course structure
      const firstCourse = firstStudent.courses[0];
      expect(firstCourse).toHaveProperty('_id');
      expect(firstCourse).toHaveProperty('title');
      expect(firstCourse).toHaveProperty('code');
      expect(firstCourse).toHaveProperty('courseType');
      expect(firstCourse).toHaveProperty('creditHours');
      expect(firstCourse).toHaveProperty('semester');
      expect(firstCourse).toHaveProperty('year');

      // Check pagination
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('pages');

      // Check summary
      expect(response.body.summary).toHaveProperty('totalStudents');
      expect(response.body.summary).toHaveProperty('totalCourses');
      expect(response.body.summary).toHaveProperty('averageStudentsPerCourse');
      expect(response.body.summary).toHaveProperty('faculty');

      // Check faculty info in summary
      expect(response.body.summary.faculty).toHaveProperty('_id');
      expect(response.body.summary.faculty).toHaveProperty('firstName');
      expect(response.body.summary.faculty).toHaveProperty('lastName');
      expect(response.body.summary.faculty).toHaveProperty('email');
      expect(response.body.summary.faculty).toHaveProperty('facultyId');
    });

    it('should handle pagination correctly', async () => {
      const response = await request(app)
        .get(`/api/v1/courses/faculty/${faculty._id}/students/aggregated?page=1&limit=1`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.pages).toBe(2);
    });

    it('should handle sorting correctly', async () => {
      const response = await request(app)
        .get(`/api/v1/courses/faculty/${faculty._id}/students/aggregated?sortBy=gpa&sortOrder=desc`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
      // Check if sorted by GPA descending
      expect(response.body.data[0].gpa).toBeGreaterThanOrEqual(response.body.data[1].gpa);
    });

    it('should handle search filter correctly', async () => {
      const response = await request(app)
        .get(`/api/v1/courses/faculty/${faculty._id}/students/aggregated?search=john`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].firstName.toLowerCase()).toContain('john');
    });

    it('should handle course filter correctly', async () => {
      const response = await request(app)
        .get(`/api/v1/courses/faculty/${faculty._id}/students/aggregated?courseId=${course1._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
      // All students should have the specified course
      response.body.data.forEach(student => {
        const hasCourse = student.courses.some(course => course._id === course1._id.toString());
        expect(hasCourse).toBe(true);
      });
    });

    it('should handle enrollment status filter correctly', async () => {
      const response = await request(app)
        .get(`/api/v1/courses/faculty/${faculty._id}/students/aggregated?status=active`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
      // All students should have active status
      response.body.data.forEach(student => {
        expect(student.enrollmentStatus).toBe('active');
      });
    });

    it('should return 404 for invalid faculty ID', async () => {
      const invalidFacultyId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/v1/courses/faculty/${invalidFacultyId}/students/aggregated`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Faculty not found or invalid faculty ID');
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/v1/courses/faculty/${faculty._id}/students/aggregated`)
        .expect(401);
    });

    it('should handle faculty with no courses', async () => {
      // Create a faculty with no courses
      const facultyNoCourses = await User.create({
        firstName: 'Dr. No',
        lastName: 'Courses',
        email: 'no.courses@test.com',
        password: 'password123',
        role: 'faculty',
        facultyId: 'FAC002',
        department: department._id,
        isActive: true,
        isEmailVerified: true
      });

      const response = await request(app)
        .get(`/api/v1/courses/faculty/${facultyNoCourses._id}/students/aggregated`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.summary.totalStudents).toBe(0);
      expect(response.body.summary.totalCourses).toBe(0);

      // Clean up
      await User.deleteOne({ _id: facultyNoCourses._id });
    });

    it('should calculate computed fields correctly', async () => {
      const response = await request(app)
        .get(`/api/v1/courses/faculty/${faculty._id}/students/aggregated`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Find student with 2 courses
      const studentWithTwoCourses = response.body.data.find(student => student.courseCount === 2);
      expect(studentWithTwoCourses).toBeDefined();
      expect(studentWithTwoCourses.totalCredits).toBe(7); // 3 + 4 credit hours

      // Find student with 1 course
      const studentWithOneCourse = response.body.data.find(student => student.courseCount === 1);
      expect(studentWithOneCourse).toBeDefined();
      expect(studentWithOneCourse.totalCredits).toBe(3); // 3 credit hours
    });
  });
}); 