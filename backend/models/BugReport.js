const mongoose = require('mongoose');

const bugReportSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 4000
        },
        pageUrl: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },
        status: {
            type: String,
            enum: ['open', 'resolved'],
            default: 'open'
        },
        resolvedAt: {
            type: Date
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('BugReport', bugReportSchema);
