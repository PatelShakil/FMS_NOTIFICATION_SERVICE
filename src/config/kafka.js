 /**
 * Kafka Configuration
 * Consumer setup for notification events
 */

const { Kafka, logLevel } = require('kafkajs');
const logger = require('../utils/logger');

// Kafka client
const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'notification-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.ERROR,
  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
});

// Create consumer
const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || 'notification-service-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
  allowAutoTopicCreation: false,
});

// Topics to subscribe to (22 notification events)
const TOPICS = {
  // Auth Service Topics (5)
  DISTRIBUTOR_REGISTERED: 'distributor.registered',
  DISTRIBUTOR_APPROVED: 'distributor.approved',
  DISTRIBUTOR_REJECTED: 'distributor.rejected',
  DISTRIBUTOR_SUSPENDED: 'distributor.suspended',
  DISTRIBUTOR_REACTIVATED: 'distributor.reactivated',

  // Admin Created Topics (4)
  USER_CREATED: 'user.created',
  USER_ACCEPTED: 'user.accepted',

  // Org Service Topics (4)
  ORG_CREATED: 'org.created',
  ORG_APPROVED: 'org.approved',
  ORG_REJECTED: 'org.rejected',
  ORG_SUSPENDED: 'org.suspended',

  // Response Service Topics (4)
  RESPONSE_SUBMITTED: 'response.submitted',
  RESPONSE_REVIEWED: 'response.reviewed',
  RESPONSE_RESOLVED: 'response.resolved',
  RESPONSE_FLAGGED: 'response.flagged',

  // QR Service Topics (9)
  QR_ASSIGNED: 'qr.assigned',
  QR_ACCEPTED: 'qr.accepted',
  QR_REJECTED: 'qr.rejected',
  QR_DEPLOYMENT_SUBMITTED: 'qr.deployment.submitted',
  QR_DEPLOYED: 'qr.deployed',
  QR_DEPLOYMENT_REJECTED: 'qr.deployment.rejected',
  QR_DEACTIVATED: 'qr.deactivated',
  QR_DELETED: 'qr.deleted',

  // Feedback Service Topics (1)
  FEEDBACK_FORM_DELETED: 'feedback.form.deleted',
};

// Connect consumer
const connectConsumer = async () => {
  try {
    await consumer.connect();
    logger.info('✅ Kafka Consumer connected successfully');

    // Subscribe to all topics
    const topicList = Object.values(TOPICS);
    
    await consumer.subscribe({
      topics: topicList,
      fromBeginning: false, // Only consume new messages
    });

    logger.info(`📡 Subscribed to ${topicList.length} Kafka topics`);
    logger.info(`Topics: ${topicList.join(', ')}`);

    return consumer;
  } catch (error) {
    logger.error('Failed to connect Kafka consumer:', error);
    throw error;
  }
};

// Disconnect consumer
const disconnectConsumer = async () => {
  try {
    await consumer.disconnect();
    logger.info('Kafka Consumer disconnected');
  } catch (error) {
    logger.error('Error disconnecting Kafka consumer:', error);
  }
};

// Error handler
consumer.on('consumer.crash', (event) => {
  logger.error('Kafka Consumer crashed:', event.payload.error);
});

consumer.on('consumer.disconnect', () => {
  logger.warn('Kafka Consumer disconnected');
});

consumer.on('consumer.connect', () => {
  logger.info('Kafka Consumer connected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down Kafka consumer...');
  await disconnectConsumer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down Kafka consumer...');
  await disconnectConsumer();
  process.exit(0);
});

module.exports = {
  kafka,
  consumer,
  TOPICS,
  connectConsumer,
  disconnectConsumer,
};

