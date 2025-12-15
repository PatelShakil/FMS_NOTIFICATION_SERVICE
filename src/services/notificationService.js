/**
 * Notification Service
 * Core business logic for notification management
 */

const Notification = require('../models/Notification');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationQueue = require('../models/NotificationQueue');
const emailService = require('./emailService');
const templateService = require('./templateService');
const rateLimitService = require('./rateLimitService');
const logger = require('../utils/logger');
const {
  extractRecipientInfo,
  getPriorityFromEvent,
  buildEmailSubject,
  isValidEmail,
  maskEmail,
  validateEventPayload,      // 🔥 NEW: Add payload validation
  buildTemplateData,          // 🔥 NEW: Add template data builder
} = require('../utils/helpers');
const { NOTIFICATION_STATUS, NOTIFICATION_TYPE } = require('../utils/constants');

/**
 * Process Kafka event and send notification
 * @param {String} eventType - Kafka topic name
 * @param {Object} eventPayload - Event data
 * @returns {Promise<Object>}
 */
const processEventNotification = async (eventType, eventPayload) => {
  try {
    logger.info(`📨 Processing notification for event: ${eventType}`);

    // 🔥 NEW: Validate event payload
    const validation = validateEventPayload(eventType, eventPayload);
    if (!validation.valid) {
      logger.error(`❌ Missing required fields for ${eventType}: ${validation.missingFields.join(', ')}`);
      return { 
        success: false, 
        reason: 'Invalid payload', 
        missingFields: validation.missingFields 
      };
    }

    // Extract recipient information
    const recipientInfo = extractRecipientInfo(eventType, eventPayload);

    if (!recipientInfo.email) {
      logger.warn(`⚠️ No recipient email found for event: ${eventType}`);
      return { success: false, reason: 'No recipient email' };
    }

    // Validate email
    if (!isValidEmail(recipientInfo.email)) {
      logger.error(`❌ Invalid email address: ${recipientInfo.email}`);
      return { success: false, reason: 'Invalid email address' };
    }

    // Check user preferences (if userId exists)
    // 🔥 UPDATED: Skip preference check for user.created (user not yet exists)
    if (recipientInfo.userId && eventType !== 'user.created') {
      const preference = await NotificationPreference.getOrCreate(
        recipientInfo.userId,
        recipientInfo.email
      );

      if (!preference.isNotificationAllowed(eventType)) {
        logger.info(`🔕 User ${recipientInfo.userId} opted out of ${eventType} notifications`);
        return { success: false, reason: 'User opted out' };
      }
    }

    // Check rate limit
    const rateLimitResult = await rateLimitService.checkRateLimit(eventType, recipientInfo.email);
    
    if (!rateLimitResult.allowed) {
      logger.warn(`⏱️ Rate limit exceeded for ${eventType} - ${maskEmail(recipientInfo.email)}`);
      return { success: false, reason: 'Rate limit exceeded', resetAt: rateLimitResult.resetAt };
    }

    // Get template name
    const templateName = templateService.getTemplateNameFromEvent(eventType);

    // 🔥 UPDATED: Use buildTemplateData helper for consistency
    const templateData = buildTemplateData(eventPayload, recipientInfo);

    // Render email template
    const emailHtml = await templateService.renderTemplate(templateName, templateData);

    // Build email subject
    const emailSubject = buildEmailSubject(eventType, eventPayload);

    // Create notification record
    const notification = await Notification.create({
      eventType,
      eventPayload,
      recipientType: recipientInfo.recipientType,
      recipientEmail: recipientInfo.email,
      recipientId: recipientInfo.userId,
      recipientName: recipientInfo.name,
      notificationType: NOTIFICATION_TYPE.EMAIL,
      subject: emailSubject,
      messageBody: emailHtml,
      templateName,
      status: NOTIFICATION_STATUS.PENDING,
      priority: getPriorityFromEvent(eventType),
      provider: process.env.EMAIL_PROVIDER || 'GMAIL_SMTP',
    });

    logger.info(`📧 Sending email to ${maskEmail(recipientInfo.email)} - Template: ${templateName}`);

    // Send email
    const emailResult = await emailService.sendEmail({
      to: recipientInfo.email,
      subject: emailSubject,
      html: emailHtml,
      eventType,
      recipientType: recipientInfo.recipientType,
      priority: notification.priority === 'HIGH' ? 'high' : 'normal',
    });

    // Update notification status
    if (emailResult.success) {
      await notification.markAsSent(emailResult.messageId);
      logger.info(`✅ Notification sent successfully for event: ${eventType} to ${maskEmail(recipientInfo.email)}`);
      return { success: true, notificationId: notification._id, messageId: emailResult.messageId };
    } else {
      await notification.markAsFailed(emailResult.error);
      
      // Add to retry queue
      await addToRetryQueue(notification);
      
      logger.error(`❌ Notification failed for event: ${eventType} - ${emailResult.error}`);
      return { success: false, reason: emailResult.error, notificationId: notification._id };
    }
  } catch (error) {
    logger.error(`💥 Error processing notification for ${eventType}:`, error);
    return { success: false, reason: error.message };
  }
};

