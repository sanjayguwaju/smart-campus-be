const Course = require('../models/course.model');
const logger = require('../utils/logger');

class CourseService {
  async createCourse(courseData) {
    try {
      // Check if course code already exists
      const existingCourse = await Course.findOne({ code: courseData.code });
      if (existingCourse) {
        throw new Error('Course with this code already exists');
      }

      // No instructor lookup or role check

      // Create course
      const course = new Course(courseData);
      await course.save();

      // No instructor populate

      logger.info(`Course created: ${course.code} - ${course.title}`);
      return course;
    } catch (error) {
      logger.error('Error creating course:', error);
      throw error;
    }
  }

  async getCourseById(courseId) {
    try {
      const course = await Course.findById(courseId)
        // .populate('instructor', 'firstName lastName email department')
        .populate('students', 'firstName lastName email studentId')
        .populate('prerequisites', 'title code');

      if (!course) {
        throw new Error('Course not found');
      }

      return course;
    } catch (error) {
      logger.error('Error getting course by ID:', error);
      throw error;
    }
  }

  async getCourses(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const { department, semester, year, instructor, isActive, isPublished, available, search } = filters;

      // Build query
      const query = {};
      if (department) query.department = { $regex: department, $options: 'i' };
      if (semester) query.semester = semester;
      if (year) query.year = year;
      if (instructor) query.instructor = instructor;
      if (isActive !== undefined) query.isActive = isActive;
      if (isPublished !== undefined) query.isPublished = isPublished;
      if (available) {
        query.$expr = { $lt: ['$currentStudents', '$maxStudents'] };
        query.isActive = true;
        query.isPublished = true;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const skip = (page - 1) * limit;
      const courses = await Course.find(query)
        // .populate('instructor', 'firstName lastName email department')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Get total count
      const total = await Course.countDocuments(query);

      return {
        courses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting courses:', error);
      throw error;
    }
  }

  async updateCourse(courseId, updateData) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Check if course code is being updated and if it already exists
      if (updateData.code && updateData.code !== course.code) {
        const existingCourse = await Course.findOne({ code: updateData.code });
        if (existingCourse) {
          throw new Error('Course code already exists');
        }
      }

      // No instructor lookup or role check

      // Update course
      Object.assign(course, updateData);
      await course.save();

      // No instructor populate

      logger.info(`Course updated: ${course.code} - ${course.title}`);
      return course;
    } catch (error) {
      logger.error('Error updating course:', error);
      throw error;
    }
  }

  async deleteCourse(courseId) {
    try {
      const course = await Course.findByIdAndDelete(courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      logger.info(`Course deleted: ${courseId}`);
      return course;
    } catch (error) {
      logger.error('Error deleting course:', error);
      throw error;
    }
  }
}

module.exports = new CourseService();