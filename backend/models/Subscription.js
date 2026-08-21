const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    planCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'],
        default: 'ACTIVE',
        index: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    amountPaid: {
        type: Number,
        required: true
    },
    couponUsed: {
        type: String,
        default: null,
        uppercase: true
    },
    paymentTransactionId: {
        type: String,
        default: null
    },
    autoRenew: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'subscriptions'
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
