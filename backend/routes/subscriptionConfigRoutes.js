const express = require('express');
const router = express.Router();
const subscriptionConfigController = require('../controllers/subscriptionConfigController');

// Public route to fetch orchestrated subscription page data
router.get('/public', subscriptionConfigController.getPublicConfig);

// Route to validate coupon codes
router.post('/validate-coupon', subscriptionConfigController.validateCoupon);

module.exports = router;
