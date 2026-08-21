const Scheme = require('../models/Scheme');

// @desc    Get all schemes
// @route   GET /api/admin/schemes
// @access  Private/Admin
const getSchemes = async (req, res) => {
    try {
        const schemes = await Scheme.find().sort({ name: -1 });
        res.status(200).json({
            success: true,
            data: schemes
        });
    } catch (error) {
        console.error('Error in getSchemes:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

// @desc    Create a new scheme
// @route   POST /api/admin/schemes
// @access  Private/Admin
const createScheme = async (req, res) => {
    try {
        const { name, status } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a scheme name'
            });
        }

        const schemeExists = await Scheme.findOne({ name });
        if (schemeExists) {
            return res.status(400).json({
                success: false,
                message: 'Scheme already exists'
            });
        }

        const scheme = await Scheme.create({
            name,
            status: status || 'Published'
        });

        res.status(201).json({
            success: true,
            data: scheme
        });
    } catch (error) {
        console.error('Error in createScheme:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

module.exports = {
    getSchemes,
    createScheme
};
