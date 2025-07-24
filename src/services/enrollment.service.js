const Enrollment = require('../models/enrollment.model');
const User = require('../models/user.model');
const Program = require('../models/program.model');
const Course = require('../models/course.model');
const createError = require('../utils/createError');
const logger = require('../utils/logger');

class EnrollmentService {
  /**
   * Create a new enrollment
   */
  async createEnrollment(enrollmentData, createdBy) {
    try {
      // Check if student exists
      const student = await User.findById(enrollmentData.student);
      if (!student) {
        throw createError(404, 'Student not found');
      }

      // Check if program exists
      const program = await Program.findById(enrollmentData.program);
      if (!program) {
        throw createError(404, 'Program not found');
      }

      // Check if advisor exists (if provided)
      if (enrollmentData.advisor) {
        const advisor = await User.findById(enrollmentData.advisor);
        if (!advisor) {
          throw createError(404, 'Advisor not found');
        }
      }

      // Check if courses exist (if provided)
      if (enrollmentData.courses && enrollmentData.courses.length > 0) {
        const courses = await Course.find({ _id: { $in: enrollmentData.courses } });
        if (courses.length !== enrollmentData.courses.length) {
          throw createError(404, 'One or more courses not found');
        }
      }

      // Check for duplicate enrollment
      const existingEnrollment = await Enrollment.findOne({
        student: enrollmentData.student,
        program: enrollmentData.program,
        semester: enrollmentData.semester,
        academicYear: enrollmentData.academicYear
      });

      if (existingEnrollment) {
        throw createError(409, 'Student is already enrolled in this program for the specified semester and academic year');
      }

      const data = {
        ...enrollmentData,
        createdBy: createdBy
      };

      const enrollment = await Enrollment.create(data);

      // Add initial audit entry
      await enrollment.addAuditEntry('enrolled', createdBy, 'Initial enrollment created');

      // Calculate total credits if courses are provided
      if (enrollmentData.courses && enrollmentData.courses.length > 0) {
        await enrollment.calculateTotalCredits();
      }

      const populatedEnrollment = await Enrollment.findById(enrollment._id)
        .populate('student', 'name email studentId')
        .populate('program', 'name code')
        .populate('courses', 'name code creditHours')
        .populate('advisor', 'name email')
        .populate('createdBy', 'name email');

      logger.info(`Enrollment created: ${enrollment._id} for student: ${enrollmentData.student}`);

      return {
        success: true,
        data: populatedEnrollment,
        message: 'Enrollment created successfully'
      };
    } catch (error) {
      logger.error('Error creating enrollment:', error);
      throw error;
    }
  }

  /**
   * Get all enrollments with pagination and filtering
   */
  async getEnrollments(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'enrolledAt', sortOrder = 'desc' } = pagination;
      const { 
        search, 
        student, 
        program, 
        semester, 
        semesterTerm,
        academicYear,
        status, 
        enrollmentType,
        academicStanding,
        financialStatus,
        advisor 
      } = filters;

      // Build query
      const query = {};
      
      if (search) {
        query.$or = [
          { notes: { $regex: search, $options: 'i' } }
        ];
      }

      if (student) {
        query.student = student;
      }

      if (program) {
        query.program = program;
      }

      if (semester !== undefined) {
        query.semester = semester;
      }

      if (semesterTerm) {
        query.semesterTerm = semesterTerm;
      }

      if (academicYear) {
        query.academicYear = academicYear;
      }

      if (status) {
        query.status = status;
      }

      if (enrollmentType) {
        query.enrollmentType = enrollmentType;
      }

      if (academicStanding) {
        query.academicStanding = academicStanding;
      }

      if (financialStatus) {
        query.financialStatus = financialStatus;
      }

      if (advisor) {
        query.advisor = advisor;
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calculate skip value
      const skip = (page - 1) * limit;

      // Execute query
      const [enrollments, total] = await Promise.all([
        Enrollment.find(query)
          .populate('student', 'name email studentId')
          .populate('program', 'name code')
          .populate('courses', 'name code creditHours')
          .populate('advisor', 'name email')
          .populate('createdBy', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Enrollment.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: {
          enrollments,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage
          }
        },
        message: 'Enrollments retrieved successfully'
      };
    } catch (error) {
      logger.error('Error getting enrollments:', error);
      throw error;
    }
  }

  /**
   * Get enrollment by ID
   */
  async getEnrollmentById(enrollmentId) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('student', 'name email studentId department')
        .populate('program', 'name code description')
        .populate('courses', 'name code creditHours description')
        .populate('advisor', 'name email')
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name email')
        .populate('auditTrail.performedBy', 'name email');

