const User = require("../models/User");
const Subject = require("../models/Subject");
const UserUpload = require("../models/UserUpload");
const Feedback = require("../models/Feedback");
const BugReport = require("../models/BugReport");

/**
 * GET /admin/analytics/overview
 * Return: { totalUsers, activeUsers, totalFiles, pendingUploads, totalSubjects, uploadsThisMonth }
 */
exports.getOverviewAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Total users
        const totalUsers = await User.countDocuments();

        // User upload count
        const userUploadCount = await UserUpload.countDocuments();

        // Total files
        const subjects = await Subject.find({});
        let totalFiles = 0;
        subjects.forEach((subject) => {
            totalFiles += (subject.notes?.length || 0);
            totalFiles += (subject.pyqs?.length || 0);
            totalFiles += (subject.questionBanks?.length || 0);
            totalFiles += (subject.syllabus?.length || 0);
            totalFiles += (subject.resources?.length || 0);
        });

        // Pending uploads
        const pendingUploads = await UserUpload.countDocuments({ status: "pending" });

        // Total subjects
        const totalSubjects = await Subject.countDocuments();

        // Uploads this month
        const uploadsThisMonth = await UserUpload.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        res.json({
            totalUsers,
            userUploadCount,
            totalFiles,
            pendingUploads,
            totalSubjects,
            uploadsThisMonth
        });
    } catch (err) {
        console.error("Error fetching overview analytics:", err);
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
};

/**
 * GET /admin/analytics/user-growth
 * Return: { months: [], counts: [] } - Monthly user registration data
 */
exports.getUserGrowthAnalytics = async (req, res) => {
    try {
        const users = await User.find({})
            .select("createdAt")
            .sort({ createdAt: 1 })
            .lean();

        const monthlyData = {};
        users.forEach((user) => {
            if (user.createdAt) {
                const key = user.createdAt.toISOString().split("T")[0].slice(0, 7); // YYYY-MM
                monthlyData[key] = (monthlyData[key] || 0) + 1;
            }
        });

        const months = Object.keys(monthlyData).sort();
        const counts = months.map((month) => monthlyData[month]);

        // Calculate cumulative (total users per month)
        const cumulativeCounts = [];
        let cumulative = 0;
        counts.forEach((count) => {
            cumulative += count;
            cumulativeCounts.push(cumulative);
        });

        res.json({ months, counts: cumulativeCounts });
    } catch (err) {
        console.error("Error fetching user growth:", err);
        res.status(500).json({ error: "Failed to fetch user growth data" });
    }
};

/**
 * GET /admin/analytics/upload-growth
 * Return: { months: [], counts: [] } - Monthly upload data
 */
exports.getUploadGrowthAnalytics = async (req, res) => {
    try {
        const uploads = await UserUpload.find({})
            .select("createdAt")
            .sort({ createdAt: 1 })
            .lean();

        const monthlyData = {};
        uploads.forEach((upload) => {
            if (upload.createdAt) {
                const key = upload.createdAt.toISOString().split("T")[0].slice(0, 7); // YYYY-MM
                monthlyData[key] = (monthlyData[key] || 0) + 1;
            }
        });

        const months = Object.keys(monthlyData).sort();
        const counts = months.map((month) => monthlyData[month]);

        res.json({ months, counts });
    } catch (err) {
        console.error("Error fetching upload growth:", err);
        res.status(500).json({ error: "Failed to fetch upload growth data" });
    }
};

/**
 * GET /admin/analytics/content-by-subject
 * Return: { subjects: [], notes: [], pyqs: [], questionBanks: [] }
 */
exports.getContentBySubjectAnalytics = async (req, res) => {
    try {
        const subjects = await Subject.find({})
            .select("code name notes pyqs questionBanks")
            .lean();

        const subjectCodes = new Map();

        subjects.forEach((subject) => {
            const key = subject.code;
            if (!subjectCodes.has(key)) {
                subjectCodes.set(key, {
                    code: subject.code,
                    name: subject.name,
                    notes: 0,
                    pyqs: 0,
                    questionBanks: 0
                });
            }

            const data = subjectCodes.get(key);
            data.notes += subject.notes?.length || 0;
            data.pyqs += subject.pyqs?.length || 0;
            data.questionBanks += subject.questionBanks?.length || 0;
        });

        const data = Array.from(subjectCodes.values());

        // Top 20 by total content
        const topSubjects = data
            .sort((a, b) => (b.notes + b.pyqs + b.questionBanks) - (a.notes + a.pyqs + a.questionBanks))
            .slice(0, 20);

        res.json({
            subjects: topSubjects.map((s) => s.code),
            subjectNames: topSubjects.map((s) => s.name),
            notes: topSubjects.map((s) => s.notes),
            pyqs: topSubjects.map((s) => s.pyqs),
            questionBanks: topSubjects.map((s) => s.questionBanks)
        });
    } catch (err) {
        console.error("Error fetching content by subject:", err);
        res.status(500).json({ error: "Failed to fetch content analytics" });
    }
};

