const mongoose = require('mongoose');

/**
 * CourseModule Schema
 * 
 * Represents a content module within an academic subject curriculum (e.g. "0. Basics", "Module 1: Introduction").
 * References AcademicSubjectCms authoritatively via academicSubjectId ObjectId.
 * Contains purely content structure; academic metadata (credits, scheme, branch, semester)
 * is authoritatively managed by AcademicSubjectCms.
 */
const courseModuleSchema = new mongoose.Schema({
    academicSubjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        required: [true, 'Academic subject reference is required'],
        index: true
    },
    moduleSlug: {
        type: String,
        required: [true, 'Module slug is required'],
        trim: true,
        lowercase: true
    },
    moduleNumber: {
        type: Number,
        required: [true, 'Module number is required'],
        min: [0, 'Module number cannot be negative']
    },
    title: {
        type: String,
        required: [true, 'Module title is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    order: {
        type: Number,
        required: [true, 'Display order is required'],
        default: 1
    }
}, {
    timestamps: true,
    collection: 'course_modules'
});

// Indexes
// Ensures moduleSlug is unique within a given academic subject
courseModuleSchema.index({ academicSubjectId: 1, moduleSlug: 1 }, { unique: true });

// Ensures efficient ordered retrieval of modules for an academic subject
courseModuleSchema.index({ academicSubjectId: 1, order: 1 });

module.exports = mongoose.models.CourseModule || mongoose.model('CourseModule', courseModuleSchema);
