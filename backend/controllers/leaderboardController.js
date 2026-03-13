const Document = require('../models/Document');
const User = require('../models/User');

/**
 * @desc    Get leaderboard data
 * @route   GET /api/leaderboard
 * @access  Public
 */
exports.getLeaderboard = async (req, res) => {
    try {
        // Temporary seed data to keep the leaderboard engaging
        const TEMPORARY_LEADERBOARD_USERS = [
            { usn: "1SI23IS004", uploads: 18, score: 180, isTemporary: true },
            { usn: "1SI23CS011", uploads: 15, score: 150, isTemporary: true },
            { usn: "1SI22EC021", uploads: 12, score: 120, isTemporary: true },
            { usn: "1SI24IS006", uploads: 10, score: 100, isTemporary: true },
            { usn: "1SI22ME010", uploads: 8, score: 80, isTemporary: true },
            { usn: "1SI23CI015", uploads: 7, score: 70, isTemporary: true },
            { usn: "1SI24CS022", uploads: 6, score: 60, isTemporary: true },
            { usn: "1SI22EE008", uploads: 5, score: 50, isTemporary: true },
            { usn: "1SI23EC045", uploads: 4, score: 40, isTemporary: true },
            { usn: "1SI24BT003", uploads: 3, score: 30, isTemporary: true }
        ];

        // Aggregate approved documents to calculate real scores
        const realLeaderboard = await Document.aggregate([
            { $match: { isApproved: true } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'uploadedBy',
                    foreignField: '_id',
                    as: 'uploader'
                }
            },
            { $unwind: '$uploader' },
            { $match: { "uploader.isAdmin": { $ne: true } } },
            {
                $project: {
                    displayName: {
                        $cond: {
                            if: { $and: [ { $ne: ["$contributor.name", ""] }, { $ne: ["$contributor.name", null] } ] },
                            then: "$contributor.name",
                            else: "$uploader.usn"
                        }
                    }
                }
            },
            {
                $match: {
                    displayName: { $ne: null, $ne: "", $exists: true },
                    $expr: {
                        $and: [
                            { $ne: ["$displayName", null] },
                            { $ne: [{ $trim: { input: "$displayName" } }, ""] }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: { $toUpper: { $trim: { input: "$displayName" } } },
                    uploads: { $sum: 1 },
                    score: { $sum: 10 }
                }
            },
            { $match: { _id: { $ne: null, $ne: "" } } },
            {
                $project: {
                    _id: 0,
                    usn: "$_id",
                    uploads: 1,
                    score: 1,
                    isTemporary: { $literal: false }
                }
            }
        ]);

        // Merge real data with temporary data
        // Filter out temporary users if their USN already exists in real leaderboard (either as a USN or a name)
        const realIdentities = new Set(realLeaderboard.map(u => u.usn.toUpperCase()));
        const uniqueTempUsers = TEMPORARY_LEADERBOARD_USERS.filter(temp => !realIdentities.has(temp.usn.toUpperCase()));

        let combinedLeaderboard = [...realLeaderboard, ...uniqueTempUsers];

        // Sort by score DESC, then uploads DESC
        combinedLeaderboard.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.uploads - a.uploads;
        });

        // Limit to top 50 to keep it manageable
        const finalLeaderboard = combinedLeaderboard.slice(0, 50);

        res.json(finalLeaderboard);
    } catch (err) {
        console.error('Error fetching leaderboard:', err.message);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
};

