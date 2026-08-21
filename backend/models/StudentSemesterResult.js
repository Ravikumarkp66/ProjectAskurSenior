const mongoose = require('mongoose');

const subjectResultSchema = new mongoose.Schema({
    registeredSubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentRegisteredSubject',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        default: null
    },
    subjectCode: { type: String, default: '' },
    subjectName: { type: String, default: '' },
    credits: { type: Number, default: 0 },

    // Imported CIE from CIE Analyzer
    cieRecord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentCieRecord',
        default: null
    },
    cieMarks: { type: Number, default: null },
    cieMax: { type: Number, default: 50 },
    cieStatus: { type: String, default: 'NOT_STARTED' },

    // Student Entered SEE
    seeRawMarks: { type: Number, default: null },
    seeRawMaximum: { type: Number, default: 100 },
    seeScaledMarks: { type: Number, default: null },
    seeScaledMaximum: { type: Number, default: 50 },

    // Calculated Final Results
    totalMarks: { type: Number, default: null },
    totalMaxMarks: { type: Number, default: 100 },
    grade: { type: String, default: 'PENDING' },
    gradePoint: { type: Number, default: 0 },
    creditPoints: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['PENDING', 'ELIGIBLE', 'COMPLETED', 'FAILED', 'NE'],
        default: 'PENDING'
    },
    failureReason: { type: String, default: null }
}, { _id: false });

const studentSemesterResultSchema = new mongoose.Schema({
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
    subjects: [subjectResultSchema],
    totalCredits: { type: Number, default: 0 },
    totalCreditPoints: { type: Number, default: 0 },
    sgpa: { type: Number, default: null },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED_SUBJECTS', 'NE'],
        default: 'PENDING'
    },
    rulesVersion: { type: String, default: '1.0.0' }
}, {
    timestamps: true
});

studentSemesterResultSchema.index({ student: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('StudentSemesterResult', studentSemesterResultSchema);
