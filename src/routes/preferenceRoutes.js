/**
 * Preference Routes
 * REST API endpoints for user notification preferences
 */



const express = require('express');
const router = express.Router();
const NotificationPreference = require('../models/NotificationPreference');
const logger = require('../utils/logger');
const { HTTP_STATUS, SUCCESS_MESSAGES } = require('../utils/constants');


/**
 * @swagger
 * tags:
 *   name: Preferences
 *   description: User notification preference management
 */

/**
 * @swagger
 * /api/preferences/{userId}:
 *   get:
 *     summary: Get user notification preferences
 *     description: Retrieve notification preferences for a specific user
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID from auth-service
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreference'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/preferences:
 *   post:
 *     summary: Create or update notification preferences
 *     description: Create new or update existing notification preferences for a user
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - email
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 123
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               emailEnabled:
 *                 type: boolean
 *                 example: true
 *                 description: Master switch for all email notifications
 *               emailOnResponseSubmitted:
 *                 type: boolean
 *                 example: true
 *               emailOnResponseReviewed:
 *                 type: boolean
 *                 example: true
 *               emailOnResponseResolved:
 *                 type: boolean
 *                 example: true
 *               emailOnResponseFlagged:
 *                 type: boolean
 *                 example: true
 *               emailOnQrAssigned:
 *                 type: boolean
 *                 example: true
 *               emailOnQrDeployed:
 *                 type: boolean
 *                 example: true
 *               emailOnQrRejected:
 *                 type: boolean
 *                 example: true
 *               emailOnOrgApproved:
 *                 type: boolean
 *                 example: true
 *               emailOnOrgSuspended:
 *                 type: boolean
 *                 example: true
 *               emailOnNewFeedback:
 *                 type: boolean
 *                 example: true
 *               emailOnDistributorApproved:
 *                 type: boolean
 *                 example: true
 *               emailOnDistributorRejected:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Preferences updated successfully
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
 *                   example: Notification preferences updated
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreference'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/preferences/{userId}:
 *   put:
 *     summary: Update specific preference fields
 *     description: Update one or more notification preference fields for a user
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailEnabled:
 *                 type: boolean
 *               emailOnResponseSubmitted:
 *                 type: boolean
 *               emailOnQrAssigned:
 *                 type: boolean
 *           example:
 *             emailOnResponseSubmitted: false
 *             emailOnQrAssigned: true
 *     responses:
 *       200:
 *         description: Preferences updated successfully
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
 *                   example: Notification preferences updated
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreference'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/preferences/{userId}/enable-all:
 *   put:
 *     summary: Enable all notification types
 *     description: Enable all notification preferences for a user
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: All notifications enabled
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
 *                   example: All notifications enabled
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreference'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/preferences/{userId}/disable-all:
 *   put:
 *     summary: Disable all notification types
 *     description: Disable all notifications for a user (sets emailEnabled to false)
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: All notifications disabled
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
 *                   example: All notifications disabled
 *                 data:
 *                   $ref: '#/components/schemas/NotificationPreference'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/preferences/{userId}:
 *   delete:
 *     summary: Delete user preferences (reset to default)
 *     description: Delete user preferences and reset to system defaults
 *     tags: [Preferences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Preferences reset to default
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
 *                   example: Preferences reset to default
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */


/**
 * @route   GET /api/preferences/:userId
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const preference = await NotificationPreference.findOne({ userId: parseInt(userId) });

    if (!preference) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Preferences not found for this user',
      });
    }

    res.json({
      success: true,
      data: preference,
    });
  } catch (error) {
    logger.error('Error fetching preferences:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/preferences
 * @desc    Create or update user notification preferences
 * @access  Private
 * @body    { userId, email, ...preferences }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, email, ...preferences } = req.body;

    if (!userId || !email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'userId and email are required',
      });
    }

    const updatedPreference = await NotificationPreference.updatePreference(
      parseInt(userId),
      { email, ...preferences }
    );

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.PREFERENCE_UPDATED,
      data: updatedPreference,
    });
  } catch (error) {
    logger.error('Error updating preferences:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/preferences/:userId
 * @desc    Update specific preference fields
 * @access  Private
 */
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const updatedPreference = await NotificationPreference.findOneAndUpdate(
      { userId: parseInt(userId) },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.PREFERENCE_UPDATED,
      data: updatedPreference,
    });
  } catch (error) {
    logger.error('Error updating preferences:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/preferences/:userId/enable-all
 * @desc    Enable all notification types for user
 * @access  Private
 */
router.put('/:userId/enable-all', async (req, res) => {
  try {
    const { userId } = req.params;

    const updatedPreference = await NotificationPreference.findOneAndUpdate(
      { userId: parseInt(userId) },
      {
        $set: {
          emailEnabled: true,
          emailOnResponseSubmitted: true,
          emailOnResponseReviewed: true,
          emailOnResponseResolved: true,
          emailOnResponseFlagged: true,
          emailOnQrAssigned: true,
          emailOnQrDeployed: true,
          emailOnQrRejected: true,
          emailOnOrgApproved: true,
          emailOnOrgSuspended: true,
          emailOnNewFeedback: true,
          emailOnDistributorApproved: true,
          emailOnDistributorRejected: true,
        },
      },
      { new: true }
    );

    if (!updatedPreference) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User preferences not found',
      });
    }

    res.json({
      success: true,
      message: 'All notifications enabled',
      data: updatedPreference,
    });
  } catch (error) {
    logger.error('Error enabling all preferences:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to enable all preferences',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/preferences/:userId/disable-all
 * @desc    Disable all notification types for user
 * @access  Private
 */
router.put('/:userId/disable-all', async (req, res) => {
  try {
    const { userId } = req.params;

    const updatedPreference = await NotificationPreference.findOneAndUpdate(
      { userId: parseInt(userId) },
      { $set: { emailEnabled: false } },
      { new: true }
    );

    if (!updatedPreference) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User preferences not found',
      });
    }

    res.json({
      success: true,
      message: 'All notifications disabled',
      data: updatedPreference,
    });
  } catch (error) {
    logger.error('Error disabling all preferences:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to disable all preferences',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/preferences/:userId
 * @desc    Delete user preferences (reset to default)
 * @access  Private
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    await NotificationPreference.findOneAndDelete({ userId: parseInt(userId) });

    res.json({
      success: true,
      message: 'Preferences reset to default',
    });
  } catch (error) {
    logger.error('Error deleting preferences:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete preferences',
      error: error.message,
    });
  }
});

module.exports = router;
