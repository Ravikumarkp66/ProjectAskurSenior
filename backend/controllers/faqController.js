const faqService = require('../services/faqService');
const Faq = require('../models/Faq');

const getFaqs = async (req, res) => {
    try {
        const groupedFaqs = await faqService.getGroupedFaqs();
        return res.status(200).json({
            success: true,
            message: 'FAQs fetched successfully.',
            data: groupedFaqs
        });
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve FAQs.',
            error: error.message
        });
    }
};

const getAllFaqsAdmin = async (req, res) => {
    try {
        const faqs = await Faq.find().sort({ category: 1, order: 1 });
        return res.status(200).json({
            success: true,
            data: faqs
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

const createFaq = async (req, res) => {
    try {
        const newFaq = await Faq.create(req.body);
        return res.status(201).json({
            success: true,
            message: 'FAQ item added successfully.',
            data: newFaq
        });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

const updateFaq = async (req, res) => {
    try {
        const updated = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'FAQ item not found.' });
        return res.status(200).json({
            success: true,
            message: 'FAQ item updated successfully.',
            data: updated
        });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

const deleteFaq = async (req, res) => {
    try {
        const deleted = await Faq.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'FAQ item not found.' });
        return res.status(200).json({
            success: true,
            message: 'FAQ item deleted successfully.'
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getFaqs,
    getAllFaqsAdmin,
    createFaq,
    updateFaq,
    deleteFaq
};
