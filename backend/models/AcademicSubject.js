const mongoose = require('mongoose');

const academicSubjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
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
    credits: {
        type: Number,
        required: true,
        min: 0,
        max: 4,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} must be an integer'
        }
    },
    status: {
        type: String,
        enum: ['Published', 'Hidden'],
        default: 'Published'
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    materialCount: {
        type: Number,
        default: 0,
        min: 0
    },
    defaultTheoryClasses: {
        type: Number,
        default: 4
    },
    defaultLabSessions: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'academic_subjects'
});

// Indexes for unique constraints and performance
academicSubjectSchema.index({ code: 1 }, { unique: true });
academicSubjectSchema.index({ slug: 1 }, { unique: true });
academicSubjectSchema.index({ year: 1 });
academicSubjectSchema.index({ branch: 1 });
academicSubjectSchema.index({ scheme: 1 });
academicSubjectSchema.index({ branch: 1, year: 1, status: 1 });

module.exports = mongoose.models.AcademicSubjectCms || mongoose.model('AcademicSubjectCms', academicSubjectSchema);
