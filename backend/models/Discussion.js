const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const discussionSchema = new mongoose.Schema({
    subjectId: {
        type: String, // String identifier to match how frontend sends subject ids
        required: true,
        index: true
    },
    subjectName: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    category: {
        type: String,
        enum: ['Question', 'Doubt', 'Exam', 'Resource', 'Notes', 'General'],
        default: 'General'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    replies: [replySchema],
    repliesCount: {
        type: Number,
        default: 0
    },
    pinned: {
        type: Boolean,
        default: false
    },
    isAnswered: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Pre-save hook to update repliesCount
discussionSchema.pre('save', function (next) {
    if (this.isModified('replies')) {
        this.repliesCount = this.replies.length;
    }
    next();
});

const Discussion = mongoose.model('Discussion', discussionSchema);
module.exports = Discussion;
