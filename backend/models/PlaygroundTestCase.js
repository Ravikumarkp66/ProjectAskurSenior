const mongoose = require('mongoose');

const playgroundTestCaseSchema = new mongoose.Schema({
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlaygroundProblem',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    input: {
        type: String,
        required: true
    },
    expectedOutput: {
        type: String,
        required: true
    },
    isHidden: {
        type: Boolean,
        default: false,
        index: true
    },
    displayOrder: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PlaygroundTestCase', playgroundTestCaseSchema);
