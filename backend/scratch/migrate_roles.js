require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function migrate() {
    try {
        const dbUri = process.env.MONGODB_URI;
        console.log("Connecting to:", dbUri);
        await mongoose.connect(dbUri);
        console.log("Connected to MongoDB!");

        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Find how many users have role: 'free'
        const freeCount = await usersCollection.countDocuments({ role: 'free' });
        console.log(`Found ${freeCount} users with role "free".`);

        if (freeCount > 0) {
            console.log("Migrating users with role 'free' to 'student'...");
            const result = await usersCollection.updateMany(
                { role: 'free' },
                { $set: { role: 'student' } }
            );
            console.log(`Successfully migrated ${result.modifiedCount} users.`);
        } else {
            console.log("No users with role 'free' to migrate.");
        }

    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        await mongoose.connection.close();
        console.log("Connection closed.");
    }
}

migrate();
