const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validateEvent, validateEventUpdate, validateEventRegistration } = require('../validation/event.validation');
const { handleImageUpload } = require('../middleware/upload.middleware');

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
 *         _id:
 *           type: string
 *           description: Auto-generated event ID
 *         title:
 *           type: string
 *           maxLength: 100
 *           description: Event title
 *         description:
 *           type: string
 *           maxLength: 1000
 *           description: Event description
 *         shortDescription:
 *           type: string
 *           maxLength: 200
 *           description: Short description of the event
 *         eventType:
 *           type: string
 *           enum: [academic, cultural, sports, technical, social, workshop, seminar, conference, other]
 *           description: Type of event
 *         category:
 *           type: string
 *           enum: [student, faculty, admin, public, invitation-only]
 *           description: Target category
 *         startDate:
 *           type: string
 *           format: date
 *           description: Event start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Event end date
 *         startTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Event start time (HH:MM format)
 *         endTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           description: Event end time (HH:MM format)
 *         location:
 *           type: object
 *           properties:
 *             venue:
 *               type: string
 *               description: Event venue
 *             room:
 *               type: string
 *               description: Room number
 *             building:
 *               type: string
 *               description: Building name
 *             campus:
 *               type: string
 *               description: Campus location
 *         organizer:
 *           type: string
 *           format: uuid
 *           description: Organizer user ID
 *         coOrganizers:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Co-organizer user IDs
 *         maxAttendees:
 *           type: number
 *           minimum: 1
 *           description: Maximum number of attendees
 *         currentAttendees:
 *           type: number
 *           description: Current number of attendees
 *         registrationDeadline:
 *           type: string
 *           format: date-time
 *           description: Registration deadline
 *         isRegistrationRequired:
 *           type: boolean
 *           description: Whether registration is required
 *         isRegistrationOpen:
 *           type: boolean
 *           description: Whether registration is currently open
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Event tags
 *         images:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: Image URL
 *               public_id:
 *                 type: string
 *                 description: Cloudinary public ID (optional for external images)
 *               caption:
 *                 type: string
 *                 description: Image caption
 *               isPrimary:
 *                 type: boolean
 *                 description: Whether this is the primary image
 *               width:
 *                 type: number
 *                 description: Image width
 *               height:
 *                 type: number
 *                 description: Image height
 *               format:
 *                 type: string
 *                 description: Image format
 *               size:
 *                 type: number
 *                 description: Image size in bytes
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Attachment name
 *               url:
 *                 type: string
 *                 description: Attachment URL
 *               type:
 *                 type: string
 *                 description: File type
 *               size:
 *                 type: number
 *                 description: File size in bytes
 *         contactInfo:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               format: email
 *               description: Contact email
 *             phone:
 *               type: string
 *               description: Contact phone
 *             website:
 *               type: string
 *               description: Contact website
 *         status:
 *           type: string
 *           enum: [draft, published, cancelled, completed, postponed]
 *           default: draft
 *           description: Event status
 *         isPublished:
 *           type: boolean
 *           default: false
 *           description: Whether the event is published
 *         visibility:
 *           type: string
 *           enum: [public, private, restricted]
 *           default: public
 *           description: Event visibility
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *           description: Event priority
 *         featured:
 *           type: boolean
 *           default: false
 *           description: Whether the event is featured
 *         highlights:
 *           type: array
 *           items:
 *             type: string
 *           description: Event highlights
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *           description: Event requirements
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *           description: Event benefits
 *         externalLinks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Link title
 *               url:
 *                 type: string
 *                 description: Link URL
 *               description:
 *                 type: string
 *                 description: Link description
 *         attendees:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 format: uuid
 *                 description: User ID
 *               status:
 *                 type: string
 *                 enum: [registered, attended, cancelled, waitlist]
 *                 description: Attendance status
 *               registeredAt:
 *                 type: string
 *                 format: date-time
 *                 description: Registration date
 *         reviews:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *                 format: uuid
 *                 description: User ID
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating (1-5)
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 description: Review comment
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: Review date
 *         averageRating:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           description: Average rating
 *         totalReviews:
 *           type: number
 *           description: Total number of reviews
 *         statistics:
 *           type: object
 *           properties:
 *             views:
 *               type: number
 *               description: Number of views
 *             shares:
 *               type: number
 *               description: Number of shares
 *             registrations:
 *               type: number
 *               description: Number of registrations
 *             attendance:
 *               type: number
 *               description: Number of attendees
 *         createdBy:
 *           type: string
 *           format: uuid
 *           description: User who created the event
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           description: User who last updated the event
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

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
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of events per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
 *       - in: query
 *         name: organizer
 *         schema:
 *           type: string
 *         description: Filter by organizer ID
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/', eventController.getEvents);

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
 *           enum: [academic, social, cultural, sports, workshop, conference, seminar, other]
 *         description: Filter by event type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [undergraduate, graduate, faculty, staff, all]
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 */
router.get('/all', eventController.getAllEvents);

