 /**
 * Application Constants
 * Centralized constants for notification-service
 */

// Notification Status
const NOTIFICATION_STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED',
  RETRY: 'RETRY',
};

// Notification Types
const NOTIFICATION_TYPE = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  IN_APP: 'IN_APP',
  PUSH: 'PUSH',
};

// Recipient Types
const RECIPIENT_TYPE = {
  CITIZEN: 'CITIZEN',
  ORG_ADMIN: 'ORG_ADMIN',
  ORG_OWNER: 'ORG_OWNER',
  DISTRIBUTOR: 'DISTRIBUTOR',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  UNKNOWN: 'UNKNOWN'
};

// Event Types (22 notification events)
const EVENT_TYPE = {
  // Auth Service Events (5)
  DISTRIBUTOR_REGISTERED: 'distributor.registered',
  DISTRIBUTOR_APPROVED: 'distributor.approved',
  DISTRIBUTOR_REJECTED: 'distributor.rejected',
  DISTRIBUTOR_SUSPENDED: 'distributor.suspended',
  DISTRIBUTOR_REACTIVATED: 'distributor.reactivated',

  //User
  USER_CREATED:"user.created",
  USER_ACCEPTED:"user.accepted",

  // Org Service Events (4)
  ORG_CREATED: 'org.created',
  ORG_APPROVED: 'org.approved',
  ORG_REJECTED: 'org.rejected',
  ORG_SUSPENDED: 'org.suspended',

  // Response Service Events (4)
  RESPONSE_SUBMITTED: 'response.submitted',
  RESPONSE_REVIEWED: 'response.reviewed',
  RESPONSE_RESOLVED: 'response.resolved',
  RESPONSE_FLAGGED: 'response.flagged',

  // QR Service Events (9)
  QR_ASSIGNED: 'qr.assigned',
  QR_ACCEPTED: 'qr.accepted',
  QR_REJECTED: 'qr.rejected',
  QR_DEPLOYMENT_SUBMITTED: 'qr.deployment.submitted',
  QR_DEPLOYED: 'qr.deployed',
  QR_DEPLOYMENT_REJECTED: 'qr.deployment.rejected',
  QR_DEACTIVATED: 'qr.deactivated',
  QR_DELETED: 'qr.deleted',

  // Feedback Service Events (1)
  FEEDBACK_FORM_DELETED: 'feedback.form.deleted',
};

// Email Templates (map event type to template name)
const EMAIL_TEMPLATES = {
  [EVENT_TYPE.ORG_CREATED]: 'org_created',
  [EVENT_TYPE.ORG_APPROVED]: 'org_approved',
  [EVENT_TYPE.ORG_REJECTED]: 'org_rejected',
  [EVENT_TYPE.ORG_SUSPENDED]: 'org_suspended',
  
  [EVENT_TYPE.DISTRIBUTOR_REGISTERED]: 'distributor_registered',
  [EVENT_TYPE.DISTRIBUTOR_APPROVED]: 'distributor_approved',
  [EVENT_TYPE.DISTRIBUTOR_REJECTED]: 'distributor_rejected',
  [EVENT_TYPE.DISTRIBUTOR_SUSPENDED]: 'distributor_suspended',
  [EVENT_TYPE.DISTRIBUTOR_REACTIVATED]: 'distributor_reactivated',
 
  [EVENT_TYPE.USER_CREATED]: 'user_created',
  [EVENT_TYPE.USER_ACCEPTED]: 'user_accepted',
  
  [EVENT_TYPE.RESPONSE_SUBMITTED]: 'response_submitted',
  [EVENT_TYPE.RESPONSE_REVIEWED]: 'response_reviewed',
  [EVENT_TYPE.RESPONSE_RESOLVED]: 'response_resolved',
  [EVENT_TYPE.RESPONSE_FLAGGED]: 'response_flagged',
  
  [EVENT_TYPE.QR_ASSIGNED]: 'qr_assigned',
  [EVENT_TYPE.QR_ACCEPTED]: 'qr_accepted',
  [EVENT_TYPE.QR_REJECTED]: 'qr_rejected',
  [EVENT_TYPE.QR_DEPLOYMENT_SUBMITTED]: 'qr_deployment_submitted',
  [EVENT_TYPE.QR_DEPLOYED]: 'qr_deployed',
  [EVENT_TYPE.QR_DEPLOYMENT_REJECTED]: 'qr_deployment_rejected',
  [EVENT_TYPE.QR_DEACTIVATED]: 'qr_deactivated',
  [EVENT_TYPE.QR_DELETED]: 'qr_deleted',
  
  [EVENT_TYPE.FEEDBACK_FORM_DELETED]: 'feedback_form_deleted',
};

