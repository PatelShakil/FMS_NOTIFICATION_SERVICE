/**
 * NotificationQueue Model
 * Manages retry queue for failed notifications
 */

const mongoose = require('mongoose');
const { QUEUE_STATUS } = require('../utils/constants');

const notificationQueueSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
      index: true,
    },

    // Retry Logic
    retryCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: 1,
    },
    nextRetryAt: {
      type: Date,
      required: true,
      index: true,
    },

    // Status
    queueStatus: {
      type: String,
      required: true,
      enum: Object.values(QUEUE_STATUS),
      default: QUEUE_STATUS.PENDING,
      index: true,
    },

    // Error tracking
    lastError: {
      type: String,
      default: null,
    },

    // Processing info
    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'notification_queue',
  }
);

// Compound index for finding ready items
notificationQueueSchema.index({ queueStatus: 1, nextRetryAt: 1 });

// Virtual to check if max retries reached
notificationQueueSchema.virtual('maxRetriesReached').get(function () {
  return this.retryCount >= this.maxRetries;
});

// Method to mark as processing
notificationQueueSchema.methods.markAsProcessing = function () {
  this.queueStatus = QUEUE_STATUS.PROCESSING;
  return this.save();
};

// Method to mark as completed
notificationQueueSchema.methods.markAsCompleted = function () {
  this.queueStatus = QUEUE_STATUS.COMPLETED;
  this.processedAt = new Date();
  return this.save();
};

// Method to mark as failed and schedule retry
notificationQueueSchema.methods.markAsFailedAndRetry = function (error, nextRetryTime) {
  this.queueStatus = QUEUE_STATUS.PENDING;
  this.retryCount += 1;
  this.lastError = error;
  this.nextRetryAt = nextRetryTime;
  return this.save();
};

// Method to mark as permanently failed
notificationQueueSchema.methods.markAsPermanentlyFailed = function (error) {
  this.queueStatus = QUEUE_STATUS.FAILED;
  this.lastError = error;
  this.processedAt = new Date();
  return this.save();
};

// Static method to find items ready for retry
notificationQueueSchema.statics.findReadyForRetry = function (limit = 50) {
  return this.find({
    queueStatus: QUEUE_STATUS.PENDING,
    nextRetryAt: { $lte: new Date() },
  })
    .populate('notificationId')
    .limit(limit)
    .sort({ nextRetryAt: 1 });
};

// Static method to get queue size
notificationQueueSchema.statics.getQueueSize = async function () {
  return this.countDocuments({
    queueStatus: { $in: [QUEUE_STATUS.PENDING, QUEUE_STATUS.PROCESSING] },
  });
};

// Static method to cleanup old completed items
notificationQueueSchema.statics.cleanupOldItems = function (daysOld = 30) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    queueStatus: { $in: [QUEUE_STATUS.COMPLETED, QUEUE_STATUS.FAILED] },
    createdAt: { $lt: cutoffDate },
  });
};

const NotificationQueue = mongoose.model('NotificationQueue', notificationQueueSchema);

module.exports = NotificationQueue;

