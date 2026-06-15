require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function checkExactStats() {
    try {
        const dbUri = process.env.MONGODB_URI;
        await mongoose.connect(dbUri);
        console.log("Connected to MongoDB!");

        const User = require('../models/User');
        const Document = require('../models/Document');
        const Subject = require('../models/Subject');
        const UserUpload = require('../models/UserUpload');
        const Material = require('../models/Material');

        console.log("\n--- COUNTING COLLECTIONS ---");
        console.log("User.countDocuments():", await User.countDocuments());
        console.log("User.countDocuments({ uploads: { $gt: 0 } }):", await User.countDocuments({ uploads: { $gt: 0 } }));
        console.log("Document.countDocuments({}):", await Document.countDocuments());
        console.log("Document.countDocuments({ isApproved: true }):", await Document.countDocuments({ isApproved: true }));
        console.log("Document.countDocuments({ isApproved: true, isDeleted: false }):", await Document.countDocuments({ isApproved: true, isDeleted: false }));
        console.log("UserUpload.countDocuments({}):", await UserUpload.countDocuments());
        console.log("UserUpload.countDocuments({ status: 'approved' }):", await UserUpload.countDocuments({ status: 'approved' }));
        console.log("Material.countDocuments({}):", await Material.countDocuments());

        // Count Subject files
        const subjectStats = await Subject.aggregate([
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
        const subjectFilesCount = subjectStats.length > 0 ? subjectStats[0].totalFiles : 0;
        console.log("Subject Files Count:", subjectFilesCount);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

checkExactStats();
