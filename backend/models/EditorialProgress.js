const mongoose = require('mongoose');

const completedTopicSchema = new mongoose.Schema({
    moduleSlug: {
        type: String,
        required: true,
        trim: true
    },
    topicSlug: {
        type: String,
        required: true,
        trim: true
    },
    topicId: {
        type: String,
        trim: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const editorialProgressSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    subjectSlug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    completedTopics: [completedTopicSchema]
}, {
    timestamps: true
});

editorialProgressSchema.index({ studentId: 1, subjectSlug: 1 }, { unique: true });

module.exports = mongoose.model('EditorialProgress', editorialProgressSchema);
