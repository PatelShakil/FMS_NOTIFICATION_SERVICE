/**
 * RateLimit Model
 * Tracks notification rate limits (event-based and recipient-based)
 */

const mongoose = require('mongoose');
const { RATE_LIMIT_TYPE } = require('../utils/constants');

const rateLimitSchema = new mongoose.Schema(
  {
    // Rate Limit Key
    limitType: {
      type: String,
      required: true,
      enum: Object.values(RATE_LIMIT_TYPE),
      index: true,
    },
    
    // For event-based limiting
    eventType: {
      type: String,
      default: null,
      index: true,
    },
    
    // For recipient-based limiting
    recipientEmail: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Counter
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // Time Window
    windowStart: {
      type: Date,
      required: true,
      index: true,
    },
    windowEnd: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'rate_limits',
  }
);

// Compound indexes for efficient queries
rateLimitSchema.index({ limitType: 1, eventType: 1, windowEnd: 1 });
rateLimitSchema.index({ limitType: 1, recipientEmail: 1, windowEnd: 1 });

// Virtual to check if window is expired
rateLimitSchema.virtual('isExpired').get(function () {
  return this.windowEnd < new Date();
});

// Method to increment count
rateLimitSchema.methods.increment = function () {
  this.count += 1;
  return this.save();
};

// Method to check if limit is exceeded
rateLimitSchema.methods.isLimitExceeded = function (maxLimit) {
  return this.count >= maxLimit;
};

// Static method to check and increment rate limit
rateLimitSchema.statics.checkAndIncrement = async function (limitType, key, maxLimit, windowMinutes) {
  const now = new Date();
  const windowStart = now;
  const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);

  const query = {
    limitType,
    windowEnd: { $gt: now },
  };

  if (limitType === RATE_LIMIT_TYPE.EVENT) {
    query.eventType = key;
  } else {
    query.recipientEmail = key;
  }

  // Find existing rate limit record
  let rateLimit = await this.findOne(query);

  if (!rateLimit) {
    // Create new record
    rateLimit = await this.create({
      limitType,
      eventType: limitType === RATE_LIMIT_TYPE.EVENT ? key : null,
      recipientEmail: limitType === RATE_LIMIT_TYPE.RECIPIENT ? key : null,
      count: 1,
      windowStart,
      windowEnd,
    });
    return { allowed: true, remaining: maxLimit - 1 };
  }

  // Check if limit exceeded
  if (rateLimit.count >= maxLimit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: rateLimit.windowEnd,
    };
  }

  // Increment counter
  await rateLimit.increment();

  return {
    allowed: true,
    remaining: maxLimit - rateLimit.count,
    resetAt: rateLimit.windowEnd,
  };
};

// Static method to cleanup expired rate limits
rateLimitSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    windowEnd: { $lt: new Date() },
  });
};

// Static method to get current rate limit status
rateLimitSchema.statics.getStatus = async function (limitType, key) {
  const query = {
    limitType,
    windowEnd: { $gt: new Date() },
  };

  if (limitType === RATE_LIMIT_TYPE.EVENT) {
    query.eventType = key;
  } else {
    query.recipientEmail = key;
  }

  const rateLimit = await this.findOne(query);
  
  if (!rateLimit) {
    return { count: 0, resetAt: null };
  }

  return {
    count: rateLimit.count,
    resetAt: rateLimit.windowEnd,
  };
};

const RateLimit = mongoose.model('RateLimit', rateLimitSchema);

module.exports = RateLimit;

