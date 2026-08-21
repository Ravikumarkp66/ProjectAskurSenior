const mongoose = require('mongoose');

const studentAttendanceEntrySchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    semesterSnapshotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SemesterSnapshot',
        default: null
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
        type: String, // Format: YYYY-MM-DD
        required: true
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
    timeSlot: {
        type: String, // Optional: e.g. "08:00-09:00"
        default: ''
    },
    remarks: {
        type: String,
        default: ''
    },
    createdBy: {
        type: String,
        enum: ['System', 'Student', 'Faculty'],
        default: 'Student'
    }
}, {
    timestamps: true,
    collection: 'student_attendance_entries',
    versionKey: false
});

// Unique index to prevent duplicate attendance entry for same subject slot on a specific date
studentAttendanceEntrySchema.index({ student: 1, semester: 1, subject: 1, date: 1, timeSlot: 1 }, { unique: true });
studentAttendanceEntrySchema.index({ student: 1, date: 1 });

module.exports = mongoose.models.StudentAttendanceEntry || mongoose.model('StudentAttendanceEntry', studentAttendanceEntrySchema);
