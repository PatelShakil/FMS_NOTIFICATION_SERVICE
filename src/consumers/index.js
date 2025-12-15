/**
 * Kafka Consumer Orchestrator
 * Routes Kafka messages to appropriate consumer handlers
 */

const { consumer, connectConsumer, TOPICS } = require('../config/kafka');
const { handleAuthEvent } = require('./authConsumer');
const { handleOrgEvent } = require('./orgConsumer');
const { handleResponseEvent } = require('./responseConsumer');
const { handleQrEvent } = require('./qrConsumer');
const { handleFeedbackEvent } = require('./feedbackConsumer');
const logger = require('../utils/logger');

// Topic to consumer mapping
const AUTH_TOPICS = [
  TOPICS.DISTRIBUTOR_REGISTERED,
  TOPICS.DISTRIBUTOR_APPROVED,
  TOPICS.DISTRIBUTOR_REJECTED,
  TOPICS.DISTRIBUTOR_SUSPENDED,
  TOPICS.DISTRIBUTOR_REACTIVATED,
  TOPICS.USER_CREATED,        // 🔥 NEW EVENT
  TOPICS.USER_ACCEPTED,
  // W
];

const ORG_TOPICS = [
  TOPICS.ORG_CREATED,
  TOPICS.ORG_APPROVED,
  TOPICS.ORG_REJECTED,
  TOPICS.ORG_SUSPENDED,
];

const RESPONSE_TOPICS = [
  TOPICS.RESPONSE_SUBMITTED,
  TOPICS.RESPONSE_REVIEWED,
  TOPICS.RESPONSE_RESOLVED,
  TOPICS.RESPONSE_FLAGGED,
];

const QR_TOPICS = [
  TOPICS.QR_ASSIGNED,
  TOPICS.QR_ACCEPTED,
  TOPICS.QR_REJECTED,
  TOPICS.QR_DEPLOYMENT_SUBMITTED,
  TOPICS.QR_DEPLOYED,
  TOPICS.QR_DEPLOYMENT_REJECTED,
  TOPICS.QR_DEACTIVATED,
  TOPICS.QR_DELETED,
];

const FEEDBACK_TOPICS = [
  TOPICS.FEEDBACK_FORM_DELETED,
];

/**
 * Route message to appropriate consumer
 */
const routeMessage = async (topic, partition, message) => {
  try {
    // Route to appropriate consumer based on topic
    if (AUTH_TOPICS.includes(topic)) {
      await handleAuthEvent(topic, message);
    } else if (ORG_TOPICS.includes(topic)) {
      await handleOrgEvent(topic, message);
    } else if (RESPONSE_TOPICS.includes(topic)) {
      await handleResponseEvent(topic, message);
    } else if (QR_TOPICS.includes(topic)) {
      await handleQrEvent(topic, message);
    } else if (FEEDBACK_TOPICS.includes(topic)) {
      await handleFeedbackEvent(topic, message);
    } else {
      logger.warn(`No handler for topic: ${topic}`);
    }
  } catch (error) {
    logger.error(`Error routing message from topic ${topic}:`, error);
    // Don't throw - continue processing other messages
  }
};

/**
 * Start Kafka consumer
 */
const startConsumer = async () => {
  try {
    // Connect consumer
    await connectConsumer();

    // Run consumer
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const offset = message.offset;
        const key = message.key ? message.key.toString() : null;

        logger.debug(`Received message: Topic=${topic}, Partition=${partition}, Offset=${offset}, Key=${key}`);

        // Route to appropriate handler
        await routeMessage(topic, partition, message);
      },
    });

    logger.info('✅ Kafka consumer started successfully');
  } catch (error) {
    logger.error('❌ Failed to start Kafka consumer:', error);
    throw error;
  }
};

/**
 * Get consumer statistics
 */
const getConsumerStats = () => {
  return {
    authTopics: AUTH_TOPICS.length,
    orgTopics: ORG_TOPICS.length,
    responseTopics: RESPONSE_TOPICS.length,
    qrTopics: QR_TOPICS.length,
    feedbackTopics: FEEDBACK_TOPICS.length,
    totalTopics: AUTH_TOPICS.length + ORG_TOPICS.length + RESPONSE_TOPICS.length + QR_TOPICS.length + FEEDBACK_TOPICS.length,
  };
};

module.exports = {
  startConsumer,
  getConsumerStats,
};
