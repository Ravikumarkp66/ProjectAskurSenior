const express = require('express');
const router = express.Router();
const UserNotification = require('../models/UserNotification');
const auth = require('../middleware/auth');

// Get all notifications for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const notifications = await UserNotification.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(limit);
        
        const unreadCount = await UserNotification.countDocuments({ userId: req.user.id, isRead: false });

        res.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ error: 'Server error fetching notifications' });
    }
});

// Mark a single notification as read
router.patch('/:id/read', auth, async (req, res) => {
    try {
        const notification = await UserNotification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Mark all notifications as read for the user
router.post('/mark-all-read', auth, async (req, res) => {
    try {
        await UserNotification.updateMany(
            { userId: req.user.id, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
