const mongoose = require('mongoose');

const playgroundProblemLanguageSchema = new mongoose.Schema({
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlaygroundProblem',
        required: true,
        index: true
    },
    languageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlaygroundLanguage',
        required: true,
        index: true
    },
    languageSlug: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    starterCode: {
        type: String,
        required: true
    },
    solutionCode: {
        type: String,
        default: ''
    },
    functionSignature: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true
});

playgroundProblemLanguageSchema.index({ problemId: 1, languageSlug: 1 }, { unique: true });

module.exports = mongoose.model('PlaygroundProblemLanguage', playgroundProblemLanguageSchema);
