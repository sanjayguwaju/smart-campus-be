const { getRedisClient } = require('../config/redis.config');
const logger = require('./logger');

class CacheService {
  constructor() {
    this.client = getRedisClient();
    this.defaultTTL = 3600; // 1 hour
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<*>} Cached value
   */
  async get(key) {
    try {
      if (!this.client) return null;
      
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.client) return false;
      
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    try {
      if (!this.client) return false;
      
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys with pattern
   * @param {string} pattern - Key pattern
   * @returns {Promise<boolean>} Success status
   */
  async delPattern(pattern) {
    try {
      if (!this.client) return false;
      
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache pattern delete error:', error);
      return false;
    }
  }

  /**
   * Generate cache key
   * @param {string} prefix - Key prefix
   * @param {Object} params - Parameters to include in key
   * @returns {string} Cache key
   */
  generateKey(prefix, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(':');
    
    return sortedParams ? `${prefix}:${sortedParams}` : prefix;
  }

  /**
   * Cache wrapper for async functions
   * @param {string} key - Cache key
   * @param {Function} fn - Function to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<*>} Function result
   */
  async cached(key, fn, ttl = this.defaultTTL) {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      if (cached !== null) {
        logger.debug(`Cache hit: ${key}`);
        return cached;
      }

      // Execute function and cache result
      const result = await fn();
      await this.set(key, result, ttl);
      logger.debug(`Cache miss: ${key}`);
      return result;
    } catch (error) {
      logger.error('Cache wrapper error:', error);
      // Fallback to function execution
      return await fn();
    }
  }
}

module.exports = new CacheService(); 