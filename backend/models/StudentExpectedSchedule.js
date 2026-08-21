const mongoose = require('mongoose');

const expectedClassSchema = new mongoose.Schema({
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    timeSlot: {
        type: String, // Format: "HH:MM-HH:MM"
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubjectCms',
        required: true
    },
    lectureType: {
        type: String,
        default: 'Lecture'
    },
    dayOfWeek: {
        type: Number,
        required: true
    }
}, { _id: false });

const studentExpectedScheduleSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    version: {
        type: Number,
        required: true
    },
    classes: {
        type: [expectedClassSchema],
        default: []
    },
    lastCalculated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'student_expected_schedules',
    versionKey: false
});

studentExpectedScheduleSchema.index({ student: 1, semester: 1 }, { unique: true });

module.exports = mongoose.models.StudentExpectedSchedule || mongoose.model('StudentExpectedSchedule', studentExpectedScheduleSchema);
