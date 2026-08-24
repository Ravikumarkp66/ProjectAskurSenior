const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema({
    input: {
        type: String,
        required: true
    },
    output: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        default: ''
    }
}, { _id: false });

const quizSchema = new mongoose.Schema({
    question: {
        type: String,
        default: 'What will be the output for the following input?'
    },
    input: {
        type: String,
        required: true
    },
    expectedOutput: {
        type: String,
        required: true
    },
    options: [{
        type: String
    }],
    explanation: {
        type: String,
        default: ''
    }
}, { _id: false });

const playgroundProblemSchema = new mongoose.Schema({
    labId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlaygroundLab',
        required: true,
        index: true
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
    programNumber: {
        type: Number,
        required: true
    },
    shortObjective: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    inputFormat: {
        type: String,
        required: true
    },
    outputFormat: {
        type: String,
        required: true
    },
    constraints: [{
        type: String
    }],
    examples: [exampleSchema],
    quiz: {
        type: quizSchema,
        default: null
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Easy'
    },
    concepts: [{
        type: String
    }],
    hints: [{
        type: String
    }],
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

module.exports = mongoose.model('PlaygroundProblem', playgroundProblemSchema);
