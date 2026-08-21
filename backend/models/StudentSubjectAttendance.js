const mongoose = require('mongoose');

const historyItemSchema = new mongoose.Schema({
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    timeSlot: {
        type: String, // Format: "HH:MM-HH:MM"
        default: ''
    },
    lectureType: {
        type: String,
        default: 'Lecture'
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Medical Leave', 'On Duty', 'Cancelled'],
        required: true
    },
    isExtraClass: {
        type: Boolean,
        default: false
    },
    remarks: {
        type: String,
        default: ''
    }
}, { _id: true }); // Needs _id for deletion / identification of specific extra class history records

const studentSubjectAttendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true
    },
    academicSession: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms', // maps to the AcademicSubject model
        required: true
    },
    analytics: {
        expected: { type: Number, default: 0 },
        conducted: { type: Number, default: 0 },
        present: { type: Number, default: 0 },
        absent: { type: Number, default: 0 },
        cancelled: { type: Number, default: 0 },
        medicalLeave: { type: Number, default: 0 },
        onDuty: { type: Number, default: 0 }
    },
    streak: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 }
    },
    history: {
        type: [historyItemSchema],
        default: []
    }
}, {
    timestamps: true,
    collection: 'student_subject_attendances',
    versionKey: false
});

// Compound unique index on student + academicSession + subject
studentSubjectAttendanceSchema.index({ student: 1, academicSession: 1, subject: 1 }, { unique: true });

module.exports = mongoose.models.StudentSubjectAttendance || mongoose.model('StudentSubjectAttendance', studentSubjectAttendanceSchema);
