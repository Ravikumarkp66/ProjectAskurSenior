const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    lastMessage: {
        type: String,
        default: ''
    },
    unreadAdminCount: {
        type: Number,
        default: 0
    },
    unreadUserCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
