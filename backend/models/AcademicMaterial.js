const mongoose = require('mongoose');

const MATERIAL_TYPES = [
    'Notes',
    'SEE',
    'Internals',
    'Others'
];

const MIGRATION_STATUSES = ['Auto Matched', 'Needs Review', 'Manually Assigned'];

const academicMaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    // Normalized reference — null if subject couldn't be matched during migration
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        default: null
    },

    // Original subject name from legacy documents — preserved forever for traceability
    legacySubjectName: {
        type: String,
        trim: true
    },

    materialType: {
        type: String,
        enum: MATERIAL_TYPES,
        default: 'Others'
    },

    // File metadata
    fileUrl: {
        type: String,
        required: true,
        trim: true
    },
    storedFileName: {
        type: String,
        trim: true
    },
    originalFileName: {
        type: String,
        trim: true
    },
    fileType: {
        type: String,
        trim: true
    },
    mimeType: {
        type: String,
        trim: true
    },
    fileSize: {
        type: Number,
        default: 0
    },
    fileHash: {
        type: String,
        index: true
    },

    // Uploader tracking
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Stored separately so ownership survives user deletion / email changes
    uploaderEmail: {
        type: String,
        lowercase: true,
        trim: true
    },

    // Visibility
    status: {
        type: String,
        enum: ['Published', 'Hidden', 'Draft'],
        default: 'Published'
    },
    ignoredDuplicate: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null,
        index: true
    },

    // Migration audit trail
    migrationStatus: {
        type: String,
        enum: MIGRATION_STATUSES,
        default: null  // null for freshly uploaded materials (not migrated)
    },

    // Reference to the source legacy document — also acts as the idempotency key
    legacyDocumentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        default: null
    },

    // Engagement tracking (preserved from legacy)
    downloadCount: {
        type: Number,
        default: 0
    },
    previewCount: {
        type: Number,
        default: 0
    },
    lastDownloadedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'academic_materials'
});

// Idempotency — one record per legacy document
academicMaterialSchema.index({ legacyDocumentId: 1 }, { unique: true, sparse: true });

// Common query patterns
academicMaterialSchema.index({ subject: 1 });
academicMaterialSchema.index({ status: 1 });
academicMaterialSchema.index({ materialType: 1 });
academicMaterialSchema.index({ migrationStatus: 1 });
academicMaterialSchema.index({ uploadedBy: 1 });
academicMaterialSchema.index({ createdAt: -1 });

module.exports = mongoose.models.AcademicMaterial
    || mongoose.model('AcademicMaterial', academicMaterialSchema);
