const rateLimit = require('express-rate-limit');
const { getRedisClient } = require('../config/redis.config');
const logger = require('../utils/logger');

// Redis store for rate limiting
const RedisStore = require('rate-limit-redis');
const redisClient = getRedisClient();

// Create Redis store if available
const redisStore = redisClient ? new RedisStore({
  sendCommand: (...args) => redisClient.sendCommand(args)
}) : undefined;

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  store: redisStore,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Authentication rate limiter (stricter)
 */
const authLimiter = rateLimit({
  store: redisStore,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later.',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  store: redisStore,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please try again later.',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Search rate limiter
 */
const searchLimiter = rateLimit({
  store: redisStore,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each IP to 30 searches per 5 minutes
  message: {
    success: false,
    message: 'Too many search requests, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Search rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many search requests, please try again later.',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Admin endpoints rate limiter
 */
const adminLimiter = rateLimit({
  store: redisStore,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 admin requests per windowMs
  message: {
    success: false,
    message: 'Too many admin requests, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Admin rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many admin requests, please try again later.',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Dynamic rate limiter based on user role
 */
const dynamicLimiter = (defaultMax = 100) => {
  return rateLimit({
    store: redisStore,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      // Different limits based on user role
      if (req.user?.role === 'admin') return 200;
      if (req.user?.role === 'faculty') return 150;
      if (req.user?.role === 'student') return 100;
      return defaultMax; // Default for unauthenticated users
    },
    message: {
      success: false,
      message: 'Rate limit exceeded, please try again later.',
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Dynamic rate limit exceeded for user: ${req.user?.email || 'anonymous'}`);
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded, please try again later.',
        timestamp: new Date().toISOString()
      });
    }
  });
};

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  searchLimiter,
  adminLimiter,
  dynamicLimiter
}; 