/**
 * @swagger
 * /api/events/{eventId}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
router.get('/:eventId', eventController.getEventById);

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
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - eventType
 *               - category
 *               - startDate
 *               - endDate
 *               - startTime
 *               - endTime
 *               - location
 *               - organizer
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               shortDescription:
 *                 type: string
 *                 maxLength: 200
 *               eventType:
 *                 type: string
 *                 enum: [academic, cultural, sports, technical, social, workshop, seminar, conference, other]
 *               category:
 *                 type: string
 *                 enum: [student, faculty, admin, public, invitation-only]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               endTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               location:
 *                 type: object
 *                 properties:
 *                   venue:
 *                     type: string
 *                   room:
 *                     type: string
 *                   building:
 *                     type: string
 *                   campus:
 *                     type: string
 *               organizer:
 *                 type: string
 *                 format: uuid
 *               coOrganizers:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               maxAttendees:
 *                 type: number
 *                 minimum: 1
 *               registrationDeadline:
 *                 type: string
 *                 format: date-time
 *               isRegistrationRequired:
 *                 type: boolean
 *               isRegistrationOpen:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     public_id:
 *                       type: string
 *                     caption:
 *                       type: string
 *                     isPrimary:
 *                       type: boolean
 *                     width:
 *                       type: number
 *                     height:
 *                       type: number
 *                     format:
 *                       type: string
 *                     size:
 *                       type: number
 *               contactInfo:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *                   website:
 *                     type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, cancelled, completed, postponed]
 *               visibility:
 *                 type: string
 *                 enum: [public, private, restricted]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               featured:
 *                 type: boolean
 *               highlights:
 *                 type: array
 *                 items:
 *                   type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               externalLinks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     url:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.post('/', authMiddleware.authenticate, authMiddleware.authorize(['admin', 'faculty']), validateEvent, eventController.createEvent);

/**
 * @swagger
 * /api/events/{eventId}:
 *   put:
 *     summary: Update event by ID
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
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               shortDescription:
 *                 type: string
 *                 maxLength: 200
 *               eventType:
 *                 type: string
 *                 enum: [academic, cultural, sports, technical, social, workshop, seminar, conference, other]
 *               category:
 *                 type: string
 *                 enum: [student, faculty, admin, public, invitation-only]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               endTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               location:
 *                 type: object
 *                 properties:
 *                   venue:
 *                     type: string
 *                   room:
 *                     type: string
 *                   building:
 *                     type: string
 *                   campus:
 *                     type: string
 *               maxAttendees:
 *                 type: number
 *                 minimum: 1
 *               registrationDeadline:
 *                 type: string
 *                 format: date-time
 *               isRegistrationRequired:
 *                 type: boolean
 *               isRegistrationOpen:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     public_id:
 *                       type: string
 *                     caption:
 *                       type: string
 *                     isPrimary:
 *                       type: boolean
 *                     width:
 *                       type: number
 *                     height:
 *                       type: number
 *                     format:
 *                       type: string
 *                     size:
 *                       type: number
 *               contactInfo:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   phone:
 *                     type: string
 *                   website:
 *                     type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, cancelled, completed, postponed]
 *               visibility:
 *                 type: string
 *                 enum: [public, private, restricted]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               featured:
 *                 type: boolean
 *               highlights:
 *                 type: array
 *                 items:
 *                   type: string
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               externalLinks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     url:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Event not found
 */
router.put('/:eventId', authMiddleware.authenticate, authMiddleware.authorize(['admin', 'faculty']), validateEventUpdate, eventController.updateEvent);

/**
 * @swagger
 * /api/events/{eventId}:
 *   delete:
 *     summary: Delete event by ID
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
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Event not found
 */
router.delete('/:eventId', authMiddleware.authenticate, authMiddleware.authorize(['admin', 'faculty']), eventController.deleteEvent);

/**
 * @swagger
 * /api/events/{eventId}/register:
 *   post:
 *     summary: Register for an event
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
 *             properties:
 *               additionalInfo:
 *                 type: object
 *                 description: Additional registration information
 *     responses:
 *       200:
 *         description: Successfully registered for event
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
 *                     registrationId:
 *                       type: string
 *                     eventId:
 *                       type: string
 *                     userId:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Registration error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       409:
 *         description: Already registered or event full
 */
router.post('/:eventId/register', authMiddleware.authenticate, validateEventRegistration, eventController.registerForEvent);

