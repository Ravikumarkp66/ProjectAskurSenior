const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const Announcement = require('../models/Announcement');
const MarketplaceListing = require('../models/MarketplaceListing');

const escapeRegExp = (str) => str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';

/* ─── helpers ─────────────────────────────────────────────────────── */
const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

/* ─── GET /api/campus-hub/feed ────────────────────────────────────── */
router.get('/feed', authMiddleware, async (req, res) => {
    try {
        const { tab = 'all', sort = 'newest', search = '', page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const lim  = parseInt(limit);
        const now  = new Date();

        const searchRegex = search ? new RegExp(escapeRegExp(search), 'i') : null;

        let items = [];
        let total = 0;

        // ── Announcements ──
        if (tab === 'all' || tab === 'ann') {
            const annFilter = {
                $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
            };
            if (searchRegex) {
                annFilter.$and = [
                    { $or: [{ title: searchRegex }, { description: searchRegex }] }
                ];
            }
            const anns = await Announcement.find(annFilter)
                .populate('createdBy', 'name usn')
                .lean();
            const annItems = anns.map(a => ({ ...a, pillar: 'ann' }));
            items.push(...annItems);
        }

        // ── Marketplace / Lost+Found ──
        if (tab === 'all' || tab === 'mkt' || tab === 'lost') {
            let typeFilter;
            if (tab === 'lost') typeFilter = ['lost', 'found'];
            else if (tab === 'mkt') typeFilter = ['sell', 'buy', 'service', 'room'];
            else typeFilter = ['sell', 'buy', 'service', 'room', 'lost', 'found'];

            const mktFilter = {
                type: { $in: typeFilter },
                status: 'active',
                $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
            };
            if (searchRegex) {
                mktFilter.$and = [
                    { $or: [{ title: searchRegex }, { description: searchRegex }] }
                ];
            }
            const listings = await MarketplaceListing.find(mktFilter)
                .populate('createdBy', 'name usn')
                .lean();
            const mktItems = listings.map(l => ({
                ...l,
                pillar: ['lost', 'found'].includes(l.type) ? 'lost' : 'mkt'
            }));
            items.push(...mktItems);
        }

        // ── Sort ──
        if (sort === 'pinned') {
            items.sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        } else if (sort === 'oldest') {
            items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else {
            items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        total = items.length;
        const page_items = items.slice(skip, skip + lim);

        return res.json({
            items: page_items,
            total,
            page: parseInt(page),
            hasMore: skip + lim < total
        });
    } catch (err) {
        console.error('Campus Hub feed error:', err);
        res.status(500).json({ error: 'Failed to load feed' });
    }
});

/* ─── GET /api/campus-hub/announcements/:id ──────────────────────── */
router.get('/announcements/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id))
            return res.status(400).json({ error: 'Invalid ID' });

        const ann = await Announcement.findByIdAndUpdate(
            id,
            { $inc: { views: 1 }, $addToSet: { viewedBy: req.userId } },
            { new: true }
        ).populate('createdBy', 'name usn');

        if (!ann) return res.status(404).json({ error: 'Announcement not found' });
        res.json({ ...ann.toObject(), pillar: 'ann' });
    } catch (err) {
        console.error('Announcement detail error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── POST /api/campus-hub/announcements (admin) ─────────────────── */
router.post('/announcements', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { title, description, category, priority, isPinned, expiresAt } = req.body;

        if (!title || !title.trim())       return res.status(400).json({ error: 'Title is required' });
        if (!description || !description.trim()) return res.status(400).json({ error: 'Description is required' });
        if (!category)                     return res.status(400).json({ error: 'Category is required' });

        const ann = await Announcement.create({
            title: title.trim(),
            description: description.trim(),
            category,
            priority: priority || 'medium',
            isPinned: !!isPinned,
            expiresAt: expiresAt || null,
            createdBy: req.userId
        });

        const populated = await ann.populate('createdBy', 'name usn');
        res.status(201).json({ ...populated.toObject(), pillar: 'ann' });
    } catch (err) {
        console.error('Create announcement error:', err);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

/* ─── PATCH /api/campus-hub/announcements/:id/pin (admin) ────────── */
router.patch('/announcements/:id/pin', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const ann = await Announcement.findById(req.params.id);
        if (!ann) return res.status(404).json({ error: 'Announcement not found' });

        ann.isPinned = !ann.isPinned;
        await ann.save();
        res.json({ isPinned: ann.isPinned, _id: ann._id });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── DELETE /api/campus-hub/announcements/:id (admin) ───────────── */
router.delete('/announcements/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const ann = await Announcement.findByIdAndDelete(req.params.id);
        if (!ann) return res.status(404).json({ error: 'Announcement not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── POST /api/campus-hub/marketplace ───────────────────────────── */
router.post('/marketplace', authMiddleware, async (req, res) => {
    try {
        const { title, description, type, price, contactNumber, images } = req.body;

        if (!title || !title.trim())       return res.status(400).json({ error: 'Title is required' });
        if (!description || !description.trim()) return res.status(400).json({ error: 'Description is required' });
        if (!type)                         return res.status(400).json({ error: 'Listing type is required' });

        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        const listing = await MarketplaceListing.create({
            title:   title.trim(),
            description: description.trim(),
            type,
            price:   price || null,
            contactNumber: contactNumber || null,
            images:  Array.isArray(images) ? images.slice(0, 3) : [],
            createdBy: req.userId,
            expiresAt
        });

        const populated = await listing.populate('createdBy', 'name usn');
        const pillar = ['lost', 'found'].includes(listing.type) ? 'lost' : 'mkt';
        res.status(201).json({ ...populated.toObject(), pillar });
    } catch (err) {
        console.error('Create listing error:', err);
        res.status(500).json({ error: 'Failed to create listing' });
    }
});

/* ─── PATCH /api/campus-hub/marketplace/:id/status ──────────────── */
router.patch('/marketplace/:id/status', authMiddleware, async (req, res) => {
    try {
        const listing = await MarketplaceListing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: 'Listing not found' });

        const isOwner = listing.createdBy.toString() === req.userId;
        if (!isOwner && !req.isAdmin)
            return res.status(403).json({ error: 'Not authorised' });

        const { status } = req.body;
        if (!['sold', 'closed'].includes(status))
            return res.status(400).json({ error: 'Status must be sold or closed' });

        listing.status = status;
        await listing.save();
        res.json({ _id: listing._id, status: listing.status });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── DELETE /api/campus-hub/marketplace/:id ─────────────────────── */
router.delete('/marketplace/:id', authMiddleware, async (req, res) => {
    try {
        const listing = await MarketplaceListing.findById(req.params.id);
        if (!listing) return res.status(404).json({ error: 'Listing not found' });

        const isOwner = listing.createdBy.toString() === req.userId;
        if (!isOwner && !req.isAdmin)
            return res.status(403).json({ error: 'Not authorised' });

        await listing.deleteOne();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/* ─── GET /api/campus-hub/unread-count ──────────────────────────── */
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        const count = await Announcement.countDocuments({
            isPinned: true,
            viewedBy: { $nin: [req.userId] }
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
