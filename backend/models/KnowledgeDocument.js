const mongoose = require('mongoose');

const knowledgeDocumentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['College Rules', 'Attendance', 'Placements', 'Exams', 'Hostel', 'FAQs', 'General'],
        default: 'General'
    },
    fileUrl: {
        type: String,
        required: true
    },
    s3Key: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    extractedText: {
        type: String,
        default: ""
    },
    isProcessed: {
        type: Boolean,
        default: false
    },
    processingStatus: {
        type: String,
        enum: ['processing', 'ready', 'failed'],
        default: 'processing'
    },
    processingTimeMs: {
        type: Number,
        default: 0
    },
    processedAt: {
        type: Date
    },
    isChunked: {
        type: Boolean,
        default: false
    },
    chunkCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
