const BugReport = require('../models/BugReport');
const StudentAccount = require('../models/StudentAccount');
const User = require('../models/User');
const { resolvePlusAccess } = require('../services/plusAccessService');
const cacheInvalidator = require('../utils/cacheInvalidator');

const createBug = async (req, res) => {
    try {
        const { title, description, pageUrl, problemType, contactEmail } = req.body;

        if (!title || !String(title).trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }
        if (!description || !String(description).trim()) {
            return res.status(400).json({ error: 'Description is required' });
        }
        if (!pageUrl || !String(pageUrl).trim()) {
            return res.status(400).json({ error: 'Page URL is required' });
        }

        const validTypes = ['UI / Design', 'Feature not working', 'Performance', 'Login / Account', 'Academic data', 'Other'];
        const safeProblemType = validTypes.includes(problemType) ? problemType : 'Other';

        const bug = await BugReport.create({
            userId: req.userId || null,
            contactEmail: contactEmail ? String(contactEmail).trim().toLowerCase() : (req.user?.email || null),
            title: String(title).trim(),
            description: String(description).trim(),
            pageUrl: String(pageUrl).trim(),
            problemType: safeProblemType,
            status: 'open'
        });

        cacheInvalidator.emit('FEEDBACK_UPDATED');

        return res.status(201).json({ message: 'Bug reported successfully', bug });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const listBugs = async (req, res) => {
    try {
        const { status, problemType, search, page = 1, limit = 50 } = req.query;
        const query = {};

        if (status && status !== 'all' && status !== 'All') {
            query.status = status.toLowerCase();
        }
        if (problemType && problemType !== 'all' && problemType !== 'All') {
            query.problemType = problemType;
        }
        if (search && String(search).trim()) {
            const searchRegex = new RegExp(String(search).trim(), 'i');
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { pageUrl: searchRegex },
                { contactEmail: searchRegex }
            ];
        }

        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
        const skip = (parsedPage - 1) * parsedLimit;

        const [items, total] = await Promise.all([
            BugReport.find(query).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit).lean(),
            BugReport.countDocuments(query)
        ]);

        // Hydrate student and user accounts
        const userIds = [...new Set(items.map(b => b.userId?.toString()).filter(Boolean))];
        const [students, users] = await Promise.all([
            StudentAccount.find({ _id: { $in: userIds } })
                .select('_id name usn email branch semester studentId isPlus subscription hasActiveSubscription plan role isAdmin isTestUser isTestAccount')
                .populate('branch', 'name shortName')
                .lean(),
            User.find({ _id: { $in: userIds } })
                .select('_id name usn email branch currentBranch isPlus subscription hasActiveSubscription plan role isAdmin isTestUser isTestAccount')
                .populate('branch', 'name shortName')
                .lean()
        ]);

        const userMap = new Map();
        students.forEach(s => {
            const plus = resolvePlusAccess(s);
            userMap.set(s._id.toString(), {
                _id: s._id,
                name: s.name,
                usn: s.usn,
                email: s.email,
                branch: s.branch?.shortName || s.branch?.name || '',
                semester: s.semester,
                studentId: s.studentId,
                accountType: 'Student',
                plan: plus.plan, // 'PLUS' | 'FREE'
                hasPlusAccess: plus.hasPlusAccess,
                source: plus.source
            });
        });
        users.forEach(u => {
            if (!userMap.has(u._id.toString())) {
                const plus = resolvePlusAccess(u);
                userMap.set(u._id.toString(), {
                    _id: u._id,
                    name: u.name,
                    usn: u.usn,
                    email: u.email,
                    branch: u.branch?.shortName || u.branch?.name || '',
                    semester: u.semester,
                    accountType: 'User',
                    plan: plus.plan,
                    hasPlusAccess: plus.hasPlusAccess,
                    source: plus.source
                });
            }
        });

        const hydratedItems = items.map(item => {
            const userObj = item.userId ? (userMap.get(item.userId.toString()) || null) : null;
            return {
                ...item,
                userId: userObj || item.userId,
                user: userObj
            };
        });

        // Summary counts for dashboard / stats cards
        const [totalOpen, totalInProgress, totalResolved, totalClosed] = await Promise.all([
            BugReport.countDocuments({ status: 'open' }),
            BugReport.countDocuments({ status: 'in_progress' }),
            BugReport.countDocuments({ status: 'resolved' }),
            BugReport.countDocuments({ status: 'closed' })
        ]);

        return res.json({
            items: hydratedItems,
            total,
            page: parsedPage,
            totalPages: Math.ceil(total / parsedLimit) || 1,
            stats: {
                total: totalOpen + totalInProgress + totalResolved + totalClosed,
                open: totalOpen,
                inProgress: totalInProgress,
                resolved: totalResolved,
                closed: totalClosed
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const updateBugStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminNotes } = req.body;

        const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
        }

        const update = {};
        if (status) {
            update.status = status;
            if (status === 'resolved' || status === 'closed') {
                update.resolvedAt = new Date();
                update.resolvedBy = req.admin?._id || req.userId;
            } else {
                update.resolvedAt = null;
                update.resolvedBy = null;
            }
        }

        if (adminNotes !== undefined) {
            update.adminNotes = String(adminNotes).trim();
        }

        const bug = await BugReport.findByIdAndUpdate(id, update, { new: true });
        if (!bug) return res.status(404).json({ error: 'Bug report not found' });

        // Invalidate Cache
        cacheInvalidator.emit('FEEDBACK_UPDATED');

        res.json({ message: 'Bug report updated successfully', bug });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

const deleteBug = async (req, res) => {
    try {
        const { id } = req.params;
        const bug = await BugReport.findByIdAndDelete(id);
        if (!bug) return res.status(404).json({ error: 'Bug report not found' });

        cacheInvalidator.emit('FEEDBACK_UPDATED');
        res.json({ message: 'Bug report deleted successfully' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createBug,
    listBugs,
    updateBugStatus,
    deleteBug
};
