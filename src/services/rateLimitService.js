/**
 * Rate Limit Service
 * Manages notification rate limiting
 */

const RateLimit = require('../models/RateLimit');
const logger = require('../utils/logger');
const { RATE_LIMIT_TYPE, RATE_LIMIT_CONFIG } = require('../utils/constants');
const { recordRateLimitHit } = require('../utils/metrics');

/**
 * Check rate limit for event type
 * @param {String} eventType - Event type
 * @param {String} recipientEmail - Recipient email
 * @returns {Promise<Object>} - { allowed, remaining, resetAt }
 */
const checkRateLimit = async (eventType, recipientEmail) => {
  try {
    // Check event-based rate limit
    const eventLimit = await RateLimit.checkAndIncrement(
      RATE_LIMIT_TYPE.EVENT,
      eventType,
      RATE_LIMIT_CONFIG.PER_EVENT,
      RATE_LIMIT_CONFIG.WINDOW_MINUTES
    );

    if (!eventLimit.allowed) {
      logger.warn(`Event rate limit exceeded for: ${eventType}`);
      recordRateLimitHit(RATE_LIMIT_TYPE.EVENT);
      return eventLimit;
    }

    // Check recipient-based rate limit (optional - commented out for now)
    // Uncomment if you want per-recipient limiting
    /*
    const recipientLimit = await RateLimit.checkAndIncrement(
      RATE_LIMIT_TYPE.RECIPIENT,
      recipientEmail,
      10, // Max 10 emails per hour per recipient
      60
    );

    if (!recipientLimit.allowed) {
      logger.warn(`Recipient rate limit exceeded for: ${recipientEmail}`);
      recordRateLimitHit(RATE_LIMIT_TYPE.RECIPIENT);
      return recipientLimit;
    }
    */

    return { allowed: true, remaining: eventLimit.remaining };
  } catch (error) {
    logger.error('Error checking rate limit:', error);
    // Allow on error to avoid blocking notifications
    return { allowed: true, remaining: null };
  }
};

/**
 * Get rate limit status for event
 * @param {String} eventType - Event type
 * @returns {Promise<Object>}
 */
const getRateLimitStatus = async (eventType) => {
  return RateLimit.getStatus(RATE_LIMIT_TYPE.EVENT, eventType);
};

/**
 * Cleanup expired rate limits (cron job)
 * @returns {Promise<Number>} - Number of deleted records
 */
const cleanupExpiredLimits = async () => {
  try {
    const result = await RateLimit.cleanupExpired();
    logger.info(`Cleaned up ${result.deletedCount} expired rate limit records`);
    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up rate limits:', error);
    return 0;
  }
};

module.exports = {
  checkRateLimit,
  getRateLimitStatus,
  cleanupExpiredLimits,
};
