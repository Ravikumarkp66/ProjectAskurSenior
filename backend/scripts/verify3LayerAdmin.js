const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {}

const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const AdminActivity = require('../models/AdminActivity');
const AcademicMaterial = require('../models/AcademicMaterial');
const AcademicSubject = require('../models/AcademicSubject');
const Announcement = require('../models/Announcement');
const Branch = require('../models/Branch');
const User = require('../models/User');
const {
  logActivity,
  getAdminContributionStats,
  getLeaderboard,
  getActivityLogs
} = require('../services/adminActivityService');

async function runVerification() {
  console.log('=== STARTING 3-LAYER ADMIN SYSTEM VERIFICATION ===\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    try {
      await AcademicMaterial.collection.dropIndex('legacyDocumentId_1');
    } catch (e) {}
    await AcademicMaterial.syncIndexes();

    // 1. Check Super Admin existence
    const superAdmin = await Admin.findOne({ role: 'SUPER_ADMIN', status: 'ACTIVE' });
    if (!superAdmin) {
      throw new Error('No active Super Admin found in database!');
    }
    console.log(`✓ Super Admin verified: ${superAdmin.name} (${superAdmin.email})`);

    // 2. Create two temporary test admins: Rahul (CSE) and Arjun (ECE)
    const cseBranch = await Branch.findOne({ shortName: 'CSE' }) || await Branch.findOne();
    const testRahulEmail = 'test_rahul_admin@example.com';
    const testArjunEmail = 'test_arjun_admin@example.com';

    await Admin.deleteMany({ email: { $in: [testRahulEmail, testArjunEmail] } });
    await User.deleteMany({ email: { $in: [testRahulEmail, testArjunEmail] } });
    await AdminActivity.deleteMany({ adminEmail: { $in: [testRahulEmail, testArjunEmail] } });
    await AcademicMaterial.deleteMany({ uploaderEmail: { $in: [testRahulEmail, testArjunEmail] } });
    await Announcement.deleteMany({ title: /Rahul Test/ });

    const rahulUser = await User.create({
      name: 'Test Rahul',
      email: testRahulEmail,
      role: 'admin',
      isAdmin: true,
      branch: 'CS'
    });

    const rahulAdmin = await Admin.create({
      name: 'Test Rahul',
      email: testRahulEmail,
      role: 'ADMIN',
      department: cseBranch._id,
      status: 'ACTIVE'
    });

    const arjunUser = await User.create({
      name: 'Test Arjun',
      email: testArjunEmail,
      role: 'admin',
      isAdmin: true,
      branch: 'CS'
    });

    const arjunAdmin = await Admin.create({
      name: 'Test Arjun',
      email: testArjunEmail,
      role: 'ADMIN',
      department: cseBranch._id,
      status: 'ACTIVE'
    });

    console.log('✓ Created test admins: Rahul and Arjun');

    // 3. Test Layer 2: Activity / Audit Logging with Diffs and Bulk Operations
    console.log('\n--- Testing Layer 2: Audit Logs & Diffs ---');
    
    // Test A: Single action with diff
    const log1 = await logActivity({
      admin: rahulAdmin,
      action: 'UPDATE',
      resourceType: 'MATERIAL',
      department: cseBranch._id,
      metadata: {
        title: 'Data Structures Unit 3 Notes',
        materialType: 'Notes',
        changes: {
          title: { old: 'DS Notes v1', new: 'Data Structures Unit 3 Notes' },
          status: { old: 'Draft', new: 'Published' }
        }
      }
    });
    console.log('✓ Logged UPDATE action with diffs:', log1._id.toString());

    // Test B: Bulk operation with affected IDs and count
    const log2 = await logActivity({
      admin: rahulAdmin,
      action: 'DELETE',
      resourceType: 'MATERIAL',
      department: cseBranch._id,
      metadata: {
        count: 5,
        affectedIds: ['M001', 'M002', 'M003', 'M004', 'M005'],
        title: '5 materials moved to trash',
        extra: { actionType: 'Move to Trash' }
      }
    });
    console.log('✓ Logged Bulk DELETE with affected IDs & count (5 records):', log2._id.toString());

    // Verify querying activity logs
    const auditLogsQuery = await getActivityLogs({
      adminId: rahulAdmin._id,
      page: 1,
      limit: 10
    });
    if (auditLogsQuery.total < 2) {
      throw new Error(`Expected at least 2 audit logs for Rahul, found ${auditLogsQuery.total}`);
    }
    console.log(`✓ Queried audit logs for Rahul: found ${auditLogsQuery.total} entries`);

    // 4. Test Layer 3: Contributions (Separation of Creator Credit from Audit Logs)
    console.log('\n--- Testing Layer 3: Contributions Separation ---');

    // Rahul uploads:
    // 2 Notes, 1 PYQ, 1 Question Bank
    const testMaterials = await AcademicMaterial.create([
      {
        title: 'Rahul Test Notes 1',
        materialType: 'Notes',
        fileUrl: 'https://example.com/notes1.pdf',
        storedFileName: 'notes1.pdf',
        originalFileName: 'notes1.pdf',
        uploadedBy: rahulUser._id,
        uploaderEmail: testRahulEmail,
        status: 'Published'
      },
      {
        title: 'Rahul Test Notes 2',
        materialType: 'Notes',
        fileUrl: 'https://example.com/notes2.pdf',
        storedFileName: 'notes2.pdf',
        originalFileName: 'notes2.pdf',
        uploadedBy: rahulUser._id,
        uploaderEmail: testRahulEmail,
        status: 'Published'
      },
      {
        title: 'Rahul Test PYQ 1',
        materialType: 'PYQs',
        fileUrl: 'https://example.com/pyq1.pdf',
        storedFileName: 'pyq1.pdf',
        originalFileName: 'pyq1.pdf',
        uploadedBy: rahulUser._id,
        uploaderEmail: testRahulEmail,
        status: 'Published'
      },
      {
        title: 'Rahul Test QBank 1',
        materialType: 'Question Banks',
        fileUrl: 'https://example.com/qb1.pdf',
        storedFileName: 'qb1.pdf',
        originalFileName: 'qb1.pdf',
        uploadedBy: rahulUser._id,
        uploaderEmail: testRahulEmail,
        status: 'Published'
      }
    ]);

    // Rahul creates 1 Announcement
    const testAnnouncement = await Announcement.create({
      title: 'Rahul Test Announcement',
      description: 'Test announcement description',
      category: 'circular',
      createdBy: rahulUser._id
    });

    console.log('✓ Rahul created 4 materials (2 Notes, 1 PYQ, 1 Question Bank) and 1 Announcement');

    // Initial contribution check for Rahul
    let rahulStats = await getAdminContributionStats(rahulAdmin._id, 'all');
    console.log('Rahul Initial Stats:', {
      notes: rahulStats.notes,
      pyqs: rahulStats.pyqs,
      questionBanks: rahulStats.questionBanks,
      announcements: rahulStats.announcements,
      total: rahulStats.total
    });

    if (rahulStats.notes !== 2 || rahulStats.pyqs !== 1 || rahulStats.questionBanks !== 1 || rahulStats.total !== 5) {
      throw new Error(`Contribution mismatch for Rahul! Expected 2 Notes, 1 PYQ, 1 QB, 1 Announce (Total 5). Got: ${JSON.stringify(rahulStats)}`);
    }
    console.log('✓ Rahul received exact contribution credit (+2 Notes, +1 PYQ, +1 QB, +1 Announce = 5 Total)');

    // NOW: Arjun EDITS Rahul's material!
    // Arjun updates title and status of Rahul's Notes 1
    await logActivity({
      admin: arjunAdmin,
      action: 'UPDATE',
      resourceType: 'MATERIAL',
      resourceId: testMaterials[0]._id,
      metadata: {
        title: 'Rahul Test Notes 1 (Edited by Arjun)',
        changes: {
          title: { old: 'Rahul Test Notes 1', new: 'Rahul Test Notes 1 (Edited by Arjun)' }
        }
      }
    });

    // Also update the material record, BUT uploadedBy / uploaderEmail remain Rahul!
    testMaterials[0].title = 'Rahul Test Notes 1 (Edited by Arjun)';
    await testMaterials[0].save();

    console.log('✓ Arjun edited Rahul\'s Notes 1 and generated an UPDATE audit log');

    // Check contributions again:
    // Rahul must STILL have 2 Notes!
    rahulStats = await getAdminContributionStats(rahulAdmin._id, 'all');
    const arjunStats = await getAdminContributionStats(arjunAdmin._id, 'all');

    console.log('Post-Edit Stats:');
    console.log('  Rahul Total:', rahulStats.total, '| Notes:', rahulStats.notes);
    console.log('  Arjun Total:', arjunStats.total, '| Notes:', arjunStats.notes);

    if (rahulStats.total !== 5 || rahulStats.notes !== 2) {
      throw new Error(`CRITICAL FAILURE: Rahul lost contribution credit when Arjun edited! Total: ${rahulStats.total}`);
    }
    if (arjunStats.total !== 0) {
      throw new Error(`CRITICAL FAILURE: Arjun received creation credit for editing! Total: ${arjunStats.total}`);
    }

    console.log('✓ PASS: Rahul retained 100% original creator credit after Arjun\'s edit. Arjun has 0 contributions.');

    // 5. Test Global Leaderboard
    console.log('\n--- Testing Leaderboard ---');
    const leaderboard = await getLeaderboard('all');
    console.log(`✓ Leaderboard returned ${leaderboard.length} ranked administrators`);
    const rahulInLeaderboard = leaderboard.find(l => l.email === testRahulEmail);
    if (!rahulInLeaderboard || rahulInLeaderboard.total !== 5) {
      throw new Error('Rahul was not ranked correctly in leaderboard!');
    }
    console.log(`✓ Leaderboard verified: ${rahulInLeaderboard.name} has rank #${rahulInLeaderboard.rank} with ${rahulInLeaderboard.total} total items`);

    // Clean up test records
    await AcademicMaterial.deleteMany({ _id: { $in: testMaterials.map(m => m._id) } });
    await Announcement.deleteMany({ _id: testAnnouncement._id });
    await Admin.deleteMany({ email: { $in: [testRahulEmail, testArjunEmail] } });
    await User.deleteMany({ email: { $in: [testRahulEmail, testArjunEmail] } });
    await AdminActivity.deleteMany({ adminEmail: { $in: [testRahulEmail, testArjunEmail] } });
    console.log('\n✓ Cleaned up all temporary test records');

    console.log('\n======================================================');
    console.log('🎉 ALL 3-LAYER ADMIN ARCHITECTURE TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================');
  } catch (err) {
    console.error('\n❌ VERIFICATION FAILED:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('✓ Disconnected from MongoDB');
  }
}

runVerification();
