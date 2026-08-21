const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    planCode: {
        type: String,
        required: true,
        uppercase: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'PENDING', 'REFUNDED'],
        default: 'PENDING',
        index: true
    },
    paymentGateway: {
        type: String,
        default: 'Razorpay'
    },
    gatewayOrderId: {
        type: String,
        default: null
    },
    gatewayPaymentId: {
        type: String,
        default: null
    },
    couponUsed: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: 'payment_transactions'
});

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
