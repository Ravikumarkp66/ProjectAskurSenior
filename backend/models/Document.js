const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    
    // Metadata fields (all stored in lowercase for better search)
    subjectName: {
        type: String,
        required: true,
        trim: true
    },
    subjectCode: {
        type: String,
        required: false,
        lowercase: true,
        trim: true
    },
    semester: {
        type: String,
        trim: true
    },
    year: {
        type: String,
        trim: true
    },
    documentType: {
        type: String,
        enum: ['notes', 'internals', 'see'],
        required: true,
        lowercase: true
    },
    paperType: {
        type: String,
        lowercase: true,
        trim: true
    },
    tags: {
        type: String,
        lowercase: true,
        trim: true
    },
    moduleInfo: {
        type: String, // e.g. "Module 1", "M1-M3", "Full Syllabus"
        trim: true
    },
    pageCount: {
        type: Number
    },
    
    // Upload tracking
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    
    // Download tracking
    downloadCount: {
        type: Number,
        default: 0
    },
    previewCount: {
        type: Number,
        default: 0
    },
    lastDownloadedAt: {
        type: Date
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Approval and Contribution
    isApproved: {
        type: Boolean,
        default: false,
        index: true
    },
    contributor: {
        showName: { type: Boolean, default: false },
        name: { type: String, trim: true },
        year: { type: String, trim: true },
        branch: { type: String, trim: true }
    },
    
    // Deletion tracking
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for search performance (updated search index)
documentSchema.index({ 
    subjectName: 'text', 
    subjectCode: 'text', 
    tags: 'text',
    paperType: 'text',
    documentType: 'text',
    "contributor.name": 'text'
});

documentSchema.index({ subjectName: 1, subjectCode: 1 });
documentSchema.index({ documentType: 1 });
documentSchema.index({ paperType: 1 });
documentSchema.index({ semester: 1 });
documentSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Document', documentSchema);
