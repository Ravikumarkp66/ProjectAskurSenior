const mongoose = require('mongoose');

const academicProfileSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true,
        unique: true
    },
    cgpa: {
        type: Number,
        default: null,
        min: 0,
        max: 10
    },
    creditsEarned: {
        type: Number,
        default: null,
        min: 0
    },
    backlogs: {
        type: Number,
        default: null,
        min: 0
    }
}, {
    timestamps: true,
    collection: 'academic_profiles'
});

academicProfileSchema.index({ student: 1 }, { unique: true });

module.exports = mongoose.model('AcademicProfile', academicProfileSchema);
