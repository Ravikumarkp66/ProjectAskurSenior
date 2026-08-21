const mongoose = require('mongoose');

const materialTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    label: {
        type: String,
        required: true,
        trim: true
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    collection: 'cms_material_types'
});

module.exports = mongoose.model('MaterialType', materialTypeSchema);