/**
 * @swagger
 * /api/events/{eventId}/unregister:
 *   delete:
 *     summary: Unregister from an event
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
 *     responses:
 *       200:
 *         description: Successfully unregistered from event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found or not registered
 */
router.delete('/:eventId/unregister', authMiddleware.authenticate, eventController.unregisterFromEvent);

/**
 * @swagger
 * /api/events/{eventId}/attendees:
 *   get:
 *     summary: Get event attendees
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [registered, attended, cancelled, no-show]
 *         description: Filter by attendance status
 *     responses:
 *       200:
 *         description: List of attendees
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       registrationDate:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Event not found
 */
router.get('/:eventId/attendees', authMiddleware.authenticate, authMiddleware.authorize(['admin', 'faculty']), eventController.getEventAttendees);

/**
 * @swagger
 * /api/events/{eventId}/mark-attendance:
 *   post:
 *     summary: Mark attendance for an event
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
 *               - attendeeIds
 *             properties:
 *               attendeeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to mark as attended
 *     responses:
 *       200:
 *         description: Attendance marked successfully
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
 *                     markedCount:
 *                       type: number
 *                     totalAttendees:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Event not found
 */
router.post('/:eventId/mark-attendance', authMiddleware.authenticate, authMiddleware.authorize(['admin', 'faculty']), eventController.markAttendance);

/**
 * @swagger
 * /api/events/{eventId}/reviews:
 *   get:
 *     summary: Get event reviews
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       userName:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       comment:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *       404:
 *         description: Event not found
 */
router.get('/:eventId/reviews', eventController.getEventReviews);

/**
 * @swagger
 * /api/events/{eventId}/reviews:
 *   post:
 *     summary: Add a review to an event
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
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *               comment:
 *                 type: string
 *                 description: Review comment
 *     responses:
 *       201:
 *         description: Review added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviewId:
 *                       type: string
 *                     rating:
 *                       type: number
 *                     comment:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 *       409:
 *         description: Already reviewed this event
 */
router.post('/:eventId/reviews', authMiddleware.authenticate, eventController.addEventReview);

/**
 * @swagger
 * /api/events/search/upcoming:
 *   get:
 *     summary: Get upcoming events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of events to return
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by event type
 *     responses:
 *       200:
 *         description: List of upcoming events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 */
router.get('/search/upcoming', eventController.getUpcomingEvents);

/**
 * @swagger
 * /api/events/search/my-events:
 *   get:
 *     summary: Get user's events (organized and registered)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [organized, registered, both]
 *           default: both
 *         description: Type of events to retrieve
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by event status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of events per page
 *     responses:
 *       200:
 *         description: List of user's events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     organized:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *                     registered:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/search/my-events', authMiddleware.authenticate, eventController.getMyEvents);

/**
 * @swagger
 * /api/events/{eventId}/statistics:
 *   get:
 *     summary: Get event statistics
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
 *     responses:
 *       200:
 *         description: Event statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRegistrations:
 *                       type: number
 *                     totalAttendees:
 *                       type: number
 *                     attendanceRate:
 *                       type: number
 *                     averageRating:
 *                       type: number
 *                     totalReviews:
 *                       type: number
 *                     registrationTrend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           count:
 *                             type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Event not found
 */
router.get('/:eventId/statistics', authMiddleware.authenticate, authMiddleware.authorize(['admin', 'faculty']), eventController.getEventStatistics);

// Image upload routes
/**
 * @swagger
 * /api/events/{eventId}/images:
 *   post:
 *     summary: Upload image for event
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
router.post('/:eventId/images', 
  authMiddleware.authenticate, 
  handleImageUpload('image', { folder: 'smart-campus/events' }), 
  eventController.uploadEventImage
);

/**
 * @swagger
 * /api/events/{eventId}/images:
 *   get:
 *     summary: Get event images
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event images retrieved successfully
 *       404:
 *         description: Event not found
 */
router.get('/:eventId/images', eventController.getEventImages);

/**
 * @swagger
 * /api/events/{eventId}/images/{imageId}:
 *   put:
 *     summary: Update event image
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
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
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
router.put('/:eventId/images/:imageId', authMiddleware.authenticate, eventController.updateEventImage);

/**
 * @swagger
 * /api/events/{eventId}/images/{imageId}:
 *   delete:
 *     summary: Delete event image
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
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
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
router.delete('/:eventId/images/:imageId', authMiddleware.authenticate, eventController.deleteEventImage);

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
router.put('/:eventId/publish', authMiddleware.authenticate, authMiddleware.authorize(['admin', 'faculty']), eventController.publishEvent);

module.exports = router; 