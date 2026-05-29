const mongoose = require('mongoose');

const knowledgeChunkSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "KnowledgeDocument",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    chunkText: {
        type: String,
        required: true
    },
    chunkIndex: {
        type: Number,
        required: true
    },
    wordCount: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    embedding: {
        type: [Number],
        default: []
    },
    isEmbedded: {
        type: Boolean,
        default: false
    },
    embeddedAt: {
        type: Date
    }
});

module.exports = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
