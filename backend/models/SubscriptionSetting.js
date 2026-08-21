const mongoose = require('mongoose');

const subscriptionSettingSchema = new mongoose.Schema({
    currency: {
        type: String,
        default: 'INR',
        trim: true
    },
    currencySymbol: {
        type: String,
        default: '₹',
        trim: true
    },
    taxIncluded: {
        type: Boolean,
        default: true
    },
    refundDays: {
        type: Number,
        default: 3
    },
    allowCoupons: {
        type: Boolean,
        default: true
    },
    allowStackCoupons: {
        type: Boolean,
        default: false
    },
    termsVersion: {
        type: String,
        default: '1.0',
        trim: true
    },
    currentPlatformVersion: {
        type: String,
        default: 'V3',
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    collection: 'subscription_settings'
});

module.exports = mongoose.model('SubscriptionSetting', subscriptionSettingSchema);
