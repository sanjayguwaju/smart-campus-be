const Event = require('../models/event.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const { createError } = require('../utils/responseHandler');

class EventService {
  /**
   * Create a new event
   */
  async createEvent(eventData, userId) {
    try {
      // Set createdBy and updatedBy
      eventData.createdBy = userId;
      eventData.updatedBy = userId;

      // Validate organizer exists
      const organizer = await User.findById(eventData.organizer);
      if (!organizer) {
        throw createError('Organizer not found', 404);
      }

      // Validate co-organizers exist
      if (eventData.coOrganizers && eventData.coOrganizers.length > 0) {
        const coOrganizers = await User.find({
          _id: { $in: eventData.coOrganizers }
        });
        if (coOrganizers.length !== eventData.coOrganizers.length) {
          throw createError('One or more co-organizers not found', 404);
        }
      }

      const event = new Event(eventData);
      await event.save();

      logger.info(`Event created: ${event._id} by user: ${userId}`);
      return event;
    } catch (error) {
      logger.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Get all events with filtering and pagination
   */
  async getEvents(query = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        eventType,
        category,
        status,
        visibility,
        featured,
        startDate,
        endDate,
        organizer,
        sortBy = 'startDate',
        sortOrder = 'asc'
      } = query;

      // Build filter object
      const filter = {};

      // Search filter
      if (search) {
        filter.$text = { $search: search };
      }

      // Type and category filters
      if (eventType) filter.eventType = eventType;
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (visibility) filter.visibility = visibility;
      if (featured !== undefined) filter.featured = featured;

      // Date range filters
      if (startDate || endDate) {
        filter.startDate = {};
        if (startDate) filter.startDate.$gte = new Date(startDate);
        if (endDate) filter.startDate.$lte = new Date(endDate);
      }

      // Organizer filter
      if (organizer) filter.organizer = organizer;

      // Calculate pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Execute query
      const [events, total] = await Promise.all([
        Event.find(filter)
          .populate('organizer', 'firstName lastName email avatar')
          .populate('coOrganizers', 'firstName lastName email avatar')
          .populate('attendees.user', 'firstName lastName email avatar')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Event.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Get all events without pagination
   */
  async getAllEvents(query = {}) {
    try {
      const {
        eventType,
        category,
        status,
        visibility,
        featured,
        startDate,
        endDate,
        organizer,
        sortBy = 'startDate',
        sortOrder = 'asc'
      } = query;

      // Build filter object
      const filter = {};

      // Type and category filters
      if (eventType) filter.eventType = eventType;
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (visibility) filter.visibility = visibility;
      if (featured !== undefined) filter.featured = featured;

      // Date range filters
      if (startDate || endDate) {
        filter.startDate = {};
        if (startDate) filter.startDate.$gte = new Date(startDate);
        if (endDate) filter.startDate.$lte = new Date(endDate);
      }

      // Organizer filter
      if (organizer) filter.organizer = organizer;

      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      // Execute query without pagination
      const events = await Event.find(filter)
        .populate('organizer', 'firstName lastName email avatar')
        .populate('coOrganizers', 'firstName lastName email avatar')
        .populate('attendees.user', 'firstName lastName email avatar')
        .sort(sort)
        .lean();

      logger.info(`All events retrieved. Count: ${events.length}`);
      return events;
    } catch (error) {
      logger.error('Error fetching all events:', error);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId, userId = null) {
    try {
      const event = await Event.findById(eventId)
        .populate('organizer', 'firstName lastName email avatar department')
        .populate('coOrganizers', 'firstName lastName email avatar department')
        .populate('attendees.user', 'firstName lastName email avatar department')
        .populate('reviews.user', 'firstName lastName email avatar')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

      if (!event) {
        throw createError('Event not found', 404);
      }

      // Increment view count if user is authenticated
      if (userId) {
        await Event.findByIdAndUpdate(eventId, {
          $inc: { 'statistics.views': 1 }
        });
      }

      // Check if user is registered for this event
      if (userId) {
        const userRegistration = event.attendees.find(
          attendee => attendee.user._id.toString() === userId
        );
        event.userRegistration = userRegistration || null;
      }

      return event;
    } catch (error) {
      logger.error('Error fetching event:', error);
      throw error;
    }
  }

  /**
   * Update event
   */
  async updateEvent(eventId, updateData, userId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw createError('Event not found', 404);
      }

      // Check if user has permission to update
      if (event.createdBy.toString() !== userId && event.organizer.toString() !== userId) {
        throw createError('Unauthorized to update this event', 403);
      }

      // Set updatedBy
      updateData.updatedBy = userId;

      // Validate organizer if being updated
      if (updateData.organizer) {
        const organizer = await User.findById(updateData.organizer);
        if (!organizer) {
          throw createError('Organizer not found', 404);
        }
      }

      // Validate co-organizers if being updated
      if (updateData.coOrganizers && updateData.coOrganizers.length > 0) {
        const coOrganizers = await User.find({
          _id: { $in: updateData.coOrganizers }
        });
        if (coOrganizers.length !== updateData.coOrganizers.length) {
          throw createError('One or more co-organizers not found', 404);
        }
      }

      const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('organizer', 'firstName lastName email avatar')
        .populate('coOrganizers', 'firstName lastName email avatar');

      logger.info(`Event updated: ${eventId} by user: ${userId}`);
      return updatedEvent;
    } catch (error) {
      logger.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(eventId, userId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw createError('Event not found', 404);
      }

      // Check if user has permission to delete
      if (event.createdBy.toString() !== userId) {
        throw createError('Unauthorized to delete this event', 403);
      }

      await Event.findByIdAndDelete(eventId);

      logger.info(`Event deleted: ${eventId} by user: ${userId}`);
      return { message: 'Event deleted successfully' };
    } catch (error) {
      logger.error('Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Register user for event
   */
  async registerForEvent(eventId, userId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw createError('Event not found', 404);
      }

      // Check if registration is required and open
      if (!event.isRegistrationRequired) {
        throw createError('Registration is not required for this event', 400);
      }

      if (!event.isRegistrationOpen) {
        throw createError('Registration is closed for this event', 400);
      }

      // Check registration deadline
      if (event.registrationDeadline && new Date() > event.registrationDeadline) {
        throw createError('Registration deadline has passed', 400);
      }

      // Check if user is already registered
      const existingRegistration = event.attendees.find(
        attendee => attendee.user.toString() === userId
      );

      if (existingRegistration) {
        if (existingRegistration.status === 'registered' || existingRegistration.status === 'attended') {
          throw createError('User is already registered for this event', 400);
        } else if (existingRegistration.status === 'cancelled') {
          // Re-register cancelled user
          existingRegistration.status = 'registered';
          existingRegistration.registeredAt = new Date();
          await event.save();
          return { message: 'Registration reactivated successfully' };
        }
      }

      // Check if event is full
      if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
        // Add to waitlist
        event.attendees.push({
          user: userId,
          status: 'waitlist',
          registeredAt: new Date()
        });
        await event.save();
        return { message: 'Added to waitlist successfully' };
      }

      // Register user
      await event.registerUser(userId);

      logger.info(`User ${userId} registered for event ${eventId}`);
      return { message: 'Registration successful' };
    } catch (error) {
      logger.error('Error registering for event:', error);
      throw error;
    }
  }

  /**
   * Cancel event registration
   */
  async cancelRegistration(eventId, userId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw createError('Event not found', 404);
      }

      await event.cancelRegistration(userId);

      logger.info(`User ${userId} cancelled registration for event ${eventId}`);
      return { message: 'Registration cancelled successfully' };
    } catch (error) {
      logger.error('Error cancelling registration:', error);
      throw error;
    }
  }

  /**
   * Mark user as attended
   */
  async markAttended(eventId, userId, adminUserId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw createError('Event not found', 404);
      }

      // Check if admin has permission
      if (event.organizer.toString() !== adminUserId && event.createdBy.toString() !== adminUserId) {
        throw createError('Unauthorized to mark attendance', 403);
      }

      await event.markAttended(userId);

      logger.info(`User ${userId} marked as attended for event ${eventId} by admin ${adminUserId}`);
      return { message: 'Attendance marked successfully' };
    } catch (error) {
      logger.error('Error marking attendance:', error);
      throw error;
    }
  }

  /**
   * Add review to event
   */
  async addReview(eventId, userId, reviewData) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw createError('Event not found', 404);
      }

      // Check if user attended the event
      const attendance = event.attendees.find(
        attendee => attendee.user.toString() === userId && attendee.status === 'attended'
      );

      if (!attendance) {
        throw createError('You must attend the event to review it', 400);
      }

      await event.addReview(userId, reviewData.rating, reviewData.comment);

      logger.info(`Review added to event ${eventId} by user ${userId}`);
      return { message: 'Review added successfully' };
    } catch (error) {
      logger.error('Error adding review:', error);
      throw error;
    }
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(limit = 10) {
    try {
      const events = await Event.findUpcoming(limit);
      return events;
    } catch (error) {
      logger.error('Error fetching upcoming events:', error);
      throw error;
    }
  }

  /**
   * Get featured events
   */
  async getFeaturedEvents(limit = 5) {
    try {
      const events = await Event.findFeatured(limit);
      return events;
    } catch (error) {
      logger.error('Error fetching featured events:', error);
      throw error;
    }
  }

  /**
   * Get events by organizer
   */
  async getEventsByOrganizer(organizerId, query = {}) {
    try {
      const { page = 1, limit = 10, status } = query;
      const skip = (page - 1) * limit;

      const filter = { organizer: organizerId };
      if (status) filter.status = status;

      const [events, total] = await Promise.all([
        Event.find(filter)
          .populate('organizer', 'firstName lastName email avatar')
          .populate('coOrganizers', 'firstName lastName email avatar')
          .sort({ startDate: 1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Event.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching events by organizer:', error);
      throw error;
    }
  }

  /**
   * Get user's registered events
   */
  async getUserRegisteredEvents(userId, query = {}) {
    try {
      const { page = 1, limit = 10, status } = query;
      const skip = (page - 1) * limit;

      const filter = {
        'attendees.user': userId
      };

      if (status) {
        filter['attendees.status'] = status;
      }

      const [events, total] = await Promise.all([
        Event.find(filter)
          .populate('organizer', 'firstName lastName email avatar')
          .populate('coOrganizers', 'firstName lastName email avatar')
          .sort({ startDate: 1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Event.countDocuments(filter)
      ]);

      // Add user's registration status to each event
      events.forEach(event => {
        const userRegistration = event.attendees.find(
          attendee => attendee.user.toString() === userId
        );
        event.userRegistration = userRegistration;
      });

      const totalPages = Math.ceil(total / limit);

      return {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching user registered events:', error);
      throw error;
    }
  }

  /**
   * Get event statistics
   */
  async getEventStatistics(eventId) {
    try {
      const event = await Event.findById(eventId);
      if (!event) {
        throw createError('Event not found', 404);
      }

      const statistics = {
        totalRegistrations: event.attendees.length,
        confirmedRegistrations: event.attendees.filter(a => a.status === 'registered').length,
        attendedCount: event.attendees.filter(a => a.status === 'attended').length,
        cancelledCount: event.attendees.filter(a => a.status === 'cancelled').length,
        waitlistCount: event.attendees.filter(a => a.status === 'waitlist').length,
        averageRating: event.averageRating,
        totalReviews: event.totalReviews,
        views: event.statistics.views,
        shares: event.statistics.shares,
        capacity: event.maxAttendees ? `${event.currentAttendees}/${event.maxAttendees}` : 'Unlimited',
        registrationRate: event.maxAttendees ? (event.currentAttendees / event.maxAttendees * 100).toFixed(1) + '%' : 'N/A'
      };

      return statistics;
    } catch (error) {
      logger.error('Error fetching event statistics:', error);
      throw error;
    }
  }

  /**
   * Search events
   */
  async searchEvents(searchQuery, query = {}) {
    try {
      const { page = 1, limit = 10, eventType, category } = query;
      const skip = (page - 1) * limit;

      const filter = {
        $text: { $search: searchQuery },
        status: 'published',
        visibility: 'public'
      };

      if (eventType) filter.eventType = eventType;
      if (category) filter.category = category;

      const [events, total] = await Promise.all([
        Event.find(filter)
          .populate('organizer', 'firstName lastName email avatar')
          .populate('coOrganizers', 'firstName lastName email avatar')
          .sort({ score: { $meta: 'textScore' }, startDate: 1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Event.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        events,
        searchQuery,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error searching events:', error);
      throw error;
    }
  }

  /**
   * Get event attendees
   */
  async getEventAttendees(eventId, status = null) {
    try {
      const event = await Event.findById(eventId)
        .populate('attendees.user', 'firstName lastName email avatar department')
        .lean();

      if (!event) {
        throw createError('Event not found', 404);
      }

      let attendees = event.attendees;

      // Filter by status if provided
      if (status) {
        attendees = attendees.filter(attendee => attendee.status === status);
      }

      // Sort by registration date
      attendees.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));

      return attendees;
    } catch (error) {
      logger.error('Error fetching event attendees:', error);
      throw error;
    }
  }

  /**
   * Get event reviews
   */
  async getEventReviews(eventId, query = {}) {
    try {
      const { page = 1, limit = 10 } = query;
      const skip = (page - 1) * limit;

      const event = await Event.findById(eventId)
        .populate('reviews.user', 'firstName lastName email avatar')
        .lean();

      if (!event) {
        throw createError('Event not found', 404);
      }

      let reviews = event.reviews || [];

      // Sort by review date (newest first)
      reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply pagination
      const total = reviews.length;
      const paginatedReviews = reviews.slice(skip, skip + parseInt(limit));

      const totalPages = Math.ceil(total / limit);

      return {
        reviews: paginatedReviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching event reviews:', error);
      throw error;
    }
  }

  /**
   * Get user's events (created and organized)
   */
  async getMyEvents(userId, query = {}) {
    try {
      const { page = 1, limit = 10, status, type = 'both' } = query;
      const skip = (page - 1) * limit;

      let filter = {};

      // Build filter based on type
      if (type === 'created') {
        filter.createdBy = userId;
      } else if (type === 'organized') {
        filter.organizer = userId;
      } else {
        // both - get events where user is creator or organizer
        filter.$or = [
          { createdBy: userId },
          { organizer: userId }
        ];
      }

      // Add status filter if provided
      if (status) {
        filter.status = status;
      }

      const [events, total] = await Promise.all([
        Event.find(filter)
          .populate('organizer', 'firstName lastName email avatar')
          .populate('coOrganizers', 'firstName lastName email avatar')
          .populate('attendees.user', 'firstName lastName email avatar')
          .sort({ startDate: 1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Event.countDocuments(filter)
      ]);

      // Add user's role to each event
      events.forEach(event => {
        if (event.createdBy && event.createdBy.toString() === userId) {
          event.userRole = 'creator';
        } else if (event.organizer && event.organizer.toString() === userId) {
          event.userRole = 'organizer';
        }
      });

      const totalPages = Math.ceil(total / limit);

      return {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching user events:', error);
      throw error;
    }
  }
}

module.exports = new EventService(); 