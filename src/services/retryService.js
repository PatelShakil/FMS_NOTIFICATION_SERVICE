/**
 * Retry Service
 * Handles retrying failed notifications
 */

const NotificationQueue = require('../models/NotificationQueue');
const Notification = require('../models/Notification');
const emailService = require('./emailService');
const logger = require('../utils/logger');
const { calculateNextRetryTime } = require('../utils/helpers');
const { updateRetryQueueSize } = require('../utils/metrics');

/**
 * Process retry queue
 * @returns {Promise<Object>} - Summary of retry results
 */
const processRetryQueue = async () => {
  try {
    logger.info('🔄 Processing retry queue...');

    // Find notifications ready for retry
    const queueItems = await NotificationQueue.findReadyForRetry(50);

    if (queueItems.length === 0) {
      logger.debug('No notifications ready for retry');
      return { processed: 0, success: 0, failed: 0 };
    }

    logger.info(`Found ${queueItems.length} notifications to retry`);

    const results = {
      processed: queueItems.length,
      success: 0,
      failed: 0,
      permanentlyFailed: 0,
    };

    for (const queueItem of queueItems) {
      try {
        // Mark as processing
        await queueItem.markAsProcessing();

        const notification = queueItem.notificationId;

        if (!notification) {
          logger.warn(`Notification not found for queue item ${queueItem._id}`);
          await queueItem.markAsPermanentlyFailed('Notification not found');
          results.permanentlyFailed++;
          continue;
        }

        // Attempt to resend email
        const emailResult = await emailService.sendEmail({
          to: notification.recipientEmail,
          subject: notification.subject,
          html: notification.messageBody,
          eventType: notification.eventType,
          recipientType: notification.recipientType,
        });

        if (emailResult.success) {
          // Success - mark notification as sent
          await notification.markAsSent(emailResult.messageId);
          await queueItem.markAsCompleted();
          
          results.success++;
          logger.info(`✅ Retry successful for notification ${notification._id}`);
        } else {
          // Failed - check if we should retry again
          if (queueItem.maxRetriesReached) {
            // Max retries reached - mark as permanently failed
            await notification.markAsFailed(`Max retries reached: ${emailResult.error}`);
            await queueItem.markAsPermanentlyFailed(emailResult.error);
            
            results.permanentlyFailed++;
            logger.warn(`❌ Max retries reached for notification ${notification._id}`);
          } else {
            // Schedule next retry
            const nextRetryTime = calculateNextRetryTime(queueItem.retryCount + 1);
            
            await notification.incrementAttempt();
            await queueItem.markAsFailedAndRetry(emailResult.error, nextRetryTime);
            
            results.failed++;
            logger.info(`⏰ Retry ${queueItem.retryCount + 1} scheduled for notification ${notification._id}`);
          }
        }
      } catch (error) {
        logger.error(`Error processing queue item ${queueItem._id}:`, error);
        results.failed++;
      }
    }

    // Update queue size metric
    const queueSize = await NotificationQueue.getQueueSize();
    updateRetryQueueSize(queueSize);

    logger.info(`Retry queue processed: ${results.success} success, ${results.failed} failed, ${results.permanentlyFailed} permanent failures`);

    return results;
  } catch (error) {
    logger.error('Error processing retry queue:', error);
    throw error;
  }
};

/**
 * Get retry queue status
 * @returns {Promise<Object>}
 */
const getRetryQueueStatus = async () => {
  const [pending, processing, completed, failed] = await Promise.all([
    NotificationQueue.countDocuments({ queueStatus: 'PENDING' }),
    NotificationQueue.countDocuments({ queueStatus: 'PROCESSING' }),
    NotificationQueue.countDocuments({ queueStatus: 'COMPLETED' }),
    NotificationQueue.countDocuments({ queueStatus: 'FAILED' }),
  ]);

  return {
    pending,
    processing,
    completed,
    failed,
    total: pending + processing,
  };
};

/**
 * Clear completed queue items (cleanup)
 * @param {Number} daysOld - Delete items older than X days
 * @returns {Promise<Number>} - Number of deleted items
 */
const cleanupCompletedItems = async (daysOld = 30) => {
  try {
    const result = await NotificationQueue.cleanupOldItems(daysOld);
    logger.info(`Cleaned up ${result.deletedCount} old queue items`);
    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up queue items:', error);
    return 0;
  }
};

module.exports = {
  processRetryQueue,
  getRetryQueueStatus,
  cleanupCompletedItems,
};
