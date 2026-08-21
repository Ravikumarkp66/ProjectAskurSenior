const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
    number: {
        type: Number,
        required: true
    },
    label: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: true
    }
}, {
    timestamps: true,
    collection: 'cms_semesters'
});

// Ensure a program has only unique semester numbers
semesterSchema.index({ number: 1, program: 1 }, { unique: true });

module.exports = mongoose.model('Semester', semesterSchema);
