const mongoose = require('mongoose');

const mentorshipRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        required: true,
        enum: [
            'Placements',
            'Academics',
            'Projects',
            'Internships',
            'Resume Review',
            'Career Guidance',
            'Higher Studies',
            'Other'
        ]
    },
    description: {
        type: String,
        required: true
    },
    urgency: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    acceptedByAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MentorshipRequest', mentorshipRequestSchema);
