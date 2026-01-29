const express = require('express');
const router = express.Router();
const { getUserProgress, getProgressByBranch } = require('../controllers/progressController');
const authMiddleware = require('../middleware/auth');

// All progress routes are protected
router.use(authMiddleware);

router.get('/', getUserProgress);
router.get('/branch/:branch', getProgressByBranch);

module.exports = router;
