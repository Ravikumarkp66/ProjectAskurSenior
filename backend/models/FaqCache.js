const mongoose = require('mongoose');

const faqCacheSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    answer: {
        type: String,
        required: true
    },
    sources: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('FaqCache', faqCacheSchema);
