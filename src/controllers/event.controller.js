const eventService = require('../services/event.service');
const ResponseHandler = require('../utils/responseHandler');
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
      return ResponseHandler.success(res, 201, 'Event created successfully', event);
    } catch (error) {
      logger.error('Error in createEvent controller:', error);
      return ResponseHandler.error(res, error.statusCode || 500, error.message);
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
      const filters = {
        search: req.query.search,
        eventType: req.query.eventType,
        category: req.query.category,
        status: req.query.status,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        organizer: req.query.organizer
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'startDate',
        sortOrder: req.query.sortOrder || 'asc'
      };

      const result = await eventService.getEvents(filters, pagination);

      // Return events data with pagination at the same level
      return ResponseHandler.success(res, 200, 'Events retrieved successfully', result.events, result.pagination);
    } catch (error) {
      logger.error('Get events error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve events');
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
      const events = await eventService.getAllEvents();

      return ResponseHandler.success(res, 200, 'All events retrieved successfully', events);
    } catch (error) {
      logger.error('Get all events error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve events');
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
      const { eventId } = req.params;
      const event = await eventService.getEventById(eventId);

      return ResponseHandler.success(res, 200, 'Event retrieved successfully', event);
    } catch (error) {
      logger.error('Get event by ID error:', error);
      if (error.message === 'Event not found') {
        return ResponseHandler.notFound(res, 'Event not found');
      }
      return ResponseHandler.error(res, 500, 'Failed to retrieve event');
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
      const { eventId } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const event = await eventService.updateEvent(eventId, updateData, userId);

      return ResponseHandler.success(res, 200, 'Event updated successfully', event);
    } catch (error) {
      logger.error('Update event error:', error);
      if (error.message === 'Event not found') {
        return ResponseHandler.notFound(res, 'Event not found');
      }
      return ResponseHandler.error(res, 400, error.message);
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
      const { eventId } = req.params;
      const userId = req.user.id;

      const result = await eventService.deleteEvent(eventId, userId);

      return ResponseHandler.success(res, 200, result.message, result);
    } catch (error) {
      logger.error('Delete event error:', error);
      if (error.message === 'Event not found') {
        return ResponseHandler.notFound(res, 'Event not found');
      }
      return ResponseHandler.error(res, 500, 'Failed to delete event');
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
      const { eventId } = req.params;
      const userId = req.user.id;

      const result = await eventService.registerForEvent(eventId, userId);

      return ResponseHandler.success(res, 200, result.message, result);
    } catch (error) {
      logger.error('Register for event error:', error);
      return ResponseHandler.error(res, 400, error.message);
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
      const { eventId } = req.params;
      const userId = req.user.id;

      const result = await eventService.cancelRegistration(eventId, userId);

      return ResponseHandler.success(res, 200, result.message, result);
    } catch (error) {
      logger.error('Cancel registration error:', error);
      return ResponseHandler.error(res, 400, error.message);
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
      const { eventId } = req.params;
      const { attendeeId } = req.body;
      const userId = req.user.id;

      const result = await eventService.markAttended(eventId, attendeeId, userId);

      return ResponseHandler.success(res, 200, result.message, result);
    } catch (error) {
      logger.error('Mark attended error:', error);
      return ResponseHandler.error(res, 400, error.message);
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
      const { eventId } = req.params;
      const reviewData = req.body;
      const userId = req.user.id;

      const result = await eventService.addReview(eventId, reviewData, userId);

      return ResponseHandler.success(res, 201, result.message, result);
    } catch (error) {
      logger.error('Add review error:', error);
      return ResponseHandler.error(res, 400, error.message);
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
      const limit = parseInt(req.query.limit) || 10;
      const events = await eventService.getUpcomingEvents(limit);

      return ResponseHandler.success(res, 200, 'Upcoming events retrieved successfully', events);
    } catch (error) {
      logger.error('Get upcoming events error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve upcoming events');
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
      const limit = parseInt(req.query.limit) || 10;
      const events = await eventService.getFeaturedEvents(limit);

      return ResponseHandler.success(res, 200, 'Featured events retrieved successfully', events);
    } catch (error) {
      logger.error('Get featured events error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve featured events');
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
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await eventService.getEventsByOrganizer(organizerId, filters);

      // Return events data with pagination at the same level
      return ResponseHandler.success(res, 200, 'Events by organizer retrieved successfully', result.events, result.pagination);
    } catch (error) {
      logger.error('Get events by organizer error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve events by organizer');
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
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await eventService.getUserRegisteredEvents(userId, filters);

      // Return events data with pagination at the same level
      return ResponseHandler.success(res, 200, 'User\'s registered events retrieved successfully', result.events, result.pagination);
    } catch (error) {
      logger.error('Get user registered events error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve user\'s registered events');
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
      const statistics = await eventService.getEventStatistics();

      return ResponseHandler.success(res, 200, 'Event statistics retrieved successfully', statistics);
    } catch (error) {
      logger.error('Get event statistics error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve event statistics');
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
      const { query } = req.query;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await eventService.searchEvents(query, filters);

      // Return events data with pagination at the same level
      return ResponseHandler.success(res, 200, 'Search results retrieved successfully', result.events, result.pagination);
    } catch (error) {
      logger.error('Search events error:', error);
      return ResponseHandler.error(res, 500, 'Failed to search events');
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
      const { eventId } = req.params;
      const userId = req.user.id;

      const result = await eventService.unregisterFromEvent(eventId, userId);

      return ResponseHandler.success(res, 200, result.message, result);
    } catch (error) {
      logger.error('Unregister from event error:', error);
      return ResponseHandler.error(res, 400, error.message);
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
      const { eventId } = req.params;
      const { attendeeId, status } = req.body;
      const userId = req.user.id;

      const result = await eventService.markAttendance(eventId, attendeeId, status, userId);

      return ResponseHandler.success(res, 200, result.message, result);
    } catch (error) {
      logger.error('Mark attendance error:', error);
      return ResponseHandler.error(res, 400, error.message);
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
      const { eventId } = req.params;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status
      };

      const attendees = await eventService.getEventAttendees(eventId, filters);

      return ResponseHandler.success(res, 200, 'Event attendees retrieved successfully', attendees);
    } catch (error) {
      logger.error('Get event attendees error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve event attendees');
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
      const { eventId } = req.params;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      const result = await eventService.getEventReviews(eventId, filters);

      // Return reviews data with pagination at the same level
      return ResponseHandler.success(res, 200, 'Event reviews retrieved successfully', result.reviews, result.pagination);
    } catch (error) {
      logger.error('Get event reviews error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve event reviews');
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
      const { eventId } = req.params;
      const reviewData = req.body;
      const userId = req.user.id;

      const result = await eventService.addEventReview(eventId, reviewData, userId);

      return ResponseHandler.success(res, 201, result.message, result);
    } catch (error) {
      logger.error('Add event review error:', error);
      return ResponseHandler.error(res, 400, error.message);
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
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        type: req.query.type // 'organized' or 'registered'
      };

      const result = await eventService.getMyEvents(userId, filters);

      // Return events data with pagination at the same level
      return ResponseHandler.success(res, 200, 'User\'s events retrieved successfully', result.events, result.pagination);
    } catch (error) {
      logger.error('Get my events error:', error);
      return ResponseHandler.error(res, 500, 'Failed to retrieve user\'s events');
    }
  }

  /**
   * @swagger
   * /api/events/{id}/images:
   *   post:
   *     summary: Upload image for event
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
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               image:
   *                 type: string
   *                 format: binary
   *                 description: Image file to upload
   *               caption:
   *                 type: string
   *                 description: Image caption
   *               isPrimary:
   *                 type: boolean
   *                 description: Whether this is the primary image
   *     responses:
   *       200:
   *         description: Image uploaded successfully
   *       400:
   *         description: Upload failed
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Event not found
   */
  async uploadEventImage(req, res) {
    try {
      const { eventId } = req.params;
      const userId = req.user.id;
      const { caption, isPrimary } = req.body;

      // Check if file was uploaded
      if (!req.file) {
        return ResponseHandler.error(res, 400, 'No image file provided');
      }

      const options = {
        caption: caption || '',
        isPrimary: isPrimary === 'true'
      };

      const result = await eventService.uploadEventImage(eventId, req.file, userId, options);

      return ResponseHandler.success(res, 200, result.message, result);
    } catch (error) {
      logger.error('Upload event image error:', error);
      return ResponseHandler.error(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/images:
   *   get:
   *     summary: Get event images
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
   *         description: Event images retrieved successfully
   *       404:
   *         description: Event not found
   */
  async getEventImages(req, res) {
    try {
      const { eventId } = req.params;
      const result = await eventService.getEventImages(eventId);

      return ResponseHandler.success(res, 200, 'Event images retrieved successfully', result);
    } catch (error) {
      logger.error('Get event images error:', error);
      return ResponseHandler.error(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/images/{imageId}:
   *   put:
   *     summary: Update event image
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
   *       - in: path
   *         name: imageId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Image ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               caption:
   *                 type: string
   *                 description: Image caption
   *               isPrimary:
   *                 type: boolean
   *                 description: Whether this is the primary image
   *     responses:
   *       200:
   *         description: Image updated successfully
   *       400:
   *         description: Update failed
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Event or image not found
   */
  async updateEventImage(req, res) {
    try {
      const { eventId, imageId } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const result = await eventService.updateEventImage(eventId, imageId, updateData, userId);

      return ResponseHandler.success(res, 200, result.message, result);
    } catch (error) {
      logger.error('Update event image error:', error);
      return ResponseHandler.error(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/events/{id}/images/{imageId}:
   *   delete:
   *     summary: Delete event image
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
   *       - in: path
   *         name: imageId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Image ID
   *     responses:
   *       200:
   *         description: Image deleted successfully
   *       400:
   *         description: Deletion failed
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Event or image not found
   */
  async deleteEventImage(req, res) {
    try {
      const { eventId, imageId } = req.params;
      const userId = req.user.id;

      const result = await eventService.deleteEventImage(eventId, imageId, userId);

      return ResponseHandler.success(res, 200, result.message, result);
    } catch (error) {
      logger.error('Delete event image error:', error);
      return ResponseHandler.error(res, error.statusCode || 500, error.message);
    }
  }

  /**
   * @swagger
   * /api/events/{eventId}/publish:
   *   put:
   *     summary: Publish or unpublish an event
   *     tags: [Events]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: eventId
   *         required: true
   *         schema:
   *           type: string
   *         description: Event ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - isPublished
   *             properties:
   *               isPublished:
   *                 type: boolean
   *                 description: Whether to publish (true) or unpublish (false) the event
   *     responses:
   *       200:
   *         description: Event published/unpublished successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     event:
   *                       type: object
   *                       properties:
   *                         _id:
   *                           type: string
   *                         title:
   *                           type: string
   *                         isPublished:
   *                           type: boolean
   *                         status:
   *                           type: string
   *       400:
   *         description: Validation error
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Insufficient permissions
   *       404:
   *         description: Event not found
   */
  async publishEvent(req, res) {
    try {
      const { eventId } = req.params;
      const { isPublished } = req.body;
      const userId = req.user.id;

      // Validate isPublished is a boolean
      if (typeof isPublished !== 'boolean') {
        return ResponseHandler.error(res, 400, 'isPublished must be a boolean value');
      }

      const result = await eventService.publishEvent(eventId, isPublished, userId);

      return ResponseHandler.success(res, 200, result.message, result);
    } catch (error) {
      logger.error('Publish event error:', error);
      return ResponseHandler.error(res, error.statusCode || 500, error.message);
    }
  }
}

module.exports = new EventController(); 