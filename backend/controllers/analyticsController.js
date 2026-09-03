const User = require("../models/User");
const StudentAccount = require("../models/StudentAccount");
const Subject = require("../models/Subject");
const UserUpload = require("../models/UserUpload");
const Feedback = require("../models/Feedback");
const BugReport = require("../models/BugReport");
const AdminLog = require("../models/AdminLog");
const cacheInvalidator = require("../utils/cacheInvalidator");
const AnalyticsEvent = require("../models/AnalyticsEvent");
const PDFDocument = require("pdfkit");
const reportService = require("../services/reportService");
const csvExportService = require("../services/csvExportService");
const pdfExportService = require("../services/pdfExportService");

/**
 * GET /admin/analytics/overview
 * Return: { totalUsers, activeUsers, totalFiles, pendingUploads, totalSubjects, uploadsThisMonth }
 */
exports.getOverviewAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Execute count queries in parallel for high speed dashboard load from student_accounts
        const [totalUsers, userUploadCount, pendingUploads, totalSubjects, uploadsThisMonth, liveUsers] = await Promise.all([
            StudentAccount.countDocuments(),
            UserUpload.countDocuments(),
            UserUpload.countDocuments({ status: "pending" }),
            Subject.countDocuments(),
            UserUpload.countDocuments({ createdAt: { $gte: startOfMonth } }),
            StudentAccount.countDocuments({ lastActive: { $gte: new Date(Date.now() - 300000) } })
        ]);

        // Total files across all subjects (with defensive checks)
        let totalFiles = 0;
        try {
            const fileStats = await Subject.aggregate([
                {
                    $project: {
                        totalFiles: {
                            $add: [
                                { $size: { $ifNull: ["$notes", []] } },
                                { $size: { $ifNull: ["$pyqs", []] } },
                                { $size: { $ifNull: ["$questionBanks", []] } },
                                { $size: { $ifNull: ["$syllabus", []] } },
                                { $size: { $ifNull: ["$resources", []] } }
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalFiles: { $sum: "$totalFiles" }
                    }
                }
            ]);
            totalFiles = fileStats.length > 0 ? fileStats[0].totalFiles : 0;
        } catch (aggErr) {
            console.error("Aggregation error in totalFiles:", aggErr);
            totalFiles = 0;
        }

        // New dashboard stats
        const result = {
            totalUsers,
            userUploadCount,
            totalFiles,
            pendingUploads,
            totalSubjects,
            uploadsThisMonth,
            liveUsers
        };

        console.log("Overview analytics result:", result);
        res.json(result);
    } catch (err) {
        console.error("Error fetching overview analytics:", err);
        res.status(500).json({ error: "Failed to fetch analytics", details: err.message });
    }
};

/**
 * GET /admin/analytics/user-growth
 * Return: { months: [], counts: [] } - Monthly user registration data
 */
/**
 * GET /admin/analytics/user-growth
 * Optimized using MongoDB aggregation
 */
