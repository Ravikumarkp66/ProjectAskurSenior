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
    },
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
        default: null
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicProgram',
        default: null
    }
}, {
    timestamps: true,
    collection: 'branches',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual code alias for shortName (CSE, ISE, MECH, etc.)
branchSchema.virtual('code').get(function() {
    return this.shortName;
});

branchSchema.index({ shortName: 1 }, { unique: true });
branchSchema.index({ displayOrder: 1 });

module.exports = mongoose.models.Branch || mongoose.model('Branch', branchSchema);
