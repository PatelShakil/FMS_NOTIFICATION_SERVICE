/**
 * Notification Model
 * Stores all notification records (sent, failed, pending)
 */

const mongoose = require('mongoose');
const { NOTIFICATION_STATUS, NOTIFICATION_TYPE, RECIPIENT_TYPE, PRIORITY } = require('../utils/constants');

const notificationSchema = new mongoose.Schema(
  {
    // Event Information
    eventType: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    eventPayload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Recipient Information
    recipientType: {
      type: String,
      required: true,
      enum: Object.values(RECIPIENT_TYPE),
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    recipientPhone: {
      type: String,
      default: null,
      trim: true,
    },
    recipientId: {
      type: Number,
      default: null,
      index: true,
    },
    recipientName: {
      type: String,
      default: null,
      trim: true,
    },

    // Notification Details
    notificationType: {
      type: String,
      required: true,
      enum: Object.values(NOTIFICATION_TYPE),
      default: NOTIFICATION_TYPE.EMAIL,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 500,
    },
    messageBody: {
      type: String,
      required: true,
    },
    templateName: {
      type: String,
      required: true,
      index: true,
    },

    // Delivery Tracking
    status: {
      type: String,
      required: true,
      enum: Object.values(NOTIFICATION_STATUS),
      default: NOTIFICATION_STATUS.PENDING,
      index: true,
    },
    deliveryAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    failedReason: {
      type: String,
      default: null,
    },

    // External Provider Tracking
    provider: {
      type: String,
      default: 'GMAIL_SMTP',
    },
    providerMessageId: {
      type: String,
      default: null,
    },

    // Metadata
    priority: {
      type: String,
      enum: Object.values(PRIORITY),
      default: PRIORITY.MEDIUM,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'notifications',
  }
);

// Indexes for performance
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ recipientEmail: 1, createdAt: -1 });
notificationSchema.index({ eventType: 1, status: 1 });
notificationSchema.index({ isArchived: 1, createdAt: -1 });

// Virtual for checking if notification is recent (last 24 hours)
notificationSchema.virtual('isRecent').get(function () {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt >= oneDayAgo;
});

// Virtual for checking if notification can be retried
notificationSchema.virtual('canRetry').get(function () {
  const maxAttempts = parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3;
  return this.status === NOTIFICATION_STATUS.FAILED && this.deliveryAttempts < maxAttempts;
});

// Method to mark as sent
notificationSchema.methods.markAsSent = function (providerMessageId) {
  this.status = NOTIFICATION_STATUS.SENT;
  this.sentAt = new Date();
  this.providerMessageId = providerMessageId;
  return this.save();
};

// Method to mark as failed
notificationSchema.methods.markAsFailed = function (reason) {
  this.status = NOTIFICATION_STATUS.FAILED;
  this.failedReason = reason;
  this.lastAttemptAt = new Date();
  this.deliveryAttempts += 1;
  return this.save();
};

// Method to increment attempt
notificationSchema.methods.incrementAttempt = function () {
  this.deliveryAttempts += 1;
  this.lastAttemptAt = new Date();
  return this.save();
};

// Static method to get notifications by status
notificationSchema.statics.findByStatus = function (status, limit = 50) {
  return this.find({ status })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get recent notifications for a recipient
notificationSchema.statics.findRecentByRecipient = function (recipientEmail, days = 7) {
  const dateThreshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.find({
    recipientEmail,
    createdAt: { $gte: dateThreshold },
  }).sort({ createdAt: -1 });
};

// Static method to get notifications ready for archive
notificationSchema.statics.findReadyForArchive = function () {
  const archiveDays = parseInt(process.env.ARCHIVE_AFTER_DAYS) || 90;
  const archiveDate = new Date(Date.now() - archiveDays * 24 * 60 * 60 * 1000);
  
  return this.find({
    isArchived: false,
    createdAt: { $lt: archiveDate },
  });
};

// Pre-save hook to set default values
notificationSchema.pre('save', function (next) {
  if (this.isNew && !this.lastAttemptAt) {
    this.lastAttemptAt = new Date();
  }
  next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

