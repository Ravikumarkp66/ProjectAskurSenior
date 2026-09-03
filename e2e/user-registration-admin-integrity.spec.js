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

test.describe('E2E User Registration & Admin Data Integrity Flow', () => {
  const randNum = Math.floor(100 + Math.random() * 899);
  const testEmail = `e2e.testuser.${Date.now()}.${randNum}@askursenior.org`.toLowerCase().trim();
  const canonicalName = 'test user';
  const testUsn = `1SI23IS${randNum}`.toUpperCase();
  const adminEmail = (process.env.E2E_ADMIN_EMAIL || 'mreducator4566@gmail.com').toLowerCase().trim();

  const interceptedStudentAdminCalls = [];

  test('complete user onboarding journey and admin users table data integrity verification', async ({ page, browser, request }) => {
    // ════════════════════════════════════════════════════════════════════
    // 1. Monitor student frontend network traffic for forbidden admin APIs
    // ════════════════════════════════════════════════════════════════════
    page.on('request', req => {
      const url = req.url();
      if (url.includes('/api/admin/') || url.includes('/admin/analytics') || url.includes('/admin/users')) {
        interceptedStudentAdminCalls.push(url);
      }
    });

    // ════════════════════════════════════════════════════════════════════
    // 2. Open Student Login Page
    // ════════════════════════════════════════════════════════════════════
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Verify login page loads without unexpected errors
    await expect(page.locator('h1, h2, h3, div').filter({ hasText: /welcome|sign in|login|otp/i }).first()).toBeVisible();

    // ════════════════════════════════════════════════════════════════════
    // 3. Issue Controlled Registration Token for E2E Test User
    // ════════════════════════════════════════════════════════════════════
    const registrationToken = jwt.sign(
      {
        email: testEmail,
        googleId: `e2e_google_${Date.now()}`,
        profilePicture: '',
        type: 'registration'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Set registration session in frontend storage & navigate to Complete Profile
    await page.evaluate(({ token, email }) => {
      sessionStorage.setItem('registrationToken', token);
      sessionStorage.setItem('registrationEmail', email);
      sessionStorage.setItem('registrationPrefilled', JSON.stringify({ email }));
      localStorage.setItem('registrationToken', token);
      localStorage.setItem('registrationEmail', email);
    }, { token: registrationToken, email: testEmail });

    await page.goto('/complete-profile');
    await page.waitForLoadState('domcontentloaded');

    // ════════════════════════════════════════════════════════════════════
    // 4. Verify Complete Profile Page & Read-Only Email
    // ════════════════════════════════════════════════════════════════════
    await expect(page.locator('h1').filter({ hasText: /complete your profile/i })).toBeVisible();

    // Verify Email field is disabled / non-editable and shows testEmail
    const emailInput = page.locator('input[type="text"]').first();
    await expect(emailInput).toBeDisabled();
    await expect(emailInput).toHaveValue(testEmail);

    // Verify Email validator text below
    await expect(page.locator('text=/Verified via Google|Non-editable/i').first()).toBeVisible();

    // ════════════════════════════════════════════════════════════════════
    // 5. Test Strict Name Validation (Reject Invalid Names)
    // ════════════════════════════════════════════════════════════════════
    const nameInput = page.locator('input[placeholder*="rahul kumar"]');
    const usnInput = page.locator('input[placeholder*="1SI23IS080"]');
    const submitBtn = page.locator('button[type="submit"]');

    // Test Invalid 1: Uppercase letters (e.g. Rahul Kumar) -> Auto-converted to lowercase
    await nameInput.fill('Rahul Kumar');
    await nameInput.blur();
    await expect(nameInput).toHaveValue('rahul kumar');

    // Test Invalid 2: Numbers (e.g. rahul123 or e2e testuser with digit 2)
    await nameInput.fill('rahul123');
    await expect(page.locator('text=/Only lowercase English letters/i')).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    await nameInput.fill('e2e testuser');
    await expect(page.locator('text=/Only lowercase English letters/i')).toBeVisible();
    await expect(submitBtn).toBeDisabled();

    // Test Invalid 3: Underscore (e.g. rahul_kumar)
    await nameInput.fill('rahul_kumar');
    await expect(page.locator('text=/Only lowercase English letters/i')).toBeVisible();

    // Test Invalid 4: Hyphen (e.g. rahul-kumar)
    await nameInput.fill('rahul-kumar');
    await expect(page.locator('text=/Only lowercase English letters/i')).toBeVisible();

    // ════════════════════════════════════════════════════════════════════
    // 6. Enter Canonical Profile Information
    // ════════════════════════════════════════════════════════════════════
    await nameInput.fill(canonicalName);
    await nameInput.blur();
    await expect(page.locator('text=/Name format is valid/i')).toBeVisible();

    await usnInput.fill(testUsn);
    await expect(page.locator('text=/USN format is valid/i')).toBeVisible();

    const phoneInput = page.locator('input[placeholder*="mobile" i], input[type="tel"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('9876543210');
    }

    const dobInput = page.locator('input[type="date"]').first();
    if (await dobInput.isVisible()) {
      await dobInput.fill('2004-05-15');
    }

    // Submit profile
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // ════════════════════════════════════════════════════════════════════
    // 7. Verify Dashboard Navigation & User App Session
    // ════════════════════════════════════════════════════════════════════
    await expect(page).not.toHaveURL(/\/complete-profile/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

    // Verify stored auth token
    const storedAuthToken = await page.evaluate(() => localStorage.getItem('authToken') || localStorage.getItem('token'));
    expect(storedAuthToken, 'No authentication token found in localStorage after onboarding').toBeTruthy();

    // Verify no admin APIs were leaked from user app
    expect(
      interceptedStudentAdminCalls,
      `Student frontend improperly invoked Admin APIs: ${JSON.stringify(interceptedStudentAdminCalls)}`
    ).toHaveLength(0);

    // ════════════════════════════════════════════════════════════════════
    // 8. Admin API Direct Data Integrity Assertion
    // ════════════════════════════════════════════════════════════════════
    const adminToken = jwt.sign(
      {
        userId: 'admin_e2e_user_id',
        email: adminEmail,
        role: 'admin',
        isAdmin: true
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const adminApiRes = await request.get(`${BACKEND_BASE}/api/admin/analytics/users`, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        search: testEmail,
        limit: 10
      }
    });

    expect(adminApiRes.ok(), `Admin Users API failed with status ${adminApiRes.status()}`).toBeTruthy();
    const adminApiData = await adminApiRes.json();
    const matchedUser = (adminApiData.users || []).find(u => u.email === testEmail);

    expect(matchedUser, `Test user with email "${testEmail}" not found via Admin Users API`).toBeDefined();
    expect(matchedUser.name, 'Canonical name in database must be exact lowercase').toBe(canonicalName);
    expect(matchedUser.usn, 'USN in database must be exact normalized uppercase').toBe(testUsn);
    expect(matchedUser.email, 'Email in database must match authenticated email').toBe(testEmail);
    expect(matchedUser.createdAt, 'CreatedAt date must exist in database record').toBeTruthy();

    // ════════════════════════════════════════════════════════════════════
    // 9. Admin Incomplete & Never Active Filter Verification
    // ════════════════════════════════════════════════════════════════════
    const incompleteRes = await request.get(`${BACKEND_BASE}/api/admin/analytics/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { search: testEmail, filter: 'incomplete' }
    });
    if (incompleteRes.ok()) {
      const incompleteData = await incompleteRes.json();
      const inIncompleteList = (incompleteData.users || []).some(u => u.email === testEmail);
      expect(inIncompleteList, 'Completed test user must NOT appear in Incomplete Profiles').toBe(false);
    }

    const neverActiveRes = await request.get(`${BACKEND_BASE}/api/admin/analytics/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      params: { search: testEmail, filter: 'neverActive' }
    });
    if (neverActiveRes.ok()) {
      const neverActiveData = await neverActiveRes.json();
      const inNeverActiveList = (neverActiveData.users || []).some(u => u.email === testEmail);
      expect(inNeverActiveList, 'Active test user must NOT appear in Never Active').toBe(false);
    }

    // ════════════════════════════════════════════════════════════════════
    // 10. Safe Cleanup of Dedicated E2E Test User Only
    // ════════════════════════════════════════════════════════════════════
    try {
      const cleanupRes = await request.delete(`${BACKEND_BASE}/api/admin/utils/cleanup-test-user`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        data: { email: testEmail }
      });
      console.log(`[E2E Cleanup] Status: ${cleanupRes.status()}`);
    } catch (cleanupErr) {
      console.warn('[E2E Cleanup] Non-fatal cleanup warning:', cleanupErr.message);
    }
  });
});
