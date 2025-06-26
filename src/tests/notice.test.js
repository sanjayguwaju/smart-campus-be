const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../server');
const Notice = require('../models/notice.model');
const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt');

let mongoServer;
let adminToken;
let facultyToken;
let studentToken;
let adminUser;
let facultyUser;
let studentUser;
let testNotice;

describe('Notice API Tests', () => {
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
    await Notice.deleteMany({});
  });

  describe('POST /api/v1/notices', () => {
    it('should create a new notice with valid data', async () => {
      const noticeData = {
        title: 'Test Notice',
        content: 'This is a test notice content with sufficient length for validation.',
        type: 'announcement',
        category: 'all',
        priority: 'medium',
        summary: 'A test notice summary',
        tags: ['test', 'announcement'],
        contactInfo: {
          email: 'test@campus.com',
          phone: '1234567890'
        }
      };

      const response = await request(app)
        .post('/api/v1/notices')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(noticeData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(noticeData.title);
      expect(response.body.data.author.id).toBe(facultyUser._id.toString());
    });

    it('should reject notice creation without authentication', async () => {
      const noticeData = {
        title: 'Test Notice',
        content: 'This is a test notice content.',
        type: 'announcement',
        category: 'all'
      };

      await request(app)
        .post('/api/v1/notices')
        .send(noticeData)
        .expect(401);
    });

    it('should reject notice creation with invalid data', async () => {
      const noticeData = {
        title: '', // Invalid: empty title
        content: 'Short', // Invalid: too short
        type: 'invalid_type', // Invalid type
        category: 'all'
      };

      const response = await request(app)
        .post('/api/v1/notices')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(noticeData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/notices', () => {
    beforeEach(async () => {
      // Create test notices
      const notices = [
        {
          title: 'Academic Notice 1',
          content: 'First academic notice content',
          type: 'academic',
          category: 'undergraduate',
          priority: 'medium',
          author: {
            id: facultyUser._id,
            name: `${facultyUser.firstName} ${facultyUser.lastName}`,
            email: facultyUser.email,
            role: facultyUser.role
          },
          status: 'published',
          publishDate: new Date()
        },
        {
          title: 'Administrative Notice 1',
          content: 'First administrative notice content',
          type: 'administrative',
          category: 'all',
          priority: 'high',
          author: {
            id: adminUser._id,
            name: `${adminUser.firstName} ${adminUser.lastName}`,
            email: adminUser.email,
            role: adminUser.role
          },
          status: 'published',
          publishDate: new Date()
        }
      ];

      await Notice.insertMany(notices);
    });

    it('should get all notices with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/notices')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notices).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter notices by type', async () => {
      const response = await request(app)
        .get('/api/v1/notices?type=academic')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notices).toHaveLength(1);
      expect(response.body.data.notices[0].type).toBe('academic');
    });

    it('should search notices by title', async () => {
      const response = await request(app)
        .get('/api/v1/notices?search=Academic')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notices).toHaveLength(1);
      expect(response.body.data.notices[0].title).toContain('Academic');
    });
  });

  describe('GET /api/v1/notices/:id', () => {
    beforeEach(async () => {
      testNotice = new Notice({
        title: 'Test Notice',
        content: 'This is a test notice content.',
        type: 'announcement',
        category: 'all',
        author: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email,
          role: facultyUser.role
        },
        status: 'published',
        publishDate: new Date()
      });
      await testNotice.save();
    });

    it('should get notice by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/notices/${testNotice._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Notice');
    });

    it('should return 404 for non-existent notice', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/v1/notices/${fakeId}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/notices/:id', () => {
    beforeEach(async () => {
      testNotice = new Notice({
        title: 'Original Title',
        content: 'Original content',
        type: 'announcement',
        category: 'all',
        author: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email,
          role: facultyUser.role
        },
        status: 'published',
        publishDate: new Date()
      });
      await testNotice.save();
    });

    it('should update notice with valid data', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content with sufficient length'
      };

      const response = await request(app)
        .put(`/api/v1/notices/${testNotice._id}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.content).toBe('Updated content with sufficient length');
    });

    it('should reject update without authentication', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      await request(app)
        .put(`/api/v1/notices/${testNotice._id}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/v1/notices/:id', () => {
    beforeEach(async () => {
      testNotice = new Notice({
        title: 'Notice to Delete',
        content: 'This notice will be deleted',
        type: 'announcement',
        category: 'all',
        author: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email,
          role: facultyUser.role
        },
        status: 'published',
        publishDate: new Date()
      });
      await testNotice.save();
    });

    it('should delete notice with proper authorization', async () => {
      const response = await request(app)
        .delete(`/api/v1/notices/${testNotice._id}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify notice is deleted
      const deletedNotice = await Notice.findById(testNotice._id);
      expect(deletedNotice).toBeNull();
    });

    it('should reject deletion without authentication', async () => {
      await request(app)
        .delete(`/api/v1/notices/${testNotice._id}`)
        .expect(401);
    });
  });

  describe('POST /api/v1/notices/:id/like', () => {
    beforeEach(async () => {
      testNotice = new Notice({
        title: 'Like Test Notice',
        content: 'Notice for testing likes',
        type: 'announcement',
        category: 'all',
        author: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email,
          role: facultyUser.role
        },
        status: 'published',
        publishDate: new Date()
      });
      await testNotice.save();
    });

    it('should toggle like on notice', async () => {
      const response = await request(app)
        .post(`/api/v1/notices/${testNotice._id}/like`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isLiked).toBe(true);
      expect(response.body.data.likeCount).toBe(1);
    });

    it('should reject like without authentication', async () => {
      await request(app)
        .post(`/api/v1/notices/${testNotice._id}/like`)
        .expect(401);
    });
  });

  describe('POST /api/v1/notices/:id/bookmark', () => {
    beforeEach(async () => {
      testNotice = new Notice({
        title: 'Bookmark Test Notice',
        content: 'Notice for testing bookmarks',
        type: 'announcement',
        category: 'all',
        author: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email,
          role: facultyUser.role
        },
        status: 'published',
        publishDate: new Date()
      });
      await testNotice.save();
    });

    it('should toggle bookmark on notice', async () => {
      const response = await request(app)
        .post(`/api/v1/notices/${testNotice._id}/bookmark`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isBookmarked).toBe(true);
      expect(response.body.data.bookmarkCount).toBe(1);
    });

    it('should reject bookmark without authentication', async () => {
      await request(app)
        .post(`/api/v1/notices/${testNotice._id}/bookmark`)
        .expect(401);
    });
  });

  describe('POST /api/v1/notices/:id/comments', () => {
    beforeEach(async () => {
      testNotice = new Notice({
        title: 'Comment Test Notice',
        content: 'Notice for testing comments',
        type: 'announcement',
        category: 'all',
        author: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email,
          role: facultyUser.role
        },
        status: 'published',
        publishDate: new Date(),
        settings: {
          allowComments: true
        }
      });
      await testNotice.save();
    });

    it('should add comment to notice', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/v1/notices/${testNotice._id}/comments`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('This is a test comment');
    });

    it('should reject comment without authentication', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      await request(app)
        .post(`/api/v1/notices/${testNotice._id}/comments`)
        .send(commentData)
        .expect(401);
    });

    it('should reject comment with empty content', async () => {
      const commentData = {
        content: ''
      };

      const response = await request(app)
        .post(`/api/v1/notices/${testNotice._id}/comments`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(commentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/notices/urgent', () => {
    beforeEach(async () => {
      const notices = [
        {
          title: 'Urgent Notice 1',
          content: 'First urgent notice',
          type: 'emergency',
          category: 'all',
          priority: 'urgent',
          author: {
            id: adminUser._id,
            name: `${adminUser.firstName} ${adminUser.lastName}`,
            email: adminUser.email,
            role: adminUser.role
          },
          status: 'published',
          publishDate: new Date()
        },
        {
          title: 'Regular Notice 1',
          content: 'First regular notice',
          type: 'announcement',
          category: 'all',
          priority: 'medium',
          author: {
            id: facultyUser._id,
            name: `${facultyUser.firstName} ${facultyUser.lastName}`,
            email: facultyUser.email,
            role: facultyUser.role
          },
          status: 'published',
          publishDate: new Date()
        }
      ];

      await Notice.insertMany(notices);
    });

    it('should get urgent notices only', async () => {
      const response = await request(app)
        .get('/api/v1/notices/urgent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].priority).toBe('urgent');
    });
  });

  describe('GET /api/v1/notices/featured', () => {
    beforeEach(async () => {
      const notices = [
        {
          title: 'Featured Notice 1',
          content: 'First featured notice',
          type: 'announcement',
          category: 'all',
          author: {
            id: facultyUser._id,
            name: `${facultyUser.firstName} ${facultyUser.lastName}`,
            email: facultyUser.email,
            role: facultyUser.role
          },
          status: 'published',
          publishDate: new Date(),
          settings: {
            featured: true
          }
        },
        {
          title: 'Regular Notice 1',
          content: 'First regular notice',
          type: 'announcement',
          category: 'all',
          author: {
            id: facultyUser._id,
            name: `${facultyUser.firstName} ${facultyUser.lastName}`,
            email: facultyUser.email,
            role: facultyUser.role
          },
          status: 'published',
          publishDate: new Date(),
          settings: {
            featured: false
          }
        }
      ];

      await Notice.insertMany(notices);
    });

    it('should get featured notices only', async () => {
      const response = await request(app)
        .get('/api/v1/notices/featured')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Featured Notice 1');
    });
  });

  describe('GET /api/v1/notices/search', () => {
    beforeEach(async () => {
      const notices = [
        {
          title: 'Academic Search Notice',
          content: 'This notice contains academic content',
          type: 'academic',
          category: 'undergraduate',
          author: {
            id: facultyUser._id,
            name: `${facultyUser.firstName} ${facultyUser.lastName}`,
            email: facultyUser.email,
            role: facultyUser.role
          },
          status: 'published',
          publishDate: new Date()
        },
        {
          title: 'Administrative Notice',
          content: 'This notice contains administrative content',
          type: 'administrative',
          category: 'all',
          author: {
            id: adminUser._id,
            name: `${adminUser.firstName} ${adminUser.lastName}`,
            email: adminUser.email,
            role: adminUser.role
          },
          status: 'published',
          publishDate: new Date()
        }
      ];

      await Notice.insertMany(notices);
    });

    it('should search notices by term', async () => {
      const response = await request(app)
        .get('/api/v1/notices/search?q=academic')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toContain('Academic');
    });

    it('should require search term', async () => {
      await request(app)
        .get('/api/v1/notices/search')
        .expect(400);
    });
  });

  describe('GET /api/v1/notices/bookmarked', () => {
    beforeEach(async () => {
      testNotice = new Notice({
        title: 'Bookmarked Notice',
        content: 'This notice will be bookmarked',
        type: 'announcement',
        category: 'all',
        author: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email,
          role: facultyUser.role
        },
        status: 'published',
        publishDate: new Date(),
        engagement: {
          bookmarks: [{
            userId: studentUser._id,
            bookmarkedAt: new Date()
          }]
        }
      });
      await testNotice.save();
    });

    it('should get user bookmarked notices', async () => {
      const response = await request(app)
        .get('/api/v1/notices/bookmarked')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notices).toHaveLength(1);
      expect(response.body.data.notices[0].title).toBe('Bookmarked Notice');
    });

    it('should reject without authentication', async () => {
      await request(app)
        .get('/api/v1/notices/bookmarked')
        .expect(401);
    });
  });

  describe('GET /api/v1/notices/:id/statistics', () => {
    beforeEach(async () => {
      testNotice = new Notice({
        title: 'Statistics Test Notice',
        content: 'Notice for testing statistics',
        type: 'announcement',
        category: 'all',
        author: {
          id: facultyUser._id,
          name: `${facultyUser.firstName} ${facultyUser.lastName}`,
          email: facultyUser.email,
          role: facultyUser.role
        },
        status: 'published',
        publishDate: new Date(),
        statistics: {
          views: 10,
          uniqueViews: 8,
          downloads: 5,
          shares: 2
        },
        engagement: {
          likes: [{ userId: studentUser._id }],
          comments: [{ userId: studentUser._id, userName: 'Test User', content: 'Test comment' }],
          bookmarks: [{ userId: studentUser._id }]
        }
      });
      await testNotice.save();
    });

    it('should get notice statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/notices/${testNotice._id}/statistics`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.views).toBe(10);
      expect(response.body.data.likes).toBe(1);
      expect(response.body.data.comments).toBe(1);
      expect(response.body.data.bookmarks).toBe(1);
    });

    it('should reject without authentication', async () => {
      await request(app)
        .get(`/api/v1/notices/${testNotice._id}/statistics`)
        .expect(401);
    });
  });

  describe('POST /api/v1/notices/bulk', () => {
    beforeEach(async () => {
      const notices = [
        {
          title: 'Bulk Test Notice 1',
          content: 'First notice for bulk operations',
          type: 'announcement',
          category: 'all',
          author: {
            id: facultyUser._id,
            name: `${facultyUser.firstName} ${facultyUser.lastName}`,
            email: facultyUser.email,
            role: facultyUser.role
          },
          status: 'draft',
          publishDate: new Date()
        },
        {
          title: 'Bulk Test Notice 2',
          content: 'Second notice for bulk operations',
          type: 'announcement',
          category: 'all',
          author: {
            id: facultyUser._id,
            name: `${facultyUser.firstName} ${facultyUser.lastName}`,
            email: facultyUser.email,
            role: facultyUser.role
          },
          status: 'draft',
          publishDate: new Date()
        }
      ];

      await Notice.insertMany(notices);
    });

    it('should perform bulk publish operation', async () => {
      const notices = await Notice.find({ title: /Bulk Test Notice/ });
      const noticeIds = notices.map(notice => notice._id.toString());

      const response = await request(app)
        .post('/api/v1/notices/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          noticeIds,
          action: 'publish'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.modifiedCount).toBe(2);
    });

    it('should reject bulk operation without authentication', async () => {
      const notices = await Notice.find({ title: /Bulk Test Notice/ });
      const noticeIds = notices.map(notice => notice._id.toString());

      await request(app)
        .post('/api/v1/notices/bulk')
        .send({
          noticeIds,
          action: 'publish'
        })
        .expect(401);
    });
  });
}); 