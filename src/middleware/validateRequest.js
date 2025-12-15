/**
 * Request Validation Middleware
 * Validates request body, query, and params using Joi
 */

const Joi = require('joi');
const logger = require('../utils/logger');
const { HTTP_STATUS } = require('../utils/constants');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation error:', { errors, url: req.originalUrl });

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    // Replace with validated value
    req[property] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // User ID parameter
  userId: Joi.object({
    userId: Joi.number().integer().positive().required(),
  }),

  // Notification ID parameter
  notificationId: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),

  // Email validation
  email: Joi.object({
    email: Joi.string().email().required(),
  }),

  // Pagination query
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),

  // Notification preferences update
  notificationPreferences: Joi.object({
    userId: Joi.number().integer().positive().required(),
    email: Joi.string().email().required(),
    emailEnabled: Joi.boolean(),
    emailOnResponseSubmitted: Joi.boolean(),
    emailOnResponseReviewed: Joi.boolean(),
    emailOnResponseResolved: Joi.boolean(),
    emailOnResponseFlagged: Joi.boolean(),
    emailOnQrAssigned: Joi.boolean(),
    emailOnQrDeployed: Joi.boolean(),
    emailOnQrRejected: Joi.boolean(),
    emailOnOrgApproved: Joi.boolean(),
    emailOnOrgSuspended: Joi.boolean(),
    emailOnNewFeedback: Joi.boolean(),
    emailOnDistributorApproved: Joi.boolean(),
    emailOnDistributorRejected: Joi.boolean(),
  }),

  // Manual notification send
  manualNotification: Joi.object({
    recipientEmail: Joi.string().email().required(),
    recipientName: Joi.string().max(100),
    subject: Joi.string().max(500).required(),
    message: Joi.string(),
    templateName: Joi.string().max(50),
    templateData: Joi.object(),
    priority: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').default('MEDIUM'),
  }),

  // Bulk notification send
  bulkNotification: Joi.object({
    recipients: Joi.array()
      .items(
        Joi.object({
          email: Joi.string().email().required(),
          name: Joi.string().max(100),
          templateData: Joi.object(),
        })
      )
      .min(1)
      .max(100)
      .required(),
    templateName: Joi.string().max(50).required(),
    subject: Joi.string().max(500).required(),
  }),
};

module.exports = {
  validate,
  schemas,
};
