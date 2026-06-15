require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function diagnose() {
    try {
        const dbUri = process.env.MONGODB_URI;
        console.log("Connecting to:", dbUri);
        await mongoose.connect(dbUri);
        console.log("Connected to MongoDB!");

        // Run a raw collection query to bypass any mongoose schema casting/validation
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // 1. Get total users
        const count = await usersCollection.countDocuments();
        console.log("Total users in database:", count);

        // 2. Distinct values for 'role'
        const distinctRoles = await usersCollection.distinct('role');
        console.log("Distinct roles in database:", distinctRoles);

        // 3. Count users by role
        for (const role of distinctRoles) {
            const roleCount = await usersCollection.countDocuments({ role });
            console.log(`Users with role "${role}":`, roleCount);
        }

        // 4. Print sample users with role 'free'
        const freeUsers = await usersCollection.find({ role: 'free' }).limit(5).toArray();
        if (freeUsers.length > 0) {
            console.log("\nSample users with role 'free':");
            freeUsers.forEach(u => {
                console.log(`- ID: ${u._id}, Email: ${u.email}, USN: ${u.usn}, Name: ${u.name}`);
            });
        } else {
            console.log("\nNo users found with role 'free' in raw query.");
        }

    } catch (err) {
        console.error("Diagnosis error:", err);
    } finally {
        await mongoose.connection.close();
        console.log("Connection closed.");
    }
}

diagnose();
