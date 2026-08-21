const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    shortName: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: true
    },
    department: {
        type: String,
        trim: true
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, {
    timestamps: true,
    collection: 'cms_branches'
});

// Compound index to ensure uniqueness of branch under a single program
branchSchema.index({ shortName: 1, program: 1 }, { unique: true });

module.exports = mongoose.models.CmsBranch || mongoose.model('CmsBranch', branchSchema);
