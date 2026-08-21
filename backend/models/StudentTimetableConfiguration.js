const mongoose = require('mongoose');

const breakSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    startMinute: {
        type: Number,
        required: true,
        min: 0,
        max: 1439
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });

const studentTimetableConfigurationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true
    },
    semester: {
        type: Number,
        required: true,
        default: 1
    },
    semesterStartDate: {
        type: Date,
        required: true
    },
    lastWorkingDate: {
        type: Date,
        required: true
    },
    collegeStartMinute: {
        type: Number,
        required: true,
        min: 0,
        max: 1439,
        default: 480 // 08:00 AM
    },
    collegeEndMinute: {
        type: Number,
        required: true,
        min: 0,
        max: 1439,
        default: 1020 // 05:00 PM
    },
    classDuration: {
        type: Number,
        required: true,
        min: 10,
        default: 50
    },
    attendanceThreshold: {
        type: Number,
        default: 75,
        min: 1,
        max: 100
    },
    workingDays: {
        type: Map,
        of: {
            type: String,
            enum: ['Full Day', 'Half Day', 'Holiday']
        },
        default: () => new Map([
            ['1', 'Full Day'],
            ['2', 'Full Day'],
            ['3', 'Full Day'],
            ['4', 'Full Day'],
            ['5', 'Full Day'],
            ['6', 'Half Day'],
            ['7', 'Holiday']
        ])
    },
    breaks: {
        type: [breakSchema],
        default: []
    },
    version: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true,
    collection: 'student_timetable_configurations'
});

// Compound unique index per student per semester
studentTimetableConfigurationSchema.index({ student: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('StudentTimetableConfiguration', studentTimetableConfigurationSchema);
