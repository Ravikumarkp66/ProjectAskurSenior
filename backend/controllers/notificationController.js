const Notification = require('../models/Notification');
const cacheInvalidator = require('../utils/cacheInvalidator');

/**
 * Get notifications for a user (optionally filtered by branch/cycle)
 */
const getNotifications = async (req, res) => {
    try {
        const { branch, cycle, limit = 20 } = req.query;
        const userId = req.userId;

        // Build query - get general notifications and branch-specific ones
        const query = {
            $or: [
                { branch: { $exists: false } },  // General notifications
                { branch: null },
                { branch: branch }  // Branch-specific notifications
            ]
        };

        // Filter by cycle if provided
        if (cycle) {
            query.$or = [
                { cycle: { $exists: false } },
                { cycle: null },
                { cycle: cycle },
                { branch: { $exists: false } }
            ];
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        // Add isRead flag for each notification
        const notificationsWithReadStatus = notifications.map(n => ({
            ...n,
            isRead: n.readBy?.some(id => id.toString() === userId) || false
        }));

        // Count unread
        const unreadCount = notificationsWithReadStatus.filter(n => !n.isRead).length;

        res.json({
            notifications: notificationsWithReadStatus,
            unreadCount
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
};

/**
 * Mark notification(s) as read
 */
const markAsRead = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        const userId = req.userId;

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return res.status(400).json({ error: 'notificationIds array is required' });
        }

        // Add userId to readBy array for all specified notifications
        await Notification.updateMany(
            { _id: { $in: notificationIds } },
            { $addToSet: { readBy: userId } }
        );

        res.json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        const { branch, cycle } = req.query;

        const query = {};
        if (branch) {
            query.$or = [
                { branch: { $exists: false } },
                { branch: null },
                { branch: branch }
            ];
        }

        await Notification.updateMany(
            query,
            { $addToSet: { readBy: userId } }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

/**
 * Create a notification (admin only - also used internally)
 */
const createNotification = async (req, res) => {
    try {
        const { title, message, type, subjectId, subjectName, subjectCode, moduleNumber, moduleName, contentType, branch, cycle } = req.body;

        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required' });
        }

        const notification = new Notification({
            title,
            message,
            type: type || 'announcement',
            subjectId,
            subjectName,
            subjectCode,
            moduleNumber,
            moduleName,
            contentType,
            branch,
            cycle,
            createdBy: req.userId
        });

        await notification.save();

        // Invalidate Cache
        cacheInvalidator.emit('NOTIFICATION_CREATED', { userId: notification.userId });

        res.json({ success: true, notification });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
};

/**
 * Helper function to create notification when content is uploaded
 * (called internally from upload routes)
 */
const createContentNotification = async ({
    contentType,
    contentTitle,
    subjectId,
    subjectName,
    subjectCode,
    moduleNumber,
    moduleName,
    branch,
    cycle,
    createdBy
}) => {
    try {
        const typeLabels = {
            notes: '📚 New Notes',
            pyqs: '📝 New PYQs',
            questionBanks: '📖 New Question Bank',
            syllabus: '📋 New Syllabus'
        };

        const typeEmoji = {
            notes: '📚',
            pyqs: '📝',
            questionBanks: '📖',
            syllabus: '📋'
        };

        let title = typeLabels[contentType] || '📄 New Content';
        let message = '';

        if (moduleNumber && moduleName) {
            message = `"${contentTitle}" has been added to ${moduleName} of ${subjectName} (${subjectCode})`;
        } else {
            message = `"${contentTitle}" has been added to ${subjectName} (${subjectCode})`;
        }

        // Map backend content types to valid notification types
        const getNotificationType = (contentType) => {
            switch (contentType) {
                case 'resources':
                    return 'pyqs'; // Resources containing PYQs should show as PYQ notifications
                case 'notes':
                    return 'notes';
                case 'questionBanks':
                    return 'questionBanks';
                case 'syllabus':
                    return 'syllabus';
                default:
                    return 'update'; // Fallback to generic update
            }
        };

        const notification = new Notification({
            title,
            message,
            type: getNotificationType(contentType), // Use mapped type instead of raw contentType
            subjectId,
            subjectName,
            subjectCode,
            moduleNumber,
            moduleName,
            contentType,
            branch,
            cycle,
            createdBy
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating content notification:', error);
        // Don't throw - notification creation shouldn't break uploads
        return null;
    }
};

/**
 * Delete a notification (admin only)
 */
const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByIdAndDelete(notificationId);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        // Invalidate Cache
        cacheInvalidator.emit('FEEDBACK_UPDATED'); // Clears dashboard summary

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    createContentNotification,
    deleteNotification
};
