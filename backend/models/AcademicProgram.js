const mongoose = require('mongoose');

const academicProgramSchema = new mongoose.Schema({
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
        required: [true, 'College reference is required']
    },
    name: {
        type: String,
        required: [true, 'Program name is required'],
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Program code is required'],
        uppercase: true,
        trim: true
    },
    level: {
        type: String,
        enum: ['Undergraduate', 'Postgraduate', 'Diploma', 'Doctorate'],
        default: 'Undergraduate',
        required: true
    },
    minSemesters: {
        type: Number,
        default: 1,
        min: 1
    },
    maxSemesters: {
        type: Number,
        required: [true, 'Maximum semesters count is required'],
        default: 8,
        min: 1
    },
    hasBranches: {
        type: Boolean,
        default: true,
        description: 'True for multi-branch programs (B.E.); false for single-cohort programs (MCA/MBA)'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
        required: true
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'academic_programs'
});

academicProgramSchema.index({ code: 1, college: 1 }, { unique: true });
academicProgramSchema.index({ college: 1, status: 1 });

module.exports = mongoose.models.AcademicProgram || mongoose.model('AcademicProgram', academicProgramSchema);
