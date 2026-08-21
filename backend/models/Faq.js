const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    answer: {
        type: String,
        required: true,
        trim: true
    },
    order: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'faqs'
});

faqSchema.index({ category: 1, isPublished: 1, order: 1 });

module.exports = mongoose.model('Faq', faqSchema);
