const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        trim: true
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    config: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { _id: false });

const subscriptionPageConfigSchema = new mongoose.Schema({
    version: {
        type: String,
        default: 'v3',
        trim: true
    },
    pageTitle: {
        type: String,
        default: 'AskUrSenior Plus — Invest in Your College Journey',
        trim: true
    },
    metaDescription: {
        type: String,
        default: 'Smarter, more organized, and personalized academic experience for SIT engineering students.',
        trim: true
    },
    sections: [sectionSchema],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'subscription_page_configs'
});

module.exports = mongoose.model('SubscriptionPageConfig', subscriptionPageConfigSchema);