      if (!enrollment) {
        throw createError(404, 'Enrollment not found');
      }

      return {
        success: true,
        data: enrollment,
        message: 'Enrollment retrieved successfully'
      };
    } catch (error) {
      logger.error('Error getting enrollment by ID:', error);
      throw error;
    }
  }

  /**
   * Update enrollment
   */
  async updateEnrollment(enrollmentId, updateData, lastModifiedBy) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        throw createError(404, 'Enrollment not found');
      }

      // Check if courses exist (if being updated)
      if (updateData.courses && updateData.courses.length > 0) {
        const courses = await Course.find({ _id: { $in: updateData.courses } });
        if (courses.length !== updateData.courses.length) {
          throw createError(404, 'One or more courses not found');
        }
      }

      // Check if advisor exists (if being updated)
      if (updateData.advisor) {
        const advisor = await User.findById(updateData.advisor);
        if (!advisor) {
          throw createError(404, 'Advisor not found');
        }
      }

      const data = {};
      
      if (updateData.semester !== undefined) data.semester = updateData.semester;
      if (updateData.semesterTerm !== undefined) data.semesterTerm = updateData.semesterTerm;
      if (updateData.academicYear !== undefined) data.academicYear = updateData.academicYear;
      if (updateData.courses !== undefined) data.courses = updateData.courses;
      if (updateData.status !== undefined) data.status = updateData.status;
      if (updateData.enrollmentType !== undefined) data.enrollmentType = updateData.enrollmentType;
      if (updateData.totalCredits !== undefined) data.totalCredits = updateData.totalCredits;
      if (updateData.gpa !== undefined) data.gpa = updateData.gpa;
      if (updateData.cgpa !== undefined) data.cgpa = updateData.cgpa;
      if (updateData.academicStanding !== undefined) data.academicStanding = updateData.academicStanding;
      if (updateData.financialStatus !== undefined) data.financialStatus = updateData.financialStatus;
      if (updateData.scholarship !== undefined) data.scholarship = updateData.scholarship;
      if (updateData.advisor !== undefined) data.advisor = updateData.advisor;
      if (updateData.notes !== undefined) data.notes = updateData.notes;
      if (updateData.lastModifiedBy !== undefined) data.lastModifiedBy = updateData.lastModifiedBy;

      // Set lastModifiedBy if not provided
      if (!data.lastModifiedBy) {
        data.lastModifiedBy = lastModifiedBy;
      }

      const updatedEnrollment = await Enrollment.findByIdAndUpdate(
        enrollmentId,
        data,
        { new: true, runValidators: true }
      )
        .populate('student', 'name email studentId')
        .populate('program', 'name code')
        .populate('courses', 'name code creditHours')
        .populate('advisor', 'name email')
        .populate('lastModifiedBy', 'name email');

      // Add audit entry
      await updatedEnrollment.addAuditEntry('status_changed', lastModifiedBy, 'Enrollment updated');

      // Recalculate total credits if courses were updated
      if (updateData.courses !== undefined) {
        await updatedEnrollment.calculateTotalCredits();
      }

      logger.info(`Enrollment updated: ${enrollmentId} by user: ${lastModifiedBy}`);

      return {
        success: true,
        data: updatedEnrollment,
        message: 'Enrollment updated successfully'
      };
    } catch (error) {
      logger.error('Error updating enrollment:', error);
      throw error;
    }
  }

  /**
   * Delete enrollment
   */
  async deleteEnrollment(enrollmentId, deletedBy) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        throw createError(404, 'Enrollment not found');
      }

      // Add audit entry before deletion
      await enrollment.addAuditEntry('status_changed', deletedBy, 'Enrollment deleted');

      await Enrollment.findByIdAndDelete(enrollmentId);

      logger.info(`Enrollment deleted: ${enrollmentId} by user: ${deletedBy}`);

      return {
        success: true,
        message: 'Enrollment deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting enrollment:', error);
      throw error;
    }
  }

  /**
   * Add course to enrollment
   */
  async addCourseToEnrollment(enrollmentId, courseId, lastModifiedBy) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        throw createError(404, 'Enrollment not found');
      }

      // Check if course exists
      const course = await Course.findById(courseId);
      if (!course) {
        throw createError(404, 'Course not found');
      }

      // Check if student can enroll in course
      if (!enrollment.canEnrollInCourse(courseId)) {
        throw createError(400, 'Student cannot enroll in this course');
      }

      await enrollment.addCourse(courseId, lastModifiedBy);
      await enrollment.calculateTotalCredits();

      const updatedEnrollment = await Enrollment.findById(enrollmentId)
        .populate('student', 'name email studentId')
        .populate('program', 'name code')
        .populate('courses', 'name code creditHours')
        .populate('advisor', 'name email');

      logger.info(`Course added to enrollment: ${courseId} to enrollment: ${enrollmentId}`);

      return {
        success: true,
        data: updatedEnrollment,
        message: 'Course added to enrollment successfully'
      };
    } catch (error) {
      logger.error('Error adding course to enrollment:', error);
      throw error;
    }
  }

  /**
   * Remove course from enrollment
   */
  async removeCourseFromEnrollment(enrollmentId, courseId, lastModifiedBy) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        throw createError(404, 'Enrollment not found');
      }

      await enrollment.removeCourse(courseId, lastModifiedBy);
      await enrollment.calculateTotalCredits();

      const updatedEnrollment = await Enrollment.findById(enrollmentId)
        .populate('student', 'name email studentId')
        .populate('program', 'name code')
        .populate('courses', 'name code creditHours')
        .populate('advisor', 'name email');

      logger.info(`Course removed from enrollment: ${courseId} from enrollment: ${enrollmentId}`);

      return {
        success: true,
        data: updatedEnrollment,
        message: 'Course removed from enrollment successfully'
      };
    } catch (error) {
      logger.error('Error removing course from enrollment:', error);
      throw error;
    }
  }

  /**
   * Update enrollment status
   */
  async updateEnrollmentStatus(enrollmentId, status, lastModifiedBy, details = '') {
    try {
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        throw createError(404, 'Enrollment not found');
      }

      await enrollment.updateStatus(status, lastModifiedBy, details);

      const updatedEnrollment = await Enrollment.findById(enrollmentId)
        .populate('student', 'name email studentId')
        .populate('program', 'name code')
        .populate('courses', 'name code creditHours')
        .populate('advisor', 'name email');

      logger.info(`Enrollment status updated: ${enrollmentId} to ${status}`);

      return {
        success: true,
        data: updatedEnrollment,
        message: 'Enrollment status updated successfully'
      };
    } catch (error) {
      logger.error('Error updating enrollment status:', error);
      throw error;
    }
  }

  /**
   * Update GPA
   */
  async updateGPA(enrollmentId, gpa, cgpa, lastModifiedBy) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        throw createError(404, 'Enrollment not found');
      }

      await enrollment.updateGPA(gpa, lastModifiedBy);

      // Update CGPA if provided
      if (cgpa !== undefined) {
        enrollment.cgpa = cgpa;
        await enrollment.save();
      }

      const updatedEnrollment = await Enrollment.findById(enrollmentId)
        .populate('student', 'name email studentId')
        .populate('program', 'name code')
        .populate('courses', 'name code creditHours')
        .populate('advisor', 'name email');

      logger.info(`GPA updated for enrollment: ${enrollmentId}`);

      return {
        success: true,
        data: updatedEnrollment,
        message: 'GPA updated successfully'
      };
    } catch (error) {
      logger.error('Error updating GPA:', error);
      throw error;
    }
  }

  /**
   * Add document to enrollment
   */
  async addDocumentToEnrollment(enrollmentId, documentData, lastModifiedBy) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        throw createError(404, 'Enrollment not found');
      }

      await enrollment.addDocument(documentData, lastModifiedBy);

      const updatedEnrollment = await Enrollment.findById(enrollmentId)
        .populate('student', 'name email studentId')
        .populate('program', 'name code')
        .populate('courses', 'name code creditHours')
        .populate('advisor', 'name email');

      logger.info(`Document added to enrollment: ${enrollmentId}`);

      return {
        success: true,
        data: updatedEnrollment,
        message: 'Document added to enrollment successfully'
      };
    } catch (error) {
      logger.error('Error adding document to enrollment:', error);
      throw error;
    }
  }

  /**
   * Remove document from enrollment
   */
  async removeDocumentFromEnrollment(enrollmentId, documentId, lastModifiedBy) {
    try {
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
        throw createError(404, 'Enrollment not found');
      }

      await enrollment.removeDocument(documentId, lastModifiedBy);

      const updatedEnrollment = await Enrollment.findById(enrollmentId)
        .populate('student', 'name email studentId')
        .populate('program', 'name code')
        .populate('courses', 'name code creditHours')
        .populate('advisor', 'name email');

      logger.info(`Document removed from enrollment: ${enrollmentId}`);

      return {
        success: true,
        data: updatedEnrollment,
        message: 'Document removed from enrollment successfully'
      };
    } catch (error) {
      logger.error('Error removing document from enrollment:', error);
      throw error;
    }
  }

  /**
   * Get enrollments by student
   */
  async getEnrollmentsByStudent(studentId) {
    try {
      const enrollments = await Enrollment.findByStudent(studentId);

      return {
        success: true,
        data: enrollments,
        message: 'Student enrollments retrieved successfully'
      };
    } catch (error) {
      logger.error('Error getting enrollments by student:', error);
      throw error;
    }
  }

  /**
   * Get enrollments by program
   */
  async getEnrollmentsByProgram(programId) {
    try {
      const enrollments = await Enrollment.findByProgram(programId);

      return {
        success: true,
        data: enrollments,
        message: 'Program enrollments retrieved successfully'
      };
    } catch (error) {
      logger.error('Error getting enrollments by program:', error);
      throw error;
    }
  }

  /**
   * Get enrollment statistics
   */
  async getEnrollmentStats() {
    try {
      const [
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        droppedEnrollments,
        suspendedEnrollments,
        graduatedEnrollments,
        fullTimeEnrollments,
        partTimeEnrollments,
        goodStandingEnrollments,
        warningEnrollments,
        probationEnrollments,
        suspensionEnrollments
      ] = await Promise.all([
        Enrollment.countDocuments(),
        Enrollment.countDocuments({ status: 'active' }),
        Enrollment.countDocuments({ status: 'completed' }),
        Enrollment.countDocuments({ status: 'dropped' }),
        Enrollment.countDocuments({ status: 'suspended' }),
        Enrollment.countDocuments({ status: 'graduated' }),
        Enrollment.countDocuments({ enrollmentType: 'full_time' }),
        Enrollment.countDocuments({ enrollmentType: 'part_time' }),
        Enrollment.countDocuments({ academicStanding: 'good_standing' }),
        Enrollment.countDocuments({ academicStanding: 'academic_warning' }),
        Enrollment.countDocuments({ academicStanding: 'academic_probation' }),
        Enrollment.countDocuments({ academicStanding: 'academic_suspension' })
      ]);

      const stats = {
        total: totalEnrollments,
        byStatus: {
          active: activeEnrollments,
          completed: completedEnrollments,
          dropped: droppedEnrollments,
          suspended: suspendedEnrollments,
          graduated: graduatedEnrollments
        },
        byEnrollmentType: {
          fullTime: fullTimeEnrollments,
          partTime: partTimeEnrollments
        },
        byAcademicStanding: {
          goodStanding: goodStandingEnrollments,
          warning: warningEnrollments,
          probation: probationEnrollments,
          suspension: suspensionEnrollments
        },
        activePercentage: totalEnrollments > 0 ? Math.round((activeEnrollments / totalEnrollments) * 100) : 0
      };

      return {
        success: true,
        data: stats,
        message: 'Enrollment statistics retrieved successfully'
      };
    } catch (error) {
      logger.error('Error getting enrollment statistics:', error);
      throw error;
    }
  }

  /**
   * Bulk operations on enrollments
   */
  async bulkEnrollmentOperation(operation, enrollmentIds, data, lastModifiedBy) {
    try {
      const enrollments = await Enrollment.find({ _id: { $in: enrollmentIds } });
      
      if (enrollments.length !== enrollmentIds.length) {
        throw createError(404, 'One or more enrollments not found');
      }

      const results = [];

      for (const enrollment of enrollments) {
        try {
          switch (operation) {
            case 'activate':
              await enrollment.updateStatus('active', lastModifiedBy, 'Bulk activation');
              break;
            case 'suspend':
              await enrollment.updateStatus('suspended', lastModifiedBy, 'Bulk suspension');
              break;
            case 'complete':
              await enrollment.updateStatus('completed', lastModifiedBy, 'Bulk completion');
              break;
            case 'drop':
              await enrollment.updateStatus('dropped', lastModifiedBy, 'Bulk drop');
              break;
            case 'update_status':
              if (data.status) {
                await enrollment.updateStatus(data.status, lastModifiedBy, 'Bulk status update');
              }
              break;
            case 'update_gpa':
              if (data.gpa !== undefined) {
                await enrollment.updateGPA(data.gpa, data.cgpa, lastModifiedBy);
              }
              break;
            default:
              throw createError(400, 'Invalid operation');
          }
          results.push({ id: enrollment._id, success: true });
        } catch (error) {
          results.push({ id: enrollment._id, success: false, error: error.message });
        }
      }

      logger.info(`Bulk operation ${operation} completed on ${enrollmentIds.length} enrollments`);

      return {
        success: true,
        data: results,
        message: `Bulk operation ${operation} completed`
      };
    } catch (error) {
      logger.error('Error performing bulk enrollment operation:', error);
      throw error;
    }
  }
}

module.exports = new EnrollmentService(); 