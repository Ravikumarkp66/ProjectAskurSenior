const mongoose = require('mongoose');
require('dotenv').config({path: 'c:/AskUrSenior/backend/.env'});

const DocumentSchema = new mongoose.Schema({
    isApproved: Boolean,
    isDeleted: Boolean
});

const Document = mongoose.models.Document || mongoose.model('Document', DocumentSchema);

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const total = await Document.countDocuments({});
        const approved = await Document.countDocuments({isApproved: true, isDeleted: { $ne: true }});
        const pending = await Document.countDocuments({isApproved: false, isDeleted: { $ne: true }});
        console.log('--- DB STATS ---');
        console.log('Total Documents:', total);
        console.log('Approved Documents:', approved);
        console.log('Pending Documents:', pending);
        process.exit(0);
    } catch (err) {
        console.error('DB Check Failed:', err);
        process.exit(1);
    }
}

check();
