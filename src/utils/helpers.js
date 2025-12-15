/**
 * Helper Utility Functions
 * Enhanced with user invite flow support
 */

const logger = require('./logger');
const { RETRY_CONFIG } = require('./constants');

/**
 * Parse Kafka message value
 * @param {Buffer} value - Kafka message value
 * @returns {Object} - Parsed JSON object
 */
const parseKafkaMessage = (value) => {
  try {
    return JSON.parse(value.toString());
  } catch (error) {
    logger.error('Failed to parse Kafka message:', error);
    return null;
  }
};

/**
 * Calculate next retry time based on attempt number
 * @param {Number} attemptNumber - Current attempt number (0, 1, 2)
 * @returns {Date} - Next retry time
 */
const calculateNextRetryTime = (attemptNumber) => {
  if (attemptNumber >= RETRY_CONFIG.MAX_ATTEMPTS) {
    return null; // No more retries
  }

  const delayMinutes = RETRY_CONFIG.INTERVALS[attemptNumber] || RETRY_CONFIG.INTERVALS[0];
  const nextRetryTime = new Date(Date.now() + delayMinutes * 60 * 1000);
  
  logger.debug(`Next retry scheduled in ${delayMinutes} minutes: ${nextRetryTime}`);
  
  return nextRetryTime;
};

/**
 * Sanitize email address
 * @param {String} email - Email address
 * @returns {String} - Sanitized email
 */
const sanitizeEmail = (email) => {
  if (!email) return null;
  return email.trim().toLowerCase();
};

/**
 * Generate unique notification ID
 * @returns {String} - Unique ID
 */
const generateNotificationId = () => {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Extract recipient info from event payload
 * @param {String} eventType - Event type
 * @param {Object} payload - Event payload
 * @returns {Object} - { email, name, userId, recipientType }
 */
const extractRecipientInfo = (eventType, payload) => {
  const recipientInfo = {
    email: null,
    name: null,
    userId: null,
    recipientType: null,
  };

  try {
    // 🔥 NEW: User invite flow events
    if (eventType === 'user.created') {
      recipientInfo.email = payload.email;
      recipientInfo.name = payload.fullName;
      recipientInfo.userId = null; // User not yet activated
      recipientInfo.recipientType = 'ORG_ADMIN';
      return recipientInfo;
    }
    
    if (eventType === 'user.accepted') {
      recipientInfo.email = payload.email;
      recipientInfo.name = payload.fullName;
      recipientInfo.userId = payload.userId;
      recipientInfo.recipientType = 'ORG_ADMIN';
      return recipientInfo;
    }
    
    // Org events
    if (eventType.startsWith('org.')) {
      recipientInfo.email = payload.ownerEmail || payload.orgEmail || payload.contactEmail || payload.email;
      recipientInfo.name = payload.ownerName || payload.orgName || payload.contactName;
      recipientInfo.userId = payload.ownerId;
      recipientInfo.recipientType = 'ORG_OWNER';
    }
    
    // Distributor events
    else if (eventType.startsWith('distributor.')) {
      recipientInfo.email = payload.distributorEmail || payload.email;
      recipientInfo.name = payload.distributorName || payload.name || payload.fullName;
      recipientInfo.userId = payload.distributorId || payload.userId;
      recipientInfo.recipientType = 'DISTRIBUTOR';
    }
    
    // Response events
    else if (eventType.startsWith('response.')) {
      // For response.submitted, notify ORG_ADMIN
      if (eventType === 'response.submitted') {
        recipientInfo.email = payload.orgAdminEmail || payload.formOwnerEmail;
        recipientInfo.name = payload.orgAdminName;
        recipientInfo.userId = payload.orgAdminId;
        recipientInfo.recipientType = 'ORG_ADMIN';
      } 
      // For response.resolved/reviewed, notify CITIZEN
      else {
        recipientInfo.email = payload.citizenEmail || payload.submitterEmail;
        recipientInfo.name = payload.citizenName || 'Citizen';
        recipientInfo.userId = payload.citizenId;
        recipientInfo.recipientType = 'CITIZEN';
      }
    }
    
    // QR events
    else if (eventType.startsWith('qr.')) {
      // qr.assigned -> notify DISTRIBUTOR
      if (eventType === 'qr.assigned') {
        recipientInfo.email = payload.distributorEmail;
        recipientInfo.name = payload.distributorName;
        recipientInfo.userId = payload.distributorId;
        recipientInfo.recipientType = 'DISTRIBUTOR';
      }
      // qr.accepted/rejected -> notify ORG_ADMIN
      else if (['qr.accepted', 'qr.rejected', 'qr.deployment.submitted'].includes(eventType)) {
        recipientInfo.email = payload.orgAdminEmail;
        recipientInfo.name = payload.orgAdminName;
        recipientInfo.userId = payload.orgAdminId;
        recipientInfo.recipientType = 'ORG_ADMIN';
      }
      // qr.deployed/deployment.rejected -> notify DISTRIBUTOR
      else {
        recipientInfo.email = payload.distributorEmail;
        recipientInfo.name = payload.distributorName;
        recipientInfo.userId = payload.distributorId;
        recipientInfo.recipientType = 'DISTRIBUTOR';
      }
    }
    
    // Service events (if any)
    else if (eventType.startsWith('service.')) {
      recipientInfo.email = payload.adminEmail || payload.email;
      recipientInfo.name = payload.adminName || payload.name;
      recipientInfo.userId = payload.adminId || payload.userId;
      recipientInfo.recipientType = 'ORG_ADMIN';
    }

    // Fallback for unknown events
    else {
      recipientInfo.email = payload.email || payload.recipientEmail;
      recipientInfo.name = payload.name || payload.fullName || payload.recipientName;
      recipientInfo.userId = payload.userId;
      recipientInfo.recipientType = 'UNKNOWN';
      logger.warn(`Unknown event type for recipient extraction: ${eventType}`);
    }

  } catch (error) {
    logger.error('Error extracting recipient info:', error);
  }

  return recipientInfo;
};

/**
 * Format date for email display
 * @param {Date|String} date - Date to format
 * @returns {String} - Formatted date string
 */
const formatDateForEmail = (date) => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return d.toLocaleDateString('en-IN', options);
};

