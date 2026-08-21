const mongoose = require('mongoose');

const cmsSubjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    credits: {
        type: Number,
        required: true,
        default: 4,
        min: 0,
        max: 4,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} must be an integer'
        }
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: false // Kept for backward compatibility
    },
    year: {
        type: String,
        required: true,
        enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
    },
    scheme: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme',
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
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Published', 'Hidden'],
        default: 'Published'
    }
}, {
    timestamps: true,
    collection: 'cms_subjects'
});

// Index searchKeywords for faster search
cmsSubjectSchema.index({ searchKeywords: 1 });
cmsSubjectSchema.index({ code: 1 });
cmsSubjectSchema.index({ slug: 1 });

module.exports = mongoose.model('CmsSubject', cmsSubjectSchema);
