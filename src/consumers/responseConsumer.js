/**
 * Response Consumer
 * Handles response-service events (feedback lifecycle)
 */

const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { parseKafkaMessage } = require('../utils/helpers');
const { TOPICS } = require('../config/kafka');

/**
 * Handle response.submitted event
 * Notify ORG_ADMIN about new feedback submission
 */
const handleResponseSubmitted = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for response.submitted');
      return;
    }

    logger.info(`Processing response.submitted: Form ${payload.formId}`);

    // Only notify if form has notification enabled
    if (payload.notificationEnabled === false) {
      logger.debug('Notifications disabled for this form, skipping');
      return;
    }

    await notificationService.processEventNotification(
      TOPICS.RESPONSE_SUBMITTED,
      payload
    );
  } catch (error) {
    logger.error('Error handling response.submitted:', error);
  }
};

/**
 * Handle response.reviewed event
 * Notify CITIZEN that their feedback is being reviewed
 */
const handleResponseReviewed = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for response.reviewed');
      return;
    }

    logger.info(`Processing response.reviewed: Response ${payload.responseId}`);

    // Only notify if citizen provided email
    if (!payload.citizenEmail) {
      logger.debug('No citizen email provided, skipping notification');
      return;
    }

    await notificationService.processEventNotification(
      TOPICS.RESPONSE_REVIEWED,
      payload
    );
  } catch (error) {
    logger.error('Error handling response.reviewed:', error);
  }
};

/**
 * Handle response.resolved event
 * Notify CITIZEN that their feedback has been resolved
 */
const handleResponseResolved = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for response.resolved');
      return;
    }

    logger.info(`Processing response.resolved: Response ${payload.responseId}`);

    // Only notify if citizen requested response
    if (!payload.requestResponse || !payload.citizenEmail) {
      logger.debug('Citizen did not request response or no email provided, skipping');
      return;
    }

    await notificationService.processEventNotification(
      TOPICS.RESPONSE_RESOLVED,
      payload
    );
  } catch (error) {
    logger.error('Error handling response.resolved:', error);
  }
};

/**
 * Handle response.flagged event
 * Notify ORG_ADMIN about flagged response (spam/urgent)
 */
const handleResponseFlagged = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for response.flagged');
      return;
    }

    logger.info(`Processing response.flagged: Response ${payload.responseId} - Reason: ${payload.flagReason}`);

    await notificationService.processEventNotification(
      TOPICS.RESPONSE_FLAGGED,
      payload
    );
  } catch (error) {
    logger.error('Error handling response.flagged:', error);
  }
};

/**
 * Main handler for response events
 */
const handleResponseEvent = async (topic, message) => {
  switch (topic) {
    case TOPICS.RESPONSE_SUBMITTED:
      await handleResponseSubmitted(message);
      break;
    case TOPICS.RESPONSE_REVIEWED:
      await handleResponseReviewed(message);
      break;
    case TOPICS.RESPONSE_RESOLVED:
      await handleResponseResolved(message);
      break;
    case TOPICS.RESPONSE_FLAGGED:
      await handleResponseFlagged(message);
      break;
    default:
      logger.warn(`Unhandled response event: ${topic}`);
  }
};

module.exports = {
  handleResponseEvent,
};
