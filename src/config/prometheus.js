 
/**
 * Prometheus Metrics Configuration
 * Exposes metrics for monitoring
 */

const client = require('prom-client');
const logger = require('../utils/logger');

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'notification_service_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// Custom Metrics

// 1. Total notifications sent (counter)
const notificationsSentTotal = new client.Counter({
  name: 'notification_service_emails_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['event_type', 'status', 'recipient_type'],
  registers: [register],
});

// 2. Notification send duration (histogram)
const notificationDuration = new client.Histogram({
  name: 'notification_service_send_duration_seconds',
  help: 'Time taken to send a notification',
  labelNames: ['event_type', 'provider'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// 3. Failed notifications (counter)
const notificationsFailed = new client.Counter({
  name: 'notification_service_emails_failed_total',
  help: 'Total number of failed notifications',
  labelNames: ['event_type', 'reason'],
  registers: [register],
});

// 4. Retry queue size (gauge)
const retryQueueSize = new client.Gauge({
  name: 'notification_service_retry_queue_size',
  help: 'Current size of retry queue',
  registers: [register],
});

// 5. Kafka consumer lag (gauge)
const kafkaConsumerLag = new client.Gauge({
  name: 'notification_service_kafka_lag',
  help: 'Kafka consumer lag',
  labelNames: ['topic', 'partition'],
  registers: [register],
});

// 6. Active database connections (gauge)
const dbConnections = new client.Gauge({
  name: 'notification_service_db_connections_active',
  help: 'Number of active MongoDB connections',
  registers: [register],
});

// 7. Notifications by event type (counter)
const notificationsByEvent = new client.Counter({
  name: 'notification_service_by_event_type_total',
  help: 'Total notifications by event type',
  labelNames: ['event_type'],
  registers: [register],
});

// 8. Rate limit hits (counter)
const rateLimitHits = new client.Counter({
  name: 'notification_service_rate_limit_hits_total',
  help: 'Number of times rate limit was hit',
  labelNames: ['limit_type'],
  registers: [register],
});

// Middleware to track HTTP requests
const httpRequestDuration = new client.Histogram({
  name: 'notification_service_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Export metrics endpoint handler
const metricsHandler = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).end();
  }
};

// Helper functions to increment metrics
const metrics = {
  // Increment sent notifications
  incrementSent: (eventType, status, recipientType) => {
    notificationsSentTotal.inc({ event_type: eventType, status, recipient_type: recipientType });
    notificationsByEvent.inc({ event_type: eventType });
  },

  // Record send duration
  recordDuration: (eventType, provider, duration) => {
    notificationDuration.observe({ event_type: eventType, provider }, duration);
  },

  // Increment failed notifications
  incrementFailed: (eventType, reason) => {
    notificationsFailed.inc({ event_type: eventType, reason });
  },

  // Update retry queue size
  setRetryQueueSize: (size) => {
    retryQueueSize.set(size);
  },

  // Update Kafka lag
  setKafkaLag: (topic, partition, lag) => {
    kafkaConsumerLag.set({ topic, partition }, lag);
  },

  // Update DB connections
  setDbConnections: (count) => {
    dbConnections.set(count);
  },

  // Record rate limit hit
  recordRateLimitHit: (limitType) => {
    rateLimitHits.inc({ limit_type: limitType });
  },

  // Record HTTP request
  recordHttpRequest: (method, route, statusCode, duration) => {
    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  },
};

// Health check function
const getMetricsHealth = () => {
  return {
    prometheus: 'operational',
    metrics_count: register.metrics().split('\n').filter(line => !line.startsWith('#')).length,
  };
};

logger.info('✅ Prometheus metrics initialized');

module.exports = {
  register,
  metricsHandler,
  metrics,
  getMetricsHealth,
};
