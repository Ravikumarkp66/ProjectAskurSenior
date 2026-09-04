/**
 * AskUrSenior E2E Admin Test Suite — Database Seed Setup
 * 
 * This Playwright setup project creates all test accounts, subjects, and materials
 * in MongoDB before the admin E2E tests run.
 * 
 * All test entities use 'e2e-' / 'E2E-' prefixes for complete isolation.
 * The seed is idempotent — it checks for existence before creating.
 */

import { test as setup } from '@playwright/test';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import {
  TEST_PASSWORD,
  SUPER1, SUPER2,
  ADMIN_CSE, ADMIN_ECE, ADMIN_ISE,
  STUDENT_CSE, STUDENT_ECE,
  TEST_SUBJECTS,
  ALL_TEST_EMAILS,
} from './helpers/test-accounts.js';

// Load backend env for MONGODB_URI
dotenv.config({ path: path.resolve('backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not found. Ensure backend/.env has MONGODB_URI set.');
}

setup('seed admin e2e test data', async () => {
  setup.setTimeout(120000);
  console.log('[seed] Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();

    // ─── 1. Resolve Branch ObjectIds ──────────────────────────────
    console.log('[seed] Resolving branch references...');
    const branchesCol = db.collection('branches');

    const cseBranch = await branchesCol.findOne({ shortName: 'CSE' });
    const eceBranch = await branchesCol.findOne({ shortName: 'ECE' });
    const iseBranch = await branchesCol.findOne({ shortName: 'ISE' });

    if (!cseBranch || !eceBranch || !iseBranch) {
      const missing = [!cseBranch && 'CSE', !eceBranch && 'ECE', !iseBranch && 'ISE'].filter(Boolean);
      throw new Error(
        `Missing branch(es) in database: ${missing.join(', ')}. ` +
        `Please ensure CSE, ECE, ISE branches exist in the 'branches' collection.`
      );
    }

    const branchMap = {
      CSE: cseBranch,
      ECE: eceBranch,
      ISE: iseBranch,
    };

    console.log(`[seed] Branches resolved: CSE=${cseBranch._id}, ECE=${eceBranch._id}, ISE=${iseBranch._id}`);

    // ─── 2. Hash the test password ────────────────────────────────
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

    // ─── 3. Create Admin records ──────────────────────────────────
    console.log('[seed] Creating admin accounts...');
    const adminsCol = db.collection('admins');

    const adminDefs = [
      { ...SUPER1, department: null },
      { ...SUPER2, department: null },
      { ...ADMIN_CSE, department: branchMap.CSE._id },
      { ...ADMIN_ECE, department: branchMap.ECE._id },
      { ...ADMIN_ISE, department: branchMap.ISE._id },
    ];

    for (const def of adminDefs) {
      const existing = await adminsCol.findOne({ email: def.email });
      if (existing) {
        console.log(`[seed]   Admin ${def.email} already exists, updating...`);
        await adminsCol.updateOne(
          { email: def.email },
          {
            $set: {
              name: def.name,
              role: def.role,
              department: def.department,
              permissions: def.permissions || undefined,
              status: 'ACTIVE',
              updatedAt: new Date(),
            },
          }
        );
      } else {
        console.log(`[seed]   Creating admin: ${def.email} (${def.role})`);
        await adminsCol.insertOne({
          name: def.name,
          email: def.email,
          role: def.role,
          department: def.department,
          permissions: def.permissions || undefined,
          status: 'ACTIVE',
          securityStatus: 'NORMAL',
          lastLogin: null,
          createdBy: 'e2e-seed',
          updatedBy: 'e2e-seed',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // ─── 4. Create User records for admin login ───────────────────
    //   The admin-login endpoint verifies password against the User collection.
    //   We create matching User records so credential-based login works.
    console.log('[seed] Creating User records for admin credential login...');
    const usersCol = db.collection('users');

    for (const def of adminDefs) {
      const existing = await usersCol.findOne({ email: def.email });
      if (existing) {
        console.log(`[seed]   User ${def.email} already exists, updating password...`);
        await usersCol.updateOne(
          { email: def.email },
          {
            $set: {
              password: hashedPassword,
              isAdmin: true,
              role: def.role,
              branch: def.departmentCode || 'CS',
              currentBranch: def.departmentCode || 'CS',
              registrationComplete: true,
              isSuspended: false,
              updatedAt: new Date(),
            },
          }
        );
      } else {
        console.log(`[seed]   Creating user for admin: ${def.email}`);
        await usersCol.insertOne({
          email: def.email,
          name: def.name,
          password: hashedPassword,
          isAdmin: true,
          role: def.role,
          branch: def.departmentCode || 'CS',
          currentBranch: def.departmentCode || 'CS',
          registrationComplete: true,
          isSuspended: false,
          securityStatus: 'NORMAL',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // ─── 5. Create Student User + StudentAccount records ──────────
    console.log('[seed] Creating student accounts...');
    const studentAccountsCol = db.collection('student_accounts');

    const studentDefs = [
      { ...STUDENT_CSE, branchId: branchMap[STUDENT_CSE.branchCode]._id },
      { ...STUDENT_ECE, branchId: branchMap[STUDENT_ECE.branchCode]._id },
    ];

    await studentAccountsCol.deleteMany({
      $or: [
        { email: { $in: studentDefs.map(s => s.email) } },
        { usn: { $in: studentDefs.map(s => s.usn) } }
      ]
    });

    for (const def of studentDefs) {
      // User record (legacy — needed for login)
      const existingUser = await usersCol.findOne({ email: def.email });
      if (!existingUser) {
        console.log(`[seed]   Creating student user: ${def.usn}`);
        await usersCol.insertOne({
          usn: def.usn,
          email: def.email,
          name: def.name,
          password: hashedPassword,
          branch: def.branchCode,
          currentBranch: def.branchCode,
          role: 'student',
          isAdmin: false,
          registrationComplete: true,
          isSuspended: false,
          securityStatus: 'NORMAL',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await usersCol.updateOne(
          { email: def.email },
          {
            $set: {
              usn: def.usn,
              password: hashedPassword,
              branch: def.branchCode,
              currentBranch: def.branchCode,
              registrationComplete: true,
              isSuspended: false,
            },
          }
        );
      }

      // Clean up any prior broken test records
      await studentAccountsCol.deleteMany({
        $or: [{ email: def.email }, { usn: def.usn }, { studentId: def.usn }]
      });

      console.log(`[seed]   Creating student account: ${def.usn}`);
      await studentAccountsCol.insertOne({
        _id: existingUser ? existingUser._id : new ObjectId(),
        studentId: def.usn,
        name: def.name,
        email: def.email,
        usn: def.usn,
        password: hashedPassword,
        branch: def.branchId,
        semester: 3,
        accountStatus: 'active',
        role: 'student',
        securityStatus: 'NORMAL',
        registrationStatus: 'completed',
        onboardingCompleted: true,
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // ─── 6. Create Test Subjects ──────────────────────────────────
    console.log('[seed] Creating test subjects...');
    const subjectsCol = db.collection('academic_subjects');

    // Find a valid scheme to use (pick the first published one)
    const schemesCol = db.collection('schemes');
    const defaultScheme = await schemesCol.findOne({ status: { $in: ['Published', 'active', 'Active'] } });

    const createdSubjects = {};

    for (const [key, def] of Object.entries(TEST_SUBJECTS)) {
      const branch = branchMap[def.departmentCode];
      const existing = await subjectsCol.findOne({ code: def.code });

      if (existing) {
        console.log(`[seed]   Subject ${def.code} already exists`);
        createdSubjects[key] = existing;
      } else {
        console.log(`[seed]   Creating subject: ${def.code} (${def.name})`);
        const result = await subjectsCol.insertOne({
          name: def.name,
          code: def.code,
          year: def.year,
          branch: branch._id,
          scheme: defaultScheme?._id || null,
          slug: def.slug,
          status: 'Published',
          materialCount: 0,
          credits: 4,
          defaultTheoryClasses: 4,
          defaultLabSessions: 0,
          creatorEmail: 'e2e-seed@test.askursenior.org',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        createdSubjects[key] = { _id: result.insertedId, ...def };
      }
    }

    // ─── 7. Create Test Materials (DB records only, no S3 upload) ─
    console.log('[seed] Creating test materials...');
    const materialsCol = db.collection('academic_materials');

    const materialDefs = [
      {
        title: '[E2E] CSE Data Structures Notes',
        subject: createdSubjects.cse._id,
        materialType: 'Notes',
        uploaderEmail: ADMIN_CSE.email,
      },
      {
        title: '[E2E] ECE Network Theory Notes',
        subject: createdSubjects.ece._id,
        materialType: 'Notes',
        uploaderEmail: ADMIN_ECE.email,
      },
      {
        title: '[E2E] ISE Database Management Notes',
        subject: createdSubjects.ise._id,
        materialType: 'Notes',
        uploaderEmail: ADMIN_ISE.email,
      },
    ];

    for (const def of materialDefs) {
      const existing = await materialsCol.findOne({ title: def.title });
      if (existing) {
        console.log(`[seed]   Material "${def.title}" already exists`);
      } else {
        console.log(`[seed]   Creating material: ${def.title}`);
        await materialsCol.insertOne({
          title: def.title,
          subject: def.subject,
          materialType: def.materialType,
          fileUrl: 'https://e2e-test-placeholder.invalid/test-document.pdf',
          storedFileName: 'e2e-test-document.pdf',
          originalFileName: 'test-document.pdf',
          fileType: 'pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          uploaderEmail: def.uploaderEmail,
          status: 'Published',
          downloadCount: 0,
          previewCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // ─── 8. Save test metadata for other tests ────────────────────
    const authDir = path.resolve('admin-e2e/.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Save subject IDs for cross-referencing in tests
    const testData = {
      branches: {
        CSE: { _id: cseBranch._id.toString(), shortName: 'CSE' },
        ECE: { _id: eceBranch._id.toString(), shortName: 'ECE' },
        ISE: { _id: iseBranch._id.toString(), shortName: 'ISE' },
      },
      subjects: {},
      materials: {},
    };

    for (const [key, sub] of Object.entries(createdSubjects)) {
      testData.subjects[key] = { _id: sub._id.toString(), code: sub.code || TEST_SUBJECTS[key].code };
    }

    // Fetch material IDs
    for (const def of materialDefs) {
      const mat = await materialsCol.findOne({ title: def.title });
      if (mat) {
        const dept = def.uploaderEmail.includes('cse') ? 'cse' : def.uploaderEmail.includes('ece') ? 'ece' : 'ise';
        testData.materials[dept] = { _id: mat._id.toString(), title: mat.title };
      }
    }

    fs.writeFileSync(
      path.join(authDir, 'test-data.json'),
      JSON.stringify(testData, null, 2)
    );
    console.log('[seed] Test data metadata saved to admin-e2e/.auth/test-data.json');

    console.log('[seed] ✅ Database seeding complete!');
  } finally {
    await client.close();
    console.log('[seed] MongoDB connection closed');
  }
});
