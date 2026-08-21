const mongoose = require('mongoose');

const facultyReviewSchema = new mongoose.Schema(
    {
        facultyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Faculty',
            required: true,
            index: true,
        },
        author: {
            type: String,
            default: 'Anonymous Student',
            trim: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            default: '',
            trim: true,
        },
        tags: [
            {
                type: String,
                trim: true,
            }
        ],
        helpfulCount: {
            type: Number,
            default: 0,
        },

        // V1 Structured Feedback Journey Parameters
        subjects: [{ type: String, trim: true }],
        roles: [{ type: String, trim: true }],
        classroomStyle: [{ type: String, trim: true }],
        engagementStyle: [{ type: String, trim: true }],
        performanceTreatment: [{ type: String, trim: true }],
        singledOut: { type: String, trim: true },
        approachability: { type: String, trim: true },

        // Marks (Student Estimates)
        cieMarks: { type: Number, min: 0, max: 50, default: null },
        internalMarks: { type: Number, min: 0, max: 50, default: null },
        quizMarks: { type: Number, min: 0, max: 20, default: null },

        attendanceResponse: { type: String, trim: true },
        wishIKnew: { type: String, trim: true, maxlength: 250 },
        advice: { type: String, trim: true, maxlength: 250 },
        recommendation: { type: String, trim: true }
    },
    {
        timestamps: true,
        collection: 'faculty_reviews',
    }
);

module.exports = mongoose.models.FacultyReview || mongoose.model('FacultyReview', facultyReviewSchema);
