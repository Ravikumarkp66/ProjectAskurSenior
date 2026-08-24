const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    changedAt: {
        type: Date,
        default: Date.now
    },
    changedBy: {
        type: String,
        enum: ['STUDENT', 'FACULTY', 'ADMIN', 'SYSTEM', 'Student', 'Faculty', 'Admin', 'System'],
        default: 'STUDENT'
    },
    action: {
        type: String,
        default: 'STATUS_CHANGED'
    },
    field: {
        type: String,
        default: 'status'
    },
    from: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    to: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    previous: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    next: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, { _id: false });

const classOccurrenceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true,
        index: true
    },
    semester: {
        type: Number,
        required: true,
        index: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true,
        index: true
    },
    startMinute: {
        type: Number,
        default: 0
    },
    endMinute: {
        type: Number,
        default: 0
    },
    startTime: {
        type: String, // Format: HH:MM
        default: ''
    },
    endTime: {
        type: String, // Format: HH:MM
        default: ''
    },
    timeSlot: {
        type: String, // e.g. "08:00-09:00"
        default: ''
    },
    scheduledSubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        required: true
    },
    actualSubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        required: true
    },
    sessionType: {
        type: String,
        enum: ['Theory', 'Lab', 'Tutorial', 'Lecture'],
        default: 'Lecture'
    },
    occurrenceType: {
        type: String,
        enum: ['REGULAR', 'SWAPPED', 'EXTRA', 'MAKEUP', 'SUSPENDED'],
        default: 'REGULAR',
        index: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'PRESENT', 'ABSENT', 'SUSPENDED', 'MEDICAL_LEAVE', 'ON_DUTY'],
        default: 'PENDING',
        index: true
    },
    isExtraClass: {
        type: Boolean,
        default: false
    },
    remarks: {
        type: String,
        default: ''
    },
    markedAt: {
        type: Date,
        default: null
    },
    markedBy: {
        type: String,
        enum: ['STUDENT', 'FACULTY', 'ADMIN', 'SYSTEM', 'Student', 'Faculty', 'Admin', 'System'],
        default: 'STUDENT'
    },
    auditHistory: [auditLogSchema]
}, {
    timestamps: true,
    collection: 'class_occurrences',
    versionKey: false
});

// Compound unique index to prevent duplicate class occurrences for a student slot on a given date
classOccurrenceSchema.index(
    { student: 1, semester: 1, date: 1, timeSlot: 1, scheduledSubject: 1 },
    { unique: true }
);

// High-performance query indexes for analytics and daily views
classOccurrenceSchema.index({ student: 1, semester: 1, date: 1 });
classOccurrenceSchema.index({ student: 1, semester: 1, actualSubject: 1, status: 1 });
classOccurrenceSchema.index({ student: 1, semester: 1, occurrenceType: 1 });

module.exports = mongoose.models.ClassOccurrence || mongoose.model('ClassOccurrence', classOccurrenceSchema);
