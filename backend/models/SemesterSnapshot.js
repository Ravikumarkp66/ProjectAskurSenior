const mongoose = require('mongoose');

const semesterSnapshotSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    configuration: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    timetable: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    subjects: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    events: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    workingDays: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    holidays: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    expectedClasses: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    }
}, {
    timestamps: true,
    collection: 'semester_snapshots',
    versionKey: false
});

semesterSnapshotSchema.index({ student: 1, semester: 1 }, { unique: true });

module.exports = mongoose.models.SemesterSnapshot || mongoose.model('SemesterSnapshot', semesterSnapshotSchema);
