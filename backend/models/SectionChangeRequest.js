const mongoose = require('mongoose');

const sectionChangeRequestSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true,
        index: true
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicBatch',
        required: true
    },
    officialSemester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    currentSection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSection',
        required: true
    },
    requestedSection: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSection',
        required: true
    },
    currentLabBatch: {
        type: String,
        enum: ['B1', 'B2', null],
        default: null
    },
    requestedLabBatch: {
        type: String,
        enum: ['B1', 'B2', null],
        default: null
    },
    reason: {
        type: String,
        required: [true, 'Reason for section change is required'],
        trim: true,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
        index: true
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    reviewNotes: {
        type: String,
        default: ''
    },
    effectiveDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'section_change_requests'
});

sectionChangeRequestSchema.index({ student: 1, status: 1 });
sectionChangeRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.models.SectionChangeRequest || mongoose.model('SectionChangeRequest', sectionChangeRequestSchema);
