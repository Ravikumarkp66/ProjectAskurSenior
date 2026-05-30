const mongoose = require('mongoose');

const materialRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    materialType: {
        type: String,
        required: true,
        enum: ['Notes', 'PYQ', 'Lab Manual', 'Question Bank', 'Mini Project', 'Other']
    },
    additionalNotes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Available'],
        default: 'Pending'
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MaterialRequest', materialRequestSchema);
