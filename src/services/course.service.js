const Course = require('../models/course.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Course Service Class
 */
class CourseService {
  /**
   * Create a new course
   * @param {Object} courseData - Course data
   * @returns {Promise<Object>} Created course
   */
  async createCourse(courseData) {
    try {
      // Check if course code already exists
      const existingCourse = await Course.findOne({ code: courseData.code });
      if (existingCourse) {
        throw new Error('Course with this code already exists');
      }

      // Verify faculty exists and is faculty
      const faculty = await User.findById(courseData.faculty);
      if (!faculty || faculty.role !== 'faculty') {
        throw new Error('Faculty must be a faculty member');
      }

      // Create course
      const course = new Course(courseData);
      await course.save();

      // Populate faculty details
      await course.populate('faculty', 'firstName lastName email department');

      logger.info(`Course created: ${course.code} - ${course.title}`);
      return course;
    } catch (error) {
      logger.error('Error creating course:', error);
      throw error;
    }
  }

  /**
   * Get course by ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Course object
   */
  async getCourseById(courseId) {
    try {
      const course = await Course.findById(courseId)
        .populate('faculty', 'firstName lastName email department')
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

  /**
   * Get all courses with pagination and filters
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Courses with pagination info
   */
  async getCourses(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const { department, semester, year, faculty, isActive, isPublished, available, search } = filters;

      // Build query
      const query = {};
      if (department) query.department = { $regex: department, $options: 'i' };
      if (semester) query.semester = semester;
      if (year) query.year = year;
      if (faculty) query.faculty = faculty;
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
        .populate('faculty', 'firstName lastName email department')
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

  /**
   * Update course
   * @param {string} courseId - Course ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated course
   */
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

      // Verify faculty if being updated
      if (updateData.faculty) {
        const faculty = await User.findById(updateData.faculty);
        if (!faculty || faculty.role !== 'faculty') {
          throw new Error('Faculty must be a faculty member');
        }
      }

      // Update course
      Object.assign(course, updateData);
      await course.save();

      // Populate faculty details
      await course.populate('faculty', 'firstName lastName email department');

      logger.info(`Course updated: ${course.code} - ${course.title}`);
      return course;
    } catch (error) {
      logger.error('Error updating course:', error);
      throw error;
    }
  }

  /**
   * Delete course
   * @param {string} courseId - Course ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteCourse(courseId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      await Course.findByIdAndDelete(courseId);
      logger.info(`Course deleted: ${course.code} - ${course.title}`);
      return true;
    } catch (error) {
      logger.error('Error deleting course:', error);
      throw error;
    }
  }

  /**
   * Enroll student in course
   * @param {string} courseId - Course ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Updated course
   */
  async enrollStudent(courseId, studentId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Verify student exists and is a student
      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        throw new Error('Student not found or invalid role');
      }

      // Check if course is available
      if (!course.isAvailable) {
        throw new Error('Course is not available for enrollment');
      }

      // Check if student is already enrolled
      if (course.isStudentEnrolled(studentId)) {
        throw new Error('Student is already enrolled in this course');
      }

      // Enroll student
      await course.addStudent(studentId);

      // Populate faculty and students
      await course.populate('faculty', 'firstName lastName email department');
      await course.populate('students', 'firstName lastName email studentId');

      logger.info(`Student ${student.email} enrolled in course ${course.code}`);
      return course;
    } catch (error) {
      logger.error('Error enrolling student:', error);
      throw error;
    }
  }

  /**
   * Remove student from course
   * @param {string} courseId - Course ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object>} Updated course
   */
  async removeStudent(courseId, studentId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Remove student
      await course.removeStudent(studentId);

      // Populate faculty and students
      await course.populate('faculty', 'firstName lastName email department');
      await course.populate('students', 'firstName lastName email studentId');

      logger.info(`Student removed from course ${course.code}`);
      return course;
    } catch (error) {
      logger.error('Error removing student:', error);
      throw error;
    }
  }

  /**
   * Add course material
   * @param {string} courseId - Course ID
   * @param {Object} materialData - Material data
   * @returns {Promise<Object>} Updated course
   */
  async addCourseMaterial(courseId, materialData) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Add material
      course.materials.push(materialData);
      await course.save();

      // Populate faculty
      await course.populate('faculty', 'firstName lastName email department');

      logger.info(`Material added to course ${course.code}`);
      return course;
    } catch (error) {
      logger.error('Error adding course material:', error);
      throw error;
    }
  }

  /**
   * Remove course material
   * @param {string} courseId - Course ID
   * @param {string} materialId - Material ID
   * @returns {Promise<Object>} Updated course
   */
  async removeCourseMaterial(courseId, materialId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Remove material
      course.materials = course.materials.filter(
        material => material._id.toString() !== materialId
      );
      await course.save();

      // Populate faculty
      await course.populate('faculty', 'firstName lastName email department');

      logger.info(`Material removed from course ${course.code}`);
      return course;
    } catch (error) {
      logger.error('Error removing course material:', error);
      throw error;
    }
  }

  /**
   * Add course assignment
   * @param {string} courseId - Course ID
   * @param {Object} assignmentData - Assignment data
   * @returns {Promise<Object>} Updated course
   */
  async addCourseAssignment(courseId, assignmentData) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Add assignment
      course.assignments.push(assignmentData);
      await course.save();

      // Populate faculty
      await course.populate('faculty', 'firstName lastName email department');

      logger.info(`Assignment added to course ${course.code}`);
      return course;
    } catch (error) {
      logger.error('Error adding course assignment:', error);
      throw error;
    }
  }

  /**
   * Submit assignment
   * @param {string} courseId - Course ID
   * @param {string} assignmentId - Assignment ID
   * @param {string} studentId - Student ID
   * @param {Object} submissionData - Submission data
   * @returns {Promise<Object>} Updated course
   */
  async submitAssignment(courseId, assignmentId, studentId, submissionData) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Find assignment
      const assignment = course.assignments.id(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Check if student is enrolled
      if (!course.isStudentEnrolled(studentId)) {
        throw new Error('Student is not enrolled in this course');
      }

      // Check if already submitted
      const existingSubmission = assignment.submissions.find(
        sub => sub.student.toString() === studentId
      );
      if (existingSubmission) {
        throw new Error('Assignment already submitted');
      }

      // Add submission
      assignment.submissions.push({
        student: studentId,
        fileUrl: submissionData.fileUrl
      });

      await course.save();

      // Populate faculty
      await course.populate('faculty', 'firstName lastName email department');

      logger.info(`Assignment submitted for course ${course.code}`);
      return course;
    } catch (error) {
      logger.error('Error submitting assignment:', error);
      throw error;
    }
  }

  /**
   * Grade assignment
   * @param {string} courseId - Course ID
   * @param {string} assignmentId - Assignment ID
   * @param {string} studentId - Student ID
   * @param {Object} gradeData - Grade data
   * @returns {Promise<Object>} Updated course
   */
  async gradeAssignment(courseId, assignmentId, studentId, gradeData) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Find assignment
      const assignment = course.assignments.id(assignmentId);
      if (!assignment) {
        throw new Error('Assignment not found');
      }

      // Find submission
      const submission = assignment.submissions.find(
        sub => sub.student.toString() === studentId
      );
      if (!submission) {
        throw new Error('Submission not found');
      }

      // Update grade
      submission.grade = gradeData.grade;
      submission.feedback = gradeData.feedback;

      await course.save();

      // Populate faculty
      await course.populate('faculty', 'firstName lastName email department');

      logger.info(`Assignment graded for course ${course.code}`);
      return course;
    } catch (error) {
      logger.error('Error grading assignment:', error);
      throw error;
    }
  }

  /**
   * Get courses by faculty
   * @param {string} facultyId - Faculty ID
   * @returns {Promise<Array>} Courses taught by faculty
   */
  async getCoursesByFaculty(facultyId) {
    try {
      const courses = await Course.findByFaculty(facultyId)
        .populate('faculty', 'firstName lastName email department')
        .populate('students', 'firstName lastName email studentId');

      return courses;
    } catch (error) {
      logger.error('Error getting courses by faculty:', error);
      throw error;
    }
  }

  /**
   * Get courses by department
   * @param {string} department - Department name
   * @returns {Promise<Array>} Courses in department
   */
  async getCoursesByDepartment(department) {
    try {
      const courses = await Course.findByDepartment(department)
        .populate('faculty', 'firstName lastName email department')
        .populate('students', 'firstName lastName email studentId');

      return courses;
    } catch (error) {
      logger.error('Error getting courses by department:', error);
      throw error;
    }
  }

  /**
   * Get available courses
   * @returns {Promise<Array>} Available courses
   */
  async getAvailableCourses() {
    try {
      const courses = await Course.findAvailable()
        .populate('faculty', 'firstName lastName email department')
        .populate('students', 'firstName lastName email studentId');

      return courses;
    } catch (error) {
      logger.error('Error getting available courses:', error);
      throw error;
    }
  }

  /**
   * Get course statistics
   * @returns {Promise<Object>} Course statistics
   */
  async getCourseStats() {
    try {
      const stats = await Course.aggregate([
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 },
            activeCount: {
              $sum: { $cond: ['$isActive', 1, 0] }
            },
            publishedCount: {
              $sum: { $cond: ['$isPublished', 1, 0] }
            },
            totalStudents: { $sum: '$currentStudents' }
          }
        }
      ]);

      const totalCourses = await Course.countDocuments();
      const activeCourses = await Course.countDocuments({ isActive: true });
      const publishedCourses = await Course.countDocuments({ isPublished: true });

      return {
        total: totalCourses,
        active: activeCourses,
        published: publishedCourses,
        byDepartment: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            total: stat.count,
            active: stat.activeCount,
            published: stat.publishedCount,
            totalStudents: stat.totalStudents
          };
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting course stats:', error);
      throw error;
    }
  }
}

module.exports = new CourseService(); 