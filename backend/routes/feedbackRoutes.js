const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const {
    createFeedback,
    listFeedback,
    feedbackStats,
    getMyLatestFeedback
} = require('../controllers/feedbackController');

router.post('/', authMiddleware, createFeedback);
router.get('/', authMiddleware, adminMiddleware, listFeedback);
router.get('/stats', authMiddleware, feedbackStats);
router.get('/me/latest', authMiddleware, getMyLatestFeedback);

module.exports = router;
