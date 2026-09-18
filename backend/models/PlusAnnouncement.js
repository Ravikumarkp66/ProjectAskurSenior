const mongoose = require('mongoose');

const CATEGORIES = ['ACADEMIC', 'FEATURE', 'SYSTEM'];
const PRIORITIES = ['NORMAL', 'IMPORTANT', 'URGENT'];
const STATUSES   = ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'];

/**
 * Embedded attachment metadata — mirrors the existing S3 upload conventions
 * used by AcademicMaterial and uploadRoutes.
 */
const attachmentSchema = new mongoose.Schema({
    originalName:    { type: String, required: true, trim: true },
    storedFileName:  { type: String, trim: true, default: null },
    s3Key:           { type: String, trim: true, default: null },
    fileUrl:         { type: String, required: true, trim: true },
    mimeType:        { type: String, default: 'application/pdf', trim: true },
    fileSize:        { type: Number, default: 0 }  // bytes
}, { _id: false });

const plusAnnouncementSchema = new mongoose.Schema({
    // ── Content ──────────────────────────────────────────────────────
    title: {
        type: String,
        required: [true, 'Announcement title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    summary: {
        type: String,
        required: [true, 'Announcement summary is required'],
        trim: true,
        minlength: [10, 'Summary must be at least 10 characters'],
        maxlength: [500, 'Summary cannot exceed 500 characters']
    },
    content: {
        type: String,
        required: [true, 'Announcement content is required'],
        trim: true,
        minlength: [10, 'Content must be at least 10 characters']
    },

    // ── Classification ────────────────────────────────────────────────
    category: {
        type: String,
        enum: { values: CATEGORIES, message: 'Invalid category' },
        required: [true, 'Category is required'],
        index: true
    },
    priority: {
        type: String,
        enum: { values: PRIORITIES, message: 'Invalid priority' },
        default: 'NORMAL',
        index: true
    },

    // ── Lifecycle ─────────────────────────────────────────────────────
    status: {
        type: String,
        enum: { values: STATUSES, message: 'Invalid status' },
        default: 'DRAFT',
        index: true
    },
    isPinned: {
        type: Boolean,
        default: false,
        index: true
    },

    // ── Scheduling & Expiry ───────────────────────────────────────────
    publishedAt: {
        type: Date,
        default: null,
        index: true
    },
    scheduledAt: {
        type: Date,
        default: null
    },
    expiresAt: {
        type: Date,
        default: null,
        index: true
    },

    // ── Attachment (zero or one, following S3 conventions) ───────────
    attachment: {
        type: attachmentSchema,
        default: null
    },

    // ── Author & Audit ────────────────────────────────────────────────
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: [true, 'Author reference is required'],
        index: true
    },
    /**
     * Snapshot preserves admin display information even if the Admin
     * record is later modified or deactivated.
     */
    authorSnapshot: {
        name:  { type: String, required: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        role:  { type: String, default: 'ADMIN' }
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    }
}, {
    timestamps: true,
    collection: 'plus_announcements'
});

// ── Indexes ───────────────────────────────────────────────────────────────────

// Student feed: status + pinned first + newest
plusAnnouncementSchema.index({ status: 1, isPinned: -1, publishedAt: -1, expiresAt: 1 });

// Student category filter
plusAnnouncementSchema.index({ status: 1, category: 1, isPinned: -1, publishedAt: -1 });

// Admin management
plusAnnouncementSchema.index({ status: 1, createdAt: -1 });

// Creator audit
plusAnnouncementSchema.index({ createdBy: 1, createdAt: -1 });

// Scheduled promotion (cron queries scheduledAt)
plusAnnouncementSchema.index({ status: 1, scheduledAt: 1 });

// Full-text search (title + summary for admin search)
plusAnnouncementSchema.index({ title: 'text', summary: 'text' });

module.exports =
    mongoose.models.PlusAnnouncement ||
    mongoose.model('PlusAnnouncement', plusAnnouncementSchema);
