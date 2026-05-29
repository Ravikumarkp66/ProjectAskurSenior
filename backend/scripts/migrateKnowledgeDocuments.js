require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const KnowledgeDocument = require('../models/KnowledgeDocument');

const runMigration = async () => {
    try {
        console.log('Connected to MongoDB');
        await mongoose.connect(process.env.MONGODB_URI);

        const result = await KnowledgeDocument.collection.updateMany(
            { isProcessed: { $exists: false } },
            { 
                $set: { 
                    isProcessed: false, 
                    isChunked: false, 
                    chunkCount: 0, 
                    extractedText: "" 
                } 
            }
        );

        console.log(`\nMigration Complete`);
        console.log(`Documents Updated: ${result.modifiedCount}`);

    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

runMigration();