exports.getUserGrowthAnalytics = async (req, res) => {
    try {
        const growth = await StudentAccount.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const months = growth.map(g => g._id);
        const counts = growth.map(g => g.count);

        // Calculate cumulative
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
 * Optimized using MongoDB aggregation
 */
exports.getUploadGrowthAnalytics = async (req, res) => {
    try {
        const growth = await UserUpload.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const months = growth.map(g => g._id);
        const counts = growth.map(g => g.count);

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
        const { page = 1, limit = 10, search = "", role = "all", sortBy = "recent", filter = "" } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const now = new Date();
        const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { usn: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { username: { $regex: search, $options: "i" } },
                { studentId: { $regex: search, $options: "i" } }
            ];
        }

        if (role && role !== "all") {
            query.role = role === "admin" ? "admin" : "student";
        }

        if (filter === "recentlyActive" || sortBy === "recentlyActive") {
            query.lastActive = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
        }

        const incompleteProfileCondition = {
            $or: [
                { name: { $in: [null, ""] } },
                { name: { $exists: false } },
                { name: { $regex: /^\s*$/ } },
                { usn: { $in: [null, ""] } },
                { usn: { $exists: false } },
                { usn: { $regex: /^\s*$/ } },
                { email: { $in: [null, ""] } },
                { email: { $exists: false } },
                { email: { $regex: /^\s*$/ } }
            ]
        };

        const neverActiveCondition = {
            $or: [
                { lastActive: { $in: [null] } },
                { lastActive: { $exists: false } }
            ]
        };

        if (filter === "incomplete" || filter === "incompleteProfiles" || req.query.incomplete === "true") {
            if (query.$or) {
                query = {
                    $and: [
                        { $or: query.$or },
                        incompleteProfileCondition
                    ]
                };
            } else {
                Object.assign(query, incompleteProfileCondition);
            }
        } else if (filter === "neverActive" || req.query.neverActive === "true") {
            if (query.$or) {
                query = {
                    $and: [
                        { $or: query.$or },
                        neverActiveCondition
                    ]
                };
            } else {
                Object.assign(query, neverActiveCondition);
            }
        }

        // Base pipeline
        let pipeline = [
            { $match: query }
        ];

        // Sorting
        let sort = {};
        if (sortBy === "recent") {
            sort = { createdAt: -1 };
        } else if (sortBy === "active" || sortBy === "recentlyActive" || filter === "recentlyActive") {
            sort = { lastActive: -1 };
        } else {
            sort = { createdAt: -1 };
        }
        pipeline.push({ $sort: sort });

        // Pagination
        const countPipeline = [...pipeline];
        pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });

        // Populate branch and scheme info and alias lastActive to lastActiveAt for UI compatibility
        pipeline.push(
            {
                $lookup: {
                    from: "branches",
                    localField: "branch",
                    foreignField: "_id",
                    as: "branchData"
                }
            },
            {
                $lookup: {
                    from: "schemes",
                    localField: "scheme",
                    foreignField: "_id",
                    as: "schemeData"
                }
            },
            {
                $addFields: {
                    lastActiveAt: "$lastActive",
                    branchName: { $arrayElemAt: ["$branchData.shortName", 0] },
                    schemeName: { $arrayElemAt: ["$schemeData.name", 0] },
                    isAdmin: {
                        $or: [
                            { $eq: ["$role", "admin"] },
                            { $eq: ["$accountType", "admin"] }
                        ]
                    }
                }
            }
        );

        const [users, totalResult, liveUsers, recentlyActiveCount, incompleteProfileCount, neverActiveCount] = await Promise.all([
            StudentAccount.aggregate(pipeline),
            StudentAccount.aggregate([...countPipeline, { $count: "count" }]),
            StudentAccount.countDocuments({ lastActive: { $gte: new Date(Date.now() - 300000) } }),
            StudentAccount.countDocuments({ lastActive: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }),
            StudentAccount.countDocuments(incompleteProfileCondition),
            StudentAccount.countDocuments(neverActiveCondition)
        ]);

        const total = totalResult.length > 0 ? totalResult[0].count : 0;
        const totalUsersCount = await StudentAccount.countDocuments();

        res.json({
            users,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            summary: {
                totalUsers: totalUsersCount,
                liveUsers,
                recentlyActiveCount,
                incompleteProfileCount,
                neverActiveCount,
                incompleteCount: incompleteProfileCount
            }
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

/**
 * PATCH /admin/users/:userId/suspend
 * Suspend or reactivate user
 */
exports.suspendUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isSuspended } = req.body;

        if (typeof isSuspended !== "boolean") {
            return res.status(400).json({ error: "isSuspended must be boolean" });
        }

        const updateData = {
            accountStatus: isSuspended ? "suspended" : "active",
            isSuspended,
            suspendedAt: isSuspended ? new Date() : null,
            suspendedBy: isSuspended ? req.userId : null
        };

        const user = await StudentAccount.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select("name usn email isSuspended accountStatus suspendedAt");

        // Keep User in sync if present
        User.findByIdAndUpdate(userId, { isSuspended, suspendedAt: updateData.suspendedAt, suspendedBy: updateData.suspendedBy }).catch(() => {});

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Create Admin Log
        await AdminLog.create({
            adminId: req.userId,
            action: isSuspended ? "ACCOUNT_SUSPENDED" : "ACCOUNT_REACTIVATED",
            targetUserId: userId
        });

        res.json({
            message: `User ${isSuspended ? "suspended" : "reactivated"}`,
            user
        });

        // Invalidate Cache
        cacheInvalidator.emit('FEEDBACK_UPDATED');
    } catch (err) {
        console.error("Error suspending user:", err);
        res.status(500).json({ error: "Failed to update user status" });
    }
};

