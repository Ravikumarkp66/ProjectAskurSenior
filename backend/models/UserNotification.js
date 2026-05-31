const mongoose = require('mongoose');

const userNotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['admin_reply', 'material_approved', 'mentorship_assigned', 'issue_resolved', 'general'],
        default: 'general'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    actionLink: {
        type: String, // Optional URL or route to redirect when clicked
        default: null
    }
}, { timestamps: true });

// Auto-delete notifications older than 30 days
userNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('UserNotification', userNotificationSchema);
