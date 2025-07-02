const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/user.model');
const userService = require('../services/user.service');

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
  await User.deleteMany({});
});

describe('Admin Password Reset', () => {
  let adminUser;
  let regularUser;
  let adminToken;

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      password: 'AdminPass123',
      role: 'admin',
      isActive: true
    });

    // Create regular user
    regularUser = await User.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@test.com',
      password: 'UserPass123',
      role: 'student',
      isActive: true
    });

    // Login admin user to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'AdminPass123'
      });

    adminToken = loginResponse.body.data.accessToken;
  });

  test('should allow admin to reset user password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: regularUser._id.toString(),
        newPassword: 'NewPass123',
        confirmPassword: 'NewPass123'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Password reset successfully');

    // Verify the password was actually changed
    const updatedUser = await User.findById(regularUser._id).select('+password');
    const isPasswordValid = await updatedUser.comparePassword('NewPass123');
    expect(isPasswordValid).toBe(true);
  });

  test('should not allow non-admin users to reset passwords', async () => {
    // Login as regular user
    const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@test.com',
        password: 'UserPass123'
      });

    const userToken = userLoginResponse.body.data.accessToken;

    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        userId: adminUser._id.toString(),
        newPassword: 'NewPass123',
        confirmPassword: 'NewPass123'
      });

    expect(response.status).toBe(403);
  });

  test('should validate user ID format', async () => {
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: 'invalid-user-id',
        newPassword: 'NewPass123',
        confirmPassword: 'NewPass123'
      });

    expect(response.status).toBe(400);
  });

  test('should validate password requirements', async () => {
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: regularUser._id.toString(),
        newPassword: 'weak',
        confirmPassword: 'weak'
      });

    expect(response.status).toBe(400);
  });

  test('should validate password confirmation', async () => {
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: regularUser._id.toString(),
        newPassword: 'NewPass123',
        confirmPassword: 'DifferentPass123'
      });

    expect(response.status).toBe(400);
  });

  test('should return error for non-existent user', async () => {
    const fakeUserId = new mongoose.Types.ObjectId();
    
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: fakeUserId.toString(),
        newPassword: 'NewPass123',
        confirmPassword: 'NewPass123'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Target user not found');
  });
}); 