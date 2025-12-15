/**
 * NotificationPreference Model
 * User-specific notification preferences (opt-in/opt-out)
 */

const mongoose = require('mongoose');
const { DEFAULT_PREFERENCES } = require('../utils/constants');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Master Switch
    emailEnabled: {
      type: Boolean,
      default: true,
    },

    // Response Notifications
    emailOnResponseSubmitted: {
      type: Boolean,
      default: true,
    },
    emailOnResponseReviewed: {
      type: Boolean,
      default: true,
    },
    emailOnResponseResolved: {
      type: Boolean,
      default: true,
    },
    emailOnResponseFlagged: {
      type: Boolean,
      default: true,
    },

    // QR Notifications (for distributors)
    emailOnQrAssigned: {
      type: Boolean,
      default: true,
    },
    emailOnQrDeployed: {
      type: Boolean,
      default: true,
    },
    emailOnQrRejected: {
      type: Boolean,
      default: true,
    },

    // Org Notifications (for org admins/owners)
    emailOnOrgApproved: {
      type: Boolean,
      default: true,
    },
    emailOnOrgSuspended: {
      type: Boolean,
      default: true,
    },
    emailOnNewFeedback: {
      type: Boolean,
      default: true,
    },

    // Distributor Notifications
    emailOnDistributorApproved: {
      type: Boolean,
      default: true,
    },
    emailOnDistributorRejected: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'notification_preferences',
  }
);

// Index on email for fast lookups
notificationPreferenceSchema.index({ email: 1 });

// Method to check if notification is allowed for event
notificationPreferenceSchema.methods.isNotificationAllowed = function (eventType) {
  // If email is globally disabled, return false
  if (!this.emailEnabled) {
    return false;
  }

  // Map event types to preference fields
  const eventPreferenceMap = {
    'response.submitted': 'emailOnResponseSubmitted',
    'response.reviewed': 'emailOnResponseReviewed',
    'response.resolved': 'emailOnResponseResolved',
    'response.flagged': 'emailOnResponseFlagged',
    'qr.assigned': 'emailOnQrAssigned',
    'qr.deployed': 'emailOnQrDeployed',
    'qr.deployment.rejected': 'emailOnQrRejected',
    'org.approved': 'emailOnOrgApproved',
    'org.suspended': 'emailOnOrgSuspended',
    'distributor.approved': 'emailOnDistributorApproved',
    'distributor.rejected': 'emailOnDistributorRejected',
  };

  const preferenceField = eventPreferenceMap[eventType];
  
  // If no specific preference, allow by default
  if (!preferenceField) {
    return true;
  }

  return this[preferenceField] === true;
};

// Static method to get or create preference
notificationPreferenceSchema.statics.getOrCreate = async function (userId, email) {
  let preference = await this.findOne({ userId });
  
  if (!preference) {
    preference = await this.create({
      userId,
      email,
      ...DEFAULT_PREFERENCES,
    });
  }
  
  return preference;
};

// Static method to update preference
notificationPreferenceSchema.statics.updatePreference = async function (userId, updates) {
  return this.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true, upsert: true }
  );
};

const NotificationPreference = mongoose.model('NotificationPreference', notificationPreferenceSchema);

module.exports = NotificationPreference;
 
