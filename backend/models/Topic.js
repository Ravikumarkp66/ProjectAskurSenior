const mongoose = require('mongoose');

/**
 * Topic Schema
 * 
 * Represents an individual learning topic under a curriculum module.
 * 
 * CRITICAL IDENTIFIER DISTINCTION:
 * 1. `Topic._id` (ObjectId):
 *    The authoritative internal MongoDB primary key.
 *    Referenced by `EditorialContent.topicId` as its foreign key relationship.
 * 
 * 2. `Topic.topicId` (String, e.g. "topic-0.1"):
 *    The application-level/curriculum identifier.
 *    Preserved for backward compatibility with `EditorialProgress.completedTopics[].topicId`.
 * 
 * RELATIONSHIPS & INVARIANTS:
 * - References CourseModule authoritatively via `moduleId` ObjectId.
 * - References AcademicSubjectCms authoritatively via `academicSubjectId` ObjectId.
 * - Invariant: `Topic.academicSubjectId` must match the parent `CourseModule.academicSubjectId`.
 */
const topicSchema = new mongoose.Schema({
    academicSubjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        required: [true, 'Academic subject reference is required'],
        index: true
    },
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseModule',
        required: [true, 'Course module reference is required'],
        index: true
    },
    subjectSlug: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    moduleSlug: {
        type: String,
        trim: true,
        lowercase: true,
        default: ''
    },
    topicSlug: {
        type: String,
        required: [true, 'Topic slug is required'],
        trim: true,
        lowercase: true
    },
    topicId: {
        type: String,
        required: [true, 'Topic application identifier is required (e.g. "topic-0.1")'],
        trim: true
    },
    title: {
        type: String,
        required: [true, 'Topic title is required'],
        trim: true
    },
    displayLabel: {
        type: String,
        trim: true,
        default: ''
    },
    order: {
        type: Number,
        required: [true, 'Display order is required'],
        default: 1
    },
    estimatedMinutes: {
        type: Number,
        default: 10,
        min: [1, 'Estimated minutes must be at least 1']
    },
    status: {
        type: String,
        enum: {
            values: ['Draft', 'Published', 'Archived'],
            message: '{VALUE} is not a supported topic status'
        },
        default: 'Published'
    },
    hasEditorial: {
        type: Boolean,
        default: true
    },
    hasPyq: {
        type: Boolean,
        default: false
    },
    hasLab: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'topics'
});

// Indexes
// Ensures topicSlug is unique within a module
topicSchema.index({ moduleId: 1, topicSlug: 1 }, { unique: true });

// Ensures stable topicId uniqueness within an academic subject
topicSchema.index({ academicSubjectId: 1, topicId: 1 }, { unique: true });

// Supports efficient ordered listing of topics within a module
topicSchema.index({ academicSubjectId: 1, moduleId: 1, order: 1 });

// Supports fast URL / routing lookups by slugs
topicSchema.index({ subjectSlug: 1, moduleSlug: 1, topicSlug: 1 });

module.exports = mongoose.models.Topic || mongoose.model('Topic', topicSchema);
