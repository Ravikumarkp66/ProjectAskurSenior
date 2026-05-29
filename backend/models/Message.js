const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    senderType: {
        type: String,
        enum: ['user', 'admin', 'bot'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isDeletedForUser: {
        type: Boolean,
        default: false
    },
    seen: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
