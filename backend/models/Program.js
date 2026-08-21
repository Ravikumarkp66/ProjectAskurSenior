const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    shortName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'cms_programs'
});

module.exports = mongoose.model('Program', programSchema);
