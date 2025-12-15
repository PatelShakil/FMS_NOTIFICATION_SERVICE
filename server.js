/**
 * Server Entry Point
 * Starts the notification-service
 */

require('dotenv').config();

const app = require('./src/app');
const { connectDB } = require('./src/config/database');
const { startConsumer } = require('./src/consumers');
const { preloadTemplates } = require('./src/services/templateService');
const { processRetryQueue } = require('./src/services/retryService');
const { archiveOldNotifications } = require('./src/services/archiveService');
const { cleanupExpiredLimits } = require('./src/services/rateLimitService');
const logger = require('./src/utils/logger');
const cron = require('node-cron');

// Port
const PORT = process.env.PORT || 8092;

// ===========================================
// STARTUP SEQUENCE
// ===========================================

const startServer = async () => {
  try {
    logger.info('='.repeat(60));
    logger.info('🚀 Starting notification-service...');
    logger.info('='.repeat(60));

    // 1. Connect to MongoDB
    logger.info('📦 Connecting to MongoDB...');
    await connectDB();

    // 2. Preload email templates
    logger.info('📧 Preloading email templates...');
    await preloadTemplates();

    // 3. Start Kafka consumer
    logger.info('📡 Starting Kafka consumer...');
    await startConsumer();

    // 4. Start Express server
    const server = app.listen(PORT, () => {
      logger.info('='.repeat(60));
      logger.info(`✅ notification-service is running!`);
      logger.info(`🌐 Server: http://localhost:${PORT}`);
      logger.info(`📊 Metrics: http://localhost:${PORT}/metrics`);
      logger.info(`❤️  Health: http://localhost:${PORT}/health`);
      logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('='.repeat(60));
    });

    // 5. Setup cron jobs
    setupCronJobs();

    // Graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ===========================================
// CRON JOBS
// ===========================================

const setupCronJobs = () => {
  logger.info('⏰ Setting up cron jobs...');

  // Process retry queue every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.debug('Running retry queue processor...');
    try {
      await processRetryQueue();
    } catch (error) {
      logger.error('Error processing retry queue:', error);
    }
  });

  // Archive old notifications daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running notification archival...');
    try {
      await archiveOldNotifications();
    } catch (error) {
      logger.error('Error archiving notifications:', error);
    }
  });

  // Cleanup expired rate limits every hour
  cron.schedule('0 * * * *', async () => {
    logger.debug('Cleaning up expired rate limits...');
    try {
      await cleanupExpiredLimits();
    } catch (error) {
      logger.error('Error cleaning up rate limits:', error);
    }
  });

  // Cleanup old queue items weekly (Sunday at 3 AM)
  cron.schedule('0 3 * * 0', async () => {
    logger.info('Cleaning up old queue items...');
    try {
      const { cleanupCompletedItems } = require('./src/services/retryService');
      await cleanupCompletedItems(30);
    } catch (error) {
      logger.error('Error cleaning up queue items:', error);
    }
  });

  logger.info('✅ Cron jobs scheduled');
};

// ===========================================
// GRACEFUL SHUTDOWN
// ===========================================

const setupGracefulShutdown = (server) => {
  const shutdown = async (signal) => {
    logger.info(`\n${signal} received, shutting down gracefully...`);

    // Stop accepting new requests
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Disconnect Kafka consumer
        const { disconnectConsumer } = require('./src/config/kafka');
        await disconnectConsumer();
        logger.info('Kafka consumer disconnected');

        // Close MongoDB connection
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');

        logger.info('✅ Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 30000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
};

// ===========================================
// START SERVER
// ===========================================

startServer();
