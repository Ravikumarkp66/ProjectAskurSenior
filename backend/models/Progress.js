const mongoose = require('mongoose');

const moduleProgressSchema = new mongoose.Schema({
    moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    moduleNumber: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    completedQuestions: {
        type: Number,
        default: 0
    }
}, { _id: false });

const subjectProgressSchema = new mongoose.Schema({
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    subjectName: {
        type: String,
        required: true
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    completedQuestions: {
        type: Number,
        default: 0
    },
    modules: [moduleProgressSchema]
}, { _id: false });

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    completedQuestions: {
        type: Number,
        default: 0
    },
    overallPercentage: {
        type: Number,
        default: 0
    },
    subjectProgress: [subjectProgressSchema]
}, {
    timestamps: true
});

// Method to calculate overall progress
progressSchema.methods.calculateProgress = function() {
    let totalQuestions = 0;
    let completedQuestions = 0;

    this.subjectProgress.forEach(subject => {
        totalQuestions += subject.totalQuestions;
        completedQuestions += subject.completedQuestions;
    });

    this.totalQuestions = totalQuestions;
    this.completedQuestions = completedQuestions;
    this.overallPercentage = totalQuestions > 0 
        ? Math.round((completedQuestions / totalQuestions) * 100) 
        : 0;
};

module.exports = mongoose.model('Progress', progressSchema);
