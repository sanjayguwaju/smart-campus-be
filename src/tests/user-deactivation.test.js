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

describe('User Deactivation', () => {
  let adminUser;
  let regularUser;
  let facultyUser;
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

    // Create faculty user
    facultyUser = await User.create({
      firstName: 'Faculty',
      lastName: 'User',
      email: 'faculty@test.com',
      password: 'FacultyPass123',
      role: 'faculty',
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

  test('should allow admin to deactivate a regular user', async () => {
    const response = await request(app)
      .patch(`/api/v1/users/${regularUser._id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('User deactivated successfully');

    // Verify the user was actually deactivated
    const updatedUser = await User.findById(regularUser._id);
    expect(updatedUser.isActive).toBe(false);
  });

  test('should allow admin to deactivate a faculty user', async () => {
    const response = await request(app)
      .patch(`/api/v1/users/${facultyUser._id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('User deactivated successfully');

    // Verify the user was actually deactivated
    const updatedUser = await User.findById(facultyUser._id);
    expect(updatedUser.isActive).toBe(false);
  });

  test('should not allow admin to deactivate themselves', async () => {
    const response = await request(app)
      .patch(`/api/v1/users/${adminUser._id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Admin cannot deactivate their own account');
  });

  test('should not allow admin to deactivate other admin accounts', async () => {
    // Create another admin user
    const anotherAdmin = await User.create({
      firstName: 'Another',
      lastName: 'Admin',
      email: 'another.admin@test.com',
      password: 'AnotherAdminPass123',
      role: 'admin',
      isActive: true
    });

    const response = await request(app)
      .patch(`/api/v1/users/${anotherAdmin._id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Cannot deactivate admin accounts');
  });

  test('should not allow non-admin users to deactivate users', async () => {
    // Login as regular user
    const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@test.com',
        password: 'UserPass123'
      });

    const userToken = userLoginResponse.body.data.accessToken;

    const response = await request(app)
      .patch(`/api/v1/users/${facultyUser._id}/deactivate`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });

  test('should return error for non-existent user', async () => {
    const fakeUserId = new mongoose.Types.ObjectId();
    
    const response = await request(app)
      .patch(`/api/v1/users/${fakeUserId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Target user not found');
  });

  test('should validate user ID format', async () => {
    const response = await request(app)
      .patch('/api/v1/users/invalid-user-id/deactivate')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });
});

describe('User Activation', () => {
  let adminUser;
  let deactivatedUser;
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

    // Create deactivated user
    deactivatedUser = await User.create({
      firstName: 'Deactivated',
      lastName: 'User',
      email: 'deactivated@test.com',
      password: 'UserPass123',
      role: 'student',
      isActive: false
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

  test('should allow admin to activate a deactivated user', async () => {
    const response = await request(app)
      .patch(`/api/v1/users/${deactivatedUser._id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('User activated successfully');

    // Verify the user was actually activated
    const updatedUser = await User.findById(deactivatedUser._id);
    expect(updatedUser.isActive).toBe(true);
  });

  test('should not allow non-admin users to activate users', async () => {
    // Create and login as regular user
    const regularUser = await User.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'regular@test.com',
      password: 'RegularPass123',
      role: 'student',
      isActive: true
    });

    const userLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'regular@test.com',
        password: 'RegularPass123'
      });

    const userToken = userLoginResponse.body.data.accessToken;

    const response = await request(app)
      .patch(`/api/v1/users/${deactivatedUser._id}/activate`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });

  test('should return error for non-existent user', async () => {
    const fakeUserId = new mongoose.Types.ObjectId();
    
    const response = await request(app)
      .patch(`/api/v1/users/${fakeUserId}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Target user not found');
  });
});

describe('Toggle User Status', () => {
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

  test('should allow admin to deactivate user using toggle status', async () => {
    const response = await request(app)
      .patch(`/api/v1/users/${regularUser._id}/toggle-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isActive: false
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User deactivated successfully');

    // Verify the user was actually deactivated
    const updatedUser = await User.findById(regularUser._id);
    expect(updatedUser.isActive).toBe(false);
  });

  test('should allow admin to activate user using toggle status', async () => {
    // First deactivate the user
    regularUser.isActive = false;
    await regularUser.save();

    const response = await request(app)
      .patch(`/api/v1/users/${regularUser._id}/toggle-status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isActive: true
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User activated successfully');

    // Verify the user was actually activated
    const updatedUser = await User.findById(regularUser._id);
    expect(updatedUser.isActive).toBe(true);
  });
}); 