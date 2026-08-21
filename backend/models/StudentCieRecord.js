const mongoose = require('mongoose');

const studentCieRecordSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true,
        index: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
        index: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        default: null
    },
    registeredSubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentRegisteredSubject',
        required: true,
        index: true
    },
    evaluationType: {
        type: String,
        enum: ['IPCC', 'THEORY_ONLY', 'LAB_ONLY', 'LOW_THEORY'],
        required: true
    },
    rawMarks: {
        test1: { type: Number, default: null, min: 0 },
        test2: { type: Number, default: null, min: 0 },
        quiz1: { type: Number, default: null, min: 0 },
        quiz2: { type: Number, default: null, min: 0 },
        assignment1: { type: Number, default: null, min: 0 },
        assignment2: { type: Number, default: null, min: 0 },
        labRecord: { type: Number, default: null, min: 0 },
        labTest: { type: Number, default: null, min: 0 }
    },
    calculatedResult: {
        contributions: {
            tests: { type: Number, default: 0 },
            quizzes: { type: Number, default: 0 },
            assignments: { type: Number, default: 0 },
            labRecord: { type: Number, default: 0 },
            labTest: { type: Number, default: 0 },
            internalAssessment: { type: Number, default: 0 },
            theoryTotal: { type: Number, default: 0 },
            practicalTotal: { type: Number, default: 0 }
        },
        totalCie: { type: Number, default: 0 },
        maxCie: { type: Number, default: 50 },
        isEligible: { type: Boolean, default: false },
        status: {
            type: String,
            enum: ['NOT_STARTED', 'PARTIAL', 'ELIGIBLE', 'NOT_ELIGIBLE'],
            default: 'NOT_STARTED'
        },
        failedRequirements: [{ type: String }],
        lastCalculatedAt: { type: Date, default: Date.now }
    }
}, {
    timestamps: true
});

studentCieRecordSchema.index({ student: 1, semester: 1, registeredSubject: 1 }, { unique: true });

module.exports = mongoose.model('StudentCieRecord', studentCieRecordSchema);
