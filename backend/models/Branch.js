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
        unique: true,
        trim: true,
        uppercase: true
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Published', 'Hidden'],
        default: 'Published'
    }
}, {
    timestamps: true,
    collection: 'branches'
});

branchSchema.index({ shortName: 1 }, { unique: true });
branchSchema.index({ displayOrder: 1 });

module.exports = mongoose.models.Branch || mongoose.model('Branch', branchSchema);
