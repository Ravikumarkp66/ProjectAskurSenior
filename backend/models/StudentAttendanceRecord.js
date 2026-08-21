const mongoose = require('mongoose');

const studentAttendanceRecordSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true
    },
    scheduledSubject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        default: null
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    timeSlot: {
        type: String, // format: "HH:MM AM" or "HH:MM AM - HH:MM AM"
        default: ''
    },
    lectureType: {
        type: String,
        enum: ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Project', 'Free Period', 'Break'],
        default: 'Lecture'
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Medical Leave', 'On Duty', 'Cancelled', 'Suspended'],
        required: true
    },
    isExtraClass: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: String,
        enum: ['system', 'student'],
        default: 'system'
    },
    remarks: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    collection: 'student_attendance_records'
});

// Index for query optimization
studentAttendanceRecordSchema.index({ student: 1, subject: 1 });
studentAttendanceRecordSchema.index({ student: 1, date: 1 });

// Ensure unique timetable-based records (non-extra classes)
studentAttendanceRecordSchema.index(
    { student: 1, subject: 1, date: 1, timeSlot: 1 },
    { unique: true, partialFilterExpression: { isExtraClass: false } }
);

module.exports = mongoose.models.StudentAttendanceRecord || mongoose.model('StudentAttendanceRecord', studentAttendanceRecordSchema);
