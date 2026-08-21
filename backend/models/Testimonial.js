const mongoose = require('mongoose');

const testimonialSourceSchema = new mongoose.Schema({
    form: { type: String },
    serialNo: { type: Number }
}, { _id: false });

const testimonialSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true
    },
    review: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        default: 5,
        min: 1,
        max: 5
    },
    tags: [{
        type: String,
        trim: true
    }],
    source: testimonialSourceSchema,
    isPublished: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'testimonials'
});

// Index for performant search, filtering, and aggregation
testimonialSchema.index({ isPublished: 1, isFeatured: 1 });
testimonialSchema.index({ tags: 1 });
testimonialSchema.index({ review: 'text', email: 'text' });

module.exports = mongoose.model('Testimonial', testimonialSchema);