/**
 * GET /admin/analytics/upload-by-month
 * Return: { months: [], notes: [], pyqs: [], questionBanks: [] }
 */
exports.getUploadByMonthAnalytics = async (req, res) => {
    try {
        const uploads = await UserUpload.find({})
            .select("contentType createdAt")
            .sort({ createdAt: 1 })
            .lean();

        const monthlyData = {};

        uploads.forEach((upload) => {
            if (upload.createdAt) {
                const key = upload.createdAt.toISOString().split("T")[0].slice(0, 7); // YYYY-MM
                if (!monthlyData[key]) {
                    monthlyData[key] = { notes: 0, pyqs: 0, questionBanks: 0 };
                }
                monthlyData[key][upload.contentType] = (monthlyData[key][upload.contentType] || 0) + 1;
            }
        });

        const months = Object.keys(monthlyData).sort();
        const notes = months.map((m) => monthlyData[m].notes || 0);
        const pyqs = months.map((m) => monthlyData[m].pyqs || 0);
        const questionBanks = months.map((m) => monthlyData[m].questionBanks || 0);

        res.json({ months, notes, pyqs, questionBanks });
    } catch (err) {
        console.error("Error fetching upload by month:", err);
        res.status(500).json({ error: "Failed to fetch upload by month data" });
    }
};

/**
 * GET /admin/analytics/notification-stats
 * Return: { pendingUploads, reportCount, flaggedContent }
 */
exports.getNotificationStats = async (req, res) => {
    try {
        const pendingUploads = await UserUpload.countDocuments({ status: "pending" });
        const reportCount = await BugReport.countDocuments({ status: { $ne: "resolved" } });
        const flaggedContent = 0; // Placeholder - implement flagging system if needed

        res.json({
            pendingUploads,
            reportCount,
            flaggedContent,
            totalNotifications: pendingUploads + reportCount
        });
    } catch (err) {
        console.error("Error fetching notification stats:", err);
        res.status(500).json({ error: "Failed to fetch notification stats" });
    }
};

/**
 * GET /admin/users
 * Return user list with optional search/filter
 */
exports.getUserListAnalytics = async (req, res) => {
    try {
        const { search, role, sortBy } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { usn: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        if (role && role !== "all") {
            query.isAdmin = role === "admin";
        }

        let users = await User.find(query)
            .select("name usn email role isAdmin isBanned createdAt lastLogin")
            .lean();

        // Sorting
        if (sortBy === "recent") {
            users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === "active") {
            users.sort((a, b) => new Date(b.lastLogin || 0) - new Date(a.lastLogin || 0));
        }

        res.json({
            users,
            total: users.length
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

/**
 * PATCH /admin/users/:userId/premium
 * Toggle user premium status
 */
exports.togglePremium = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isPremium } = req.body;

        if (typeof isPremium !== "boolean") {
            return res.status(400).json({ error: "isPremium must be boolean" });
        }

        const newRole = isPremium ? "premium" : "free";

        const user = await User.findByIdAndUpdate(
            userId,
            { role: newRole },
            { new: true }
        ).select("name usn email role");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: `User ${isPremium ? "upgraded to premium" : "downgraded to free"}`,
            user
        });
    } catch (err) {
        console.error("Error updating user premium status:", err);
        res.status(500).json({ error: "Failed to update user premium status" });
    }
};

/**
 * PATCH /admin/users/:userId/ban
 * Ban or unban user
 */
exports.banUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isBanned } = req.body;

        if (typeof isBanned !== "boolean") {
            return res.status(400).json({ error: "isBanned must be boolean" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { isBanned },
            { new: true }
        ).select("name usn email isBanned");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: `User ${isBanned ? "banned" : "unbanned"}`,
            user
        });
    } catch (err) {
        console.error("Error banning user:", err);
        res.status(500).json({ error: "Failed to update user status" });
    }
};

/**
 * PATCH /admin/users/:userId/reset-role
 * Reset user to default role
 */
exports.resetUserRole = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isAdmin: false, isBanned: false },
            { new: true }
        ).select("name usn email isAdmin isBanned");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({
            message: "User role reset to default",
            user
        });
    } catch (err) {
        console.error("Error resetting user role:", err);
        res.status(500).json({ error: "Failed to reset user role" });
    }
};

