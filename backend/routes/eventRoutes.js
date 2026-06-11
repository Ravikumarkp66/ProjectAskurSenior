const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const AnalyticsEvent = require('../models/AnalyticsEvent');

router.post('/track', authMiddleware, async (req, res) => {
    try {
        const { path } = req.body;
        if (!path) return res.status(400).json({ error: 'Path is required' });

        await AnalyticsEvent.create({
            userId: req.userId,
            path,
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error tracking event:', error);
        res.status(500).json({ error: 'Failed to track event' });
    }
});

module.exports = router;
