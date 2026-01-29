const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        branch: {
            type: String,
            required: true,
            enum: ['CSE', 'ISE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIML', 'DS', 'CSBS', 'IT']
        },
        subjectProgress: [
            {
                subjectId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Subject'
                },
                subjectName: String,
                totalQuestions: {
                    type: Number,
                    default: 0
                },
                completedQuestions: {
                    type: Number,
                    default: 0
                },
                modules: [
                    {
                        moduleId: mongoose.Schema.Types.ObjectId,
                        moduleNumber: Number,
                        totalQuestions: {
                            type: Number,
                            default: 0
                        },
                        completedQuestions: {
                            type: Number,
                            default: 0
                        }
                    }
                ]
            }
        ],
        totalProgress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Method to calculate overall progress
progressSchema.methods.calculateProgress = function () {
    let totalQuestions = 0;
    let completedQuestions = 0;

    this.subjectProgress.forEach((subject) => {
        totalQuestions += subject.totalQuestions;
        completedQuestions += subject.completedQuestions;
    });

    this.totalProgress =
        totalQuestions === 0 ? 0 : Math.round((completedQuestions / totalQuestions) * 100);
    this.lastUpdated = new Date();

    return this.totalProgress;
};

module.exports = mongoose.model('Progress', progressSchema);
