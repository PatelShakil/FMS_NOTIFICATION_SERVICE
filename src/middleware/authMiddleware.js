/**
 * Auth Middleware
 * JWT token verification for protected routes
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../utils/constants');

// Load JWT public key (if using RSA)
let publicKey = null;
try {
  const publicKeyPath = process.env.JWT_PUBLIC_KEY_PATH || './keys/public.key';
  if (fs.existsSync(publicKeyPath)) {
    publicKey = fs.readFileSync(path.resolve(publicKeyPath), 'utf8');
    logger.info('✅ JWT public key loaded');
  } else {
    logger.warn('⚠️ JWT public key not found, using secret from env');
  }
} catch (error) {
  logger.warn('⚠️ Could not load JWT public key:', error.message);
}

/**
 * Verify JWT token middleware
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    const algorithm = process.env.JWT_ALGORITHM || 'HS256';
    const secret = publicKey || process.env.JWT_SECRET || 'your-secret-key';

    const decoded = jwt.verify(token, secret, {
      algorithms: [algorithm],
    });

    // Attach user info to request
    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    logger.error('JWT verification failed:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Token expired',
      });
    }

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_JWT_TOKEN,
    });
  }
};

/**
 * Check if user is admin
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'PLATFORM_ADMIN') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

/**
 * Optional auth - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const algorithm = process.env.JWT_ALGORITHM || 'HS256';
      const secret = publicKey || process.env.JWT_SECRET || 'your-secret-key';

      const decoded = jwt.verify(token, secret, {
        algorithms: [algorithm],
      });

      req.user = {
        userId: decoded.userId || decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }
  } catch (error) {
    logger.debug('Optional auth failed:', error.message);
  }

  next();
};

/**
 * API Key verification (for webhooks)
 */
const verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.WEBHOOK_API_KEY || 'your-webhook-api-key';

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid or missing API key',
    });
  }

  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  optionalAuth,
  verifyApiKey,
};
