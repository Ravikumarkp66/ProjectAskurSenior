const mongoose = require('mongoose');

const studentAttendanceSummarySchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        required: true
    },
    classesTaken: {
        type: Number,
        default: 0,
        min: 0
    },
    classesAttended: {
        type: Number,
        default: 0,
        min: 0
    },
    attendancePercentage: {
        type: Number,
        default: 100.00,
        min: 0,
        max: 100
    },
    currentStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    longestStreak: {
        type: Number,
        default: 0,
        min: 0
    },
    canMiss: {
        type: Number,
        default: 0,
        min: 0
    },
    needToAttend: {
        type: Number,
        default: 0,
        min: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'student_attendance_summaries'
});

// Compound unique index per student and subject
studentAttendanceSummarySchema.index({ student: 1, subject: 1 }, { unique: true });

module.exports = mongoose.models.StudentAttendanceSummary || mongoose.model('StudentAttendanceSummary', studentAttendanceSummarySchema);
