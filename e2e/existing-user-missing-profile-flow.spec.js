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
const ADMIN_BASE_URL = process.env.E2E_ADMIN_URL || 'http://localhost:5174';

test.describe('E2E Existing User Login with Missing Profile Pieces Flow', () => {
  const randNum = Math.floor(100 + Math.random() * 899);
  const testEmail = `e2e.missingprofile.${Date.now()}.${randNum}@askursenior.org`.toLowerCase().trim();
  const canonicalName = 'rohit sharma';
  const testUsn = `1SI23IS${randNum}`.toUpperCase();
  const adminEmail = (process.env.E2E_ADMIN_EMAIL || 'mreducator4566@gmail.com').toLowerCase().trim();

  test.afterAll(async ({ request }) => {
    try {
      await request.post(`${BACKEND_BASE}/api/admin-utils/cleanup-test-user`, {
        data: { email: testEmail, usn: testUsn }
      });
    } catch (e) {}
  });

  test('detects missing pieces on existing user login, prompts to complete profile, saves all canonical fields, and locks profile as complete', async ({ page, request }) => {
    // 1. Create Incomplete User Account (Missing DOB, Phone) via Initial Register
    const initialRegToken = jwt.sign(
      { email: testEmail, isExistingUser: false, type: 'registration' },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    const initRes = await request.post(`${BACKEND_BASE}/api/auth/register`, {
      data: {
        registrationToken: initialRegToken,
        name: canonicalName,
        usn: testUsn,
        collegeName: 'Siddaganga Institute of Technology',
        graduationYear: 2027,
        semester: 7
      }
    });

    expect(initRes.ok(), `Initial registration setup failed: ${initRes.status()}`).toBeTruthy();

    // 2. Existing User Logs In via Email OTP Flow
    const sendOtpRes = await request.post(`${BACKEND_BASE}/api/auth/send-otp`, {
      data: { email: testEmail }
    });
    expect(sendOtpRes.ok()).toBeTruthy();

    const otpQueryRes = await request.get(`${BACKEND_BASE}/api/admin-utils/get-test-otp`, {
      params: { email: testEmail }
    });
    expect(otpQueryRes.ok()).toBeTruthy();
    const { otp } = await otpQueryRes.json();
    expect(otp).toBeTruthy();

    const verifyOtpRes = await request.post(`${BACKEND_BASE}/api/auth/verify-otp`, {
      data: { email: testEmail, otp }
    });
    expect(verifyOtpRes.ok()).toBeTruthy();
    const verifyData = await verifyOtpRes.json();

    expect(verifyData.data.registrationRequired).toBe(true);
    expect(verifyData.data.isExistingUser).toBe(true);
    expect(verifyData.data.registrationToken).toBeTruthy();
    expect(verifyData.data.prefilled.email).toBe(testEmail);
    expect(verifyData.data.prefilled.name).toBe(canonicalName);
    expect(verifyData.data.prefilled.usn).toBe(testUsn);
    expect(verifyData.data.missingFields).toContain('DOB');
    expect(verifyData.data.missingFields).toContain('Phone');

    const updateToken = verifyData.data.registrationToken;

    // 3. User Navigates to Complete Profile Page with Prefilled Data
    await page.goto('/complete-profile');
    await page.evaluate(({ token, prefilled }) => {
      sessionStorage.setItem('registrationToken', token);
      sessionStorage.setItem('registrationPrefilled', JSON.stringify(prefilled));
      sessionStorage.setItem('registrationEmail', prefilled.email);
    }, { token: updateToken, prefilled: verifyData.data.prefilled });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // 4. Fill in Missing Pieces (DOB and Mobile Phone)
    const phoneInput = page.locator('input[placeholder*="mobile" i], input[type="tel"]').first();
    await phoneInput.fill('9123456789');

    const dobInput = page.locator('input[type="date"]').first();
    await dobInput.fill('2003-08-20');

    // Submit Complete Profile
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify navigation to dashboard
    await expect(page).not.toHaveURL(/\/complete-profile/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

    // 5. Subsequent Login Goes Directly to Dashboard (No Complete Profile)
    const sendOtp2Res = await request.post(`${BACKEND_BASE}/api/auth/send-otp`, {
      data: { email: testEmail }
    });
    expect(sendOtp2Res.ok()).toBeTruthy();

    const otpQuery2Res = await request.get(`${BACKEND_BASE}/api/admin-utils/get-test-otp`, {
      params: { email: testEmail }
    });
    const { otp: otp2 } = await otpQuery2Res.json();

    const verifyOtp2Res = await request.post(`${BACKEND_BASE}/api/auth/verify-otp`, {
      data: { email: testEmail, otp: otp2 }
    });
    expect(verifyOtp2Res.ok()).toBeTruthy();
    const verify2Data = await verifyOtp2Res.json();

    expect(verify2Data.data.registrationRequired).toBe(false);
    expect(verify2Data.data.accessToken).toBeTruthy();

    // 6. Admin User Review Modal Confirms "Complete Profile"
    const adminToken = jwt.sign(
      { userId: 'admin_e2e_id', email: adminEmail, role: 'admin', isAdmin: true },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const adminUserRes = await request.get(`${BACKEND_BASE}/api/admin/analytics/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { search: testEmail }
    });
    expect(adminUserRes.ok()).toBeTruthy();
    const adminUserData = await adminUserRes.json();
    const userDoc = (adminUserData.users || []).find(u => u.email === testEmail);

    expect(userDoc).toBeDefined();
    expect(userDoc.phone).toBe('9123456789');
    expect(userDoc.dob).toBeTruthy();
    expect(userDoc.usn).toBe(testUsn);
  });
});
