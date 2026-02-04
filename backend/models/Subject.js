const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    completed: {
        type: Boolean,
        default: false
    }
});

// Schema for content items (notes, pyqs, question banks)
const contentItemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    fileKey: {
        type: String,
        required: true  // S3 key for the file
    },
    fileType: {
        type: String,
        default: 'pdf'
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

const moduleSchema = new mongoose.Schema({
    moduleNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: true,
        default: function () {
            return `Module ${this.moduleNumber}`;
        }
    },
    notesKey: {
        type: String,
        default: null  // S3 key for the PDF notes (legacy - keeping for backward compatibility)
    },
    // New structure for multiple content items per module
    notes: [contentItemSchema],        // Multiple notes per module
    pyqs: [contentItemSchema],         // Previous Year Questions
    questionBanks: [contentItemSchema], // Question Banks
    questions: [questionSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Subject-level content schema (syllabus is typically one per subject)
const subjectContentSchema = new mongoose.Schema({
    syllabus: [contentItemSchema],      // Syllabus files for the subject
    resources: [contentItemSchema]      // Additional resources
});

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: false
    },
    credits: {
        type: Number,
        required: true,
        min: 0
    },
    cycle: {
        type: String,
        required: true,
        enum: ['P', 'C']
    },
    modules: [moduleSchema],
    // Subject-level content
    syllabus: [contentItemSchema],      // Syllabus files
    resources: [contentItemSchema],     // Additional resources
    branch: {
        type: String,
        required: true,
        enum: [
            'CSE',
            'ISE',
            'ECE',
            'EEE',
            'MECH',
            'CIVIL',
            'AIML',
            'DS',
            'CSBS',
            'IT',
            'CV',
            'CS',
            'IS',
            'CI',
            'BT',
            'ME',
            'IM',
            'CH',
            'EE',
            'EC',
            'ET',
            'EI'
        ]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

subjectSchema.index({ code: 1, branch: 1, cycle: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
