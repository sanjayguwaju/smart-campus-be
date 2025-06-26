const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt');

let mongoServer;
let adminToken;
let facultyToken;
let studentToken;
let adminUser;
let facultyUser;
let studentUser;
let testEvent;

describe('Event API Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test users
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      studentId: 'ADM001',
      department: 'IT',
      phone: '1234567890'
    });
    await adminUser.save();

    facultyUser = new User({
      firstName: 'Faculty',
      lastName: 'User',
      email: 'faculty@test.com',
      password: 'password123',
      role: 'faculty',
      employeeId: 'FAC001',
      department: 'Computer Science',
      phone: '1234567891'
    });
    await facultyUser.save();

    studentUser = new User({
      firstName: 'Student',
      lastName: 'User',
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      studentId: 'STU001',
      department: 'Computer Science',
      phone: '1234567892'
    });
    await studentUser.save();

    // Generate tokens
    adminToken = generateToken(adminUser);
    facultyToken = generateToken(facultyUser);
    studentToken = generateToken(studentUser);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Event.deleteMany({});
  });

  describe('POST /api/v1/events', () => {
    it('should create a new event with valid data', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'A test event description',
        type: 'academic',
        category: 'undergraduate',
        startDate: '2024-12-25',
        endDate: '2024-12-25',
        startTime: '10:00',
        endTime: '12:00',
        location: {
          venue: 'Main Hall',
          address: '123 Campus St'
        },
        maxAttendees: 100,
        tags: ['test', 'academic'],
        contactInfo: {
          email: 'test@campus.com',
          phone: '1234567890'
        }
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(eventData.title);
      expect(response.body.data.organizer.id).toBe(facultyUser._id.toString());
    });

    it('should reject event creation without authentication', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'A test event description',
        type: 'academic',
        category: 'undergraduate',
        startDate: '2024-12-25',
        endDate: '2024-12-25',
        location: {
          venue: 'Main Hall'
        }
      };

      await request(app)
        .post('/api/v1/events')
        .send(eventData)
        .expect(401);
    });

    it('should reject event creation with invalid data', async () => {
      const eventData = {
        title: '', // Invalid: empty title
        description: 'A test event description',
        type: 'invalid_type', // Invalid type
        category: 'undergraduate',
        startDate: '2024-12-25',
        endDate: '2024-12-25',
        location: {
          venue: 'Main Hall'
        }
      };

      const response = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(eventData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/events', () => {
    beforeEach(async () => {
      // Create test events
      const events = [
        {
          title: 'Academic Event 1',
          description: 'First academic event',
          type: 'academic',
          category: 'undergraduate',
          startDate: '2024-12-25',
          endDate: '2024-12-25',
          startTime: '10:00',
          endTime: '12:00',
          location: { venue: 'Hall 1' },
          organizer: {
            id: facultyUser._id,
            name: `${facultyUser.firstName} ${facultyUser.lastName}`,
            email: facultyUser.email
          },
          status: 'published'
        },
        {
          title: 'Social Event 1',
          description: 'First social event',
          type: 'social',
          category: 'all',
          startDate: '2024-12-26',
          endDate: '2024-12-26',
          startTime: '14:00',
          endTime: '16:00',
          location: { venue: 'Hall 2' },
          organizer: {
            id: adminUser._id,
            name: `${adminUser.firstName} ${adminUser.lastName}`,
            email: adminUser.email
          },
          status: 'published'
        }
      ];

      await Event.insertMany(events);
    });

    it('should get all events with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/events')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter events by type', async () => {
      const response = await request(app)
        .get('/api/v1/events?type=academic')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].type).toBe('academic');
    });

    it('should search events by title', async () => {
      const response = await request(app)
        .get('/api/v1/events?search=Academic')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toContain('Academic');
    });
  });

  describe('GET /api/v1/events/:id', () => {
    beforeEach(async () => {
      testEvent = new Event({
        title: 'Test Event',
        description: 'A test event description',
        type: 'academic',
        category: 'undergraduate',
        startDate: '2024-12-25',
        endDate: '2024-12-25',
        startTime: '10:00',
        endTime: '12:00',
        location: {
          venue: 'Main Hall',
          address: '123 Campus St'
        },
        organizer: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email
        },
        status: 'published'
      });
      await testEvent.save();
    });

    it('should get event by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/events/${testEvent._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Event');
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/v1/events/${fakeId}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/events/:id', () => {
    beforeEach(async () => {
      testEvent = new Event({
        title: 'Original Title',
        description: 'Original description',
        type: 'academic',
        category: 'undergraduate',
        startDate: '2024-12-25',
        endDate: '2024-12-25',
        startTime: '10:00',
        endTime: '12:00',
        location: {
          venue: 'Main Hall'
        },
        organizer: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email
        },
        status: 'published'
      });
      await testEvent.save();
    });

    it('should update event with valid data', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/v1/events/${testEvent._id}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should reject update without authentication', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      await request(app)
        .put(`/api/v1/events/${testEvent._id}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/v1/events/:id', () => {
    beforeEach(async () => {
      testEvent = new Event({
        title: 'Event to Delete',
        description: 'This event will be deleted',
        type: 'academic',
        category: 'undergraduate',
        startDate: '2024-12-25',
        endDate: '2024-12-25',
        startTime: '10:00',
        endTime: '12:00',
        location: {
          venue: 'Main Hall'
        },
        organizer: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email
        },
        status: 'published'
      });
      await testEvent.save();
    });

    it('should delete event with proper authorization', async () => {
      const response = await request(app)
        .delete(`/api/v1/events/${testEvent._id}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify event is deleted
      const deletedEvent = await Event.findById(testEvent._id);
      expect(deletedEvent).toBeNull();
    });

    it('should reject deletion without authentication', async () => {
      await request(app)
        .delete(`/api/v1/events/${testEvent._id}`)
        .expect(401);
    });
  });

  describe('POST /api/v1/events/:id/register', () => {
    beforeEach(async () => {
      testEvent = new Event({
        title: 'Registration Test Event',
        description: 'Event for testing registration',
        type: 'academic',
        category: 'undergraduate',
        startDate: '2024-12-25',
        endDate: '2024-12-25',
        startTime: '10:00',
        endTime: '12:00',
        location: {
          venue: 'Main Hall'
        },
        organizer: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email
        },
        status: 'published',
        maxAttendees: 50
      });
      await testEvent.save();
    });

    it('should register user for event', async () => {
      const response = await request(app)
        .post(`/api/v1/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered');

      // Verify registration in database
      const updatedEvent = await Event.findById(testEvent._id);
      expect(updatedEvent.attendees).toHaveLength(1);
      expect(updatedEvent.attendees[0].userId.toString()).toBe(studentUser._id.toString());
    });

    it('should reject duplicate registration', async () => {
      // First registration
      await request(app)
        .post(`/api/v1/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({})
        .expect(200);

      // Second registration (should fail)
      const response = await request(app)
        .post(`/api/v1/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({})
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/events/:id/unregister', () => {
    beforeEach(async () => {
      testEvent = new Event({
        title: 'Unregister Test Event',
        description: 'Event for testing unregistration',
        type: 'academic',
        category: 'undergraduate',
        startDate: '2024-12-25',
        endDate: '2024-12-25',
        startTime: '10:00',
        endTime: '12:00',
        location: {
          venue: 'Main Hall'
        },
        organizer: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email
        },
        status: 'published',
        attendees: [{
          userId: studentUser._id,
          name: `${studentUser.firstName} ${studentUser.lastName}`,
          email: studentUser.email,
          registrationDate: new Date(),
          status: 'registered'
        }]
      });
      await testEvent.save();
    });

    it('should unregister user from event', async () => {
      const response = await request(app)
        .delete(`/api/v1/events/${testEvent._id}/unregister`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('unregistered');

      // Verify unregistration in database
      const updatedEvent = await Event.findById(testEvent._id);
      expect(updatedEvent.attendees).toHaveLength(0);
    });
  });

  describe('GET /api/v1/events/search/upcoming', () => {
    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const events = [
        {
          title: 'Future Event 1',
          description: 'Event in the future',
          type: 'academic',
          category: 'undergraduate',
          startDate: futureDate.toISOString().split('T')[0],
          endDate: futureDate.toISOString().split('T')[0],
          startTime: '10:00',
          endTime: '12:00',
          location: { venue: 'Hall 1' },
          organizer: {
            id: facultyUser._id,
            name: `${facultyUser.firstName} ${facultyUser.lastName}`,
            email: facultyUser.email
          },
          status: 'published'
        },
        {
          title: 'Past Event 1',
          description: 'Event in the past',
          type: 'social',
          category: 'all',
          startDate: '2020-01-01',
          endDate: '2020-01-01',
          startTime: '10:00',
          endTime: '12:00',
          location: { venue: 'Hall 2' },
          organizer: {
            id: adminUser._id,
            name: `${adminUser.firstName} ${adminUser.lastName}`,
            email: adminUser.email
          },
          status: 'published'
        }
      ];

      await Event.insertMany(events);
    });

    it('should get upcoming events only', async () => {
      const response = await request(app)
        .get('/api/v1/events/search/upcoming')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Future Event 1');
    });
  });
}); 