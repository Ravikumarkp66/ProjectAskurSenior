const mongoose = require('mongoose');
const Material = require('./backend/models/Material');
require('dotenv').config({ path: './backend/.env' });

async function checkMaterials() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const materials = await Material.find().limit(10);
        console.log("Found materials:", materials.length);
        materials.forEach(m => console.log(`- ${m.title} (${m.subjectName}) tags:`, m.tags));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkMaterials();
