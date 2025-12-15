/**
 * Email Service
 * Handles email sending via Nodemailer (Gmail SMTP)
 */

const { getTransporter, emailConfig } = require('../config/email');
const logger = require('../utils/logger');
const { NOTIFICATION_STATUS } = require('../utils/constants');
const { recordEmailDuration, recordNotificationSent, recordNotificationFailed } = require('../utils/metrics');

/**
 * Send email
 * @param {Object} emailData - Email data
 * @returns {Promise<Object>} - Result with success status and messageId
 */
const sendEmail = async (emailData) => {
  const startTime = Date.now();
  const { to, subject, html, text, eventType, recipientType } = emailData;

  try {
    // Validate email data
    if (!to || !subject || !html) {
      throw new Error('Missing required email fields: to, subject, html');
    }

    // Get transporter
    const transporter = getTransporter();

    // Prepare mail options
    const mailOptions = {
      from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
      to,
      subject,
      html,
      text: text || undefined, // Plain text fallback
      replyTo: emailConfig.replyTo,
      priority: emailData.priority || 'normal',
    };

    // Send email
    logger.info(`Sending email to: ${to}`);
    logger.debug(`Email subject: ${subject}`);

    const info = await transporter.sendMail(mailOptions);

    // Record metrics
    recordEmailDuration(eventType, startTime);
    recordNotificationSent(eventType, NOTIFICATION_STATUS.SENT, recipientType);

    logger.info(`✅ Email sent successfully to ${to}`);
    logger.debug(`Message ID: ${info.messageId}`);

    return {
      success: true,
      status: NOTIFICATION_STATUS.SENT,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    // Record failure metric
    recordNotificationFailed(eventType, error.code || 'UNKNOWN');

    logger.error(`❌ Failed to send email to ${to}:`, error.message);
    logger.debug('Error details:', error);

    return {
      success: false,
      status: NOTIFICATION_STATUS.FAILED,
      error: error.message,
      errorCode: error.code,
    };
  }
};

/**
 * Send bulk emails (batch sending)
 * @param {Array} emailDataArray - Array of email data objects
 * @returns {Promise<Object>} - Summary of sent and failed emails
 */
const sendBulkEmails = async (emailDataArray) => {
  logger.info(`Sending bulk emails: ${emailDataArray.length} emails`);

  const results = {
    total: emailDataArray.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Send emails sequentially to avoid rate limits
  for (const emailData of emailDataArray) {
    try {
      const result = await sendEmail(emailData);
      
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push({
          email: emailData.to,
          error: result.error,
        });
      }

      // Small delay to avoid rate limiting (200ms between emails)
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: emailData.to,
        error: error.message,
      });
    }
  }

  logger.info(`Bulk email summary: ${results.sent} sent, ${results.failed} failed`);

  return results;
};

/**
 * Validate email address format
 * @param {String} email - Email address
 * @returns {Boolean}
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Test email connection
 * @returns {Promise<Boolean>}
 */
const testConnection = async () => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    logger.info('✅ Email connection verified successfully');
    return true;
  } catch (error) {
    logger.error('❌ Email connection failed:', error.message);
    return false;
  }
};

/**
 * Send test email
 * @param {String} toEmail - Test recipient email
 * @returns {Promise<Object>}
 */
const sendTestEmail = async (toEmail) => {
  const testEmailData = {
    to: toEmail,
    subject: 'BoloIndia Notification Service - Test Email',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🎉 Test Email Successful!</h2>
        <p>This is a test email from <strong>BoloIndia Notification Service</strong>.</p>
        <p>If you received this email, the notification service is configured correctly!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Sent at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </p>
      </div>
    `,
    text: 'Test email from BoloIndia Notification Service',
    eventType: 'test',
    recipientType: 'PLATFORM_ADMIN',
  };

  return sendEmail(testEmailData);
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  validateEmail,
  testConnection,
  sendTestEmail,
};
