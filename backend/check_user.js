require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUserState() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ usn: '4SI23IS080' });
        if (user) {
            console.log('User Found:', user.usn);
            console.log('Subscription:', user.subscription);
            console.log('Subscription Expiry:', user.subscriptionExpiry);
            console.log('Role:', user.role);
        } else {
            console.log('User 4SI23IS080 not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}
checkUserState();
