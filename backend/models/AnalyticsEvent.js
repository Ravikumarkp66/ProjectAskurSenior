const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        path: {
            type: String,
            required: true
        },
        userAgent: {
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true
        }
    }
);

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);
