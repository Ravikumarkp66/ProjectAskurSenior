const Progress = require('../models/Progress');

const getUserProgress = async (req, res) => {
    try {
        const progress = await Progress.findOne({ userId: req.userId }).populate(
            'subjectProgress.subjectId'
        );

        if (!progress) {
            return res.status(404).json({ error: 'Progress not found' });
        }

        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProgressByBranch = async (req, res) => {
    try {
        const { branch } = req.params;

        const progress = await Progress.findOne({
            userId: req.userId,
            branch: branch
        });

        if (!progress) {
            return res.status(404).json({ error: 'Progress not found for this branch' });
        }

        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getUserProgress,
    getProgressByBranch
};
