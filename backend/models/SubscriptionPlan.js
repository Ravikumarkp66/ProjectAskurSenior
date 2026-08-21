const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    tagline: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number,
        default: null
    },
    currency: {
        type: String,
        default: 'INR',
        trim: true
    },
    duration: {
        type: Number,
        default: 1
    },
    durationUnit: {
        type: String,
        enum: ['day', 'month', 'semester', 'year'],
        default: 'semester'
    },
    badge: {
        type: String,
        default: null
    },
    isRecommended: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
        default: 'ACTIVE',
        index: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    launchDate: {
        type: Date,
        default: Date.now
    },
    features: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true,
    collection: 'subscription_plans'
});

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
