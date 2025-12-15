/**
 * Express App Configuration
 * Main Express application setup
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const { httpMetricsMiddleware } = require('./utils/metrics');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');


// Import routes
const notificationRoutes = require('./routes/notificationRoutes');
const preferenceRoutes = require('./routes/preferenceRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const healthRoutes = require('./routes/healthRoutes');

// Create Express app
const app = express();

// ===========================================
// MIDDLEWARE
// ===========================================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
app.use(
  morgan('combined', {
    stream: logger.stream,
    skip: (req) => req.url === '/health' || req.url === '/metrics',
  })
);

// Prometheus metrics tracking
app.use(httpMetricsMiddleware);

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// ===========================================
// ROUTES
// ===========================================

// Health check routes (no rate limit)
app.use('/health', healthRoutes);

// Metrics endpoint (no rate limit)
app.use('/metrics', metricsRoutes);

// API routes (with rate limiting)
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/preferences', apiLimiter, preferenceRoutes);
app.use('/api/webhook', apiLimiter, webhookRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'notification-service',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      documentation: '/api-docs',           // ← Added
      openapi: '/api-docs.json',            // ← Added
      notifications: '/api/notifications',
      preferences: '/api/preferences',
      webhook: '/api/webhook',
    },
  });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'BoloIndia Notification API Docs',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ===========================================
// EXPORTS
// ===========================================

module.exports = app;
