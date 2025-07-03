const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Event = require('../models/event.model');
const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt');
const eventController = require('../controllers/event.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Create a minimal Express app for testing
const app = express();
app.use(express.json());

// Mock the auth middleware for testing
const mockAuthMiddleware = (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  // Simple token validation for testing
  if (token === 'admin-token') {
    req.user = { id: 'admin-user-id', role: 'admin' };
  } else if (token === 'faculty-token') {
    req.user = { id: 'faculty-user-id', role: 'faculty' };
  } else if (token === 'student-token') {
    req.user = { id: 'student-user-id', role: 'student' };
  } else {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  
  next();
};

const mockAuthorizeMiddleware = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

// Add the publish route
app.put('/api/events/:eventId/publish', 
  mockAuthMiddleware, 
  mockAuthorizeMiddleware(['admin', 'faculty']), 
  eventController.publishEvent
);

let mongoServer;
let adminUser, facultyUser, studentUser;
let testEvent;

describe('Event Publish/Unpublish API', () => {
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
      isActive: true,
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
      isActive: true,
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
      isActive: true,
      studentId: 'STU001',
      department: 'Computer Science',
      phone: '1234567892'
    });
    await studentUser.save();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Event.deleteMany({});
    
    // Create test event
    testEvent = new Event({
      title: 'Test Event',
      description: 'Test event description',
      type: 'academic',
      category: 'undergraduate',
      startDate: new Date('2024-12-31'),
      endDate: new Date('2024-12-31'),
      location: {
        venue: 'Test Venue',
        address: 'Test Address'
      },
      organizer: adminUser._id,
      status: 'draft',
      isPublished: false
    });
    await testEvent.save();
  });

  describe('PUT /api/events/:eventId/publish', () => {
    it('should publish an event when admin sets isPublished to true', async () => {
      const response = await request(app)
        .put(`/api/events/${testEvent._id}/publish`)
        .set('Authorization', 'Bearer admin-token')
        .send({ isPublished: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Event published successfully');
      expect(response.body.data.event.isPublished).toBe(true);
      expect(response.body.data.event.status).toBe('published');
    });

    it('should unpublish an event when admin sets isPublished to false', async () => {
      const response = await request(app)
        .put(`/api/events/${testEvent._id}/publish`)
        .set('Authorization', 'Bearer admin-token')
        .send({ isPublished: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Event unpublished successfully');
      expect(response.body.data.event.isPublished).toBe(false);
      expect(response.body.data.event.status).toBe('draft');
    });

    it('should allow faculty to publish/unpublish events', async () => {
      const response = await request(app)
        .put(`/api/events/${testEvent._id}/publish`)
        .set('Authorization', 'Bearer faculty-token')
        .send({ isPublished: true })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject request from student user', async () => {
      const response = await request(app)
        .put(`/api/events/${testEvent._id}/publish`)
        .set('Authorization', 'Bearer student-token')
        .send({ isPublished: true })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reject request without authentication', async () => {
      const response = await request(app)
        .put(`/api/events/${testEvent._id}/publish`)
        .send({ isPublished: true })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid isPublished value', async () => {
      const response = await request(app)
        .put(`/api/events/${testEvent._id}/publish`)
        .set('Authorization', 'Bearer admin-token')
        .send({ isPublished: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('isPublished must be a boolean value');
    });

    it('should reject request for non-existent event', async () => {
      const fakeEventId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/events/${fakeEventId}/publish`)
        .set('Authorization', 'Bearer admin-token')
        .send({ isPublished: true })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
}); 