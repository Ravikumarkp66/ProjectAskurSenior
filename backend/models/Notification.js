const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['notes', 'pyqs', 'questionBanks', 'syllabus', 'feature', 'update', 'announcement'],
        default: 'update'
    },
    // Content location details
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    },
    subjectName: String,
    subjectCode: String,
    moduleNumber: Number,
    moduleName: String,
    contentType: String,
    branch: String,
    cycle: String,
    // Read tracking - stores user IDs who have read this notification
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Creator info
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Optional expiry
    expiresAt: Date
});

// Index for efficient queries
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ branch: 1, cycle: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
