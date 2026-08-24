const mongoose = require('mongoose');

const playgroundLabSchema = new mongoose.Schema({
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicSubject',
        default: null
    },
    subjectName: {
        type: String,
        required: true,
        trim: true
    },
    courseCode: {
        type: String,
        default: ''
    },
    labNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    description: {
        type: String,
        default: ''
    },
    displayOrder: {
        type: Number,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PlaygroundLab', playgroundLabSchema);
