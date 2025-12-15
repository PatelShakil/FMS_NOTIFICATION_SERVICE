/**
 * Notification Routes
 * REST API endpoints for notification management
 */

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } = require('../utils/constants');


/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notification history (paginated)
 *     description: Retrieve paginated list of notifications with optional filters
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SENT, FAILED, RETRY]
 *         description: Filter by notification status
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Filter by event type (e.g., org.approved, qr.assigned)
 *       - in: query
 *         name: recipientEmail
 *         schema:
 *           type: string
 *           format: email
 *         description: Filter by recipient email
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Successful response with notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     description: Retrieve a single notification by its MongoDB ObjectId
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification MongoDB ObjectId (24 hex characters)
 *     responses:
 *       200:
 *         description: Notification found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/notifications/user/{userId}:
 *   get:
 *     summary: Get notifications for specific user
 *     description: Retrieve all notifications sent to a specific user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID from auth-service
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of results
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SENT, FAILED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: User notifications retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 count:
 *                   type: integer
 *                   example: 25
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/notifications/{id}/retry:
 *   post:
 *     summary: Manually retry failed notification
 *     description: Retry sending a failed notification (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Notification retried successfully
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
 *                   example: Notification retry triggered
 *       400:
 *         description: Cannot retry notification
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
 *                   example: Notification already sent
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/notifications/stats/summary:
 *   get:
 *     summary: Get notification statistics
 *     description: Retrieve aggregated statistics for notifications (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for stats (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for stats (YYYY-MM-DD)
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Filter stats by event type
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 1500
 *                     sent:
 *                       type: integer
 *                       example: 1450
 *                     failed:
 *                       type: integer
 *                       example: 30
 *                     pending:
 *                       type: integer
 *                       example: 20
 *                     successRate:
 *                       type: string
 *                       example: "96.67"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/notifications/failed/list:
 *   get:
 *     summary: Get all failed notifications
 *     description: Retrieve list of failed notifications for troubleshooting (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of failed notifications to retrieve
 *     responses:
 *       200:
 *         description: Failed notifications list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 count:
 *                   type: integer
 *                   example: 15
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification (soft delete)
 *     description: Archive a notification (soft delete) - Admin only
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Notification archived successfully
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
 *                   example: Notification archived successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */



/**
 * @route   GET /api/notifications
 * @desc    Get notification history (paginated)
 * @access  Private (JWT required)
 * @query   page, limit, status, eventType
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      eventType,
      recipientEmail,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    // Apply filters
    if (status) query.status = status;
    if (eventType) query.eventType = eventType;
    if (recipientEmail) query.recipientEmail = recipientEmail.toLowerCase();
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .select('-messageBody') // Exclude large fields
        .lean(),
      Notification.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/:id
 * @desc    Get single notification by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const notification = await notificationService.getNotificationById(req.params.id);

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Error fetching notification:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch notification',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/user/:userId
 * @desc    Get notifications for specific user
 * @access  Private
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, status } = req.query;

    const notifications = await notificationService.getNotificationHistory(
      parseInt(userId),
      { limit: parseInt(limit), status }
    );

    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error) {
    logger.error('Error fetching user notifications:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch user notifications',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/notifications/:id/retry
 * @desc    Manually retry failed notification
 * @access  Private (Admin only)
 */
router.post('/:id/retry', async (req, res) => {
  try {
    const result = await notificationService.retryNotification(req.params.id);

    if (!result.success) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: result.reason,
      });
    }

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.NOTIFICATION_RETRIED,
    });
  } catch (error) {
    logger.error('Error retrying notification:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retry notification',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/stats/summary
 * @desc    Get notification statistics
 * @access  Private (Admin only)
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate, eventType } = req.query;

    const stats = await notificationService.getNotificationStats({
      startDate,
      endDate,
      eventType,
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching notification stats:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch notification stats',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/failed/list
 * @desc    Get all failed notifications
 * @access  Private (Admin only)
 */
router.get('/failed/list', async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const failedNotifications = await Notification.findByStatus('FAILED', parseInt(limit));

    res.json({
      success: true,
      data: failedNotifications,
      count: failedNotifications.length,
    });
  } catch (error) {
    logger.error('Error fetching failed notifications:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch failed notifications',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification (soft delete)
 * @access  Private (Admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );

    if (!notification) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification archived successfully',
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
    });
  }
});

module.exports = router;
