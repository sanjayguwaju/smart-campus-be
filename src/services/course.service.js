const Course = require('../models/course.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');
const mongoose = require('mongoose'); // Added for getStudentsByFaculty

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
      const { department, program, semester, year, faculty, isActive, isPublished, available, search } = filters;

      // Build query
      const query = {};
      if (department) query.department = { $regex: department, $options: 'i' };
      if (program) query.program = program;
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
        .populate('program', 'name level duration semesters department')
        .populate('department', 'name')
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
   * Get courses by faculty with search, pagination and total count
   * @param {string} facultyId - Faculty ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Courses with pagination info
   */
  async getCoursesByFaculty(facultyId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sortBy = 'code', 
        sortOrder = 'asc',
        search = '',
        status = 'active'
      } = options;

      // Build query
      const query = { 
        faculty: facultyId,
        status: status
      };

      // Add search filter
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

      // Calculate skip value for pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get total count
      const total = await Course.countDocuments(query);

      // Get courses with pagination
      const courses = await Course.find(query)
        .populate('faculty', 'firstName lastName email department')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Calculate pagination info
      const pages = Math.ceil(total / parseInt(limit));

      return {
        courses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages
        }
      };
    } catch (error) {
      logger.error('Error getting courses by faculty:', error);
      throw error;
    }
  }

  /**
   * Get courses by instructor
   * @param {string} instructorId - Instructor ID
   * @returns {Promise<Array>} Courses taught by instructor
   */
  async getCoursesByInstructor(instructorId) {
    try {
      const courses = await Course.find({ faculty: instructorId })
        .populate('faculty', 'firstName lastName email department')
        .populate('students', 'firstName lastName email studentId');

      return courses;
    } catch (error) {
      logger.error('Error getting courses by instructor:', error);
      throw error;
    }
  }

  /**
   * Get all students enrolled in faculty's courses
   * @param {string} facultyId - Faculty ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Students with course information
   */
  async getStudentsByFaculty(facultyId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sortBy = 'firstName', 
        sortOrder = 'asc',
        courseId,
        search,
        status = 'active'
      } = options;

      // Get all courses taught by the faculty
      const facultyCourses = await Course.find({ 
        faculty: facultyId, 
        status: 'active' 
      }).select('_id title code');

      if (facultyCourses.length === 0) {
        return {
          students: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          },
          summary: {
            totalStudents: 0,
            totalCourses: 0,
            averageStudentsPerCourse: 0
          }
        };
      }

      const courseIds = facultyCourses.map(course => course._id);

      // Build enrollment query
      const enrollmentQuery = {
        courses: { $in: courseIds },
        status: status
      };

      // Add course filter if specified
      if (courseId) {
        enrollmentQuery.courses = courseId;
      }

      // Get enrollments with populated student and course data
      const enrollments = await mongoose.model('Enrollment')
        .find(enrollmentQuery)
        .populate('student', 'firstName lastName email studentId department')
        .populate('courses', 'title code faculty')
        .lean();

      // Process enrollments to get unique students with their course information
      const studentMap = new Map();

      enrollments.forEach(enrollment => {
        const studentId = enrollment.student._id.toString();
        
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            _id: enrollment.student._id,
            firstName: enrollment.student.firstName,
            lastName: enrollment.student.lastName,
            email: enrollment.student.email,
            studentId: enrollment.student.studentId,
            department: enrollment.student.department,
            courses: [],
            totalCredits: enrollment.totalCredits || 0,
            gpa: enrollment.gpa || 0.0,
            enrollmentStatus: enrollment.status,
            enrollmentType: enrollment.enrollmentType
          });
        }

        // Add course information for this student
        enrollment.courses.forEach(course => {
          if (course.faculty.toString() === facultyId) {
            const existingCourse = studentMap.get(studentId).courses.find(c => c._id.toString() === course._id.toString());
            if (!existingCourse) {
              studentMap.get(studentId).courses.push({
                _id: course._id,
                title: course.title,
                code: course.code
              });
            }
          }
        });
      });

      let students = Array.from(studentMap.values());

      // Apply search filter
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        students = students.filter(student => 
          student.firstName.match(searchRegex) ||
          student.lastName.match(searchRegex) ||
          student.email.match(searchRegex) ||
          student.studentId?.match(searchRegex)
        );
      }

      // Apply sorting
      students.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortBy === 'firstName' || sortBy === 'lastName') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });

      // Apply pagination
      const total = students.length;
      const pages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedStudents = students.slice(startIndex, endIndex);

      // Calculate summary statistics
      const totalStudents = total;
      const totalCourses = facultyCourses.length;
      const averageStudentsPerCourse = totalCourses > 0 ? (totalStudents / totalCourses).toFixed(2) : 0;

      return {
        students: paginatedStudents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages
        },
        summary: {
          totalStudents,
          totalCourses,
          averageStudentsPerCourse: parseFloat(averageStudentsPerCourse)
        }
      };
    } catch (error) {
      logger.error('Error getting students by faculty:', error);
      throw error;
    }
  }

  /**
   * Get students by faculty using aggregation pipeline
   * @param {string} facultyId - Faculty ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Aggregated faculty students data
   */
  async getFacultyStudentsAggregated(facultyId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sortBy = 'firstName', 
        sortOrder = 'asc',
        courseId,
        search,
        status = 'active'
      } = options;

      // Validate faculty exists and is faculty
      const faculty = await User.findById(facultyId);
      if (!faculty || faculty.role !== 'faculty') {
        throw new Error('Faculty not found or invalid faculty ID');
      }

      // Build aggregation pipeline
      const pipeline = [];

      // Step 1: Match courses taught by the faculty
      const courseMatch = {
        faculty: new mongoose.Types.ObjectId(facultyId),
        status: 'active'
      };
      
      if (courseId) {
        courseMatch._id = new mongoose.Types.ObjectId(courseId);
      }

      pipeline.push({
        $match: courseMatch
      });

      // Step 2: Lookup enrollments for these courses
      pipeline.push({
        $lookup: {
          from: 'enrollments',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$courseId', '$courses'] },
                    { $eq: ['$status', status] }
                  ]
                }
              }
            }
          ],
          as: 'enrollments'
        }
      });

      // Step 3: Unwind enrollments to get individual enrollment records
      pipeline.push({
        $unwind: {
          path: '$enrollments',
          preserveNullAndEmptyArrays: false
        }
      });

      // Step 4: Lookup student details
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'enrollments.student',
          foreignField: '_id',
          as: 'studentDetails'
        }
      });

      // Step 5: Unwind student details
      pipeline.push({
        $unwind: {
          path: '$studentDetails',
          preserveNullAndEmptyArrays: false
        }
      });

      // Step 6: Match only students (role = 'student')
      pipeline.push({
        $match: {
          'studentDetails.role': 'student',
          'studentDetails.isActive': true
        }
      });

      // Step 7: Apply search filter if provided
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        pipeline.push({
          $match: {
            $or: [
              { 'studentDetails.firstName': searchRegex },
              { 'studentDetails.lastName': searchRegex },
              { 'studentDetails.email': searchRegex },
              { 'studentDetails.studentId': searchRegex }
            ]
          }
        });
      }

      // Step 8: Group by student to combine course information
      pipeline.push({
        $group: {
          _id: '$studentDetails._id',
          student: { $first: '$studentDetails' },
          courses: {
            $push: {
              _id: '$_id',
              title: '$title',
              code: '$code',
              courseType: '$courseType',
              creditHours: '$creditHours',
              semester: '$semester',
              year: '$year',
              currentEnrollment: '$currentEnrollment',
              maxStudents: '$maxStudents'
            }
          },
          enrollmentInfo: { $first: '$enrollments' }
        }
      });

      // Step 9: Add computed fields
      pipeline.push({
        $addFields: {
          totalCredits: {
            $sum: '$courses.creditHours'
          },
          courseCount: {
            $size: '$courses'
          },
          enrollmentStatus: '$enrollmentInfo.status',
          enrollmentType: '$enrollmentInfo.enrollmentType',
          gpa: '$enrollmentInfo.gpa',
          cgpa: '$enrollmentInfo.cgpa'
        }
      });

      // Step 10: Project final structure
      pipeline.push({
        $project: {
          _id: '$student._id',
          firstName: '$student.firstName',
          lastName: '$student.lastName',
          email: '$student.email',
          studentId: '$student.studentId',
          department: '$student.department',
          phone: '$student.phone',
          avatar: '$student.avatar',
          courses: 1,
          totalCredits: 1,
          courseCount: 1,
          enrollmentStatus: 1,
          enrollmentType: 1,
          gpa: 1,
          cgpa: 1
        }
      });

      // Step 11: Sort results
      const sortOrderNum = sortOrder === 'desc' ? -1 : 1;
      pipeline.push({
        $sort: { [sortBy]: sortOrderNum }
      });

      // Step 12: Get total count for pagination
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Course.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      // Step 13: Apply pagination
      pipeline.push(
        { $skip: (page - 1) * limit },
        { $limit: limit }
      );

      // Execute aggregation
      const students = await Course.aggregate(pipeline);

      // Calculate summary statistics
      const totalStudents = total;
      const facultyCourses = await Course.find({ 
        faculty: facultyId, 
        status: 'active' 
      }).select('_id');
      const totalCourses = facultyCourses.length;
      const averageStudentsPerCourse = totalCourses > 0 ? (totalStudents / totalCourses).toFixed(2) : 0;

      return {
        students,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        summary: {
          totalStudents,
          totalCourses,
          averageStudentsPerCourse: parseFloat(averageStudentsPerCourse),
          faculty: {
            _id: faculty._id,
            firstName: faculty.firstName,
            lastName: faculty.lastName,
            email: faculty.email,
            facultyId: faculty.facultyId,
            department: faculty.department
          }
        }
      };
    } catch (error) {
      logger.error('Error getting faculty students aggregated:', error);
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