const mongoose = require('mongoose');
const PlusAnnouncement         = require('../models/PlusAnnouncement');
const PlusAnnouncementReadState = require('../models/PlusAnnouncementReadState');
const { logActivity }           = require('./adminActivityService');

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseNullableDate(val, fieldName = 'Date') {
    if (!val || (typeof val === 'string' && !val.trim())) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) {
        throw Object.assign(new Error(`Invalid ${fieldName} format.`), { statusCode: 422 });
    }
    return d;
}

/**
 * Build a Mongoose filter for the admin list based on query params.
 * Robust against case variations ('ALL', 'All', 'all', 'Features' vs 'FEATURE').
 */
function buildAdminFilter({ status, category, search }) {
    const filter = {};
    if (status && !['ALL', 'ALL STATUSES'].includes(status.trim().toUpperCase())) {
        filter.status = status.trim().toUpperCase();
    }
    if (category && !['ALL', 'ALL CATEGORIES'].includes(category.trim().toUpperCase())) {
        const catMap = { 'ACADEMIC': 'ACADEMIC', 'FEATURE': 'FEATURE', 'FEATURES': 'FEATURE', 'SYSTEM': 'SYSTEM' };
        filter.category = catMap[category.trim().toUpperCase()] || category.trim().toUpperCase();
    }
    if (search && search.trim()) {
        const regex = new RegExp(escapeRegex(search.trim()), 'i');
        filter.$or = [
            { title:   regex },
            { summary: regex }
        ];
    }
    return filter;
}

/**
 * Build the authorSnapshot from a Mongoose Admin document.
 */
function buildAuthorSnapshot(admin) {
    return {
        name:  admin?.name  || 'Admin',
        email: (admin?.email || '').toLowerCase().trim(),
        role:  admin?.role  || 'ADMIN'
    };
}

// ── Admin CRUD ────────────────────────────────────────────────────────────────

const getAdminList = async ({ page = 1, limit = 20, status, category, search }) => {
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const filter   = buildAdminFilter({ status, category, search });
    const skip     = (pageNum - 1) * limitNum;
    const total    = await PlusAnnouncement.countDocuments(filter);
    const items    = await PlusAnnouncement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    return {
        data:       items,
        pagination: {
            total,
            page:       pageNum,
            limit:      limitNum,
            totalPages: Math.ceil(total / limitNum)
        }
    };
};

const getAdminStats = async () => {
    const [total, published, scheduled, draft, archived] = await Promise.all([
        PlusAnnouncement.countDocuments({}),
        PlusAnnouncement.countDocuments({ status: 'PUBLISHED' }),
        PlusAnnouncement.countDocuments({ status: 'SCHEDULED' }),
        PlusAnnouncement.countDocuments({ status: 'DRAFT' }),
        PlusAnnouncement.countDocuments({ status: 'ARCHIVED' })
    ]);
    return { total, published, scheduled, draft, archived };
};

const getAdminById = async (id) => {
    if (!mongoose.isValidObjectId(id)) return null;
    return PlusAnnouncement.findById(id).lean();
};

const createAnnouncement = async ({ body, admin, req }) => {
    const {
        title, summary, content, category, priority,
        status, isPinned, scheduledAt, expiresAt, attachment
    } = body;

    const now = new Date();
    let resolvedStatus    = (status || 'DRAFT').toUpperCase();
    let resolvedPublishedAt = null;

    const parsedScheduledAt = parseNullableDate(scheduledAt, 'scheduledAt');
    const parsedExpiresAt   = parseNullableDate(expiresAt, 'expiresAt');

    // Validate lifecycle
    if (resolvedStatus === 'SCHEDULED') {
        if (!parsedScheduledAt || parsedScheduledAt <= now) {
            throw Object.assign(new Error('Scheduled announcements require a future scheduledAt datetime.'), { statusCode: 422 });
        }
    }
    if (parsedExpiresAt && parsedExpiresAt <= now) {
        throw Object.assign(new Error('Expiry date must be a future datetime. Cannot create an already-expired announcement.'), { statusCode: 422 });
    }
    if (resolvedStatus === 'PUBLISHED') {
        resolvedPublishedAt = now;
    }

    const doc = await PlusAnnouncement.create({
        title,
        summary,
        content,
        category,
        priority:   priority   || 'NORMAL',
        status:     resolvedStatus,
        isPinned:   isPinned   || false,
        publishedAt: resolvedPublishedAt,
        scheduledAt: parsedScheduledAt,
        expiresAt:  parsedExpiresAt,
        attachment: attachment || null,
        createdBy:  admin._id,
        authorSnapshot: buildAuthorSnapshot(admin),
        updatedBy:  null
    });

    // Audit log (non-blocking)
    logActivity({
        req,
        admin,
        action:       'CREATE',
        resourceType: 'ANNOUNCEMENT',
        resourceId:   doc._id,
        metadata:     { title: doc.title }
    }).catch(() => {});

    return doc;
};

