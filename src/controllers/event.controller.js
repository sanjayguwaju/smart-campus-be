const eventService = require('../services/event.service');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - eventType
 *         - category
 *         - startDate
 *         - endDate
 *         - startTime
 *         - endTime
 *         - location
 *         - organizer
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 1000
 *         shortDescription:
 *           type: string
 *           maxLength: 200
 *         eventType:
 *           type: string
 *           enum: [academic, cultural, sports, technical, social, workshop, seminar, conference, other]
 *         category:
 *           type: string
 *           enum: [student, faculty, admin, public, invitation-only]
 *         startDate:
 *           type: string
 *           format: date
 *         endDate:
 *           type: string
 *           format: date
 *         startTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         endTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *         location:
 *           type: object
 *           properties:
 *             venue:
 *               type: string
 *             room:
 *               type: string
 *             building:
 *               type: string
 *             campus:
 *               type: string
 *         organizer:
 *           type: string
 *           format: uuid
 *         coOrganizers:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         maxAttendees:
 *           type: integer
 *           minimum: 1
 *         registrationDeadline:
 *           type: string
 *           format: date
 *         isRegistrationRequired:
 *           type: boolean
 *         isRegistrationOpen:
 *           type: boolean
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [draft, published, cancelled, completed, postponed]
 *         visibility:
 *           type: string
 *           enum: [public, private, restricted]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         featured:
 *           type: boolean
 */

