/**
 * Webhook Routes
 * REST API endpoints for manual notification triggers
 */


const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const templateService = require('../services/templateService');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const { HTTP_STATUS, NOTIFICATION_STATUS, NOTIFICATION_TYPE } = require('../utils/constants');
const { isValidEmail, getPriorityFromEvent } = require('../utils/helpers');

/**
 * @swagger
 * tags:
 *   name: Webhook
 *   description: Manual notification trigger endpoints
 */

/**
 * @swagger
 * /api/webhook/send:
 *   post:
 *     summary: Send manual notification
 *     description: Manually trigger a notification via API (requires API key or admin JWT)
 *     tags: [Webhook]
 *     security:
 *       - apiKeyAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientEmail
 *               - subject
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: Recipient email address
 *               recipientName:
 *                 type: string
 *                 example: John Doe
 *                 description: Recipient name
 *               subject:
 *                 type: string
 *                 example: Important Update from BoloIndia
 *                 description: Email subject line
 *               message:
 *                 type: string
 *                 description: Raw HTML message (used if template is not specified)
 *                 example: "<h1>Hello</h1><p>This is a test email.</p>"
 *               templateName:
 *                 type: string
 *                 example: org_approved
 *                 description: Handlebars template name (without .hbs extension)
 *               templateData:
 *                 type: object
 *                 description: Data to populate the template
 *                 example:
 *                   orgName: "My Organization"
 *                   ownerName: "John Doe"
 *               priority:
 *                 type: string
 *                 enum: [HIGH, MEDIUM, LOW]
 *                 default: MEDIUM
 *                 description: Email priority level
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification sent successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     notificationId:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     messageId:
 *                       type: string
 *                       example: <abc123@gmail.com>
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/webhook/send-bulk:
 *   post:
 *     summary: Send bulk notifications
 *     description: Send notifications to multiple recipients (Admin only)
 *     tags: [Webhook]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipients
 *               - templateName
 *               - subject
 *             properties:
 *               recipients:
 *                 type: array
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - email
 *                   properties:
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: user1@example.com
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     templateData:
 *                       type: object
 *                       example:
 *                         customField: "value"
 *               templateName:
 *                 type: string
 *                 example: org_approved
 *                 description: Handlebars template name
 *               subject:
 *                 type: string
 *                 example: Important Update
 *                 description: Email subject (same for all recipients)
 *           example:
 *             recipients:
 *               - email: user1@example.com
 *                 name: User One
 *                 templateData:
 *                   orgName: Org A
 *               - email: user2@example.com
 *                 name: User Two
 *                 templateData:
 *                   orgName: Org B
 *             templateName: org_approved
 *             subject: Welcome to BoloIndia
 *     responses:
 *       200:
 *         description: Bulk notifications processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Bulk notifications processed
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     sent:
 *                       type: integer
 *                       example: 48
 *                     failed:
 *                       type: integer
 *                       example: 2
 *                     notificationIds:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/webhook/test:
 *   post:
 *     summary: Send test email
 *     description: Send a test email to verify SMTP configuration (Admin only)
 *     tags: [Webhook]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: test@example.com
 *                 description: Email address to send test email
 *     responses:
 *       200:
 *         description: Test email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Test email sent successfully
 *                 messageId:
 *                   type: string
 *                   example: <abc123@gmail.com>
 *       400:
 *         description: Invalid email address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Valid email address required
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @route   POST /api/webhook/send
 * @desc    Send manual notification (webhook endpoint)
 * @access  Private (API Key or Admin JWT)
 * @body    { recipientEmail, subject, message, templateName, templateData }
 */
router.post('/send', async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      subject,
      message,
      templateName,
      templateData,
      priority = 'MEDIUM',
    } = req.body;

    // Validation
    if (!recipientEmail || !subject) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'recipientEmail and subject are required',
      });
    }

    if (!isValidEmail(recipientEmail)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid email address',
      });
    }

    let emailHtml = message;

    // If template is specified, render it
    if (templateName && templateData) {
      try {
        emailHtml = await templateService.renderTemplate(templateName, templateData);
      } catch (error) {
        logger.warn(`Template ${templateName} not found, using raw message`);
      }
    }

    // Create notification record
    const notification = await Notification.create({
      eventType: 'manual',
      eventPayload: { templateData },
      recipientType: 'CITIZEN',
      recipientEmail,
      recipientName: recipientName || 'User',
      notificationType: NOTIFICATION_TYPE.EMAIL,
      subject,
      messageBody: emailHtml,
      templateName: templateName || 'manual',
      status: NOTIFICATION_STATUS.PENDING,
      priority,
      provider: process.env.EMAIL_PROVIDER || 'GMAIL_SMTP',
    });

    // Send email
    const emailResult = await emailService.sendEmail({
      to: recipientEmail,
      subject,
      html: emailHtml,
      eventType: 'manual',
      recipientType: 'CITIZEN',
      priority: priority === 'HIGH' ? 'high' : 'normal',
    });

    // Update notification status
    if (emailResult.success) {
      await notification.markAsSent(emailResult.messageId);
      
      res.json({
        success: true,
        message: 'Notification sent successfully',
        data: {
          notificationId: notification._id,
          messageId: emailResult.messageId,
        },
      });
    } else {
      await notification.markAsFailed(emailResult.error);
      
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send notification',
        error: emailResult.error,
        notificationId: notification._id,
      });
    }
  } catch (error) {
    logger.error('Error sending manual notification:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/webhook/send-bulk
 * @desc    Send bulk notifications
 * @access  Private (Admin only)
 * @body    { recipients: [{ email, name, templateData }], templateName, subject }
 */
router.post('/send-bulk', async (req, res) => {
  try {
    const { recipients, templateName, subject } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'recipients array is required',
      });
    }

    if (!templateName || !subject) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'templateName and subject are required',
      });
    }

    logger.info(`Sending bulk notifications to ${recipients.length} recipients`);

    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      notificationIds: [],
    };

    for (const recipient of recipients) {
      try {
        // Render template
        const emailHtml = await templateService.renderTemplate(templateName, recipient.templateData || {});

        // Create notification record
        const notification = await Notification.create({
          eventType: 'bulk',
          eventPayload: recipient.templateData,
          recipientType: 'CITIZEN',
          recipientEmail: recipient.email,
          recipientName: recipient.name || 'User',
          notificationType: NOTIFICATION_TYPE.EMAIL,
          subject,
          messageBody: emailHtml,
          templateName,
          status: NOTIFICATION_STATUS.PENDING,
          priority: 'MEDIUM',
        });

        results.notificationIds.push(notification._id);

        // Send email
        const emailResult = await emailService.sendEmail({
          to: recipient.email,
          subject,
          html: emailHtml,
          eventType: 'bulk',
          recipientType: 'CITIZEN',
        });

        if (emailResult.success) {
          await notification.markAsSent(emailResult.messageId);
          results.sent++;
        } else {
          await notification.markAsFailed(emailResult.error);
          results.failed++;
        }

        // Small delay between emails (200ms)
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        logger.error(`Error sending to ${recipient.email}:`, error);
        results.failed++;
      }
    }

    res.json({
      success: true,
      message: 'Bulk notifications processed',
      data: results,
    });
  } catch (error) {
    logger.error('Error sending bulk notifications:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send bulk notifications',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/webhook/test
 * @desc    Send test email
 * @access  Private (Admin only)
 */
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Valid email address required',
      });
    }

    const result = await emailService.sendTestEmail(email);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error,
      });
    }
  } catch (error) {
    logger.error('Error sending test email:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
    });
  }
});

module.exports = router;
