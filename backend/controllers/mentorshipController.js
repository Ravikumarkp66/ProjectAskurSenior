const MentorshipRequest = require('../models/MentorshipRequest');
const User = require('../models/User');

// @desc    Create a new mentorship request
// @route   POST /api/mentorship
// @access  Private
const createRequest = async (req, res) => {
    try {
        const { topic, description, urgency } = req.body;
        
        if (!topic || !description) {
            return res.status(400).json({ error: "Topic and description are required" });
        }

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const request = await MentorshipRequest.create({
            userId: user._id,
            userName: user.name || user.email,
            topic,
            description,
            urgency: urgency || 'Medium',
            status: 'Pending'
        });

        res.status(201).json(request);
    } catch (error) {
        console.error("Create mentorship request error:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

// @desc    Get all mentorship requests
// @route   GET /api/mentorship
// @access  Private (Admin)
const getRequests = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) {
            query.status = status;
        }

        const requests = await MentorshipRequest.find(query).sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        console.error("Get mentorship requests error:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

// @desc    Update request status
// @route   PUT /api/mentorship/:id/status
// @access  Private (Admin)
const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Pending', 'Accepted', 'Completed', 'Cancelled'].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const request = await MentorshipRequest.findById(id);
        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }

        request.status = status;
        if (status === 'Accepted') {
            request.acceptedByAdminId = req.userId;
        }

        await request.save();
        res.status(200).json(request);
    } catch (error) {
        console.error("Update mentorship status error:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
};

module.exports = {
    createRequest,
    getRequests,
    updateRequestStatus
};
