const mongoose = require('mongoose');

const issueReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    issueType: {
        type: String,
        required: true,
        enum: ['Missing Company', 'Wrong Answer', 'Wrong Material', 'Broken PDF', 'Missing Notes', 'Other']
    },
    description: {
        type: String,
        required: true
    },
    originalQuestion: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Open', 'Resolved', 'Dismissed'],
        default: 'Open'
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('IssueReport', issueReportSchema);