const updateAnnouncement = async ({ id, body, admin, req }) => {
    if (!mongoose.isValidObjectId(id)) {
        throw Object.assign(new Error('Invalid announcement ID.'), { statusCode: 400 });
    }
    const doc = await PlusAnnouncement.findById(id);
    if (!doc) throw Object.assign(new Error('Announcement not found.'), { statusCode: 404 });

    const allowed = ['title', 'summary', 'content', 'category', 'priority',
                     'status', 'isPinned', 'scheduledAt', 'expiresAt', 'attachment'];
    const now = new Date();

    for (const field of allowed) {
        if (body[field] !== undefined) {
            if (field === 'scheduledAt' || field === 'expiresAt') {
                doc[field] = parseNullableDate(body[field], field);
            } else if (field === 'status') {
                doc[field] = body[field] ? body[field].toUpperCase() : doc[field];
            } else {
                doc[field] = body[field];
            }
        }
    }

    // Keep publishedAt if transitioning to published
    if (doc.status === 'PUBLISHED' && !doc.publishedAt) {
        doc.publishedAt = now;
    }
    // Validate scheduled state
    if (doc.status === 'SCHEDULED' && (!doc.scheduledAt || doc.scheduledAt <= now)) {
        throw Object.assign(new Error('Scheduled announcements require a future scheduledAt.'), { statusCode: 422 });
    }
    if (doc.expiresAt && doc.expiresAt <= now) {
        throw Object.assign(new Error('Expiry date must be in the future.'), { statusCode: 422 });
    }

    doc.updatedBy = admin._id;
    await doc.save();

    logActivity({
        req,
        admin,
        action:       'UPDATE',
        resourceType: 'ANNOUNCEMENT',
        resourceId:   doc._id,
        metadata:     { title: doc.title }
    }).catch(() => {});

    return doc;
};

const publishAnnouncement = async ({ id, admin, req }) => {
    if (!mongoose.isValidObjectId(id)) {
        throw Object.assign(new Error('Invalid announcement ID.'), { statusCode: 400 });
    }
    const doc = await PlusAnnouncement.findById(id);
    if (!doc) throw Object.assign(new Error('Announcement not found.'), { statusCode: 404 });
    if (doc.status === 'PUBLISHED') return doc; // idempotent

    doc.status      = 'PUBLISHED';
    doc.publishedAt = new Date();
    doc.scheduledAt = null;
    doc.updatedBy   = admin._id;
    await doc.save();

    logActivity({
        req,
        admin,
        action:       'PUBLISH',
        resourceType: 'ANNOUNCEMENT',
        resourceId:   doc._id,
        metadata:     { title: doc.title }
    }).catch(() => {});

    return doc;
};

const archiveAnnouncement = async ({ id, admin, req }) => {
    if (!mongoose.isValidObjectId(id)) {
        throw Object.assign(new Error('Invalid announcement ID.'), { statusCode: 400 });
    }
    const doc = await PlusAnnouncement.findById(id);
    if (!doc) throw Object.assign(new Error('Announcement not found.'), { statusCode: 404 });

    doc.status    = 'ARCHIVED';
    doc.updatedBy = admin._id;
    await doc.save();

    logActivity({
        req,
        admin,
        action:       'ARCHIVE',
        resourceType: 'ANNOUNCEMENT',
        resourceId:   doc._id,
        metadata:     { title: doc.title }
    }).catch(() => {});

    return doc;
};

const togglePin = async ({ id, admin, req }) => {
    if (!mongoose.isValidObjectId(id)) {
        throw Object.assign(new Error('Invalid announcement ID.'), { statusCode: 400 });
    }
    const doc = await PlusAnnouncement.findById(id);
    if (!doc) throw Object.assign(new Error('Announcement not found.'), { statusCode: 404 });

    doc.isPinned  = !doc.isPinned;
    doc.updatedBy = admin._id;
    await doc.save();

    logActivity({
        req,
        admin,
        action:       'UPDATE',
        resourceType: 'ANNOUNCEMENT',
        resourceId:   doc._id,
        metadata:     { title: doc.title, extra: { pinned: doc.isPinned } }
    }).catch(() => {});

    return doc;
};

const deleteAnnouncement = async ({ id, admin, req }) => {
    if (!mongoose.isValidObjectId(id)) {
        throw Object.assign(new Error('Invalid announcement ID.'), { statusCode: 400 });
    }
    const doc = await PlusAnnouncement.findByIdAndDelete(id);
    if (!doc) throw Object.assign(new Error('Announcement not found.'), { statusCode: 404 });

    // Clean up read states too
    PlusAnnouncementReadState.deleteMany({ announcementId: id }).catch(() => {});

    logActivity({
        req,
        admin,
        action:       'DELETE',
        resourceType: 'ANNOUNCEMENT',
        resourceId:   new mongoose.Types.ObjectId(id),
        metadata:     { title: doc.title }
    }).catch(() => {});

    return doc;
};

// ── Student feed ──────────────────────────────────────────────────────────────

/**
 * Build the student-safe filter: only PUBLISHED, non-expired announcements.
 */
