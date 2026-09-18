const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        trim: true,
        default: null
    },
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
        default: null
    },
    status: {
        type: String,
        enum: ['Published', 'Hidden', 'Active', 'Inactive'],
        default: 'Active'
    }
}, {
    timestamps: true,
    collection: 'schemes'
});

// Index to support college-specific schemes while allowing legacy global schemes
schemeSchema.index({ name: 1, college: 1 }, { unique: true });

module.exports = mongoose.models.Scheme || mongoose.model('Scheme', schemeSchema);
