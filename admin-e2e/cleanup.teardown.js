/**
 * AskUrSenior E2E Admin Test Suite — Database Cleanup Teardown
 * 
 * Runs after all admin E2E tests complete.
 * Removes ALL test entities created by the seed script.
 * Uses 'e2e-' / 'E2E-' prefix matching for safe, targeted cleanup.
 */

import { test as teardown } from '@playwright/test';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import { ALL_TEST_EMAILS, ALL_TEST_USNS } from './helpers/test-accounts.js';

dotenv.config({ path: path.resolve('backend/.env') });

const MONGODB_URI = process.env.MONGODB_URI;

teardown('cleanup admin e2e test data', async () => {
  teardown.setTimeout(120000);
  if (!MONGODB_URI) {
    console.warn('[cleanup] MONGODB_URI not found, skipping cleanup');
    return;
  }

  console.log('[cleanup] Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();

    // ─── 1. Delete test Admin records ─────────────────────────────
    const adminResult = await db.collection('admins').deleteMany({
      email: { $in: ALL_TEST_EMAILS },
    });
    console.log(`[cleanup] Deleted ${adminResult.deletedCount} admin records`);

    // ─── 2. Delete test User records ──────────────────────────────
    const userResult = await db.collection('users').deleteMany({
      $or: [
        { email: { $in: ALL_TEST_EMAILS } },
        { email: { $in: ALL_TEST_USNS.map(u => `${u.toLowerCase()}@test.askursenior.org`) } },
        { usn: { $in: ALL_TEST_USNS } },
        { email: { $regex: /^e2e-.*@test\.askursenior\.org$/ } },
      ],
    });
    console.log(`[cleanup] Deleted ${userResult.deletedCount} user records`);

    // ─── 3. Delete test StudentAccount records ────────────────────
    const saResult = await db.collection('student_accounts').deleteMany({
      $or: [
        { email: { $regex: /^e2e-.*@test\.askursenior\.org$/ } },
        { usn: { $in: ALL_TEST_USNS } },
      ],
    });
    console.log(`[cleanup] Deleted ${saResult.deletedCount} student account records`);

    // ─── 4. Delete test Subject records ───────────────────────────
    const subjectResult = await db.collection('academic_subjects').deleteMany({
      code: { $regex: /^E2E-/ },
    });
    console.log(`[cleanup] Deleted ${subjectResult.deletedCount} subject records`);

    // ─── 5. Delete test Material records ──────────────────────────
    const materialResult = await db.collection('academic_materials').deleteMany({
      title: { $regex: /^\[E2E\]/ },
    });
    console.log(`[cleanup] Deleted ${materialResult.deletedCount} material records`);

    // ─── 6. Delete test LoginSession records ──────────────────────
    const sessionResult = await db.collection('login_sessions').deleteMany({
      email: { $regex: /^e2e-.*@test\.askursenior\.org$/ },
    });
    console.log(`[cleanup] Deleted ${sessionResult.deletedCount} login session records`);

    // ─── 7. Delete test AdminActivity / audit log records ─────────
    const activityResult = await db.collection('admin_activities').deleteMany({
      $or: [
        { 'admin.email': { $regex: /^e2e-.*@test\.askursenior\.org$/ } },
        { adminEmail: { $regex: /^e2e-.*@test\.askursenior\.org$/ } },
        { 'metadata.title': { $regex: /^\[E2E\]|^E2E / } },
      ],
    });
    console.log(`[cleanup] Deleted ${activityResult.deletedCount} admin activity records`);

    // ─── 8. Delete test Announcement records ──────────────────────
    const announcementResult = await db.collection('announcements').deleteMany({
      title: { $regex: /^\[E2E\]/ },
    });
    console.log(`[cleanup] Deleted ${announcementResult.deletedCount} announcement records`);

    // ─── 9. Clean up .auth directory ──────────────────────────────
    const authDir = path.resolve('admin-e2e/.auth');
    const testDataFile = path.join(authDir, 'test-data.json');
    if (fs.existsSync(testDataFile)) {
      fs.unlinkSync(testDataFile);
      console.log('[cleanup] Removed test-data.json');
    }

    console.log('[cleanup] ✅ Cleanup complete!');
  } finally {
    await client.close();
    console.log('[cleanup] MongoDB connection closed');
  }
});
