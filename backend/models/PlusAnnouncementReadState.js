const mongoose = require('mongoose');

/**
 * Per-student per-announcement read state.
 *
 * IMPORTANT: read state must NEVER live on the PlusAnnouncement document itself
 * because 1,000 students have 1,000 independent read states for every announcement.
 *
 * Identity: StudentAccount._id is the primary student reference in this project
 * (see middleware/auth.js — StudentAccount is tried first, User as legacy fallback).
 * We store userId as a generic ref-less ObjectId to support both identity types
 * without tightly coupling this model to either.
 */
const plusAnnouncementReadStateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    announcementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlusAnnouncement',
        required: true
    },
    readAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'plus_announcement_read_states'
});

// Unique compound index: prevents duplicate read records and enables efficient lookups
plusAnnouncementReadStateSchema.index(
    { userId: 1, announcementId: 1 },
    { unique: true }
);

// Supports fetching all reads for a user quickly
plusAnnouncementReadStateSchema.index({ userId: 1, readAt: -1 });

module.exports =
    mongoose.models.PlusAnnouncementReadState ||
    mongoose.model('PlusAnnouncementReadState', plusAnnouncementReadStateSchema);
