const InterviewExperience = require('../models/InterviewExperience');

// @desc    Get all interview experiences
// @route   GET /api/interview-experiences
// @access  Public
const getExperiences = async (req, res) => {
    try {
        const { company, role } = req.query;
        let query = {};

        if (company) {
            query.company = { $regex: company, $options: 'i' };
        }

        if (role) {
            query.role = { $regex: role, $options: 'i' };
        }

        const experiences = await InterviewExperience.find(query).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: experiences.length,
            data: experiences
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// @desc    Add multiple interview experiences (Internal/Admin only)
// @route   POST /api/interview-experiences/bulk
// @access  Private/Admin
const addBulkExperiences = async (req, res) => {
    try {
        const experiences = await InterviewExperience.insertMany(req.body);
        res.status(201).json({
            success: true,
            data: experiences
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getExperiences,
    addBulkExperiences
};
