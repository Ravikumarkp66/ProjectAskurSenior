const mongoose = require('mongoose');

const contributorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    usn: {
        type: String,
        trim: true
    },
    branch: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        default: 'Community Contributor',
        trim: true
    },
    avatar: {
        type: String,
        default: null
    },
    order: {
        type: Number,
        default: 0
    },
    isVisible: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'contributors'
});

contributorSchema.index({ isVisible: 1, order: 1 });

module.exports = mongoose.model('Contributor', contributorSchema);
