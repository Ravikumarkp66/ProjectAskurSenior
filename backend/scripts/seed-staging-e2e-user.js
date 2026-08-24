require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentAccount = require('../models/StudentAccount');

async function seedStagingTestUser() {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || '';

    // STRICT SAFETY CHECK 1: Ensure URI strictly targets staging database
    if (!mongoUri.includes('askursenior_staging')) {
        console.error('❌ SAFETY ABORT: MongoDB URI is not pointing to askursenior_staging. Aborting to protect production!');
        process.exit(1);
    }

    try {
        console.log('Connecting to staging MongoDB...');
        await mongoose.connect(mongoUri);

        const dbName = mongoose.connection.name;
        if (dbName !== 'askursenior_staging') {
            console.error(`❌ SAFETY ABORT: Active database is "${dbName}", not "askursenior_staging". Aborting!`);
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log(`✅ Verified staging database connection: ${dbName}`);

        const testUsn = (process.env.E2E_TEST_USN || 'STAGING01').toUpperCase().trim();
        const testEmail = (process.env.E2E_TEST_EMAIL || 'staging.tester@askursenior.org').toLowerCase().trim();
        const testPassword = process.env.E2E_TEST_PASSWORD || 'StagingE2EPass2026!';
        const testName = 'Staging E2E Tester';

        // 1. Seed or Update User
        let user = await User.findOne({ $or: [{ usn: testUsn }, { email: testEmail }] });

        if (user) {
            console.log(`Found existing staging test user (${user.usn}). Updating password & status...`);
            user.usn = testUsn;
            user.email = testEmail;
            user.password = testPassword; // pre-save hook will hash it
            user.name = testName;
            user.branch = 'CS';
            user.currentBranch = 'CS';
            user.semester = 4;
            user.registrationComplete = true;
            user.isSuspended = false;
            await user.save();
        } else {
            console.log(`Creating new staging test user: USN=${testUsn}, Email=${testEmail}`);
            user = new User({
                usn: testUsn,
                email: testEmail,
                password: testPassword,
                name: testName,
                branch: 'CS',
                currentBranch: 'CS',
                semester: 4,
                registrationComplete: true,
                isSuspended: false
            });
            await user.save();
        }

        // 2. Seed or Update corresponding StudentAccount with the same _id
        let student = await StudentAccount.findById(user._id);
        if (student) {
            student.email = testEmail;
            student.name = testName;
            student.usn = testUsn;
            student.password = testPassword;
            student.semester = 4;
            student.registrationStatus = 'completed';
            student.onboardingCompleted = true;
            student.accountStatus = 'active';
            await student.save();
        } else {
            student = new StudentAccount({
                _id: user._id,
                email: testEmail,
                studentId: testUsn,
                authProvider: 'email',
                password: testPassword,
                name: testName,
                usn: testUsn,
                semester: 4,
                registrationStatus: 'completed',
                onboardingCompleted: true,
                accountStatus: 'active'
            });
            await student.save();
        }

        console.log(`✅ Staging StudentAccount & User successfully seeded: ID=${user._id}, USN=${user.usn}, Email=${user.email}`);
        await mongoose.disconnect();
        console.log('Disconnected cleanly.');
    } catch (error) {
        console.error('❌ Error seeding staging test user:', error);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
}

seedStagingTestUser();
