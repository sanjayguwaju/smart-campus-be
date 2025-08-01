const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');
const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt');

describe('Bulk User Creation API', () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    // Create admin user for testing
    adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@smartcampus.com',
      password: 'Admin@123',
      role: 'admin',
      isActive: true
    });
    await adminUser.save();

    adminToken = generateToken({
      userId: adminUser._id,
      email: adminUser.email,
      role: adminUser.role
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up users except admin
    await User.deleteMany({ email: { $ne: 'admin@smartcampus.com' } });
  });

  describe('POST /api/v1/users/bulk', () => {
    it('should create multiple users successfully', async () => {
      const userData = {
        users: [
          {
            firstName: 'Krishna',
            lastName: 'Lama',
            role: 'student',
            department: 'Computer Science'
          },
          {
            firstName: 'John',
            lastName: 'Doe',
            role: 'faculty',
            department: 'Mathematics'
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'student'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Bulk user creation completed');
      expect(response.body.data.created).toHaveLength(3);
      expect(response.body.data.failed).toHaveLength(0);
      expect(response.body.data.summary.total).toBe(3);
      expect(response.body.data.summary.created).toBe(3);
      expect(response.body.data.summary.failed).toBe(0);

      // Verify created users
      const createdUsers = response.body.data.created;
      expect(createdUsers[0].firstName).toBe('Krishna');
      expect(createdUsers[0].lastName).toBe('Lama');
      expect(createdUsers[0].email).toMatch(/^krishna\.lama(@smartcampus\.com|001@smartcampus\.com|002@smartcampus\.com)$/);
      expect(createdUsers[0].role).toBe('student');
      expect(createdUsers[0].isActive).toBe(true);
      expect(createdUsers[0].phone).toMatch(/^98\d{8}$/);

      expect(createdUsers[1].firstName).toBe('John');
      expect(createdUsers[1].lastName).toBe('Doe');
      expect(createdUsers[1].email).toMatch(/^john\.doe(@smartcampus\.com|001@smartcampus\.com|002@smartcampus\.com)$/);
      expect(createdUsers[1].role).toBe('faculty');
    });

    it('should handle duplicate users gracefully', async () => {
      // First, create a user manually
      const existingUser = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@smartcampus.com',
        password: 'John@123',
        role: 'faculty',
        isActive: true
      });
      await existingUser.save();

      const userData = {
        users: [
          {
            firstName: 'John',
            lastName: 'Doe',
            role: 'faculty'
          },
          {
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'student'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.data.created).toHaveLength(1);
      expect(response.body.data.failed).toHaveLength(1);
      expect(response.body.data.summary.total).toBe(2);
      expect(response.body.data.summary.created).toBe(1);
      expect(response.body.data.summary.failed).toBe(1);

      // Verify failed user details
      const failedUser = response.body.data.failed[0];
      expect(failedUser.userData.firstName).toBe('John');
      expect(failedUser.userData.lastName).toBe('Doe');
      expect(failedUser.error).toBe('User with this email already exists');
      expect(failedUser.generatedEmail).toBe('john.doe@smartcampus.com');
    });

    it('should validate required fields', async () => {
      const userData = {
        users: [
          {
            firstName: '',
            lastName: 'Lama',
            role: 'student'
          },
          {
            firstName: 'John',
            lastName: '',
            role: 'faculty'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should validate role values', async () => {
      const userData = {
        users: [
          {
            firstName: 'John',
            lastName: 'Doe',
            role: 'invalid_role'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should limit array size to 100', async () => {
      const users = Array.from({ length: 101 }, (_, i) => ({
        firstName: `User${i}`,
        lastName: 'Test',
        role: 'student'
      }));

      const userData = { users };

      const response = await request(app)
        .post('/api/v1/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should require authentication', async () => {
      const userData = {
        users: [
          {
            firstName: 'John',
            lastName: 'Doe',
            role: 'student'
          }
        ]
      };

      await request(app)
        .post('/api/v1/users/bulk')
        .send(userData)
        .expect(401);
    });

    it('should require admin privileges', async () => {
      // Create a non-admin user
      const regularUser = new User({
        firstName: 'Regular',
        lastName: 'User',
        email: 'regular@smartcampus.com',
        password: 'Regular@123',
        role: 'student',
        isActive: true
      });
      await regularUser.save();

      const regularToken = generateToken({
        userId: regularUser._id,
        email: regularUser.email,
        role: regularUser.role
      });

      const userData = {
        users: [
          {
            firstName: 'John',
            lastName: 'Doe',
            role: 'student'
          }
        ]
      };

      await request(app)
        .post('/api/v1/users/bulk')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(userData)
        .expect(403);
    });

    it('should handle empty array', async () => {
      const userData = { users: [] };

      const response = await request(app)
        .post('/api/v1/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should generate unique phone numbers', async () => {
      const userData = {
        users: [
          {
            firstName: 'User1',
            lastName: 'Test',
            role: 'student'
          },
          {
            firstName: 'User2',
            lastName: 'Test',
            role: 'student'
          },
          {
            firstName: 'User3',
            lastName: 'Test',
            role: 'student'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      const createdUsers = response.body.data.created;
      const phoneNumbers = createdUsers.map(user => user.phone);
      
      // Check that all phone numbers are unique
      const uniquePhoneNumbers = new Set(phoneNumbers);
      expect(uniquePhoneNumbers.size).toBe(phoneNumbers.length);
      
      // Check that all phone numbers match the pattern
      phoneNumbers.forEach(phone => {
        expect(phone).toMatch(/^98\d{8}$/);
      });
    });

    it('should generate unique emails with suffixes when duplicates exist', async () => {
      // First, create a user with the same name
      const existingUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@smartcampus.com',
        password: 'Test@123',
        role: 'student',
        isActive: true
      });
      await existingUser.save();

      const userData = {
        users: [
          {
            firstName: 'Test',
            lastName: 'User',
            role: 'student'
          },
          {
            firstName: 'Test',
            lastName: 'User',
            role: 'faculty'
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/users/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.data.created).toHaveLength(2);
      
      const createdUsers = response.body.data.created;
      const emails = createdUsers.map(user => user.email);
      
      // Should have unique emails
      expect(emails[0]).toBe('test.user001@smartcampus.com');
      expect(emails[1]).toBe('test.user002@smartcampus.com');
      
      // All emails should be unique
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(emails.length);
    });
  });
}); 