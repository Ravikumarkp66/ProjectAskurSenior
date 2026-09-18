const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { requirePlusAccess } = require('../middleware/plusAccess');
const svc     = require('../services/plusAnnouncementService');

// All Plus announcement routes: authenticated + Plus access
router.use(auth, requirePlusAccess);

// ── Student feed ──────────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
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

router.post('/:id/read', async (req, res) => {
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
