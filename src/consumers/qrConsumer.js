/**
 * QR Consumer
 * Handles qr-service events (QR lifecycle and deployment)
 */

const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');
const { parseKafkaMessage } = require('../utils/helpers');
const { TOPICS } = require('../config/kafka');

/**
 * Handle qr.assigned event
 * Notify DISTRIBUTOR about QR code assignment
 */
const handleQrAssigned = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for qr.assigned');
      return;
    }

    logger.info(`Processing qr.assigned: QR ${payload.qrCodeId} to distributor ${payload.distributorId}`);

    await notificationService.processEventNotification(
      TOPICS.QR_ASSIGNED,
      payload
    );
  } catch (error) {
    logger.error('Error handling qr.assigned:', error);
  }
};

/**
 * Handle qr.accepted event
 * Notify ORG_ADMIN that distributor accepted QR assignment
 */
const handleQrAccepted = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for qr.accepted');
      return;
    }

    logger.info(`Processing qr.accepted: QR ${payload.qrCodeId}`);

    await notificationService.processEventNotification(
      TOPICS.QR_ACCEPTED,
      payload
    );
  } catch (error) {
    logger.error('Error handling qr.accepted:', error);
  }
};

/**
 * Handle qr.rejected event
 * Notify ORG_ADMIN that distributor rejected QR assignment
 */
const handleQrRejected = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for qr.rejected');
      return;
    }

    logger.info(`Processing qr.rejected: QR ${payload.qrCodeId} - Reason: ${payload.rejectionReason}`);

    await notificationService.processEventNotification(
      TOPICS.QR_REJECTED,
      payload
    );
  } catch (error) {
    logger.error('Error handling qr.rejected:', error);
  }
};

/**
 * Handle qr.deployment.submitted event
 * Notify ORG_ADMIN that distributor submitted QR deployment for approval
 */
const handleQrDeploymentSubmitted = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for qr.deployment.submitted');
      return;
    }

    logger.info(`Processing qr.deployment.submitted: QR ${payload.qrCodeId}`);

    await notificationService.processEventNotification(
      TOPICS.QR_DEPLOYMENT_SUBMITTED,
      payload
    );
  } catch (error) {
    logger.error('Error handling qr.deployment.submitted:', error);
  }
};

/**
 * Handle qr.deployed event
 * Notify DISTRIBUTOR that deployment was approved
 */
const handleQrDeployed = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for qr.deployed');
      return;
    }

    logger.info(`Processing qr.deployed: QR ${payload.qrCodeId}`);

    await notificationService.processEventNotification(
      TOPICS.QR_DEPLOYED,
      payload
    );
  } catch (error) {
    logger.error('Error handling qr.deployed:', error);
  }
};

/**
 * Handle qr.deployment.rejected event
 * Notify DISTRIBUTOR that deployment was rejected
 */
const handleQrDeploymentRejected = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for qr.deployment.rejected');
      return;
    }

    logger.info(`Processing qr.deployment.rejected: QR ${payload.qrCodeId} - Reason: ${payload.rejectionReason}`);

    await notificationService.processEventNotification(
      TOPICS.QR_DEPLOYMENT_REJECTED,
      payload
    );
  } catch (error) {
    logger.error('Error handling qr.deployment.rejected:', error);
  }
};

/**
 * Handle qr.deactivated event
 * Notify DISTRIBUTOR that QR code was deactivated
 */
const handleQrDeactivated = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for qr.deactivated');
      return;
    }

    logger.info(`Processing qr.deactivated: QR ${payload.qrCodeId}`);

    // Only notify if QR was assigned to a distributor
    if (!payload.distributorId || !payload.distributorEmail) {
      logger.debug('QR not assigned to distributor, skipping notification');
      return;
    }

    await notificationService.processEventNotification(
      TOPICS.QR_DEACTIVATED,
      payload
    );
  } catch (error) {
    logger.error('Error handling qr.deactivated:', error);
  }
};

/**
 * Handle qr.deleted event
 * Notify DISTRIBUTOR that QR code was deleted
 */
const handleQrDeleted = async (message) => {
  try {
    const payload = parseKafkaMessage(message.value);
    
    if (!payload) {
      logger.error('Invalid message payload for qr.deleted');
      return;
    }

    logger.info(`Processing qr.deleted: QR ${payload.qrCodeId}`);

    // Only notify if QR was assigned to a distributor
    if (!payload.distributorId || !payload.distributorEmail) {
      logger.debug('QR not assigned to distributor, skipping notification');
      return;
    }

    await notificationService.processEventNotification(
      TOPICS.QR_DELETED,
      payload
    );
  } catch (error) {
    logger.error('Error handling qr.deleted:', error);
  }
};

/**
 * Main handler for QR events
 */
const handleQrEvent = async (topic, message) => {
  switch (topic) {
    case TOPICS.QR_ASSIGNED:
      await handleQrAssigned(message);
      break;
    case TOPICS.QR_ACCEPTED:
      await handleQrAccepted(message);
      break;
    case TOPICS.QR_REJECTED:
      await handleQrRejected(message);
      break;
    case TOPICS.QR_DEPLOYMENT_SUBMITTED:
      await handleQrDeploymentSubmitted(message);
      break;
    case TOPICS.QR_DEPLOYED:
      await handleQrDeployed(message);
      break;
    case TOPICS.QR_DEPLOYMENT_REJECTED:
      await handleQrDeploymentRejected(message);
      break;
    case TOPICS.QR_DEACTIVATED:
      await handleQrDeactivated(message);
      break;
    case TOPICS.QR_DELETED:
      await handleQrDeleted(message);
      break;
    default:
      logger.warn(`Unhandled QR event: ${topic}`);
  }
};

module.exports = {
  handleQrEvent,
};
