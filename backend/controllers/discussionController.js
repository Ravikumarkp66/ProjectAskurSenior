const Discussion = require('../models/Discussion');

// Get all discussions for a subject (optionally filter by category)
exports.getDiscussions = async (req, res) => {
    try {
        const { subjectId, category } = req.query;
        if (!subjectId) {
            return res.status(400).json({ error: 'subjectId is required' });
        }

        const query = { subjectId };
        if (category && category !== 'All') {
            query.category = category;
        }

        const discussions = await Discussion.find(query)
            .populate('author', 'name usn profilePicture')
            .populate('replies.author', 'name usn profilePicture role')
            .sort({ pinned: -1, createdAt: -1 });

        res.status(200).json(discussions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching discussions' });
    }
};

// Create a new discussion
exports.createDiscussion = async (req, res) => {
    try {
        const { subjectId, subjectName, title, description, category } = req.body;
        
        if (!subjectId || !title || !category || !subjectName) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        const newDiscussion = new Discussion({
            subjectId,
            subjectName,
            title,
            description,
            category,
            author: req.userId
        });

        await newDiscussion.save();

        const populated = await Discussion.findById(newDiscussion._id)
            .populate('author', 'name usn profilePicture');

        res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating discussion' });
    }
};

// Add a reply to a discussion
exports.addReply = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Reply content cannot be empty' });
        }

        const discussion = await Discussion.findById(id);
        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }

        discussion.replies.push({
            author: req.userId,
            content
        });

        await discussion.save();

        const populated = await Discussion.findById(discussion._id)
            .populate('author', 'name usn profilePicture')
            .populate('replies.author', 'name usn profilePicture role');

        res.status(201).json(populated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error adding reply' });
    }
};

// Toggle Answered status (Author only)
exports.toggleAnswered = async (req, res) => {
    try {
        const { id } = req.params;
        const discussion = await Discussion.findById(id);
        
        if (!discussion) return res.status(404).json({ error: 'Discussion not found' });
        
        if (discussion.author.toString() !== req.userId && !req.isAdmin) {
            return res.status(403).json({ error: 'Unauthorized to mark answered' });
        }

        discussion.isAnswered = !discussion.isAnswered;
        await discussion.save();

        res.status(200).json(discussion);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error toggling answered status' });
    }
};
