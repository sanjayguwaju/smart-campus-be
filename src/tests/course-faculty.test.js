const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Course = require('../models/course.model');
const User = require('../models/user.model');
const Department = require('../models/department.model');

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
});

describe('GET /api/v1/courses/faculty/:facultyId', () => {
  let faculty;
  let department;
  let course1;
  let course2;

  beforeEach(async () => {
    // Create department
    department = await Department.create({
      name: 'Computer Science',
      code: 'CS',
      description: 'Computer Science Department'
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
      program: new mongoose.Types.ObjectId(),
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
      program: new mongoose.Types.ObjectId(),
      semester: 2,
      year: 2024,
      creditHours: 3,
      maxStudents: 25,
      status: 'active'
    });

    // Create a course assigned to different faculty (should not be returned)
    const otherFaculty = await User.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@university.edu',
      password: 'password123',
      role: 'faculty',
      department: department._id
    });

    await Course.create({
      title: 'Database Systems',
      code: 'CS301',
      description: 'Database management systems',
      faculty: otherFaculty._id,
      department: department._id,
      program: new mongoose.Types.ObjectId(),
      semester: 3,
      year: 2024,
      creditHours: 3,
      maxStudents: 20,
      status: 'active'
    });
  });

  it('should return courses assigned to the specified faculty', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Courses retrieved successfully');
    expect(response.body.data).toHaveLength(2);
    
    // Check that only courses assigned to the faculty are returned
    const courseIds = response.body.data.map(course => course._id);
    expect(courseIds).toContain(course1._id.toString());
    expect(courseIds).toContain(course2._id.toString());
  });

  it('should return empty array for faculty with no courses', async () => {
    const newFaculty = await User.create({
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@university.edu',
      password: 'password123',
      role: 'faculty',
      department: department._id
    });

    const response = await request(app)
      .get(`/api/v1/courses/faculty/${newFaculty._id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(0);
  });

  it('should return 500 for invalid faculty ID', async () => {
    const response = await request(app)
      .get('/api/v1/courses/faculty/invalid-id')
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Failed to retrieve courses');
  });

  it('should only return active courses', async () => {
    // Create an inactive course for the faculty
    await Course.create({
      title: 'Inactive Course',
      code: 'CS401',
      description: 'This course is inactive',
      faculty: faculty._id,
      department: department._id,
      program: new mongoose.Types.ObjectId(),
      semester: 4,
      year: 2024,
      creditHours: 3,
      maxStudents: 15,
      status: 'inactive'
    });

    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}`)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    
    // Check that inactive course is not included
    const courseCodes = response.body.data.map(course => course.code);
    expect(courseCodes).not.toContain('CS401');
  });

  it('should populate faculty and department information', async () => {
    const response = await request(app)
      .get(`/api/v1/courses/faculty/${faculty._id}`)
      .expect(200);

    const course = response.body.data[0];
    
    expect(course.faculty).toBeDefined();
    expect(course.faculty._id).toBe(faculty._id.toString());
    expect(course.faculty.firstName).toBe('John');
    expect(course.faculty.lastName).toBe('Doe');
    expect(course.faculty.email).toBe('john.doe@university.edu');
    
    expect(course.department).toBeDefined();
    expect(course.department._id).toBe(department._id.toString());
    expect(course.department.name).toBe('Computer Science');
  });
}); 