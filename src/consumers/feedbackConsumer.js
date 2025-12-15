/**
 * Feedback Consumer
 * Handles feedback-service events (form lifecycle)
 */

const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { parseKafkaMessage } = require('../utils/helpers');
const { TOPICS } = require('../config/kafka');

/**
 * Handle feedback.form.deleted event
 * Notify ORG_ADMINS about form deletion (affects linked QR codes)
 */
const handleFeedbackFormDeleted = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for feedback.form.deleted');
      return;
    }

    logger.info(`Processing feedback.form.deleted: Form ${payload.formId} - ${payload.formName}`);

    // Only notify if form had active QR codes
    if (!payload.hasActiveQrCodes) {
      logger.debug('Form had no active QR codes, skipping notification');
      return;
    }

    await notificationService.processEventNotification(
      TOPICS.FEEDBACK_FORM_DELETED,
      payload
    );
  } catch (error) {
    logger.error('Error handling feedback.form.deleted:', error);
  }
};

/**
 * Main handler for feedback events
 */
const handleFeedbackEvent = async (topic, message) => {
  switch (topic) {
    case TOPICS.FEEDBACK_FORM_DELETED:
      await handleFeedbackFormDeleted(message);
      break;
    default:
      logger.warn(`Unhandled feedback event: ${topic}`);
  }
};

module.exports = {
  handleFeedbackEvent,
};
