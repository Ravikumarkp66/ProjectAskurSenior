const mongoose = require('mongoose');

const bugReportSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false
        },
        contactEmail: {
            type: String,
            trim: true,
            maxlength: 200,
            lowercase: true
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
        problemType: {
            type: String,
            enum: ['UI / Design', 'Feature not working', 'Performance', 'Login / Account', 'Academic data', 'Other'],
            default: 'Other'
        },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved', 'closed'],
            default: 'open'
        },
        adminNotes: {
            type: String,
            trim: true,
            maxlength: 2000
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        resolvedAt: {
            type: Date
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('BugReport', bugReportSchema);
