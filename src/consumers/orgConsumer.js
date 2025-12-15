/**
 * Org Consumer
 * Handles org-service events (organization lifecycle)
 */

const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { parseKafkaMessage } = require('../utils/helpers');
const { TOPICS } = require('../config/kafka');

/**
 * Handle org.created event
 * Notify PLATFORM_ADMIN about new organization registration
 */
const handleOrgCreated = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for org.created');
      return;
    }

    logger.info(`Processing org.created: ${payload.orgName}`);

    // Notify platform admin about new org registration pending approval
    await notificationService.processEventNotification(
      TOPICS.ORG_CREATED,
      payload
    );
  } catch (error) {
    logger.error('Error handling org.created:', error);
  }
};

/**
 * Handle org.approved event
 * Notify ORG_OWNER about organization approval
 */
const handleOrgApproved = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for org.approved');
      return;
    }

    logger.info(`Processing org.approved: ${payload.orgName}`);

    await notificationService.processEventNotification(
      TOPICS.ORG_APPROVED,
      payload
    );
  } catch (error) {
    logger.error('Error handling org.approved:', error);
  }
};

/**
 * Handle org.rejected event
 * Notify ORG_OWNER about organization rejection
 */
const handleOrgRejected = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for org.rejected');
      return;
    }

    logger.info(`Processing org.rejected: ${payload.orgName}`);

    await notificationService.processEventNotification(
      TOPICS.ORG_REJECTED,
      payload
    );
  } catch (error) {
    logger.error('Error handling org.rejected:', error);
  }
};

/**
 * Handle org.suspended event
 * Notify ORG_OWNER and ORG_ADMINS about organization suspension
 */
const handleOrgSuspended = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for org.suspended');
      return;
    }

    logger.info(`Processing org.suspended: ${payload.orgName}`);

    // Notify org owner
    await notificationService.processEventNotification(
      TOPICS.ORG_SUSPENDED,
      payload
    );

    // TODO: If payload contains list of org admins, send to each admin
    // This would require batch notification logic
  } catch (error) {
    logger.error('Error handling org.suspended:', error);
  }
};

/**
 * Main handler for org events
 */
const handleOrgEvent = async (topic, message) => {
  switch (topic) {
    case TOPICS.ORG_CREATED:
      await handleOrgCreated(message);
      break;
    case TOPICS.ORG_APPROVED:
      await handleOrgApproved(message);
      break;
    case TOPICS.ORG_REJECTED:
      await handleOrgRejected(message);
      break;
    case TOPICS.ORG_SUSPENDED:
      await handleOrgSuspended(message);
      break;
    default:
      logger.warn(`Unhandled org event: ${topic}`);
  }
};

module.exports = {
  handleOrgEvent,
};
