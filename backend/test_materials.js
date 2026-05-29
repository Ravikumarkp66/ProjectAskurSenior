const mongoose = require('mongoose');
const Document = require('./models/Document');
require('dotenv').config({ path: './.env' });

async function checkMaterials() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const docs = await Document.find({ isApproved: true, isDeleted: false }).limit(10);
        console.log("Found documents:", docs.length);
        docs.forEach(m => console.log(`- ${m.originalName} (${m.subjectName}) tags:`, m.tags));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkMaterials();
