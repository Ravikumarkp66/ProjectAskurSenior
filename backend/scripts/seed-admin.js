/**
 * seed-admin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time script to create (or promote) the admin user in MongoDB.
 * Credentials are read exclusively from .env — NEVER hardcoded in source.
 *
 * Usage:
 *   node scripts/seed-admin.js
 *
 * Required .env variables:
 *   MONGODB_URI     — MongoDB connection string
 *   ADMIN_EMAIL     — Admin email address
 *   ADMIN_PASSWORD  — Plain-text password (stored as bcrypt hash)
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

// ── Validation ──────────────────────────────────────────────────────────────
if (!MONGODB_URI)       { console.error('❌  MONGODB_URI is not set in .env');    process.exit(1); }
if (!ADMIN_EMAIL)       { console.error('❌  ADMIN_EMAIL is not set in .env');    process.exit(1); }
if (!ADMIN_PASSWORD)    { console.error('❌  ADMIN_PASSWORD is not set in .env'); process.exit(1); }

// ── Minimal schema (raw — skips all hooks to prevent double-hashing) ─────────
const userSchema = new mongoose.Schema({}, { strict: false });
const UserRaw = mongoose.model('UserRaw', userSchema, 'users'); // 'users' = actual collection

// ── Main ─────────────────────────────────────────────────────────────────────
async function seedAdmin() {
    console.log('\n🔧  AskUrSenior — Admin Seed Script');
    console.log('━'.repeat(50));

    await mongoose.connect(MONGODB_URI);
    console.log('✅  Connected to MongoDB');

    const email = ADMIN_EMAIL.trim().toLowerCase();

    // Hash password (bcrypt, cost=12) — this is the only place in the codebase
    // that ever touches the plain-text ADMIN_PASSWORD from env
    console.log('🔐  Hashing password...');
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const existing = await UserRaw.findOne({ email });

    if (existing) {
        await UserRaw.updateOne(
            { email },
            {
                $set: {
                    isAdmin: true,
                    role: 'admin',
                    password: hashedPassword,
                    registrationComplete: true,
                    accountStatus: 'active',
                    lastLogin: new Date(),
                    updatedAt: new Date(),
                }
            }
        );
        console.log(`\n${existing.isAdmin ? '🔄  Admin user updated' : '🚀  Existing user PROMOTED to admin'}:`);
    } else {
        await UserRaw.create({
            email,
            name: 'Admin',
            password: hashedPassword,
            isAdmin: true,
            role: 'admin',
            branch: 'CS',
            currentBranch: 'CS',
            registrationComplete: true,
            accountStatus: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log('\n🚀  New admin user created:');
    }

    console.log(`   📧  Email   : ${email}`);
    console.log(`   🛡️  isAdmin : true`);
    console.log(`   🔑  Password: [stored as bcrypt hash — plain text not logged]`);
    console.log('\n✅  Done! Log in at  →  /admin/login');
    console.log('━'.repeat(50) + '\n');

    await mongoose.disconnect();
    process.exit(0);
}

seedAdmin().catch((err) => {
    console.error('\n❌  Seed failed:', err.message);
    console.error(err);
    process.exit(1);
});
