const helmet = require('helmet');
const cors = require('cors');
const logger = require('../utils/logger');

/**
 * Comprehensive security middleware configuration
 */
const securityMiddleware = {
  /**
   * Helmet configuration for security headers
   */
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }),

  /**
   * CORS configuration
   */
  cors: cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://yourdomain.com'
      ];
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Admin-Token'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
  }),

  /**
   * Request sanitization middleware
   */
  sanitizeRequest: (req, res, next) => {
    try {
      // Sanitize query parameters
      if (req.query) {
        Object.keys(req.query).forEach(key => {
          if (typeof req.query[key] === 'string') {
            req.query[key] = req.query[key].trim();
          }
        });
      }

      // Sanitize body parameters
      if (req.body) {
        Object.keys(req.body).forEach(key => {
          if (typeof req.body[key] === 'string') {
            req.body[key] = req.body[key].trim();
          }
        });
      }

      // Sanitize URL parameters
      if (req.params) {
        Object.keys(req.params).forEach(key => {
          if (typeof req.params[key] === 'string') {
            req.params[key] = req.params[key].trim();
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Request sanitization error:', error);
      next();
    }
  },

  /**
   * SQL injection protection middleware
   */
  sqlInjectionProtection: (req, res, next) => {
    const sqlPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i;
    
    const checkValue = (value) => {
      if (typeof value === 'string' && sqlPattern.test(value)) {
        logger.warn(`Potential SQL injection attempt: ${value}`);
        return false;
      }
      return true;
    };

    // Check query parameters
    if (req.query) {
      for (const key in req.query) {
        if (!checkValue(req.query[key])) {
          return res.status(400).json({
            success: false,
            message: 'Invalid input detected'
          });
        }
      }
    }

    // Check body parameters
    if (req.body) {
      for (const key in req.body) {
        if (!checkValue(req.body[key])) {
          return res.status(400).json({
            success: false,
            message: 'Invalid input detected'
          });
        }
      }
    }

    next();
  },

  /**
   * XSS protection middleware
   */
  xssProtection: (req, res, next) => {
    const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        return value.replace(xssPattern, '');
      }
      return value;
    };

    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        req.query[key] = sanitizeValue(req.query[key]);
      });
    }

    // Sanitize body parameters
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        req.body[key] = sanitizeValue(req.body[key]);
      });
    }

    next();
  },

  /**
   * Request size limiting middleware
   */
  requestSizeLimit: (req, res, next) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large'
      });
    }

    next();
  },

  /**
   * API key validation middleware
   */
  validateApiKey: (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const validApiKeys = process.env.API_KEYS?.split(',') || [];
    
    if (validApiKeys.length > 0 && !validApiKeys.includes(apiKey)) {
      logger.warn(`Invalid API key attempt: ${apiKey}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    next();
  },

  /**
   * Request logging middleware
   */
  requestLogger: (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || 'anonymous'
      };

      if (res.statusCode >= 400) {
        logger.warn('Request completed with error:', logData);
      } else {
        logger.info('Request completed:', logData);
      }
    });

    next();
  },

  /**
   * IP whitelist middleware
   */
  ipWhitelist: (req, res, next) => {
    const whitelistedIPs = process.env.IP_WHITELIST?.split(',') || [];
    
    if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(req.ip)) {
      logger.warn(`Access denied for IP: ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    next();
  }
};

module.exports = securityMiddleware; 