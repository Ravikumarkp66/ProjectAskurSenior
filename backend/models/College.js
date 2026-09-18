const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'College name is required'],
        trim: true
    },
    code: {
        type: String,
        required: [true, 'College code is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'College slug is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
        required: true
    },
    address: {
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
        country: { type: String, trim: true, default: 'India' }
    },
    website: {
        type: String,
        trim: true,
        default: ''
    },
    emailDomain: {
        type: String,
        trim: true,
        lowercase: true,
        default: 'sit.ac.in'
    }
}, {
    timestamps: true,
    collection: 'colleges'
});

collegeSchema.index({ code: 1 }, { unique: true });
collegeSchema.index({ slug: 1 }, { unique: true });
collegeSchema.index({ status: 1 });

module.exports = mongoose.models.College || mongoose.model('College', collegeSchema);
