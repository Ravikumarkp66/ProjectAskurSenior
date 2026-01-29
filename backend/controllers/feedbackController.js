const Feedback = require('../models/Feedback');

const createFeedback = async (req, res) => {
    try {
        const { rating, message } = req.body;

        if (!rating || Number.isNaN(Number(rating))) {
            return res.status(400).json({ error: 'Rating is required' });
        }

        const normalizedRating = Number(rating);
        if (normalizedRating < 1 || normalizedRating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        const feedback = await Feedback.create({
            userId: req.userId,
            rating: normalizedRating,
            message: message ? String(message).trim() : undefined
        });

        return res.status(201).json({ message: 'Feedback submitted', feedback });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const getMyLatestFeedback = async (req, res) => {
    try {
        const item = await Feedback.findOne({ userId: req.userId }).sort({ createdAt: -1 });
        return res.json({ item: item || null });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const listFeedback = async (req, res) => {
    try {
        const items = await Feedback.find()
            .populate('userId', 'usn email')
            .sort({ createdAt: -1 });

        return res.json({ items });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const feedbackStats = async (req, res) => {
    try {
        const result = await Feedback.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    avgRating: { $avg: '$rating' }
                }
            }
        ]);

        const stats = result?.[0]
            ? {
                  total: result[0].total,
                  avgRating: Math.round(result[0].avgRating * 10) / 10
              }
            : { total: 0, avgRating: 0 };

        return res.json({ stats });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createFeedback,
    listFeedback,
    feedbackStats,
    getMyLatestFeedback
};
