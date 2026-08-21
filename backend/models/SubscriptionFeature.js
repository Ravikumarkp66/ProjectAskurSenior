const mongoose = require('mongoose');

const subscriptionFeatureSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        default: 'Academics',
        trim: true
    },
    tier: {
        type: String,
        enum: ['free', 'plus', 'both'],
        default: 'plus',
        index: true
    },
    shortDescription: {
        type: String,
        trim: true
    },
    problem: {
        type: String,
        trim: true
    },
    solution: {
        type: String,
        trim: true
    },
    benefit: {
        type: String,
        trim: true
    },
    icon: {
        type: String,
        default: 'Sparkles',
        trim: true
    },
    screenshots: [{
        type: String,
        trim: true
    }],
    previewImages: [{
        type: String,
        trim: true
    }],
    videoUrl: {
        type: String,
        default: null
    },
    estimatedTimeSaved: {
        type: String,
        default: null
    },
    highlight: {
        type: String,
        default: null
    },
    isFeatured: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'subscription_features'
});

module.exports = mongoose.model('SubscriptionFeature', subscriptionFeatureSchema);
