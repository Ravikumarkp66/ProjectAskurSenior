const mongoose = require('mongoose');

const playgroundSubmissionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentAccount',
        required: true,
        index: true
    },
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlaygroundProblem',
        required: true,
        index: true
    },
    languageSlug: {
        type: String,
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: [
            'Accepted', 
            'Wrong Answer', 
            'Time Limit Exceeded', 
            'Runtime Error', 
            'Compilation Error',
            'Memory Limit Exceeded',
            'Output Limit Exceeded',
            'Execution Error'
        ],
        required: true,
        index: true
    },
    runtime: {
        type: String,
        default: '0ms'
    },
    memory: {
        type: String,
        default: null
    },
    passedTestCases: {
        type: Number,
        default: 0
    },
    totalTestCases: {
        type: Number,
        default: 0
    },
    testCaseResults: {
        type: Array,
        default: []
    },
    stderr: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

playgroundSubmissionSchema.index({ studentId: 1, problemId: 1, createdAt: -1 });

module.exports = mongoose.model('PlaygroundSubmission', playgroundSubmissionSchema);