/**
 * Add notification to retry queue
 * @param {Object} notification - Notification document
 */
const addToRetryQueue = async (notification) => {
  try {
    const { calculateNextRetryTime } = require('../utils/helpers');
    const nextRetryTime = calculateNextRetryTime(notification.deliveryAttempts);

    if (!nextRetryTime) {
      logger.warn(`⚠️ Max retry attempts reached for notification ${notification._id}`);
      return;
    }

    await NotificationQueue.create({
      notificationId: notification._id,
      retryCount: notification.deliveryAttempts,
      maxRetries: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
      nextRetryAt: nextRetryTime,
      queueStatus: 'PENDING',
    });

    logger.info(`🔄 Notification ${notification._id} added to retry queue (next retry: ${nextRetryTime.toISOString()})`);
  } catch (error) {
    logger.error('💥 Failed to add notification to retry queue:', error);
  }
};

/**
 * Get notification history for a user
 * @param {Number} userId - User ID
 * @param {Object} options - Query options (limit, skip, status)
 * @returns {Promise<Array>}
 */
const getNotificationHistory = async (userId, options = {}) => {
  const { limit = 50, skip = 0, status } = options;

  const query = { recipientId: userId };
  if (status) {
    query.status = status;
  }

  return Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .select('-messageBody -eventPayload') // Exclude large fields
    .lean();
};

/**
 * Get notification by ID
 * @param {String} notificationId - Notification ID
 * @returns {Promise<Object>}
 */
const getNotificationById = async (notificationId) => {
  return Notification.findById(notificationId);
};

/**
 * Manually retry a failed notification
 * @param {String} notificationId - Notification ID
 * @returns {Promise<Object>}
 */
const retryNotification = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return { success: false, reason: 'Notification not found' };
    }

    if (notification.status === NOTIFICATION_STATUS.SENT) {
      return { success: false, reason: 'Notification already sent' };
    }

    logger.info(`🔄 Retrying notification ${notificationId}...`);

    // Resend email
    const emailResult = await emailService.sendEmail({
      to: notification.recipientEmail,
      subject: notification.subject,
      html: notification.messageBody,
      eventType: notification.eventType,
      recipientType: notification.recipientType,
    });

    if (emailResult.success) {
      await notification.markAsSent(emailResult.messageId);
      logger.info(`✅ Notification ${notificationId} resent successfully`);
      return { success: true };
    } else {
      await notification.markAsFailed(emailResult.error);
      logger.error(`❌ Failed to resend notification ${notificationId}`);
      return { success: false, reason: emailResult.error };
    }
  } catch (error) {
    logger.error(`💥 Error retrying notification ${notificationId}:`, error);
    return { success: false, reason: error.message };
  }
};

/**
 * Get notification statistics
 * @param {Object} filters - Optional filters (startDate, endDate, eventType)
 * @returns {Promise<Object>}
 */
const getNotificationStats = async (filters = {}) => {
  const query = {};

  if (filters.startDate) {
    query.createdAt = { $gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    query.createdAt = { ...query.createdAt, $lte: new Date(filters.endDate) };
  }
  if (filters.eventType) {
    query.eventType = filters.eventType;
  }

  const [total, sent, failed, pending] = await Promise.all([
    Notification.countDocuments(query),
    Notification.countDocuments({ ...query, status: NOTIFICATION_STATUS.SENT }),
    Notification.countDocuments({ ...query, status: NOTIFICATION_STATUS.FAILED }),
    Notification.countDocuments({ ...query, status: NOTIFICATION_STATUS.PENDING }),
  ]);

  return {
    total,
    sent,
    failed,
    pending,
    successRate: total > 0 ? ((sent / total) * 100).toFixed(2) : 0,
  };
};

module.exports = {
  processEventNotification,
  addToRetryQueue,
  getNotificationHistory,
  getNotificationById,
  retryNotification,
  getNotificationStats,
};
