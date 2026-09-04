require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const User = require('../models/User');

const SUPER_ADMIN_PERMISSIONS = {
  users: { view: true, create: true, update: true, delete: true },
  subjects: { view: true, create: true, update: true, delete: true },
  materials: { view: true, create: true, update: true, delete: true, publish: true, archive: true },
  queries: { view: true, respond: true, resolve: true, delete: true },
  requests: { view: true, approve: true, reject: true }
};

const migrateExistingAdmin = async () => {
  const primaryEmail = (process.env.ADMIN_EMAIL || 'mreducator4566@gmail.com').toLowerCase().trim();
  console.log(`[Admin Migration] Checking existing admin account: ${primaryEmail}`);

  let adminDoc = await Admin.findOne({ email: primaryEmail });

  if (!adminDoc) {
    const existingUser = await User.findOne({ email: primaryEmail });
    const adminName = existingUser?.name || 'Ravikumar K P';

    adminDoc = await Admin.create({
      name: adminName,
      email: primaryEmail,
      role: 'SUPER_ADMIN',
      department: null,
      permissions: { ...SUPER_ADMIN_PERMISSIONS },
      status: 'ACTIVE',
      createdBy: 'System Migration'
    });
    console.log(`[Admin Migration] Successfully migrated primary Super Admin: ${primaryEmail} (${adminName})`);
  } else {
    // Ensure Super Admin privileges and active status
    let modified = false;
    if (adminDoc.role !== 'SUPER_ADMIN') {
      adminDoc.role = 'SUPER_ADMIN';
      modified = true;
    }
    if (adminDoc.status !== 'ACTIVE') {
      adminDoc.status = 'ACTIVE';
      modified = true;
    }
    if (adminDoc.department !== null) {
      adminDoc.department = null;
      modified = true;
    }
    if (modified) {
      adminDoc.permissions = { ...SUPER_ADMIN_PERMISSIONS };
      await adminDoc.save();
      console.log(`[Admin Migration] Updated privileges for existing Super Admin: ${primaryEmail}`);
    } else {
      console.log(`[Admin Migration] Super Admin account ${primaryEmail} is already active and verified.`);
    }
  }

  const superCount = await Admin.countDocuments({ role: 'SUPER_ADMIN' });
  const totalCount = await Admin.countDocuments();
  console.log(`[Admin Migration] Total Admins: ${totalCount} | Super Admins: ${superCount}/3`);
  return adminDoc;
};

if (require.main === module) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
      await migrateExistingAdmin();
      await mongoose.disconnect();
      console.log('[Admin Migration] Finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Admin Migration] Error:', err);
      process.exit(1);
    });
}

module.exports = { migrateExistingAdmin };
