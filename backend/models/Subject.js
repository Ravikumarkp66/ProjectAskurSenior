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
    questions: [questionSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
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
