/**
 * Auth Consumer
 * Handles auth-service events (distributor lifecycle + user invite flow)
 */

const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { parseKafkaMessage } = require('../utils/helpers');
const { TOPICS } = require('../config/kafka');

/**
 * Handle distributor.registered event
 * Notify PLATFORM_ADMIN about new distributor registration
 */
const handleDistributorRegistered = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('❌ Invalid message payload for distributor.registered');
      return;
    }

    logger.info(`📝 Processing distributor.registered: ${payload.email || payload.distributorEmail}`);

    const result = await notificationService.processEventNotification(
      TOPICS.DISTRIBUTOR_REGISTERED,
      payload
    );

    if (result.success) {
      logger.info(`✅ Distributor registered notification sent`);
    } else {
      logger.warn(`⚠️ Failed to send distributor registered notification: ${result.reason}`);
    }
  } catch (error) {
    logger.error('💥 Error handling distributor.registered:', error);
  }
};

/**
 * Handle distributor.approved event
 * Notify DISTRIBUTOR about account approval
 */
const handleDistributorApproved = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('❌ Invalid message payload for distributor.approved');
      return;
    }

    logger.info(`📝 Processing distributor.approved: ${payload.email || payload.distributorEmail}`);

    const result = await notificationService.processEventNotification(
      TOPICS.DISTRIBUTOR_APPROVED,
      payload
    );

    if (result.success) {
      logger.info(`✅ Distributor approved notification sent`);
    } else {
      logger.warn(`⚠️ Failed to send distributor approved notification: ${result.reason}`);
    }
  } catch (error) {
    logger.error('💥 Error handling distributor.approved:', error);
  }
};

/**
 * Handle distributor.rejected event
 * Notify DISTRIBUTOR about account rejection
 */
const handleDistributorRejected = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('❌ Invalid message payload for distributor.rejected');
      return;
    }

    logger.info(`📝 Processing distributor.rejected: ${payload.email || payload.distributorEmail}`);

    const result = await notificationService.processEventNotification(
      TOPICS.DISTRIBUTOR_REJECTED,
      payload
    );

    if (result.success) {
      logger.info(`✅ Distributor rejected notification sent`);
    } else {
      logger.warn(`⚠️ Failed to send distributor rejected notification: ${result.reason}`);
    }
  } catch (error) {
    logger.error('💥 Error handling distributor.rejected:', error);
  }
};

/**
 * Handle distributor.suspended event
 * Notify DISTRIBUTOR about account suspension
 */
const handleDistributorSuspended = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('❌ Invalid message payload for distributor.suspended');
      return;
    }

    logger.info(`📝 Processing distributor.suspended: ${payload.email || payload.distributorEmail}`);

    const result = await notificationService.processEventNotification(
      TOPICS.DISTRIBUTOR_SUSPENDED,
      payload
    );

    if (result.success) {
      logger.info(`✅ Distributor suspended notification sent`);
    } else {
      logger.warn(`⚠️ Failed to send distributor suspended notification: ${result.reason}`);
    }
  } catch (error) {
    logger.error('💥 Error handling distributor.suspended:', error);
  }
};

/**
 * Handle distributor.reactivated event
 * Notify DISTRIBUTOR about account reactivation
 */
const handleDistributorReactivated = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('❌ Invalid message payload for distributor.reactivated');
      return;
    }

    logger.info(`📝 Processing distributor.reactivated: ${payload.email || payload.distributorEmail}`);

    const result = await notificationService.processEventNotification(
      TOPICS.DISTRIBUTOR_REACTIVATED,
      payload
    );

    if (result.success) {
      logger.info(`✅ Distributor reactivated notification sent`);
    } else {
      logger.warn(`⚠️ Failed to send distributor reactivated notification: ${result.reason}`);
    }
  } catch (error) {
    logger.error('💥 Error handling distributor.reactivated:', error);
  }
};

/**
 * 🔥 NEW: Handle user.created event
 * Send invitation email to newly invited user
 */
const handleUserCreated = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('❌ Invalid message payload for user.created');
      return;
    }
    
    logger.info(`📝 Processing user.created: ${payload.email} - Roles: ${payload.roles}`);

    const result = await notificationService.processEventNotification(
      TOPICS.USER_CREATED,
      payload
    );

    if (result.success) {
      logger.info(`✅ User invite email sent to ${payload.email}`);
    } else {
      logger.warn(`⚠️ Failed to send user invite: ${result.reason}`);
    }
  } catch (error) {
    logger.error('💥 Error handling user.created:', error);
  }
};

/**
 * 🔥 NEW: Handle user.accepted event
 * Send account activation confirmation email
 */
const handleUserAccepted = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('❌ Invalid message payload for user.accepted');
      return;
    }
    
    logger.info(`📝 Processing user.accepted: ${payload.email} (User ID: ${payload.userId})`);

    const result = await notificationService.processEventNotification(
      TOPICS.USER_ACCEPTED,
      payload
    );

    if (result.success) {
      logger.info(`✅ Account activation email sent to ${payload.email}`);
    } else {
      logger.warn(`⚠️ Failed to send activation email: ${result.reason}`);
    }
  } catch (error) {
    logger.error('💥 Error handling user.accepted:', error);
  }
};


/**
 * Main handler for auth events
 * Routes incoming Kafka messages to appropriate handlers
 */
const handleAuthEvent = async (topic, message) => {
  try {
    switch (topic) {
      case TOPICS.DISTRIBUTOR_REGISTERED:
        await handleDistributorRegistered(message);
        break;
        
      case TOPICS.DISTRIBUTOR_APPROVED:
        await handleDistributorApproved(message);
        break;
        
      case TOPICS.DISTRIBUTOR_REJECTED:
        await handleDistributorRejected(message);
        break;
        
      case TOPICS.DISTRIBUTOR_SUSPENDED:
        await handleDistributorSuspended(message);
        break;
        
      case TOPICS.DISTRIBUTOR_REACTIVATED:
        await handleDistributorReactivated(message);
        break;
        
      // 🔥 NEW: User invite flow handlers
      case TOPICS.USER_CREATED:
        await handleUserCreated(message);
        break;
        
      case TOPICS.USER_ACCEPTED:
        await handleUserAccepted(message);
        break;
        
      default:
        logger.warn(`⚠️ Unhandled auth event: ${topic}`);
    }
  } catch (error) {
    logger.error(`💥 Critical error in handleAuthEvent for ${topic}:`, error);
  }
};

module.exports = {
  handleAuthEvent,
  handleDistributorRegistered,
  handleDistributorApproved,
  handleDistributorRejected,
  handleDistributorSuspended,
  handleDistributorReactivated,
  handleUserCreated,      // 🔥 NEW EXPORT
  handleUserAccepted,     // 🔥 NEW EXPORT
};
