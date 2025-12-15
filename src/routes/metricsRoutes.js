/**
 * Metrics Routes
 * Prometheus metrics endpoint
 */

const express = require('express');
const router = express.Router();
const { metricsHandler } = require('../config/prometheus');


/**
 * @swagger
 * tags:
 *   name: Metrics
 *   description: Prometheus metrics endpoint
 */

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Prometheus metrics endpoint
 *     description: Exposes Prometheus-compatible metrics for monitoring (emails sent, failed, queue size, etc.)
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Metrics in Prometheus format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP notification_service_emails_sent_total Total number of notifications sent
 *                 # TYPE notification_service_emails_sent_total counter
 *                 notification_service_emails_sent_total{event_type="org.approved",status="SENT",recipient_type="ORG_OWNER"} 150
 *       500:
 *         description: Error generating metrics
 */


/**
 * @route   GET /metrics
 * @desc    Prometheus metrics endpoint
 * @access  Public
 */
router.get('/', metricsHandler);

module.exports = router;
