const StudentAccount = require('../models/StudentAccount');

exports.getUsersReportData = async (from, to) => {
    let query = {};
    const reportData = {
        generatedAt: new Date(),
        fromDate: null,
        toDate: null,
        summary: {},
        users: []
    };

    if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        
        if (!isNaN(fromDate) && !isNaN(toDate)) {
            query.createdAt = { $gte: fromDate, $lte: toDate };
            reportData.fromDate = fromDate;
            reportData.toDate = toDate;
        }
    }

    const users = await StudentAccount.aggregate([
        { $match: query },
        {
            $lookup: {
                from: 'analyticsevents',
                localField: '_id',
                foreignField: 'userId',
                as: 'events'
            }
        },
        {
            $addFields: {
                uniquePaths: { $setUnion: "$events.path" }
            }
        },
        {
            $addFields: {
                uniqueTabsVisited: { $size: { $ifNull: ["$uniquePaths", []] } }
            }
        },
        {
            $project: {
                name: 1,
                usn: 1,
                email: 1,
                createdAt: 1,
                lastActiveAt: 1,
                uniqueTabsVisited: 1
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    const totalUsers = users.length;
    const totalTabs = users.reduce((sum, u) => sum + u.uniqueTabsVisited, 0);
    const avgTabs = totalUsers > 0 ? (totalTabs / totalUsers).toFixed(1) : 0;

    reportData.summary = {
        totalUsers,
        totalUniqueTabsVisited: totalTabs,
        averageTabsPerUser: avgTabs
    };

    reportData.users = users;

    return reportData;
};
