const subscriptionModuleService = require('../services/subscriptionModuleService');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const SubscriptionFeature = require('../models/SubscriptionFeature');
const DiscountCoupon = require('../models/DiscountCoupon');
const Subscription = require('../models/Subscription');
const PaymentTransaction = require('../models/PaymentTransaction');

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

/**
 * Direct Enterprise Checkout & Instant Activation Endpoint
 * Stores payment transaction, creates active subscription, and activates Plus.
 */
const checkout = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'You must be logged in to activate AskUrSenior Plus.'
            });
        }

        const { planCode = 'SEM_1', couponCode, paymentMethod = 'Online Checkout' } = req.body;

        // 1. Fetch Plan from DB
        const plan = await SubscriptionPlan.findOne({
            code: (planCode || 'SEM_1').toUpperCase(),
            status: { $ne: 'INACTIVE' }
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Requested subscription plan is not active or available.'
            });
        }

        let basePrice = plan.price;
        let discountAmount = 0;
        let appliedCouponDoc = null;

        // 2. Validate Coupon if provided
        if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
            const coupon = await DiscountCoupon.findOne({
                code: couponCode.trim().toUpperCase(),
                isActive: true
            });

            if (coupon) {
                const isPlanEligible = !coupon.applicablePlans || coupon.applicablePlans.length === 0 || coupon.applicablePlans.includes(plan.code);
                if (isPlanEligible) {
                    if (coupon.discountType === 'percentage') {
                        discountAmount = Math.round((basePrice * coupon.discountValue) / 100);
                    } else if (coupon.discountType === 'flat') {
                        discountAmount = coupon.discountValue;
                    }
                    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
                        discountAmount = coupon.maxDiscountAmount;
                    }
                    appliedCouponDoc = coupon;
                }
            }
        }

        const finalAmount = Math.max(0, basePrice - discountAmount);

        // 3. Generate unique transaction reference
        const transactionId = `STRIKE_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        // 4. Create PaymentTransaction record in DB
        const transaction = await PaymentTransaction.create({
            transactionId,
            userId,
            planCode: plan.code,
            amount: finalAmount,
            currency: plan.currency || 'INR',
            status: 'SUCCESS',
            paymentGateway: paymentMethod,
            couponUsed: appliedCouponDoc ? appliedCouponDoc.code : null
        });

        // 5. Calculate Subscription End Date (180 days / 1 full semester)
        const durationMonths = plan.durationUnit === 'year' ? (plan.duration * 12) : (plan.durationUnit === 'semester' ? (plan.duration * 6) : 6);
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + (durationMonths * 30 * 24 * 60 * 60 * 1000));

        // Expire any existing active subscriptions for this user
        await Subscription.updateMany(
            { userId, status: 'ACTIVE' },
            { $set: { status: 'EXPIRED' } }
        );

        // Create new active Subscription in DB
        const subscription = await Subscription.create({
            userId,
            planCode: plan.code,
            status: 'ACTIVE',
            startDate,
            endDate,
            amountPaid: finalAmount,
            couponUsed: appliedCouponDoc ? appliedCouponDoc.code : null,
            paymentTransactionId: transaction.transactionId,
            autoRenew: false
        });

        // 6. Update StudentAccount / User models
        const StudentAccount = require('../models/StudentAccount');
        const User = require('../models/User');

        await Promise.all([
            StudentAccount.findByIdAndUpdate(userId, {
                isPlus: true,
                hasActiveSubscription: true,
                subscription: 'plus',
                subscriptionStatus: 'ACTIVE'
            }).catch(() => null),
            User.findByIdAndUpdate(userId, {
                isPlus: true,
                hasActiveSubscription: true,
                subscription: 'plus',
                subscriptionStatus: 'ACTIVE'
            }).catch(() => null)
        ]);

        return res.status(200).json({
            success: true,
            message: 'AskUrSenior Plus activated successfully!',
            data: {
                transactionId: transaction.transactionId,
                plan: {
                    code: plan.code,
                    name: plan.name,
                    duration: plan.duration,
                    durationUnit: plan.durationUnit,
                    features: plan.features
                },
                amountPaid: finalAmount,
                originalPrice: basePrice,
                discount: discountAmount,
                couponUsed: appliedCouponDoc ? appliedCouponDoc.code : null,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                access: {
                    plan: 'PLUS',
                    source: 'SUBSCRIPTION',
                    hasPlusAccess: true
                }
            }
        });
    } catch (error) {
        console.error('Error processing checkout:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process checkout transaction.',
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
    checkout,
    createPlanAdmin,
    updatePlanAdmin,
    createCouponAdmin,
    updateCouponAdmin
};
