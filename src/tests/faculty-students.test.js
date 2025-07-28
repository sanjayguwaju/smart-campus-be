const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const Department = require('../models/department.model');
const Enrollment = require('../models/enrollment.model');
const Program = require('../models/program.model');

let mongoServer;

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
  await Course.deleteMany({});
  await User.deleteMany({});
  await Department.deleteMany({});
  await Enrollment.deleteMany({});
  await Program.deleteMany({});
});

describe('GET /api/v1/courses/faculty/:facultyId/students', () => {
  let faculty;
  let department;
  let program;
  let course1;
  let course2;
  let student1;
  let student2;
  let student3;
  let enrollment1;
  let enrollment2;
  let enrollment3;

  beforeEach(async () => {
    // Create department
    department = await Department.create({
      name: 'Computer Science',
      code: 'CS',
      description: 'Computer Science Department'
    });

    // Create program
    program = await Program.create({
      name: 'Bachelor of Computer Science',
      code: 'BCS',
      level: 'undergraduate',
      duration: 4,
      semesters: 8,
      department: department._id
    });

    // Create faculty
    faculty = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@university.edu',
      password: 'password123',
      role: 'faculty',
      department: department._id
    });

    // Create courses assigned to the faculty
    course1 = await Course.create({
      title: 'Introduction to Computer Science',
      code: 'CS101',
      description: 'Basic concepts of computer science',
      faculty: faculty._id,
      department: department._id,
      program: program._id,
      semester: 1,
      year: 2024,
      creditHours: 3,
      maxStudents: 30,
      status: 'active'
    });

    course2 = await Course.create({
      title: 'Data Structures',
      code: 'CS201',
      description: 'Advanced data structures',
      faculty: faculty._id,
      department: department._id,
      program: program._id,
      semester: 2,
      year: 2024,
      creditHours: 3,
      maxStudents: 25,
      status: 'active'
    });

    // Create students
    student1 = await User.create({
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@student.edu',
      password: 'password123',
      role: 'student',
      studentId: 'STU2024001',
      department: department._id
    });

    student2 = await User.create({
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob.smith@student.edu',
      password: 'password123',
      role: 'student',
      studentId: 'STU2024002',
      department: department._id
    });

    student3 = await User.create({
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie.brown@student.edu',
      password: 'password123',
      role: 'student',
      studentId: 'STU2024003',
      department: department._id
    });

    // Create enrollments
    enrollment1 = await Enrollment.create({
      student: student1._id,
      program: program._id,
      semester: 1,
      academicYear: '2024-2025',
      courses: [course1._id, course2._id],
      status: 'active',
      enrollmentType: 'full_time',
      totalCredits: 6,
      gpa: 3.75
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
      gpa: 3.50
    });

    enrollment3 = await Enrollment.create({
      student: student3._id,
      program: program._id,
      semester: 1,
      academicYear: '2024-2025',
      courses: [course2._id],
      status: 'active',
      enrollmentType: 'part_time',
      totalCredits: 3,
      gpa: 3.25
    });
  });

  it('should return all students enrolled in faculty courses', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Students retrieved successfully');
    expect(response.body.data).toHaveLength(3);
    
    // Check that all students are returned
    const studentIds = response.body.data.map(student => student._id);
    expect(studentIds).toContain(student1._id.toString());
    expect(studentIds).toContain(student2._id.toString());
    expect(studentIds).toContain(student3._id.toString());
  });

  it('should include course information for each student', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students`)
      .expect(200);

    const student1Data = response.body.data.find(s => s._id === student1._id.toString());
    expect(student1Data.courses).toHaveLength(2);
    expect(student1Data.courses.map(c => c.code)).toContain('CS101');
    expect(student1Data.courses.map(c => c.code)).toContain('CS201');

    const student2Data = response.body.data.find(s => s._id === student2._id.toString());
    expect(student2Data.courses).toHaveLength(1);
    expect(student2Data.courses[0].code).toBe('CS101');
  });

  it('should include pagination information', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students`)
      .expect(200);

    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(10);
    expect(response.body.pagination.total).toBe(3);
    expect(response.body.pagination.pages).toBe(1);
  });

  it('should include summary statistics', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students`)
      .expect(200);

    expect(response.body.summary).toBeDefined();
    expect(response.body.summary.totalStudents).toBe(3);
    expect(response.body.summary.totalCourses).toBe(2);
    expect(response.body.summary.averageStudentsPerCourse).toBe(1.5);
  });

  it('should filter by specific course', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students?courseId=${course1._id}`)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    const studentIds = response.body.data.map(student => student._id);
    expect(studentIds).toContain(student1._id.toString());
    expect(studentIds).toContain(student2._id.toString());
    expect(studentIds).not.toContain(student3._id.toString());
  });

  it('should search students by name', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students?search=alice`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].firstName).toBe('Alice');
  });

  it('should search students by email', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students?search=bob.smith`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].email).toBe('bob.smith@student.edu');
  });

  it('should sort students by lastName', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students?sortBy=lastName&sortOrder=asc`)
      .expect(200);

    const lastNames = response.body.data.map(student => student.lastName);
    expect(lastNames).toEqual(['Brown', 'Johnson', 'Smith']);
  });

  it('should sort students by gpa in descending order', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students?sortBy=gpa&sortOrder=desc`)
      .expect(200);

    const gpas = response.body.data.map(student => student.gpa);
    expect(gpas).toEqual([3.75, 3.50, 3.25]);
  });

  it('should apply pagination', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students?page=1&limit=2`)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(2);
    expect(response.body.pagination.total).toBe(3);
    expect(response.body.pagination.pages).toBe(2);
  });

  it('should filter by enrollment status', async () => {
    // Create a dropped enrollment
    await Enrollment.create({
      student: student1._id,
      program: program._id,
      semester: 1,
      academicYear: '2024-2025',
      courses: [course1._id],
      status: 'dropped',
      enrollmentType: 'full_time',
      totalCredits: 3,
      gpa: 3.75
    });

    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students?status=dropped`)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]._id).toBe(student1._id.toString());
  });

  it('should return empty array for faculty with no courses', async () => {
    const newFaculty = await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@university.edu',
      password: 'password123',
      role: 'faculty',
      department: department._id
    });

    const response = await request(app)
      .get(`/api/v1/courses/faculty/${newFaculty._id}/students`)
      .expect(200);

    expect(response.body.data).toHaveLength(0);
    expect(response.body.summary.totalStudents).toBe(0);
    expect(response.body.summary.totalCourses).toBe(0);
  });

  it('should return 500 for invalid faculty ID', async () => {
    const response = await request(app)
      .get('/api/v1/courses/faculty/invalid-id/students')
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Failed to retrieve students');
  });

  it('should not include students from inactive courses', async () => {
    // Create an inactive course
    const inactiveCourse = await Course.create({
      title: 'Inactive Course',
      code: 'CS301',
      description: 'This course is inactive',
      faculty: faculty._id,
      department: department._id,
      program: program._id,
      semester: 3,
      year: 2024,
      creditHours: 3,
      maxStudents: 15,
      status: 'inactive'
    });

    // Create enrollment for inactive course
    await Enrollment.create({
      student: student1._id,
      program: program._id,
      semester: 1,
      academicYear: '2024-2025',
      courses: [inactiveCourse._id],
      status: 'active',
      enrollmentType: 'full_time',
      totalCredits: 3,
      gpa: 3.75
    });

    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students`)
      .expect(200);

    // Should still return the same number of students (no change)
    expect(response.body.data).toHaveLength(3);
  });

  it('should include student academic information', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}/students`)
      .expect(200);

    const student = response.body.data[0];
    expect(student.totalCredits).toBeDefined();
    expect(student.gpa).toBeDefined();
    expect(student.enrollmentStatus).toBeDefined();
    expect(student.enrollmentType).toBeDefined();
  });
}); 