function buildStudentFilter({ category } = {}) {
    const now = new Date();
    const filter = {
        status:      'PUBLISHED',
        publishedAt: { $lte: now },
        $or: [
            { expiresAt: null },
            { expiresAt: { $gt: now } }
        ]
    };
    if (category && category !== 'ALL') {
        const catMap = { 'ACADEMIC': 'ACADEMIC', 'FEATURE': 'FEATURE', 'FEATURES': 'FEATURE', 'SYSTEM': 'SYSTEM' };
        const resolved = catMap[category.trim().toUpperCase()];
        if (resolved) {
            filter.category = resolved;
        }
    }
    return filter;
}

const getStudentFeed = async ({ userId, category, page = 1, limit = 20 }) => {
    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const filter   = buildStudentFilter({ category });
    const skip     = (pageNum - 1) * limitNum;
    const total    = await PlusAnnouncement.countDocuments(filter);

    const items = await PlusAnnouncement.find(filter)
        .select('-createdBy -updatedBy -authorSnapshot.email')
        .sort({ isPinned: -1, publishedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

    // Fetch read states for this user in ONE covered index query
    const announcementIds = items.map(a => a._id);
    let readSet = new Set();
    const hasValidUserId = userId && mongoose.isValidObjectId(userId);
    const validUserId = hasValidUserId ? new mongoose.Types.ObjectId(userId.toString()) : null;

    if (validUserId && announcementIds.length > 0) {
        const readStates = await PlusAnnouncementReadState.find({
            userId:         validUserId,
            announcementId: { $in: announcementIds }
        }).select('announcementId').lean();
        readSet = new Set(readStates.map(r => r.announcementId.toString()));
    }

    // Calculate total unread count across all active announcements
    let unreadCount = 0;
    if (validUserId) {
        const activeAnnouncements = await PlusAnnouncement.find(buildStudentFilter()).select('_id').lean();
        if (activeAnnouncements.length > 0) {
            const activeIds = activeAnnouncements.map(a => a._id);
            const totalRead = await PlusAnnouncementReadState.countDocuments({
                userId:         validUserId,
                announcementId: { $in: activeIds }
            });
            unreadCount = Math.max(0, activeAnnouncements.length - totalRead);
        }
    }

    // Normalize to student-safe DTO
    const data = items.map(a => ({
        id:          a._id.toString(),
        title:       a.title,
        summary:     a.summary,
        content:     a.content,
        category:    a.category,
        priority:    a.priority,
        isPinned:    a.isPinned,
        publishedAt: a.publishedAt,
        expiresAt:   a.expiresAt,
        attachment:  a.attachment ? {
            name:     a.attachment.originalName,
            url:      a.attachment.fileUrl,
            mimeType: a.attachment.mimeType,
            size:     a.attachment.fileSize
        } : null,
        author: {
            name: a.authorSnapshot?.name || 'AskUrSenior',
            role: a.authorSnapshot?.role || 'ADMIN'
        },
        isRead: readSet.has(a._id.toString())
    }));

    return {
        data,
        unreadCount,
        pagination: {
            total,
            page:       pageNum,
            limit:      limitNum,
            totalPages: Math.ceil(total / limitNum)
        }
    };
};

// ── Read / Unread ─────────────────────────────────────────────────────────────

const markAsRead = async ({ userId, announcementId }) => {
    if (!mongoose.isValidObjectId(announcementId)) {
        throw Object.assign(new Error('Invalid announcement ID.'), { statusCode: 400 });
    }
    if (!userId || !mongoose.isValidObjectId(userId)) {
        throw Object.assign(new Error('Invalid user ID.'), { statusCode: 400 });
    }

    // Verify announcement is actually visible to students
    const filter = buildStudentFilter();
    filter._id   = new mongoose.Types.ObjectId(announcementId.toString());
    const exists = await PlusAnnouncement.exists(filter);
    if (!exists) {
        throw Object.assign(new Error('Announcement not found or not visible.'), { statusCode: 404 });
    }

    // Upsert: idempotent — repeated calls are safe
    await PlusAnnouncementReadState.updateOne(
        {
            userId:         new mongoose.Types.ObjectId(userId.toString()),
            announcementId: new mongoose.Types.ObjectId(announcementId.toString())
        },
        { $setOnInsert: { readAt: new Date() } },
        { upsert: true }
    );

    return { success: true };
};

// ── Scheduled Promotion ───────────────────────────────────────────────────────

/**
 * Called by cron every minute.
 * Promotes SCHEDULED announcements whose scheduledAt has arrived.
 */
const promoteScheduledAnnouncements = async () => {
    const now    = new Date();
    const result = await PlusAnnouncement.updateMany(
        { status: 'SCHEDULED', scheduledAt: { $lte: now } },
        {
            $set: {
                status:      'PUBLISHED',
                publishedAt: now
            },
            $unset: { scheduledAt: '' }
        }
    );
    return result.modifiedCount || 0;
};

module.exports = {
    getAdminList,
    getAdminStats,
    getAdminById,
    createAnnouncement,
    updateAnnouncement,
    publishAnnouncement,
    archiveAnnouncement,
    togglePin,
    deleteAnnouncement,
    getStudentFeed,
    markAsRead,
    promoteScheduledAnnouncements
};
