const mongoose = require('mongoose');

const studentSemesterSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1
    },
    academicYear: {
        type: String,
        trim: true
    },
    sgpa: {
        type: Number,
        required: true,
        min: 0,
        max: 10
    },
    credits: {
        type: Number,
        default: 20
    },
    status: {
        type: String,
        enum: ['completed', 'current', 'upcoming'],
        default: 'completed'
    }
}, {
    timestamps: true,
    collection: 'student_semesters'
});

// Compound unique index on student + semester
studentSemesterSchema.index({ student: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('StudentSemester', studentSemesterSchema);
