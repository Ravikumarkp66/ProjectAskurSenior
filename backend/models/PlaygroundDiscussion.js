const mongoose = require('mongoose');

const playgroundDiscussionSchema = new mongoose.Schema({
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlaygroundProblem',
        required: true,
        index: true
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true
    },
    authorName: {
        type: String,
        required: true,
        trim: true
    },
    authorRole: {
        type: String,
        default: 'Student'
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount'
    }],
    upvoteCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

playgroundDiscussionSchema.index({ problemId: 1, createdAt: -1 });

module.exports = mongoose.model('PlaygroundDiscussion', playgroundDiscussionSchema);
