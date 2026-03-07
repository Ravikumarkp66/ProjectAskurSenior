const mongoose = require('mongoose');
require('dotenv').config();
const Document = require('./models/Document');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Set isApproved to true for all existing documents that don't have it or are false
        const result = await Document.updateMany(
            {}, 
            { $set: { isApproved: true } }
        );

        console.log(`Migration successful. Updated ${result.modifiedCount} documents.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
