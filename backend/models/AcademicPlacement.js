const mongoose = require('mongoose');

const academicPlacementSchema = new mongoose.Schema({
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
    section: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSection',
        required: true
    },
    labBatch: {
        type: String,
        enum: ['B1', 'B2', null],
        default: null
    },
    effectiveFrom: {
        type: Date,
        required: true,
        default: Date.now
    },
    effectiveTo: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'SUPERSEDED', 'CANCELLED'],
        default: 'ACTIVE',
        index: true
    },
    createdBy: {
        type: String,
        enum: ['STUDENT', 'ADMIN', 'SYSTEM'],
        default: 'STUDENT'
    },
    adminReason: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    collection: 'academic_placements'
});

academicPlacementSchema.index({ student: 1, status: 1 });
academicPlacementSchema.index({ student: 1, effectiveFrom: 1 });

module.exports = mongoose.models.AcademicPlacement || mongoose.model('AcademicPlacement', academicPlacementSchema);
