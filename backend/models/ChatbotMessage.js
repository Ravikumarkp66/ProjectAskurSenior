const mongoose = require('mongoose');

const chatbotMessageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true
    },
    toxicityScore: {
        type: Number,
        default: 0
    },
    demeritsAwarded: {
        type: Number,
        default: 0
    },
    flags: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('ChatbotMessage', chatbotMessageSchema);
