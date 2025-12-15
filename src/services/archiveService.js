/**
 * Archive Service
 * Archives old notifications (90+ days)
 */

const Notification = require('../models/Notification');
const NotificationArchive = require('../models/NotificationArchive');
const logger = require('../utils/logger');
const { ARCHIVE_CONFIG } = require('../utils/constants');

/**
 * Archive old notifications
 * @returns {Promise<Object>} - Summary of archived records
 */
const archiveOldNotifications = async () => {
  try {
    logger.info('📦 Starting notification archival process...');

    // Find notifications ready for archive
    const notificationsToArchive = await Notification.findReadyForArchive();

    if (notificationsToArchive.length === 0) {
      logger.info('No notifications to archive');
      return { archived: 0, deleted: 0 };
    }

    logger.info(`Found ${notificationsToArchive.length} notifications to archive`);

    // Archive notifications
    await NotificationArchive.archiveNotifications(notificationsToArchive);

    // Mark original notifications as archived
    const notificationIds = notificationsToArchive.map((n) => n._id);
    await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { $set: { isArchived: true } }
    );

    // Optional: Delete archived notifications from main collection
    // Uncomment if you want to free up space
    /*
    const deleteResult = await Notification.deleteMany({
      _id: { $in: notificationIds },
    });
    */

    logger.info(`✅ Archived ${notificationsToArchive.length} notifications`);

    return {
      archived: notificationsToArchive.length,
      deleted: 0, // Change to deleteResult.deletedCount if deleting
    };
  } catch (error) {
    logger.error('Error archiving notifications:', error);
    throw error;
  }
};

/**
 * Search archived notifications
 * @param {Object} query - Search query
 * @param {Number} limit - Result limit
 * @returns {Promise<Array>}
 */
const searchArchive = async (query = {}, limit = 100) => {
  return NotificationArchive.searchArchive(query, limit);
};

/**
 * Get archive statistics
 * @returns {Promise<Object>}
 */
const getArchiveStats = async () => {
  const [totalArchived, byStatus] = await Promise.all([
    NotificationArchive.countDocuments(),
    NotificationArchive.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    totalArchived,
    byStatus: byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
};

module.exports = {
  archiveOldNotifications,
  searchArchive,
  getArchiveStats,
};
