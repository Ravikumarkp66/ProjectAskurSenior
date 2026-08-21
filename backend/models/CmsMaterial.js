const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
    fileUrl: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true,
        trim: true
    },
    fileSize: {
        type: Number
    },
    fileExtension: {
        type: String,
        trim: true
    }
});

const cmsMaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    attachments: {
        type: [attachmentSchema],
        default: []
    },
    materialType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MaterialType',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CmsSubject',
        required: true
    },
    tags: {
        type: [String],
        default: []
    },
    searchKeywords: {
        type: [String],
        default: []
    },
    visibility: {
        type: String,
        enum: ['Published', 'Hidden'],
        default: 'Published'
    },
    version: {
        type: Number,
        default: 1
    },
    thumbnail: {
        type: String,
        trim: true
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'cms_materials'
});

// Indexes for query optimization
cmsMaterialSchema.index({ subject: 1 });
cmsMaterialSchema.index({ searchKeywords: 1 });
cmsMaterialSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('CmsMaterial', cmsMaterialSchema);