/**
 * Truncate text to max length
 * @param {String} text - Text to truncate
 * @param {Number} maxLength - Maximum length
 * @returns {String} - Truncated text
 */
const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Sleep/delay function
 * @param {Number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Check if email is valid
 * @param {String} email - Email to validate
 * @returns {Boolean}
 */
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get priority from event type
 * @param {String} eventType - Event type
 * @returns {String} - Priority level (HIGH, MEDIUM, LOW)
 */
const getPriorityFromEvent = (eventType) => {
  // 🔥 HIGH PRIORITY: Critical actions requiring immediate attention
  const highPriorityEvents = [
    // Organization critical events
    'org.approved',
    'org.rejected',
    'org.suspended',
    
    // Distributor critical events
    'distributor.approved',
    'distributor.rejected',
    'distributor.suspended',
    
    // Response critical events
    'response.submitted',
    'response.resolved',
    'response.flagged',
    
    // QR critical events
    'qr.assigned',
    'qr.deployed',
    'qr.deployment.rejected',
    
    // 🔥 NEW: User invite flow (high priority)
    'user.created',
    'user.accepted',
  ];

  // MEDIUM PRIORITY: Important but not urgent
  const mediumPriorityEvents = [
    'org.created',
    'distributor.registered',
    'distributor.reactivated',
    'response.reviewed',
    'qr.generated',
    'qr.accepted',
    'qr.rejected',
    'service.created',
    'service.updated',
  ];

  if (highPriorityEvents.includes(eventType)) {
    return 'HIGH';
  }

  if (mediumPriorityEvents.includes(eventType)) {
    return 'MEDIUM';
  }

  return 'LOW';
};

/**
 * Mask email for logging (privacy)
 * @param {String} email - Email address
 * @returns {String} - Masked email
 */
const maskEmail = (email) => {
  if (!email) return 'N/A';
  const [username, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

/**
 * Build email subject from event
 * @param {String} eventType - Event type
 * @param {Object} payload - Event payload
 * @returns {String} - Email subject
 */
const buildEmailSubject = (eventType, payload) => {
  const subjects = {
    // Organization events
    'org.created': `Organization Registration Received - ${payload.orgName || 'Your Organization'}`,
    'org.approved': `🎉 Welcome to BoloIndia - Organization Approved!`,
    'org.rejected': `Organization Registration Update - ${payload.orgName || 'Your Application'}`,
    'org.suspended': `⚠️ URGENT: Organization Suspended - ${payload.orgName || 'Action Required'}`,
    
    // Distributor events
    'distributor.registered': `🔔 New Distributor Application - ${payload.fullName || payload.name}`,
    'distributor.approved': `✅ Congratulations! Your Distributor Account is Approved`,
    'distributor.rejected': `Distributor Application Update`,
    'distributor.suspended': `⚠️ Account Suspended - Action Required`,
    'distributor.reactivated': `✅ Account Reactivated - Welcome Back!`,
    
    // Response events
    'response.submitted': `📩 New Feedback Received - ${payload.formName || 'Form'}`,
    'response.reviewed': `📋 Your Feedback is Being Reviewed`,
    'response.resolved': `✅ Your Feedback Has Been Resolved`,
    'response.flagged': `⚠️ Feedback Flagged for Review`,
    
    // QR events
    'qr.generated': `QR Code Generated - ${payload.qrCodeId || 'New QR'}`,
    'qr.assigned': `📦 New QR Code Assignment - Action Required`,
    'qr.accepted': `✅ QR Assignment Accepted`,
    'qr.rejected': `QR Assignment Update`,
    'qr.deployed': `✅ QR Deployment Approved - ${payload.location || 'Location'}`,
    'qr.deployment.submitted': `📸 QR Deployment Submitted for Review`,
    'qr.deployment.rejected': `QR Deployment Update - Action Required`,
    
    // Service events
    'service.created': `New Service Created - ${payload.serviceName || 'Service'}`,
    'service.updated': `Service Updated - ${payload.serviceName || 'Service'}`,
    'service.activated': `Service Activated - ${payload.serviceName || 'Service'}`,
    'service.deactivated': `Service Deactivated - ${payload.serviceName || 'Service'}`,
    
    // 🔥 NEW: User invite flow events
    'user.created': `🎉 Welcome to BoloIndia - Activate Your Account`,
    'user.accepted': `✅ Your BoloIndia Account is Active!`,
  };

  return subjects[eventType] || `📬 Notification from BoloIndia`;
};

/**
 * Get template data with common fields populated
 * @param {Object} payload - Event payload
 * @param {Object} recipientInfo - Recipient information
 * @returns {Object} - Enhanced template data
 */
const buildTemplateData = (payload, recipientInfo) => {
  return {
    ...payload,
    recipientName: recipientInfo.name || 'User',
    recipientEmail: recipientInfo.email,
    currentYear: new Date().getFullYear(),
    platformName: 'BoloIndia',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@boloindia.in',
    platformUrl: process.env.PLATFORM_URL || 'http://localhost:5173',
    formattedDate: formatDateForEmail(new Date()),
  };
};

/**
 * Validate event payload has required fields
 * @param {String} eventType - Event type
 * @param {Object} payload - Event payload
 * @returns {Object} - { valid: Boolean, missingFields: Array }
 */
const validateEventPayload = (eventType, payload) => {
  const requiredFieldsMap = {
    'user.created': ['email', 'fullName', 'inviteToken', 'inviteLink'],
    'user.accepted': ['email', 'fullName', 'userId'],
    'org.approved': ['orgName', 'ownerEmail'],
    'org.rejected': ['orgName', 'ownerEmail', 'rejectionReason'],
    'distributor.approved': ['email', 'fullName'],
    'distributor.rejected': ['email', 'fullName', 'rejectionReason'],
    'qr.assigned': ['distributorEmail', 'qrCodeId'],
    'response.submitted': ['formName', 'orgAdminEmail'],
  };

  const requiredFields = requiredFieldsMap[eventType] || ['email'];
  const missingFields = requiredFields.filter(field => !payload[field]);

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Get event category for analytics
 * @param {String} eventType - Event type
 * @returns {String} - Category name
 */
const getEventCategory = (eventType) => {
  if (eventType.startsWith('org.')) return 'ORGANIZATION';
  if (eventType.startsWith('distributor.')) return 'DISTRIBUTOR';
  if (eventType.startsWith('user.')) return 'USER';
  if (eventType.startsWith('response.')) return 'RESPONSE';
  if (eventType.startsWith('qr.')) return 'QR_CODE';
  if (eventType.startsWith('service.')) return 'SERVICE';
  return 'OTHER';
};

module.exports = {
  parseKafkaMessage,
  calculateNextRetryTime,
  sanitizeEmail,
  generateNotificationId,
  extractRecipientInfo,
  formatDateForEmail,
  truncateText,
  sleep,
  isValidEmail,
  getPriorityFromEvent,
  maskEmail,
  buildEmailSubject,
  buildTemplateData,           // 🔥 NEW
  validateEventPayload,        // 🔥 NEW
  getEventCategory,            // 🔥 NEW
};
