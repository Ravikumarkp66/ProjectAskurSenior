const mongoose = require('mongoose');

const discountCouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    title: {
        type: String,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: true
    },
    minPlanPrice: {
        type: Number,
        default: 0
    },
    maxDiscountAmount: {
        type: Number,
        default: null
    },
    applicablePlans: [{
        type: String,
        uppercase: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    validUntil: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'discount_coupons'
});

module.exports = mongoose.model('DiscountCoupon', discountCouponSchema);
