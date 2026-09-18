const express = require('express');
const authMiddleware = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const {
    getAdminFeatures,
    getAdminFeatureByKey,
    updateAdminFeature
} = require('../controllers/featureController');

const router = express.Router();

// All feature admin routes require active admin authentication
router.use(authMiddleware, requireAdmin);

router.get('/', getAdminFeatures);
router.get('/:key', getAdminFeatureByKey);
router.patch('/:key', updateAdminFeature);

module.exports = router;