const logger = require('./logger');

class QueryOptimizer {
  /**
   * Optimize pagination query with proper indexing hints
   * @param {Object} query - Mongoose query object
   * @param {Object} pagination - Pagination options
   * @param {Array} indexes - Suggested indexes for the query
   * @returns {Object} Optimized query
   */
  static optimizePagination(query, pagination = {}, indexes = []) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    
    // Add index hints if provided
    if (indexes.length > 0) {
      query.hint(indexes);
    }
    
    // Optimize sort with compound index
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Add _id to sort for consistent pagination
    if (sortBy !== '_id') {
      sort._id = sortOrder === 'desc' ? -1 : 1;
    }
    
    return query.sort(sort);
  }

  /**
   * Optimize text search query
   * @param {Object} query - Mongoose query object
   * @param {string} searchTerm - Search term
   * @param {Array} searchFields - Fields to search in
   * @returns {Object} Optimized search query
   */
  static optimizeTextSearch(query, searchTerm, searchFields = []) {
    if (!searchTerm) return query;

    // Use text index if available
    if (searchFields.length > 0) {
      query.$text = { $search: searchTerm };
      // Add text score for relevance sorting
      query.score = { $meta: 'textScore' };
    } else {
      // Fallback to regex search
      const searchRegex = { $regex: searchTerm, $options: 'i' };
      const searchConditions = searchFields.map(field => ({ [field]: searchRegex }));
      query.$or = searchConditions;
    }

    return query;
  }

  /**
   * Optimize aggregation pipeline
   * @param {Array} pipeline - Aggregation pipeline
   * @param {Object} options - Optimization options
   * @returns {Array} Optimized pipeline
   */
  static optimizeAggregation(pipeline, options = {}) {
    const { allowDiskUse = false, maxTimeMS = 30000 } = options;
    
    // Add optimization options
    const optimizedPipeline = [
      ...pipeline,
      {
        $limit: 1000 // Prevent excessive memory usage
      }
    ];

    return {
      pipeline: optimizedPipeline,
      options: {
        allowDiskUse,
        maxTimeMS
      }
    };
  }

  /**
   * Create compound index suggestion
   * @param {Array} fields - Fields to index
   * @param {Object} options - Index options
   * @returns {Object} Index suggestion
   */
  static suggestIndex(fields, options = {}) {
    const { unique = false, sparse = false, background = true } = options;
    
    const index = {};
    fields.forEach(field => {
      if (typeof field === 'string') {
        index[field] = 1;
      } else if (typeof field === 'object') {
        Object.assign(index, field);
      }
    });

    return {
      fields: index,
      options: {
        unique,
        sparse,
        background
      }
    };
  }

  /**
   * Optimize populate operations
   * @param {Object} query - Mongoose query object
   * @param {Array} populateOptions - Populate options
   * @returns {Object} Query with optimized populate
   */
  static optimizePopulate(query, populateOptions = []) {
    if (populateOptions.length === 0) return query;

    // Optimize populate by selecting only needed fields
    const optimizedPopulate = populateOptions.map(option => {
      if (typeof option === 'string') {
        return {
          path: option,
          select: '-__v -createdAt -updatedAt'
        };
      }
      
      // If option is already an object, ensure it has select optimization
      if (option.select === undefined) {
        option.select = '-__v -createdAt -updatedAt';
      }
      
      return option;
    });

    return query.populate(optimizedPopulate);
  }

  /**
   * Add query performance monitoring
   * @param {Object} query - Mongoose query object
   * @param {string} operationName - Name of the operation
   * @returns {Object} Query with performance monitoring
   */
  static addPerformanceMonitoring(query, operationName) {
    const startTime = Date.now();
    
    // Add query execution monitoring
    const originalExec = query.exec;
    query.exec = async function(...args) {
      const result = await originalExec.apply(this, args);
      const executionTime = Date.now() - startTime;
      
      // Log slow queries
      if (executionTime > 1000) {
        logger.warn(`Slow query detected: ${operationName} took ${executionTime}ms`);
      }
      
      // Log query performance metrics
      logger.debug(`Query performance: ${operationName} - ${executionTime}ms`);
      
      return result;
    };

    return query;
  }

  /**
   * Optimize bulk operations
   * @param {Array} operations - Bulk operations
   * @param {Object} options - Bulk operation options
   * @returns {Object} Optimized bulk operations
   */
  static optimizeBulkOperations(operations, options = {}) {
    const { ordered = false, writeConcern = { w: 1 } } = options;
    
    return {
      operations,
      options: {
        ordered,
        writeConcern
      }
    };
  }

  /**
   * Create query cache key
   * @param {string} collection - Collection name
   * @param {Object} query - Query parameters
   * @param {Object} options - Query options
   * @returns {string} Cache key
   */
  static createCacheKey(collection, query = {}, options = {}) {
    const queryStr = JSON.stringify(query);
    const optionsStr = JSON.stringify(options);
    return `${collection}:${Buffer.from(queryStr + optionsStr).toString('base64')}`;
  }
}

module.exports = QueryOptimizer; 