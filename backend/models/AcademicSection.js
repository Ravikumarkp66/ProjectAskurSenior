const mongoose = require('mongoose');

const academicSectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Section name is required'],
        uppercase: true,
        trim: true
    },
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
        required: [true, 'College reference is required']
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicProgram',
        required: [true, 'Program reference is required']
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        default: null,
        description: 'Optional; null for single-cohort programs (e.g. MCA)'
    },
    batch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicBatch',
        required: [true, 'Batch reference is required']
    },
    academicSemester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        default: null
    },
    semester: {
        type: Number,
        required: [true, 'Semester number is required'],
        min: 1,
        max: 12
    },
    room: {
        type: String,
        trim: true,
        default: ''
    },
    capacity: {
        type: Number,
        default: 60,
        min: 1
    },
    status: {
        type: String,
        enum: ['Active', 'Archived'],
        default: 'Active',
        required: true
    }
}, {
    timestamps: true,
    collection: 'academic_sections'
});

academicSectionSchema.index({ batch: 1, branch: 1, semester: 1, name: 1 }, { unique: true });
academicSectionSchema.index({ batch: 1, branch: 1, academicSemester: 1, name: 1 }, { unique: true, sparse: true });
academicSectionSchema.index({ college: 1, status: 1 });

module.exports = mongoose.models.AcademicSection || mongoose.model('AcademicSection', academicSectionSchema);
