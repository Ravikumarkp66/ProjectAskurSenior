const express = require('express');
const router = express.Router();
const MaterialRequest = require('../models/MaterialRequest');
const MentorshipRequest = require('../models/MentorshipRequest');
const IssueReport = require('../models/IssueReport');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// 1. Submit Material Request
router.post('/material', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const { subject, branch, semester, materialType, additionalNotes } = req.body;
        const newReq = new MaterialRequest({
            userId: req.userId,
            userName: user ? user.name : "Unknown Student",
            subject,
            branch,
            semester,
            materialType,
            additionalNotes
        });
        await newReq.save();
        res.status(201).json({ message: 'Material Request Submitted', request: newReq });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit material request' });
    }
});

// 2. Submit Mentorship Request
router.post('/mentorship', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const { topic, description, preferredCommunication } = req.body;
        const newReq = new MentorshipRequest({
            userId: req.userId,
            userName: user ? user.name : "Unknown Student",
            topic,
            description,
            preferredCommunication
        });
        await newReq.save();
        res.status(201).json({ message: 'Mentorship Request Submitted', request: newReq });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit mentorship request' });
    }
});

// 3. Submit Issue Report
router.post('/issue', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const { issueType, description, originalQuestion } = req.body;
        const newReq = new IssueReport({
            userId: req.userId,
            userName: user ? user.name : "Unknown Student",
            issueType,
            description,
            originalQuestion
        });
        await newReq.save();
        res.status(201).json({ message: 'Issue Report Submitted', request: newReq });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit issue report' });
    }
});

// --- ADMIN ROUTES ---

// Get all requests
router.get('/admin', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const materials = await MaterialRequest.find().sort({ createdAt: -1 });
        const mentorships = await MentorshipRequest.find().sort({ createdAt: -1 });
        const issues = await IssueReport.find().sort({ createdAt: -1 });

        // Analytics: Most requested materials
        const materialAnalytics = await MaterialRequest.aggregate([
            {
                $group: {
                    _id: { subject: "$subject", materialType: "$materialType" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({ materials, mentorships, issues, analytics: { mostRequested: materialAnalytics } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});

// Update Status
router.put('/admin/:type/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { type, id } = req.params;
        const { status } = req.body;
        let updated;

        if (type === 'material') {
            updated = await MaterialRequest.findByIdAndUpdate(id, { status, resolvedAt: status === 'Available' ? new Date() : undefined }, { new: true });
            
            if (status === 'Available') {
                const Conversation = require('../models/Conversation');
                const Message = require('../models/Message');
                
                let conversation = await Conversation.findOne({ userId: updated.userId });
                if (!conversation) {
                    conversation = await Conversation.create({
                        userId: updated.userId,
                        userName: updated.userName,
                        userEmail: 'student@example.com' // Fallback
                    });
                }
                
                const msgText = `🎉 Good News!\n\nThe material you requested is now available.\n📚 ${updated.subject} ${updated.materialType}\n\nSearch for it to view or download the PDF!`;
                
                const newMessage = await Message.create({
                    conversationId: conversation._id,
                    senderId: req.userId,
                    senderType: 'admin',
                    message: msgText
                });
                
                conversation.lastMessage = msgText;
                conversation.lastMessageAt = new Date();
                conversation.unreadUserCount = (conversation.unreadUserCount || 0) + 1;
                await conversation.save();
                
                const io = req.app.get('io');
                if (io) {
                    io.to(`conversation_${conversation._id}`).emit('receive_message', newMessage);
                }
            }
        } else if (type === 'mentorship') {
            updated = await MentorshipRequest.findByIdAndUpdate(id, { status, acceptedByAdminId: status === 'Accepted' ? req.userId : undefined }, { new: true });
        } else if (type === 'issue') {
            updated = await IssueReport.findByIdAndUpdate(id, { status, resolvedAt: status === 'Resolved' ? new Date() : undefined }, { new: true });
        }

        res.json({ message: 'Status updated', data: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

module.exports = router;
