const mongoose = require('mongoose');
const User = require('./models/User');
const Subject = require('./models/Subject');
const UserUpload = require('./models/UserUpload');
require('dotenv').config();

const createIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Creating User indexes...');
        await User.collection.createIndex({ email: 1 });
        await User.collection.createIndex({ usn: 1 });
        await User.collection.createIndex({ createdAt: -1 });

        console.log('Creating Subject indexes...');
        // code is already unique in schema usually, but ensure index exists
        await Subject.collection.createIndex({ code: 1 }, { unique: true });

        console.log('Creating UserUpload indexes...');
        await UserUpload.collection.createIndex({ status: 1 });
        await UserUpload.collection.createIndex({ userId: 1 });
        await UserUpload.collection.createIndex({ createdAt: -1 });

        console.log('All indexes created successfully');
        process.exit(0);
    } catch (err) {
        console.error('Index creation failed:', err);
        process.exit(1);
    }
};

createIndexes();
