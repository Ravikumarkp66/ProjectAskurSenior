const contributorService = require('../services/contributorService');
const Contributor = require('../models/Contributor');

const getPublicContributors = async (req, res) => {
    try {
        const contributors = await contributorService.getVisibleContributors();
        return res.status(200).json({
            success: true,
            message: 'Contributors fetched successfully.',
            count: contributors.length,
            data: contributors
        });
    } catch (error) {
        console.error('Error fetching contributors:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve contributors.',
            error: error.message
        });
    }
};

const getAllContributorsAdmin = async (req, res) => {
    try {
        const contributors = await Contributor.find().sort({ order: 1 });
        return res.status(200).json({
            success: true,
            data: contributors
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

const createContributor = async (req, res) => {
    try {
        const newContributor = await Contributor.create(req.body);
        return res.status(201).json({
            success: true,
            message: 'Contributor added successfully.',
            data: newContributor
        });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

const updateContributor = async (req, res) => {
    try {
        const updated = await Contributor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Contributor not found.' });
        return res.status(200).json({
            success: true,
            message: 'Contributor updated successfully.',
            data: updated
        });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

const deleteContributor = async (req, res) => {
    try {
        const deleted = await Contributor.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Contributor not found.' });
        return res.status(200).json({
            success: true,
            message: 'Contributor deleted successfully.'
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getPublicContributors,
    getAllContributorsAdmin,
    createContributor,
    updateContributor,
    deleteContributor
};
