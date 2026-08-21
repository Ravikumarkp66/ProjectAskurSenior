const subscriptionModuleService = require('../services/subscriptionModuleService');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const SubscriptionFeature = require('../models/SubscriptionFeature');
const DiscountCoupon = require('../models/DiscountCoupon');

const getPublicPage = async (req, res) => {
    try {
        const payload = await subscriptionModuleService.getPublicPageData();
        return res.status(200).json({
            success: true,
            message: 'Public subscription page configuration fetched successfully.',
            data: payload
        });
    } catch (error) {
        console.error('Error fetching public subscription page:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve public subscription page configuration.',
            error: error.message
        });
    }
};

const getPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({ status: { $ne: 'INACTIVE' } }).sort({ sortOrder: 1 });
        return res.status(200).json({
            success: true,
            data: plans
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

const getFeatures = async (req, res) => {
    try {
        const features = await SubscriptionFeature.find().sort({ order: 1 });
        return res.status(200).json({
            success: true,
            data: features
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
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

        // Validate plan eligibility using applicablePlans / validPlans
        if (planCode && coupon.applicablePlans && coupon.applicablePlans.length > 0) {
            const isEligible = coupon.applicablePlans.includes(planCode.toUpperCase());
            if (!isEligible) {
                return res.status(400).json({
                    success: false,
                    message: `Coupon ${coupon.code} is not valid for ${planCode}.`
                });
            }
        }

        // Calculate discount amount against plan price if planCode provided
        let discountAmount = 0;
        let finalPrice = null;

        if (planCode) {
            const plan = await SubscriptionPlan.findOne({ code: planCode.toUpperCase(), status: { $ne: 'INACTIVE' } });
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

// Admin CRUD Methods
const createPlanAdmin = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.create(req.body);
        return res.status(201).json({ success: true, message: 'Plan created successfully.', data: plan });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

const updatePlanAdmin = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.status(200).json({ success: true, message: 'Plan updated successfully.', data: plan });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

const createCouponAdmin = async (req, res) => {
    try {
        const coupon = await DiscountCoupon.create(req.body);
        return res.status(201).json({ success: true, message: 'Coupon created successfully.', data: coupon });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

const updateCouponAdmin = async (req, res) => {
    try {
        const coupon = await DiscountCoupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        return res.status(200).json({ success: true, message: 'Coupon updated successfully.', data: coupon });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

module.exports = {
    getPublicPage,
    getPlans,
    getFeatures,
    validateCoupon,
    createPlanAdmin,
    updatePlanAdmin,
    createCouponAdmin,
    updateCouponAdmin
};
