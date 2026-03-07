const mongoose = require('mongoose');
require('dotenv').config();
const Document = require('../models/Document');
const deleteFromS3 = require('../utils/deleteFromS3');

async function cleanupDuplicates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find duplicates based on originalName and fileSize
        const duplicates = await Document.aggregate([
            {
                $group: {
                    _id: { originalName: "$originalName", fileSize: "$fileSize" },
                    count: { $sum: 1 },
                    docs: { $push: { id: "$_id", fileName: "$fileName", createdAt: "$createdAt" } }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        console.log(`Found ${duplicates.length} sets of duplicates.`);

        let deletedCount = 0;

        for (const group of duplicates) {
            console.log(`\nDuplicate Set: "${group._id.originalName}" (${(group._id.fileSize / 1024 / 1024).toFixed(2)} MB)`);
            
            // Sort docs by createdAt descending (keep the newest one)
            const sortedDocs = group.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            const [keep, ...toDelete] = sortedDocs;
            console.log(`Keeping: ${keep.id} (Uploaded ${keep.createdAt})`);

            for (const doc of toDelete) {
                console.log(`Deleting: ${doc.id} (Uploaded ${doc.createdAt})`);
                
                // Delete from S3
                try {
                    await deleteFromS3(doc.fileName);
                    console.log(`  - Deleted from S3: ${doc.fileName}`);
                } catch (s3Error) {
                    console.error(`  - Failed to delete from S3: ${doc.fileName}`, s3Error.message);
                }

                // Delete from DB
                await Document.findByIdAndDelete(doc.id);
                console.log(`  - Deleted from Database`);
                deletedCount++;
            }
        }

        console.log(`\nCleanup complete. Total duplicates removed: ${deletedCount}`);
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanupDuplicates();
