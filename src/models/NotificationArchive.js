/**
 * NotificationArchive Model
 * Stores archived notifications (90+ days old)
 */

const mongoose = require('mongoose');
const { NOTIFICATION_STATUS, NOTIFICATION_TYPE, RECIPIENT_TYPE } = require('../utils/constants');

const notificationArchiveSchema = new mongoose.Schema(
  {
    // Original notification ID
    originalNotificationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Event Information
    eventType: {
      type: String,
      required: true,
      index: true,
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
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    recipientId: {
      type: Number,
      default: null,
    },

    // Notification Details
    notificationType: {
      type: String,
      required: true,
      enum: Object.values(NOTIFICATION_TYPE),
    },
    subject: {
      type: String,
      required: true,
    },
    templateName: {
      type: String,
      required: true,
    },

    // Delivery Summary
    status: {
      type: String,
      required: true,
      enum: Object.values(NOTIFICATION_STATUS),
    },
    deliveryAttempts: {
      type: Number,
      default: 0,
    },
    sentAt: {
      type: Date,
      default: null,
    },

    // Archive Metadata
    archivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    originalCreatedAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'notification_archive',
  }
);

// Indexes for performance
notificationArchiveSchema.index({ archivedAt: -1 });
notificationArchiveSchema.index({ originalCreatedAt: -1 });
notificationArchiveSchema.index({ recipientEmail: 1, originalCreatedAt: -1 });

// Static method to archive notifications
notificationArchiveSchema.statics.archiveNotifications = async function (notifications) {
  const archiveData = notifications.map((notification) => ({
    originalNotificationId: notification._id,
    eventType: notification.eventType,
    eventPayload: notification.eventPayload,
    recipientType: notification.recipientType,
    recipientEmail: notification.recipientEmail,
    recipientId: notification.recipientId,
    notificationType: notification.notificationType,
    subject: notification.subject,
    templateName: notification.templateName,
    status: notification.status,
    deliveryAttempts: notification.deliveryAttempts,
    sentAt: notification.sentAt,
    archivedAt: new Date(),
    originalCreatedAt: notification.createdAt,
  }));

  return this.insertMany(archiveData);
};

// Static method to search archived notifications
notificationArchiveSchema.statics.searchArchive = function (query = {}, limit = 100) {
  return this.find(query)
    .sort({ originalCreatedAt: -1 })
    .limit(limit);
};

const NotificationArchive = mongoose.model('NotificationArchive', notificationArchiveSchema);

module.exports = NotificationArchive;

