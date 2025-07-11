const Program = require('../models/program.model');
const Department = require('../models/department.model');
const logger = require('../utils/logger');

/**
 * Program Service Class
 */
class ProgramService {
  /**
   * Create a new program
   * @param {Object} programData - Program data
   * @returns {Promise<Object>} Created program
   */
  async createProgram(programData) {
    try {
      const data = {
        name: programData.name,
        department: programData.department,
        level: programData.level,
        duration: programData.duration,
        semesters: programData.semesters,
        description: programData.description,
        prerequisites: programData.prerequisites || [],
        image: programData.image,
        brochureUrl: programData.brochureUrl,
        isPublished: programData.isPublished !== undefined ? programData.isPublished : false,
        status: programData.status || 'draft'
      };

      // Validate department exists
      const department = await Department.findById(data.department);
      if (!department) {
        throw new Error('Department not found');
      }

      // Check if program with same name already exists in the same department
      const existingProgram = await Program.findOne({
        name: { $regex: new RegExp(`^${data.name}$`, 'i') },
        department: data.department
      });

      if (existingProgram) {
        throw new Error('Program with this name already exists in the selected department');
      }

      const program = await Program.create(data);
      await program.populate('department', 'name code');
      
      logger.info(`Program created: ${program.name} in department: ${department.name}`);
      return program;
    } catch (error) {
      logger.error('Error creating program:', error);
      throw error;
    }
  }

  /**
   * Get all programs with pagination and filters
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Programs with pagination info
   */
  async getPrograms(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = pagination;
      const { search, department, level, status, isPublished } = filters;

      // Build query
      const query = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (department) {
        query.department = department;
      }

      if (level) {
        query.level = level;
      }

      if (status) {
        query.status = status;
      }

      if (isPublished !== undefined) {
        query.isPublished = isPublished === 'true';
      }

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Execute query with pagination
      const programs = await Program.find(query)
        .populate('department', 'name code')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await Program.countDocuments(query);
      const pages = Math.ceil(total / parseInt(limit));

      const paginationInfo = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      };

