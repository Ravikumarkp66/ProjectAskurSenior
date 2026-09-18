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
    semester: {
        type: Number,
        min: 1,
        max: 8,
        default: null,
        validate: {
            validator: function(val) {
                return val === null || (Number.isInteger(val) && val >= 1 && val <= 8);
            },
            message: '{VALUE} must be an integer between 1 and 8 or null'
        }
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
    },
    category: {
        type: String,
        enum: ['Theory', 'Theory + Lab', 'Lab Only', 'Project', 'Seminar', 'Elective'],
        default: 'Theory'
    },
    evaluationType: {
        type: String,
        enum: ['IPCC', 'THEORY_ONLY', 'LAB_ONLY', 'LOW_THEORY'],
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    creatorEmail: {
        type: String,
        lowercase: true,
        trim: true,
        default: null
    }
}, {
    timestamps: true,
    collection: 'academic_subjects'
});

// Indexes for unique constraints and performance
academicSubjectSchema.index({ code: 1 }, { unique: true });
academicSubjectSchema.index({ slug: 1 }, { unique: true });
academicSubjectSchema.index({ year: 1 });
academicSubjectSchema.index({ status: 1 });
academicSubjectSchema.index({ year: 1, status: 1 });
academicSubjectSchema.index({ branch: 1 });
academicSubjectSchema.index({ scheme: 1 });
academicSubjectSchema.index({ branch: 1, year: 1, status: 1 });
academicSubjectSchema.index({ semester: 1 });
academicSubjectSchema.index({ scheme: 1, branch: 1, semester: 1, status: 1 });

module.exports = mongoose.models.AcademicSubjectCms || mongoose.model('AcademicSubjectCms', academicSubjectSchema);
