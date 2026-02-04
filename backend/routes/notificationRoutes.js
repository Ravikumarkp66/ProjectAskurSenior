const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// All notification routes require authentication
router.use(authMiddleware);

// Get notifications for the current user
router.get('/', getNotifications);

// Mark specific notifications as read
router.post('/read', markAsRead);

// Mark all notifications as read
router.post('/read-all', markAllAsRead);

// Admin routes
router.post('/', adminMiddleware, createNotification);
router.delete('/:notificationId', adminMiddleware, deleteNotification);

module.exports = router;