// Priority Levels
const PRIORITY = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

// Queue Status
const QUEUE_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

// Email Providers
const EMAIL_PROVIDER = {
  GMAIL_SMTP: 'GMAIL_SMTP',
  SENDGRID: 'SENDGRID',
  AWS_SES: 'AWS_SES',
};

// Rate Limit Types
const RATE_LIMIT_TYPE = {
  EVENT: 'event',
  RECIPIENT: 'recipient',
};

// Retry Configuration
const RETRY_CONFIG = {
  MAX_ATTEMPTS: parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3,
  INTERVALS: (process.env.RETRY_INTERVALS || '5,15,60')
    .split(',')
    .map(num => parseInt(num)), // [5, 15, 60] minutes
};

// Archive Configuration
const ARCHIVE_CONFIG = {
  DAYS_THRESHOLD: parseInt(process.env.ARCHIVE_AFTER_DAYS) || 90,
};

// Rate Limit Configuration
const RATE_LIMIT_CONFIG = {
  PER_EVENT: parseInt(process.env.RATE_LIMIT_PER_EVENT) || 5, // Max 5 per event type
  WINDOW_MINUTES: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES) || 60, // Per hour
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Messages
const ERROR_MESSAGES = {
  DATABASE_CONNECTION_FAILED: 'Failed to connect to database',
  KAFKA_CONNECTION_FAILED: 'Failed to connect to Kafka',
  EMAIL_SEND_FAILED: 'Failed to send email',
  INVALID_EVENT_TYPE: 'Invalid event type',
  TEMPLATE_NOT_FOUND: 'Email template not found',
  RECIPIENT_NOT_FOUND: 'Recipient information missing',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INVALID_JWT_TOKEN: 'Invalid or expired JWT token',
  UNAUTHORIZED_ACCESS: 'Unauthorized access',
};

// Success Messages
const SUCCESS_MESSAGES = {
  NOTIFICATION_SENT: 'Notification sent successfully',
  PREFERENCE_UPDATED: 'Notification preferences updated',
  NOTIFICATION_RETRIED: 'Notification retry triggered',
};

// Default Notification Preferences
const DEFAULT_PREFERENCES = {
  emailEnabled: true,
  
  // Response notifications
  emailOnResponseSubmitted: true,
  emailOnResponseReviewed: true,
  emailOnResponseResolved: true,
  emailOnResponseFlagged: true,
  
  // QR notifications
  emailOnQrAssigned: true,
  emailOnQrDeployed: true,
  emailOnQrRejected: true,
  
  // Org notifications
  emailOnOrgApproved: true,
  emailOnOrgSuspended: true,
  emailOnNewFeedback: true,
  
  // Distributor notifications
  emailOnDistributorApproved: true,
  emailOnDistributorRejected: true,
};

module.exports = {
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPE,
  RECIPIENT_TYPE,
  EVENT_TYPE,
  EMAIL_TEMPLATES,
  PRIORITY,
  QUEUE_STATUS,
  EMAIL_PROVIDER,
  RATE_LIMIT_TYPE,
  RETRY_CONFIG,
  ARCHIVE_CONFIG,
  RATE_LIMIT_CONFIG,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_PREFERENCES,
};

