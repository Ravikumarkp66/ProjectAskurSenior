const testimonialService = require('../services/testimonialService');

const getTestimonials = async (req, res) => {
    try {
        const { page, limit, search, tag, isFeatured } = req.query;
        const result = await testimonialService.getTestimonials({ page, limit, search, tag, isFeatured });
        return res.status(200).json({
            success: true,
            message: 'Testimonials retrieved successfully.',
            ...result
        });
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve testimonials.',
            error: error.message
        });
    }
};

const getRandomTestimonials = async (req, res) => {
    try {
        const limit = req.query.limit || 24;
        const data = await testimonialService.getRandomTestimonials(limit);
        return res.status(200).json({
            success: true,
            message: 'Random testimonials fetched successfully.',
            count: data.length,
            data
        });
    } catch (error) {
        console.error('Error fetching random testimonials:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve random testimonials.',
            error: error.message
        });
    }
};

const getFeaturedTestimonials = async (req, res) => {
    try {
        const data = await testimonialService.getFeaturedTestimonials();
        return res.status(200).json({
            success: true,
            message: 'Featured testimonials fetched successfully.',
            count: data.length,
            data
        });
    } catch (error) {
        console.error('Error fetching featured testimonials:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve featured testimonials.',
            error: error.message
        });
    }
};

module.exports = {
    getTestimonials,
    getRandomTestimonials,
    getFeaturedTestimonials
};