class EventController {
  /**
   * @swagger
   * /api/events:
   *   post:
   *     summary: Create a new event
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Event'
   *     responses:
   *       201:
   *         description: Event created successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  async createEvent(req, res) {
    try {
      const eventData = req.body;
      const userId = req.user.id;

      const event = await eventService.createEvent(eventData, userId);

      logger.info(`Event created successfully: ${event._id}`);
      return successResponse(res, 'Event created successfully', event, 201);
    } catch (error) {
      logger.error('Error in createEvent controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events:
   *   get:
   *     summary: Get all events with filtering and pagination
   *     tags: [Events]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Number of items per page
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search query
   *       - in: query
   *         name: eventType
   *         schema:
   *           type: string
   *           enum: [academic, cultural, sports, technical, social, workshop, seminar, conference, other]
   *         description: Filter by event type
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [student, faculty, admin, public, invitation-only]
   *         description: Filter by category
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, published, cancelled, completed, postponed]
   *         description: Filter by status
   *       - in: query
   *         name: featured
   *         schema:
   *           type: boolean
   *         description: Filter by featured status
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter events from this date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *         description: Filter events until this date
   *       - in: query
   *         name: organizer
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filter by organizer ID
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [title, startDate, endDate, createdAt, updatedAt, priority, featured]
   *         description: Sort field
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *         description: Sort order
   *     responses:
   *       200:
   *         description: Events retrieved successfully
   *       400:
   *         description: Validation error
   */
  async getEvents(req, res) {
    try {
      const query = req.query;
      const result = await eventService.getEvents(query);

      logger.info(`Events retrieved successfully. Total: ${result.pagination.total}`);
      return successResponse(res, 'Events retrieved successfully', result);
    } catch (error) {
      logger.error('Error in getEvents controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/all:
   *   get:
   *     summary: Get all events without pagination
   *     tags: [Events]
   *     parameters:
   *       - in: query
   *         name: eventType
   *         schema:
   *           type: string
   *           enum: [academic, cultural, sports, technical, social, workshop, seminar, conference, other]
   *         description: Filter by event type
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [student, faculty, admin, public, invitation-only]
   *         description: Filter by category
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, published, cancelled, completed, postponed]
   *         description: Filter by status
   *       - in: query
   *         name: featured
   *         schema:
   *           type: boolean
   *         description: Filter by featured status
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [title, startDate, endDate, createdAt, updatedAt, priority, featured]
   *         description: Sort field
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *         description: Sort order
   *     responses:
   *       200:
   *         description: All events retrieved successfully
   *       400:
   *         description: Validation error
   */
  async getAllEvents(req, res) {
    try {
      const query = req.query;
      const events = await eventService.getAllEvents(query);

      logger.info(`All events retrieved successfully. Count: ${events.length}`);
      return successResponse(res, 'All events retrieved successfully', events);
    } catch (error) {
      logger.error('Error in getAllEvents controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}:
   *   get:
   *     summary: Get event by ID
   *     tags: [Events]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *     responses:
   *       200:
   *         description: Event retrieved successfully
   *       404:
   *         description: Event not found
   */
  async getEventById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const event = await eventService.getEventById(id, userId);

      logger.info(`Event retrieved successfully: ${id}`);
      return successResponse(res, 'Event retrieved successfully', event);
    } catch (error) {
      logger.error('Error in getEventById controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}:
   *   put:
   *     summary: Update event
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Event'
   *     responses:
   *       200:
   *         description: Event updated successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Event not found
   */
  async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const event = await eventService.updateEvent(id, updateData, userId);

      logger.info(`Event updated successfully: ${id}`);
      return successResponse(res, 'Event updated successfully', event);
    } catch (error) {
      logger.error('Error in updateEvent controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}:
   *   delete:
   *     summary: Delete event
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *     responses:
   *       200:
   *         description: Event deleted successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Event not found
   */
  async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await eventService.deleteEvent(id, userId);

      logger.info(`Event deleted successfully: ${id}`);
      return successResponse(res, result.message, result);
    } catch (error) {
      logger.error('Error in deleteEvent controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/register:
   *   post:
   *     summary: Register for an event
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *     responses:
   *       200:
   *         description: Registration successful
   *       400:
   *         description: Registration failed
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Event not found
   */
  async registerForEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await eventService.registerForEvent(id, userId);

      logger.info(`User ${userId} registered for event ${id}`);
      return successResponse(res, result.message, result);
    } catch (error) {
      logger.error('Error in registerForEvent controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/cancel-registration:
   *   post:
   *     summary: Cancel event registration
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *     responses:
   *       200:
   *         description: Registration cancelled successfully
   *       400:
   *         description: Cancellation failed
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Event not found
   */
  async cancelRegistration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await eventService.cancelRegistration(id, userId);

      logger.info(`User ${userId} cancelled registration for event ${id}`);
      return successResponse(res, result.message, result);
    } catch (error) {
      logger.error('Error in cancelRegistration controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/mark-attended:
   *   post:
   *     summary: Mark user as attended (Admin/Organizer only)
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       200:
   *         description: Attendance marked successfully
   *       400:
   *         description: Operation failed
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Event not found
   */
  async markAttended(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const adminUserId = req.user.id;

      const result = await eventService.markAttended(id, userId, adminUserId);

      logger.info(`User ${userId} marked as attended for event ${id} by admin ${adminUserId}`);
      return successResponse(res, result.message, result);
    } catch (error) {
      logger.error('Error in markAttended controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/review:
   *   post:
   *     summary: Add review to event
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - rating
   *             properties:
   *               rating:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *               comment:
   *                 type: string
   *                 maxLength: 500
   *     responses:
   *       200:
   *         description: Review added successfully
   *       400:
   *         description: Review failed
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Event not found
   */
  async addReview(req, res) {
    try {
      const { id } = req.params;
      const reviewData = req.body;
      const userId = req.user.id;

      const result = await eventService.addReview(id, userId, reviewData);

      logger.info(`Review added to event ${id} by user ${userId}`);
      return successResponse(res, result.message, result);
    } catch (error) {
      logger.error('Error in addReview controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/upcoming:
   *   get:
   *     summary: Get upcoming events
   *     tags: [Events]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *         description: Number of events to return
   *     responses:
   *       200:
   *         description: Upcoming events retrieved successfully
   */
  async getUpcomingEvents(req, res) {
    try {
      const { limit = 10 } = req.query;
      const events = await eventService.getUpcomingEvents(parseInt(limit));

      logger.info(`Upcoming events retrieved successfully. Count: ${events.length}`);
      return successResponse(res, 'Upcoming events retrieved successfully', events);
    } catch (error) {
      logger.error('Error in getUpcomingEvents controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/featured:
   *   get:
   *     summary: Get featured events
   *     tags: [Events]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 20
   *         description: Number of events to return
   *     responses:
   *       200:
   *         description: Featured events retrieved successfully
   */
  async getFeaturedEvents(req, res) {
    try {
      const { limit = 5 } = req.query;
      const events = await eventService.getFeaturedEvents(parseInt(limit));

      logger.info(`Featured events retrieved successfully. Count: ${events.length}`);
      return successResponse(res, 'Featured events retrieved successfully', events);
    } catch (error) {
      logger.error('Error in getFeaturedEvents controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/organizer/{organizerId}:
   *   get:
   *     summary: Get events by organizer
   *     tags: [Events]
   *     parameters:
   *       - in: path
   *         name: organizerId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Organizer ID
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Number of items per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, published, cancelled, completed, postponed]
   *         description: Filter by status
   *     responses:
   *       200:
   *         description: Events retrieved successfully
   */
  async getEventsByOrganizer(req, res) {
    try {
      const { organizerId } = req.params;
      const query = req.query;

      const result = await eventService.getEventsByOrganizer(organizerId, query);

      logger.info(`Events by organizer retrieved successfully. Organizer: ${organizerId}, Total: ${result.pagination.total}`);
      return successResponse(res, 'Events by organizer retrieved successfully', result);
    } catch (error) {
      logger.error('Error in getEventsByOrganizer controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/my-registrations:
   *   get:
   *     summary: Get user's registered events
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Number of items per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [registered, attended, cancelled, waitlist]
   *         description: Filter by registration status
   *     responses:
   *       200:
   *         description: User's registered events retrieved successfully
   *       401:
   *         description: Unauthorized
   */
  async getUserRegisteredEvents(req, res) {
    try {
      const userId = req.user.id;
      const query = req.query;

      const result = await eventService.getUserRegisteredEvents(userId, query);

      logger.info(`User's registered events retrieved successfully. User: ${userId}, Total: ${result.pagination.total}`);
      return successResponse(res, 'User\'s registered events retrieved successfully', result);
    } catch (error) {
      logger.error('Error in getUserRegisteredEvents controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/statistics:
   *   get:
   *     summary: Get event statistics
   *     tags: [Events]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *     responses:
   *       200:
   *         description: Event statistics retrieved successfully
   *       404:
   *         description: Event not found
   */
  async getEventStatistics(req, res) {
    try {
      const { id } = req.params;

      const statistics = await eventService.getEventStatistics(id);

      logger.info(`Event statistics retrieved successfully: ${id}`);
      return successResponse(res, 'Event statistics retrieved successfully', statistics);
    } catch (error) {
      logger.error('Error in getEventStatistics controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/search:
   *   get:
   *     summary: Search events
   *     tags: [Events]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Number of items per page
   *       - in: query
   *         name: eventType
   *         schema:
   *           type: string
   *           enum: [academic, cultural, sports, technical, social, workshop, seminar, conference, other]
   *         description: Filter by event type
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *           enum: [student, faculty, admin, public, invitation-only]
   *         description: Filter by category
   *     responses:
   *       200:
   *         description: Search results retrieved successfully
   */
  async searchEvents(req, res) {
    try {
      const { q: searchQuery, ...query } = req.query;

      if (!searchQuery) {
        return errorResponse(res, 'Search query is required', 400);
      }

      const result = await eventService.searchEvents(searchQuery, query);

      logger.info(`Event search completed. Query: "${searchQuery}", Results: ${result.pagination.total}`);
      return successResponse(res, 'Search results retrieved successfully', result);
    } catch (error) {
      logger.error('Error in searchEvents controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/unregister:
   *   delete:
   *     summary: Unregister from an event
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *     responses:
   *       200:
   *         description: Unregistration successful
   *       400:
   *         description: Unregistration failed
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Event not found
   */
  async unregisterFromEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await eventService.cancelRegistration(id, userId);

      logger.info(`User ${userId} unregistered from event ${id}`);
      return successResponse(res, result.message, result);
    } catch (error) {
      logger.error('Error in unregisterFromEvent controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/mark-attendance:
   *   post:
   *     summary: Mark user attendance (Admin/Organizer only)
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       200:
   *         description: Attendance marked successfully
   *       400:
   *         description: Operation failed
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Event not found
   */
  async markAttendance(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      const adminUserId = req.user.id;

      const result = await eventService.markAttended(id, userId, adminUserId);

      logger.info(`User ${userId} marked as attended for event ${id} by admin ${adminUserId}`);
      return successResponse(res, result.message, result);
    } catch (error) {
      logger.error('Error in markAttendance controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/attendees:
   *   get:
   *     summary: Get event attendees (Admin/Organizer only)
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [registered, attended, cancelled, waitlist]
   *         description: Filter by registration status
   *     responses:
   *       200:
   *         description: Event attendees retrieved successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Event not found
   */
  async getEventAttendees(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.query;

      const attendees = await eventService.getEventAttendees(id, status);

      logger.info(`Event attendees retrieved successfully: ${id}`);
      return successResponse(res, 'Event attendees retrieved successfully', attendees);
    } catch (error) {
      logger.error('Error in getEventAttendees controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/reviews:
   *   get:
   *     summary: Get event reviews
   *     tags: [Events]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: Event reviews retrieved successfully
   *       404:
   *         description: Event not found
   */
  async getEventReviews(req, res) {
    try {
      const { id } = req.params;
      const query = req.query;

      const result = await eventService.getEventReviews(id, query);

      logger.info(`Event reviews retrieved successfully: ${id}`);
      return successResponse(res, 'Event reviews retrieved successfully', result);
    } catch (error) {
      logger.error('Error in getEventReviews controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/reviews:
   *   post:
   *     summary: Add review to event
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Event ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - rating
   *             properties:
   *               rating:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *               comment:
   *                 type: string
   *                 maxLength: 500
   *     responses:
   *       200:
   *         description: Review added successfully
   *       400:
   *         description: Review failed
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Event not found
   */
  async addEventReview(req, res) {
    try {
      const { id } = req.params;
      const reviewData = req.body;
      const userId = req.user.id;

      const result = await eventService.addReview(id, userId, reviewData);

      logger.info(`Review added to event ${id} by user ${userId}`);
      return successResponse(res, result.message, result);
    } catch (error) {
      logger.error('Error in addEventReview controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * @swagger
   * /api/events/search/my-events:
   *   get:
   *     summary: Get user's events (created and organized)
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *         description: Number of items per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [draft, published, cancelled, completed, postponed]
   *         description: Filter by status
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [created, organized, both]
   *           default: both
   *         description: Type of events to retrieve
   *     responses:
   *       200:
   *         description: User's events retrieved successfully
   *       401:
   *         description: Unauthorized
   */
  async getMyEvents(req, res) {
    try {
      const userId = req.user.id;
      const query = req.query;

      const result = await eventService.getMyEvents(userId, query);

      logger.info(`User's events retrieved successfully. User: ${userId}, Total: ${result.pagination.total}`);
      return successResponse(res, 'User\'s events retrieved successfully', result);
    } catch (error) {
      logger.error('Error in getMyEvents controller:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

module.exports = new EventController(); 