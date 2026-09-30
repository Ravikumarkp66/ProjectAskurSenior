const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { requirePlusAccess } = require('../middleware/plusAccess');
const svc     = require('../services/plusAnnouncementService');

const jwt     = require('jsonwebtoken');

// Soft auth middleware to optionally resolve userId for GET requests without failing if unauthenticated
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (token) {
        try {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'fallback_secret_ask_ur_senior'
            );
            req.userId = decoded.userId || decoded.id || decoded._id;
        } catch (_) {}
    }
    next();
};

// ── Student feed ──────────────────────────────────────────────────────────────

router.get('/', optionalAuth, async (req, res) => {
    try {
        const { page, limit, category } = req.query;
        const userId = req.userId || req.user?._id;
        const result = await svc.getStudentFeed({ userId, category, page, limit });
        res.json({ success: true, ...result });
    } catch (err) {
        console.error('Student getAnnouncements error:', err);
        res.status(500).json({ success: false, error: 'Failed to load announcements.' });
    }
});

// ── Mark as read ──────────────────────────────────────────────────────────────

router.post('/:id/read', auth, async (req, res) => {
    try {
        const userId = req.userId || req.user?._id;
        if (!userId) return res.status(401).json({ success: false, error: 'Authentication required.' });
        await svc.markAsRead({ userId, announcementId: req.params.id });
        res.json({ success: true });
    } catch (err) {
        console.error('Student markAsRead error:', err);
        res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
});

module.exports = router;
