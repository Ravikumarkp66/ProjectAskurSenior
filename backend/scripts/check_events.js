require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const items = await db.collection('academic_calendar_items').find({
        $or: [
            { title: /test/i },
            { title: /exam/i },
            { title: /see/i },
            { kind: 'EVENT' }
        ]
    }).toArray();
    console.log('academic_calendar_items:');
    for (const it of items) {
        console.log(`- Title: "${it.title}", kind: "${it.kind}", classImpact: "${it.classImpact}", observedByCollege: ${it.observedByCollege}`);
    }
    await mongoose.disconnect();
}

main().catch(console.error);
