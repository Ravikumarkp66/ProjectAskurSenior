const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category:    { type: String, enum: ['exam', 'placement', 'circular', 'update'], required: true },
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    isPinned:    { type: Boolean, default: false },
    expiresAt:   { type: Date },
    views:       { type: Number, default: 0 },
    viewedBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt:   { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
