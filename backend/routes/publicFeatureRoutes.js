const express = require('express');
const {
    getPublicFeatures,
    checkFeatureAccess
} = require('../controllers/featureController');

const router = express.Router();

router.get('/', getPublicFeatures);
router.get('/:key/access', checkFeatureAccess);

module.exports = router;