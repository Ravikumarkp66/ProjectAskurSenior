const mongoose = require('mongoose');

const playgroundLanguageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    identifier: {
        type: String,
        required: true,
        trim: true
    },
    version: {
        type: String,
        default: 'Latest'
    },
    fileExtension: {
        type: String,
        required: true,
        trim: true
    },
    accentColor: {
        type: String,
        default: '#A855F7'
    },
    borderColor: {
        type: String,
        default: 'rgba(168, 85, 247, 0.4)'
    },
    bgGlow: {
        type: String,
        default: 'rgba(168, 85, 247, 0.12)'
    },
    badge: {
        type: String,
        default: 'Standard'
    },
    courseCode: {
        type: String,
        default: ''
    },
    displayOrder: {
        type: Number,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PlaygroundLanguage', playgroundLanguageSchema);
