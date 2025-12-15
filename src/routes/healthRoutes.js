/**
 * Health Routes
 * Health check and status endpoints
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getConnectionStatus } = require('../config/database');
const { testEmailConnection } = require('../services/emailService');
const { getRetryQueueStatus } = require('../services/retryService');
const { getConsumerStats } = require('../consumers');
const NotificationQueue = require('../models/NotificationQueue');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');


/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check and monitoring endpoints
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Check if notification-service is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 service:
 *                   type: string
 *                   example: notification-service
 *                 status:
 *                   type: string
 *                   example: operational
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-12-09T12:30:00.000Z
 *                 uptime:
 *                   type: number
 *                   example: 3600.5
 *                   description: Service uptime in seconds
 */

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check with all dependencies
 *     description: Check health of MongoDB, Email (SMTP), Kafka consumer, and Retry queue
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All dependencies healthy
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
 *                     service:
 *                       type: string
 *                       example: notification-service
 *                     status:
 *                       type: string
 *                       enum: [operational, degraded]
 *                       example: operational
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *                     dependencies:
 *                       type: object
 *                       properties:
 *                         mongodb:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [healthy, unhealthy]
 *                             state:
 *                               type: string
 *                               example: connected
 *                         email:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [healthy, unhealthy]
 *                             provider:
 *                               type: string
 *                               example: GMAIL_SMTP
 *                         kafka:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: healthy
 *                             totalTopics:
 *                               type: integer
 *                               example: 22
 *                         retryQueue:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               example: healthy
 *                             pending:
 *                               type: integer
 *                               example: 5
 *                             processing:
 *                               type: integer
 *                               example: 2
 *                             total:
 *                               type: integer
 *                               example: 7
 *       503:
 *         description: One or more dependencies unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: degraded
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /health/readiness:
 *   get:
 *     summary: Kubernetes readiness probe
 *     description: Check if service is ready to accept traffic (MongoDB must be connected)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 ready:
 *                   type: boolean
 *                   example: true
 *       503:
 *         description: Service not ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 ready:
 *                   type: boolean
 *                   example: false
 *                 reason:
 *                   type: string
 *                   example: MongoDB not connected
 */

/**
 * @swagger
 * /health/liveness:
 *   get:
 *     summary: Kubernetes liveness probe
 *     description: Check if service process is alive
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 alive:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /health/info:
 *   get:
 *     summary: Service information
 *     description: Get service version, environment, and resource usage
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 service:
 *                   type: string
 *                   example: notification-service
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 environment:
 *                   type: string
 *                   example: production
 *                 nodeVersion:
 *                   type: string
 *                   example: v18.17.0
 *                 platform:
 *                   type: string
 *                   example: linux
 *                 memory:
 *                   type: object
 *                   properties:
 *                     heapUsed:
 *                       type: string
 *                       example: 45MB
 *                     heapTotal:
 *                       type: string
 *                       example: 80MB
 *                     rss:
 *                       type: string
 *                       example: 120MB
 *                 uptime:
 *                   type: number
 *                   example: 86400.5
 */


/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'notification-service',
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with all dependencies
 * @access  Private (Admin)
 */
router.get('/detailed', async (req, res) => {
  try {
    const health = {
      service: 'notification-service',
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {},
    };

    // MongoDB health
    try {
      const mongoStatus = getConnectionStatus();
      health.dependencies.mongodb = {
        status: mongoStatus === 'connected' ? 'healthy' : 'unhealthy',
        state: mongoStatus,
      };
    } catch (error) {
      health.dependencies.mongodb = {
        status: 'unhealthy',
        error: error.message,
      };
    }

    // Email service health
    try {
      const emailStatus = await testEmailConnection();
      health.dependencies.email = {
        status: emailStatus ? 'healthy' : 'unhealthy',
        provider: process.env.EMAIL_PROVIDER || 'GMAIL_SMTP',
      };
    } catch (error) {
      health.dependencies.email = {
        status: 'unhealthy',
        error: error.message,
      };
    }

    // Kafka consumer health
    try {
      const consumerStats = getConsumerStats();
      health.dependencies.kafka = {
        status: 'healthy',
        totalTopics: consumerStats.totalTopics,
      };
    } catch (error) {
      health.dependencies.kafka = {
        status: 'unknown',
        error: error.message,
      };
    }

    // Retry queue health
    try {
      const queueStatus = await getRetryQueueStatus();
      health.dependencies.retryQueue = {
        status: 'healthy',
        pending: queueStatus.pending,
        processing: queueStatus.processing,
        total: queueStatus.total,
      };
    } catch (error) {
      health.dependencies.retryQueue = {
        status: 'unhealthy',
        error: error.message,
      };
    }

    // Overall status
    const allHealthy = Object.values(health.dependencies).every(
      (dep) => dep.status === 'healthy'
    );
    
    health.status = allHealthy ? 'operational' : 'degraded';

    const statusCode = allHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE;
    
    res.status(statusCode).json({
      success: allHealthy,
      data: health,
    });
  } catch (error) {
    logger.error('Error in detailed health check:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      service: 'notification-service',
      status: 'unhealthy',
      error: error.message,
    });
  }
});

/**
 * @route   GET /health/readiness
 * @desc    Kubernetes readiness probe
 * @access  Public
 */
router.get('/readiness', async (req, res) => {
  try {
    // Check if MongoDB is connected
    const mongoStatus = getConnectionStatus();
    
    if (mongoStatus !== 'connected') {
      return res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        ready: false,
        reason: 'MongoDB not connected',
      });
    }

    res.json({
      success: true,
      ready: true,
    });
  } catch (error) {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      success: false,
      ready: false,
      error: error.message,
    });
  }
});

/**
 * @route   GET /health/liveness
 * @desc    Kubernetes liveness probe
 * @access  Public
 */
router.get('/liveness', (req, res) => {
  res.json({
    success: true,
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

/**
 * @route   GET /health/info
 * @desc    Service information
 * @access  Public
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    service: 'notification-service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    memory: {
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
    },
    uptime: process.uptime(),
  });
});

module.exports = router;
