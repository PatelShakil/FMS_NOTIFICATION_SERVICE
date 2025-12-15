 /**
 * Metrics Helper Wrapper
 * Simplified interface for recording metrics
 */

const { metrics } = require('../config/prometheus');
const logger = require('./logger');

/**
 * Record notification sent
 * @param {String} eventType - Event type
 * @param {String} status - SENT/FAILED
 * @param {String} recipientType - CITIZEN/ORG_ADMIN/etc
 */
const recordNotificationSent = (eventType, status, recipientType) => {
  try {
    metrics.incrementSent(eventType, status, recipientType);
  } catch (error) {
    logger.error('Failed to record notification metric:', error);
  }
};

/**
 * Record email send duration
 * @param {String} eventType - Event type
 * @param {Number} startTime - Start timestamp
 */
const recordEmailDuration = (eventType, startTime) => {
  try {
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    metrics.recordDuration(eventType, process.env.EMAIL_PROVIDER || 'GMAIL_SMTP', duration);
  } catch (error) {
    logger.error('Failed to record duration metric:', error);
  }
};

/**
 * Record failed notification
 * @param {String} eventType - Event type
 * @param {String} reason - Failure reason
 */
const recordNotificationFailed = (eventType, reason) => {
  try {
    metrics.incrementFailed(eventType, reason);
  } catch (error) {
    logger.error('Failed to record failure metric:', error);
  }
};

/**
 * Update retry queue size
 * @param {Number} size - Current queue size
 */
const updateRetryQueueSize = (size) => {
  try {
    metrics.setRetryQueueSize(size);
  } catch (error) {
    logger.error('Failed to update queue size metric:', error);
  }
};

/**
 * Record rate limit hit
 * @param {String} limitType - 'event' or 'recipient'
 */
const recordRateLimitHit = (limitType) => {
  try {
    metrics.recordRateLimitHit(limitType);
  } catch (error) {
    logger.error('Failed to record rate limit metric:', error);
  }
};

/**
 * Update database connections count
 * @param {Number} count - Active connections
 */
const updateDbConnections = (count) => {
  try {
    metrics.setDbConnections(count);
  } catch (error) {
    logger.error('Failed to update DB connections metric:', error);
  }
};

/**
 * HTTP request metrics middleware
 */
const httpMetricsMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = (Date.now() - startTime) / 1000;
    
    try {
      metrics.recordHttpRequest(
        req.method,
        req.route ? req.route.path : req.path,
        res.statusCode,
        duration
      );
    } catch (error) {
      logger.error('Failed to record HTTP metric:', error);
    }

    originalEnd.apply(res, args);
  };

  next();
};

module.exports = {
  recordNotificationSent,
  recordEmailDuration,
  recordNotificationFailed,
  updateRetryQueueSize,
  recordRateLimitHit,
  updateDbConnections,
  httpMetricsMiddleware,
};