/**
 * GET /admin/users/:userId/logs
 * Get audit trail for a user
 */
exports.getAdminLogs = async (req, res) => {
    try {
        const { userId } = req.params;
        const logs = await AdminLog.find({ targetUserId: userId })
            .populate("adminId", "name email")
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(logs);
    } catch (err) {
        console.error("Error fetching admin logs:", err);
        res.status(500).json({ error: "Failed to fetch audit trail" });
    }
};
const CACHE_KEYS = require("../utils/cacheKeys");
const { getCache, setCache } = require("../utils/cache");

/**
 * GET /admin/analytics/dashboard-summary
 * Optimized consolidated dashboard data with Smart Caching
 */
exports.getDashboardSummary = async (req, res) => {
    try {
        // Step 1: Check Cache
        const cachedScSummary = await getCache(CACHE_KEYS.DASHBOARD_SUMMARY);
        if (cachedScSummary) {
            return res.json({ ...cachedScSummary, cached: true });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Run independent queries in parallel using StudentAccount
        const [
            totalUsers,
            totalSubjects,
            pendingUploads,
            uploadsThisMonth,
            recentUsers
        ] = await Promise.all([
            StudentAccount.countDocuments().lean(),
            Subject.countDocuments().lean(),
            UserUpload.countDocuments({ status: "pending" }).lean(),
            UserUpload.countDocuments({ createdAt: { $gte: startOfMonth } }).lean(),
            StudentAccount.find().sort({ createdAt: -1 }).limit(5).select("name usn email createdAt").lean()
        ]);

        // Aggregate total files across all subjects efficiently
        const fileStats = await Subject.aggregate([
            {
                $project: {
                    totalFiles: {
                        $add: [
                            { $size: { $ifNull: ["$notes", []] } },
                            { $size: { $ifNull: ["$pyqs", []] } },
                            { $size: { $ifNull: ["$questionBanks", []] } },
                            { $size: { $ifNull: ["$syllabus", []] } },
                            { $size: { $ifNull: ["$resources", []] } }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalFiles: { $sum: "$totalFiles" }
                }
            }
        ]);

        const totalFiles = fileStats.length > 0 ? fileStats[0].totalFiles : 0;

        const responseData = {
            stats: {
                totalUsers,
                totalSubjects,
                totalFiles,
                pendingUploads,
                uploadsThisMonth
            },
            recentUsers,
            timestamp: new Date()
        };

        // Cache the result
        await setCache(CACHE_KEYS.DASHBOARD_SUMMARY, responseData, 3600);

        res.json(responseData);
    } catch (err) {
        console.error("Error fetching dashboard summary:", err);
        res.status(500).json({ error: "Failed to fetch dashboard summary" });
    }
};

const getReportFilename = (extension, from, to) => {
    const today = new Date().toISOString().split('T')[0];
    if (from && to) {
        const fromStr = new Date(from).toISOString().split('T')[0];
        const toStr = new Date(to).toISOString().split('T')[0];
        return `askursenior-users-report-${fromStr}_to_${toStr}.${extension}`;
    }
    return `askursenior-users-report-${today}.${extension}`;
};

exports.exportUsersCSV = async (req, res) => {
    try {
        const { from, to } = req.query;
        const reportData = await reportService.getUsersReportData(from, to);
        const csv = csvExportService.generateUsersReportCSV(reportData);

        const filename = getReportFilename('csv', from, to);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.status(200).send(csv);
    } catch (err) {
        console.error("Error exporting CSV:", err);
        res.status(500).json({ error: "Failed to export CSV" });
    }
};

exports.exportUsersPDF = async (req, res) => {
    try {
        const { from, to } = req.query;
        const reportData = await reportService.getUsersReportData(from, to);
        const pdfBuffer = await pdfExportService.generateUsersReportPDF(reportData);

        const filename = getReportFilename('pdf', from, to);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.status(200).send(pdfBuffer);
    } catch (err) {
        console.error("Error exporting PDF:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to export PDF" });
        }
    }
};

