const mongoose = require('mongoose');

const studentTimetableSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true
    },
    dayOfWeek: {
        type: Number, // 1 = Monday, ..., 7 = Sunday
        required: true,
        min: 1,
        max: 7
    },
    startMinute: {
        type: Number,
        required: true,
        min: 0,
        max: 1439
    },
    endMinute: {
        type: Number,
        required: true,
        min: 0,
        max: 1439
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        default: null
    },
    room: {
        type: String,
        trim: true,
        default: ''
    },
    faculty: {
        type: String,
        trim: true,
        default: ''
    },
    lectureType: {
        type: String,
        enum: ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Project', 'Free Period', 'Break'],
        default: 'Lecture'
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled', 'Holiday'],
        default: 'Scheduled'
    },
    sessionGroupId: {
        type: String,
        default: null
    },
    semester: {
        type: Number,
        required: true,
        default: 1
    },
    version: {
        type: Number,
        required: true,
        default: 1
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    timestamps: true,
    collection: 'student_timetables'
});

// Compound unique index to guarantee no overlapping starts for a student, version, and semester
studentTimetableSchema.index({ student: 1, semester: 1, version: 1, dayOfWeek: 1, startMinute: 1 }, { unique: true });
studentTimetableSchema.index({ student: 1, semester: 1, version: 1, dayOfWeek: 1 });
studentTimetableSchema.index({ student: 1, dayOfWeek: 1, semester: 1 });
studentTimetableSchema.index({ student: 1, semester: 1 });

module.exports = mongoose.model('StudentTimetable', studentTimetableSchema);
