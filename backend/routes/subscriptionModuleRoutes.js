const express = require('express');
const router = express.Router();
const subscriptionModuleController = require('../controllers/subscriptionModuleController');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Enterprise Public REST endpoints for Subscription Module
router.get('/public-page', subscriptionModuleController.getPublicPage);
router.get('/plans', subscriptionModuleController.getPlans);
router.get('/features', subscriptionModuleController.getFeatures);
router.post('/coupon/validate', subscriptionModuleController.validateCoupon);

// Enterprise Admin Endpoints
router.post('/admin/plans', authMiddleware, adminMiddleware, subscriptionModuleController.createPlanAdmin);
router.put('/admin/plans/:id', authMiddleware, adminMiddleware, subscriptionModuleController.updatePlanAdmin);
router.post('/admin/coupons', authMiddleware, adminMiddleware, subscriptionModuleController.createCouponAdmin);
router.put('/admin/coupons/:id', authMiddleware, adminMiddleware, subscriptionModuleController.updateCouponAdmin);

module.exports = router;
