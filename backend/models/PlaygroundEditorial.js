const mongoose = require('mongoose');

const vivaQuestionSchema = new mongoose.Schema({
    q: {
        type: String,
        required: true
    },
    a: {
        type: String,
        required: true
    }
}, { _id: false });

const playgroundEditorialSchema = new mongoose.Schema({
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlaygroundProblem',
        required: true,
        unique: true,
        index: true
    },
    approach: {
        type: String,
        required: true
    },
    timeComplexity: {
        type: String,
        default: 'O(1)'
    },
    spaceComplexity: {
        type: String,
        default: 'O(1)'
    },
    stepByStep: [{
        type: String
    }],
    vivaQuestions: [vivaQuestionSchema],
    isPublished: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PlaygroundEditorial', playgroundEditorialSchema);
