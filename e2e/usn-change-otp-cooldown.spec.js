import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

let envJwtSecret = '';
try {
  const envContent = fs.readFileSync(path.resolve('backend/.env'), 'utf8');
  const match = envContent.match(/^JWT_SECRET=(.*)$/m);
  if (match) envJwtSecret = match[1].trim();
} catch (e) {}

const JWT_SECRET = process.env.JWT_SECRET || envJwtSecret || 'c4f98f4a8b1f7e21f8f54f8d3d81d42c9f8c0f6f9e1c7a1e4d3f7b9c8a6d5e2f';
const BACKEND_BASE = (process.env.E2E_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');

test.describe('E2E Canonical Profile, USN OTP Verification & 6-Month Cooldown', () => {
  const rand = Math.floor(100 + Math.random() * 899);
  const testEmail = `canonical.test.${Date.now()}.${rand}@askursenior.org`.toLowerCase();
  const initialName = 'canonical student';
  const initialUsn = `1SI23IS${rand}`.toUpperCase();
  const newUsn = `1SI23CS${rand}`.toUpperCase();
  const adminEmail = (process.env.E2E_ADMIN_EMAIL || 'mreducator4566@gmail.com').toLowerCase().trim();

  test('full canonical profile registration, USN change via college email OTP, USN history retention, and 6-month cooldown enforcement', async ({ request }) => {
    // ════════════════════════════════════════════════════════════════════
    // 1. Register new canonical student
    // ════════════════════════════════════════════════════════════════════
    const regToken = jwt.sign(
      {
        email: testEmail,
        googleId: `e2e_google_${rand}`,
        profilePicture: '',
        type: 'registration'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const regRes = await request.post(`${BACKEND_BASE}/api/auth/register`, {
      data: {
        registrationToken: regToken,
        name: initialName,
        usn: initialUsn,
        collegeName: 'Siddaganga Institute of Technology',
        semester: 3,
        graduationYear: 2027,
        phone: '9876543210',
        dob: '2004-05-15'
      }
    });

    expect(regRes.ok(), `Registration failed: ${await regRes.text()}`).toBeTruthy();
    const regData = await regRes.json();
    const student = regData.data?.student || regData.student;
    const token = regData.data?.accessToken || regData.token;

    expect(student.name).toBe(initialName);
    expect(student.usn).toBe(initialUsn);
    expect(student.email).toBe(testEmail);
    expect(student.semester).toBe(3);
    expect(student.phone).toBe('9876543210');
    expect(token).toBeTruthy();

    // ════════════════════════════════════════════════════════════════════
    // 2. Request USN Change OTP (Target: [new_usn]@sit.ac.in)
    // ════════════════════════════════════════════════════════════════════
    const otpReqRes = await request.post(`${BACKEND_BASE}/api/auth/profile/usn/request-otp`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { usn: newUsn }
    });

    expect(otpReqRes.ok(), `Request USN OTP failed: ${await otpReqRes.text()}`).toBeTruthy();
    const otpReqData = await otpReqRes.json();
    expect(otpReqData.success).toBe(true);
    expect(otpReqData.data.targetEmail).toBe(`${newUsn.toLowerCase()}@sit.ac.in`);

    // ════════════════════════════════════════════════════════════════════
    // 3. Fetch OTP via test utility & verify USN change
    // ════════════════════════════════════════════════════════════════════
    const otpKey = `usn_change_${student._id || student.id}_${newUsn}`;
    const otpFetchRes = await request.get(`${BACKEND_BASE}/api/admin/utils/get-test-otp`, {
      params: { key: otpKey }
    });

    expect(otpFetchRes.ok(), `Failed to fetch test OTP: ${await otpFetchRes.text()}`).toBeTruthy();
    const { otp: generatedOtp } = await otpFetchRes.json();
    expect(generatedOtp).toBeTruthy();

    const verifyRes = await request.post(`${BACKEND_BASE}/api/auth/profile/usn/verify-otp`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        usn: newUsn,
        otp: generatedOtp
      }
    });

    expect(verifyRes.ok(), `Verify USN OTP failed: ${await verifyRes.text()}`).toBeTruthy();
    const verifyData = await verifyRes.json();
    const updatedStudent = verifyData.data.student;

    expect(updatedStudent.usn).toBe(newUsn);
    expect(updatedStudent.usnLastChangedAt).toBeTruthy();
    expect(updatedStudent.usnHistory).toBeDefined();
    expect(updatedStudent.usnHistory.length).toBeGreaterThanOrEqual(1);
    expect(updatedStudent.usnHistory[0].usn).toBe(initialUsn);
    expect(updatedStudent.usnHistory[0].verifiedEmail).toBe(`${newUsn.toLowerCase()}@sit.ac.in`);

    // ════════════════════════════════════════════════════════════════════
    // 4. Enforce 6-Month Cooldown (180 days)
    // ════════════════════════════════════════════════════════════════════
    const thirdUsn = `1SI23EC${rand + 1}`.toUpperCase();
    const cooldownRes = await request.post(`${BACKEND_BASE}/api/auth/profile/usn/request-otp`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { usn: thirdUsn }
    });

    expect(cooldownRes.status(), 'Immediate subsequent USN change must be blocked by cooldown').toBe(400);
    const cooldownData = await cooldownRes.json();
    expect(cooldownData.message).toMatch(/recently updated your USN.*change it again in \d+ days/i);

    // ════════════════════════════════════════════════════════════════════
    // 5. Admin Users Verification
    // ════════════════════════════════════════════════════════════════════
    const adminToken = jwt.sign(
      {
        userId: 'admin_test_id',
        email: adminEmail,
        role: 'admin',
        isAdmin: true
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const adminUsersRes = await request.get(`${BACKEND_BASE}/api/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    expect(adminUsersRes.ok()).toBeTruthy();
    const adminUsersData = await adminUsersRes.json();
    const matchedAdminUser = (adminUsersData.users || []).find(u => u.email === testEmail);

    expect(matchedAdminUser).toBeDefined();
    expect(matchedAdminUser.usn).toBe(newUsn);
    expect(matchedAdminUser.name).toBe(initialName);
    expect(matchedAdminUser.registrationComplete).toBe(true);

    // ════════════════════════════════════════════════════════════════════
    // 6. Safe Cleanup
    // ════════════════════════════════════════════════════════════════════
    await request.delete(`${BACKEND_BASE}/api/admin/utils/cleanup-test-user`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      data: { email: testEmail }
    });
  });
});
