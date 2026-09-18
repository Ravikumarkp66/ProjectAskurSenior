const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { requireAdmin, requirePermission } = require('../middleware/adminAuth');
const svc     = require('../services/plusAnnouncementService');

// All admin announcement routes: authenticated admin only
router.use(auth, requireAdmin);

// ── List & Stats ──────────────────────────────────────────────────────────────

router.get('/', requirePermission('announcements.view'), async (req, res) => {
    try {
        const { page, limit, status, category, search } = req.query;
        const [result, stats] = await Promise.all([
            svc.getAdminList({ page, limit, status, category, search }),
            svc.getAdminStats()
        ]);
        res.json({ success: true, ...result, stats });
    } catch (err) {
        console.error('Admin getAnnouncements error:', err);
        res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
});

// ── Single ────────────────────────────────────────────────────────────────────

router.get('/:id', requirePermission('announcements.view'), async (req, res) => {
    try {
        const doc = await svc.getAdminById(req.params.id);
        if (!doc) return res.status(404).json({ success: false, error: 'Announcement not found.' });
        res.json({ success: true, data: doc });
    } catch (err) {
        console.error('Admin getAnnouncementById error:', err);
        res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
});

// ── Create ────────────────────────────────────────────────────────────────────

router.post('/', requirePermission('announcements.create'), async (req, res) => {
    try {
        const doc = await svc.createAnnouncement({ body: req.body, admin: req.admin, req });
        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        console.error('Admin createAnnouncement error:', err);
        res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
});

// ── Update ────────────────────────────────────────────────────────────────────

router.patch('/:id', requirePermission('announcements.update'), async (req, res) => {
    try {
        const doc = await svc.updateAnnouncement({ id: req.params.id, body: req.body, admin: req.admin, req });
        res.json({ success: true, data: doc });
    } catch (err) {
        console.error('Admin updateAnnouncement error:', err);
        res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
});

// ── Publish ───────────────────────────────────────────────────────────────────

router.post('/:id/publish', requirePermission('announcements.publish'), async (req, res) => {
    try {
        const doc = await svc.publishAnnouncement({ id: req.params.id, admin: req.admin, req });
        res.json({ success: true, data: doc });
    } catch (err) {
        console.error('Admin publishAnnouncement error:', err);
        res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
});

// ── Archive ───────────────────────────────────────────────────────────────────

router.post('/:id/archive', requirePermission('announcements.archive'), async (req, res) => {
    try {
        const doc = await svc.archiveAnnouncement({ id: req.params.id, admin: req.admin, req });
        res.json({ success: true, data: doc });
    } catch (err) {
        console.error('Admin archiveAnnouncement error:', err);
        res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
});

// ── Pin ───────────────────────────────────────────────────────────────────────

router.patch('/:id/pin', requirePermission('announcements.update'), async (req, res) => {
    try {
        const doc = await svc.togglePin({ id: req.params.id, admin: req.admin, req });
        res.json({ success: true, data: doc });
    } catch (err) {
        console.error('Admin togglePin error:', err);
        res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
});

// ── Delete ────────────────────────────────────────────────────────────────────

router.delete('/:id', requirePermission('announcements.delete'), async (req, res) => {
    try {
        await svc.deleteAnnouncement({ id: req.params.id, admin: req.admin, req });
        res.json({ success: true, message: 'Announcement deleted.' });
    } catch (err) {
        console.error('Admin deleteAnnouncement error:', err);
        res.status(err.statusCode || 500).json({ success: false, error: err.message });
    }
});

module.exports = router;
