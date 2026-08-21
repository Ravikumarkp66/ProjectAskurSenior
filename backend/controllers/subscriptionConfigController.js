const subscriptionConfigService = require('../services/subscriptionConfigService');
const DiscountCoupon = require('../models/DiscountCoupon');
const SubscriptionPlan = require('../models/SubscriptionPlan');

const getPublicConfig = async (req, res) => {
    try {
        const payload = await subscriptionConfigService.getOrchestratedConfig();
        return res.status(200).json({
            success: true,
            message: 'Subscription configuration fetched successfully.',
            data: payload
        });
    } catch (error) {
        console.error('Error fetching subscription config:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscription configuration.',
            error: error.message
        });
    }
};

const validateCoupon = async (req, res) => {
    try {
        const { code, planCode } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: 'Coupon code is required.' });
        }

        const coupon = await DiscountCoupon.findOne({
            code: code.trim().toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired coupon code.'
            });
        }

        // Check plan eligibility if planCode provided
        if (planCode && coupon.applicablePlans && coupon.applicablePlans.length > 0) {
            const isEligible = coupon.applicablePlans.includes(planCode.toUpperCase());
            if (!isEligible) {
                return res.status(400).json({
                    success: false,
                    message: `Coupon code is not applicable for ${planCode}.`
                });
            }
        }

        // Calculate discount amount against plan price if planCode provided
        let discountAmount = 0;
        let finalPrice = null;

        if (planCode) {
            const plan = await SubscriptionPlan.findOne({ code: planCode.toUpperCase(), isActive: true });
            if (plan) {
                if (coupon.discountType === 'percentage') {
                    discountAmount = Math.round((plan.price * coupon.discountValue) / 100);
                } else if (coupon.discountType === 'flat') {
                    discountAmount = coupon.discountValue;
                }
                if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                    discountAmount = coupon.maxDiscountAmount;
                }
                finalPrice = Math.max(0, plan.price - discountAmount);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Coupon code applied successfully!',
            data: {
                code: coupon.code,
                title: coupon.title,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount,
                finalPrice
            }
        });
    } catch (error) {
        console.error('Error validating coupon:', error);
        return res.status(500).json({
            success: false,
            message: 'Error validating coupon code.',
            error: error.message
        });
    }
};

module.exports = {
    getPublicConfig,
    validateCoupon
};
