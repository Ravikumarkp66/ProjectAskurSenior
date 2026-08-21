const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Published', 'Hidden'],
        default: 'Published'
    }
}, {
    timestamps: true,
    collection: 'schemes'
});

module.exports = mongoose.model('Scheme', schemeSchema);