      logger.info(`Programs retrieved: ${programs.length} programs`);
      return {
        data: programs,
        pagination: paginationInfo
      };
    } catch (error) {
      logger.error('Error retrieving programs:', error);
      throw error;
    }
  }

  /**
   * Get a program by ID
   * @param {string} programId - Program ID
   * @returns {Promise<Object>} Program object
   */
  async getProgramById(programId) {
    try {
      const program = await Program.findById(programId).populate('department', 'name code');
      
      if (!program) {
        throw new Error('Program not found');
      }

      logger.info(`Program retrieved: ${program.name}`);
      return program;
    } catch (error) {
      logger.error('Error retrieving program:', error);
      throw error;
    }
  }

  /**
   * Update a program
   * @param {string} programId - Program ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated program
   */
  async updateProgram(programId, updateData) {
    try {
      const data = {};
      
      // Only include fields that are provided
      if (updateData.name !== undefined) data.name = updateData.name;
      if (updateData.department !== undefined) data.department = updateData.department;
      if (updateData.level !== undefined) data.level = updateData.level;
      if (updateData.duration !== undefined) data.duration = updateData.duration;
      if (updateData.semesters !== undefined) data.semesters = updateData.semesters;
      if (updateData.description !== undefined) data.description = updateData.description;
      if (updateData.prerequisites !== undefined) data.prerequisites = updateData.prerequisites;
      if (updateData.image !== undefined) data.image = updateData.image;
      if (updateData.brochureUrl !== undefined) data.brochureUrl = updateData.brochureUrl;
      if (updateData.isPublished !== undefined) data.isPublished = updateData.isPublished;
      if (updateData.status !== undefined) data.status = updateData.status;

      // Validate department exists if being updated
      if (data.department) {
        const department = await Department.findById(data.department);
        if (!department) {
          throw new Error('Department not found');
        }
      }

      // Check if program with same name already exists in the same department (excluding current program)
      if (data.name || data.department) {
        const existingQuery = {
          _id: { $ne: programId },
          $or: []
        };

        if (data.name && data.department) {
          existingQuery.$or.push({
            name: { $regex: new RegExp(`^${data.name}$`, 'i') },
            department: data.department
          });
        } else if (data.name) {
          // If only name is being updated, check against current department
          const currentProgram = await Program.findById(programId);
          if (currentProgram) {
            existingQuery.$or.push({
              name: { $regex: new RegExp(`^${data.name}$`, 'i') },
              department: currentProgram.department
            });
          }
        }

        if (existingQuery.$or.length > 0) {
          const existingProgram = await Program.findOne(existingQuery);
          if (existingProgram) {
            throw new Error('Program with this name already exists in the selected department');
          }
        }
      }

      const program = await Program.findByIdAndUpdate(
        programId,
        data,
        { new: true, runValidators: true }
      ).populate('department', 'name code');

      if (!program) {
        throw new Error('Program not found');
      }

      logger.info(`Program updated: ${program.name}`);
      return program;
    } catch (error) {
      logger.error('Error updating program:', error);
      throw error;
    }
  }

  /**
   * Delete a program
   * @param {string} programId - Program ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteProgram(programId) {
    try {
      const program = await Program.findById(programId);
      
      if (!program) {
        throw new Error('Program not found');
      }

      // Check if program is published (prevent deletion of published programs)
      if (program.isPublished) {
        throw new Error('Cannot delete a published program. Please unpublish it first.');
      }

      await Program.findByIdAndDelete(programId);
      
      logger.info(`Program deleted: ${program.name}`);
      return { success: true, message: 'Program deleted successfully' };
    } catch (error) {
      logger.error('Error deleting program:', error);
      throw error;
    }
  }

  /**
   * Publish or unpublish a program
   * @param {string} programId - Program ID
   * @param {boolean} isPublished - Whether to publish or unpublish
   * @returns {Promise<Object>} Updated program
   */
  async publishProgram(programId, isPublished) {
    try {
      const program = await Program.findById(programId);
      
      if (!program) {
        throw new Error('Program not found');
      }

      program.isPublished = isPublished;
      program.status = isPublished ? 'published' : 'draft';
      await program.save();
      await program.populate('department', 'name code');

      logger.info(`Program ${isPublished ? 'published' : 'unpublished'}: ${program.name}`);
      return program;
    } catch (error) {
      logger.error('Error publishing/unpublishing program:', error);
      throw error;
    }
  }

  /**
   * Get published programs only
   * @returns {Promise<Array>} Published programs
   */
  async getPublishedPrograms() {
    try {
      const programs = await Program.find({ 
        isPublished: true, 
        status: 'published' 
      })
      .populate('department', 'name code')
      .sort({ name: 1 });

      logger.info(`Published programs retrieved: ${programs.length} programs`);
      return programs;
    } catch (error) {
      logger.error('Error retrieving published programs:', error);
      throw error;
    }
  }

  /**
   * Get programs by department
   * @param {string} departmentId - Department ID
   * @returns {Promise<Array>} Programs in the department
   */
  async getProgramsByDepartment(departmentId) {
    try {
      const programs = await Program.find({ 
        department: departmentId,
        isPublished: true 
      })
      .populate('department', 'name code')
      .sort({ name: 1 });

      logger.info(`Programs retrieved for department: ${programs.length} programs`);
      return programs;
    } catch (error) {
      logger.error('Error retrieving programs by department:', error);
      throw error;
    }
  }

  /**
   * Search programs by name or description
   * @param {string} searchTerm - Search term
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Matching programs
   */
  async searchPrograms(searchTerm, limit = 10) {
    try {
      const programs = await Program.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ],
        isPublished: true
      })
      .populate('department', 'name code')
      .sort({ name: 1 })
      .limit(limit);

      logger.info(`Program search completed: ${programs.length} results for "${searchTerm}"`);
      return programs;
    } catch (error) {
      logger.error('Error searching programs:', error);
      throw error;
    }
  }

  /**
   * Get program statistics
   * @returns {Promise<Object>} Program statistics
   */
  async getProgramStats() {
    try {
      const [
        totalPrograms,
        publishedPrograms,
        draftPrograms,
        undergraduatePrograms,
        postgraduatePrograms
      ] = await Promise.all([
        Program.countDocuments(),
        Program.countDocuments({ isPublished: true, status: 'published' }),
        Program.countDocuments({ isPublished: false, status: 'draft' }),
        Program.countDocuments({ level: 'Undergraduate' }),
        Program.countDocuments({ level: 'Postgraduate' })
      ]);

      const stats = {
        total: totalPrograms,
        published: publishedPrograms,
        draft: draftPrograms,
        undergraduate: undergraduatePrograms,
        postgraduate: postgraduatePrograms,
        publishedPercentage: totalPrograms > 0 ? Math.round((publishedPrograms / totalPrograms) * 100) : 0
      };

      logger.info('Program statistics retrieved');
      return stats;
    } catch (error) {
      logger.error('Error retrieving program statistics:', error);
      throw error;
    }
  }

  /**
   * Get programs by level
   * @param {string} level - Program level (Undergraduate/Postgraduate)
   * @returns {Promise<Array>} Programs by level
   */
  async getProgramsByLevel(level) {
    try {
      const programs = await Program.find({ 
        level: level,
        isPublished: true 
      })
      .populate('department', 'name code')
      .sort({ name: 1 });

      logger.info(`Programs retrieved for level ${level}: ${programs.length} programs`);
      return programs;
    } catch (error) {
      logger.error('Error retrieving programs by level:', error);
      throw error;
    }
  }
}

module.exports = new ProgramService(); 