const mongoose = require('mongoose');

const articleReactionSchema = new mongoose.Schema({
    articleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['like', 'dislike'],
        required: true
    }
}, { timestamps: true });

// Ensure a user can only have one reaction per article
articleReactionSchema.index({ articleId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ArticleReaction', articleReactionSchema);
