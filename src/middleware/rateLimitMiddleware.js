/**
 * Rate Limit Middleware
 * HTTP request rate limiting
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
  },
});

/**
 * Strict limiter for webhook endpoints
 * 20 requests per minute
 */
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Webhook rate limit exceeded. Max 20 requests per minute.',
  },
  handler: (req, res) => {
    logger.warn(`Webhook rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Webhook rate limit exceeded. Max 20 requests per minute.',
    });
  },
});

/**
 * Auth endpoint limiter
 * 5 requests per minute (for login/register endpoints)
 */
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Health check limiter (very permissive)
 * 60 requests per minute
 */
const healthLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  standardHeaders: false,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  webhookLimiter,
  authLimiter,
  healthLimiter,
};
