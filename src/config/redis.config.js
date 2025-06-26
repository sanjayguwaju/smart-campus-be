const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD || undefined,
      });

      redisClient.on('error', (err) => {
        logger.error('Redis Client Error:', err);
      });

      redisClient.on('connect', () => {
        logger.info('Redis Client Connected');
      });

      redisClient.on('ready', () => {
        logger.info('Redis Client Ready');
      });

      redisClient.on('end', () => {
        logger.warn('Redis Client Disconnected');
      });

      await redisClient.connect();
    } else {
      logger.warn('Redis URL not provided, caching disabled');
    }
  } catch (error) {
    logger.error('Redis connection failed:', error);
    redisClient = null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis Client Disconnected');
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  disconnectRedis
}; 