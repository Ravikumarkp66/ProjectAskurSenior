const mongoose = require('mongoose');
const FaqCache = require('./backend/models/FaqCache');
require('dotenv').config({ path: './backend/.env' });

async function testCache() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const cache = await FaqCache.findOne({ question: "what is sgpa?" });
        console.log("Cache lookup:", cache);

        // Manually insert one for testing
        if (!cache) {
            await FaqCache.create({
                question: "what is sgpa?",
                answer: "SGPA is Semester Grade Point Average. It is calculated by dividing total grade points by total credits in a semester.",
                sources: ["Academic Regulations"]
            });
            console.log("Inserted test cache item.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
testCache();
