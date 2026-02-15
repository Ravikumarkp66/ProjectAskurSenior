const mongoose = require('mongoose');

const interviewExperienceSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            required: true,
            index: true
        },
        role: {
            type: String,
            required: true,
            default: 'Not disclosed',
            index: true
        },
        questions: {
            type: [String],
            required: true
        },
        focus: {
            type: String,
            required: true
        },
        package: {
            type: String,
            default: 'Not disclosed'
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('InterviewExperience', interviewExperienceSchema);
