const BugReport = require('../models/BugReport');

const createBug = async (req, res) => {
    try {
        const { title, description, pageUrl } = req.body;

        if (!title || !String(title).trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!description || !String(description).trim()) {
            return res.status(400).json({ error: 'Description is required' });
        }
        if (!pageUrl || !String(pageUrl).trim()) {
            return res.status(400).json({ error: 'Page URL is required' });
        }

        const bug = await BugReport.create({
            userId: req.userId,
            title: String(title).trim(),
            description: String(description).trim(),
            pageUrl: String(pageUrl).trim()
        });

        return res.status(201).json({ message: 'Bug reported', bug });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const listBugs = async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status) query.status = status;

        const items = await BugReport.find(query)
            .populate('userId', 'usn email')
            .sort({ createdAt: -1 });

        return res.json({ items });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const updateBugStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['open', 'resolved'].includes(status)) {
            return res.status(400).json({ error: 'Status must be open or resolved' });
        }

        const update = { status };
        if (status === 'resolved') {
            update.resolvedAt = new Date();
        } else {
            update.resolvedAt = undefined;
        }

        const bug = await BugReport.findByIdAndUpdate(id, update, { new: true });
        if (!bug) {
            return res.status(404).json({ error: 'Bug not found' });
        }

        return res.json({ message: 'Bug updated', bug });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createBug,
    listBugs,
    updateBugStatus
};
