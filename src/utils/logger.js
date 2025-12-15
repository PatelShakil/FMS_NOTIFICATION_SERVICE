 /**
 * Winston Logger Configuration
 * Centralized logging for notification-service
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if exists
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Console format (colorized)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Create transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || 'info',
  }),

  // File transport - All logs
  new winston.transports.File({
    filename: path.join(process.env.LOG_FILE_PATH || './logs', 'notification-service.log'),
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    level: 'info',
  }),

  // File transport - Error logs only
  new winston.transports.File({
    filename: path.join(process.env.LOG_FILE_PATH || './logs', 'error.log'),
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    level: 'error',
  }),
];

// Create logger instance
const logger = winston.createLogger({
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Add stream for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Log unhandled exceptions and rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Log startup
logger.info('='.repeat(60));
logger.info('🚀 notification-service Logger Initialized');
logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
logger.info(`Log Level: ${process.env.LOG_LEVEL || 'info'}`);
logger.info('='.repeat(60));

module.exports = logger;

