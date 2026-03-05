const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coverImage: {
        type: String,
        default: ''
    },
    views: {
        type: Number,
        default: 0
    },
    likesCount: {
        type: Number,
        default: 0
    },
    dislikesCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Index for search
articleSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Article', articleSchema);
