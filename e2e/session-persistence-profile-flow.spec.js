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

test.describe('Session Persistence & Profile Lifecycle Flow', () => {
  const timestamp = Date.now().toString().slice(-4);
  const testEmail = `e2e.sessiontest.${timestamp}@askursenior.org`.toLowerCase().trim();
  const canonicalName = 'kiran kumar';
  const testUsn = `1SI23CS0${timestamp.slice(-2).padStart(2, '8')}`.toUpperCase();

  test('new user sees complete profile, completes onboarding, and maintains active session across reloads without bouncing to login', async ({ page, request }) => {
    // ════════════════════════════════════════════════════════════════════
    // 1. New user authentication -> Complete Profile must be visible
    // ════════════════════════════════════════════════════════════════════
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

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

    // Inject registration state
    await page.evaluate(({ token, email }) => {
      sessionStorage.setItem('registrationToken', token);
      sessionStorage.setItem('registrationEmail', email);
      sessionStorage.setItem('registrationPrefilled', JSON.stringify({ email }));
      localStorage.setItem('registrationToken', token);
      localStorage.setItem('registrationEmail', email);
    }, { token: registrationToken, email: testEmail });

    await page.goto('/complete-profile');
    await page.waitForLoadState('domcontentloaded');

    // Assertion: Complete Profile header and form are visible
    const heading = page.locator('h1').filter({ hasText: /complete your profile/i });
    await expect(heading).toBeVisible();

    const emailField = page.locator('input[type="text"]').first();
    await expect(emailField).toBeDisabled();
    await expect(emailField).toHaveValue(testEmail);

    // Assert user stays on /complete-profile for >5 seconds without unexpected redirect to home
    await page.waitForTimeout(5000);
    await expect(page).toHaveURL(/\/complete-profile/);

    // ════════════════════════════════════════════════════════════════════
    // 2. User fills profile and submits
    // ════════════════════════════════════════════════════════════════════
    const nameInput = page.locator('input[placeholder*="rahul kumar"]');
    const usnInput = page.locator('input[placeholder*="1SI23IS080"]');
    const submitBtn = page.locator('button[type="submit"]');

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

    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // ════════════════════════════════════════════════════════════════════
    // 3. User reaches dashboard & stays authenticated
    // ════════════════════════════════════════════════════════════════════
    await expect(page).not.toHaveURL(/\/complete-profile/, { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });

    // Verify token exists in storage
    const token = await page.evaluate(() => localStorage.getItem('authToken') || localStorage.getItem('token'));
    expect(token, 'Token must exist in storage after completing profile').toBeTruthy();

    const storedUser = await page.evaluate(() => {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    });
    expect(storedUser, 'User object must exist in storage').toBeTruthy();
    expect(storedUser.email).toBe(testEmail);

    // ════════════════════════════════════════════════════════════════════
    // 4. Session Persistence: Reload page & verify no bounce to /login
    // ════════════════════════════════════════════════════════════════════
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Must NOT bounce back to login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/\/complete-profile/, { timeout: 10000 });

    // ════════════════════════════════════════════════════════════════════
    // 5. Navigate to protected routes & verify session stays active
    // ════════════════════════════════════════════════════════════════════
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });

    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 });

    // Verify token is still present and valid
    const tokenAfterNav = await page.evaluate(() => localStorage.getItem('authToken') || localStorage.getItem('token'));
    expect(tokenAfterNav).toBe(token);

    // ════════════════════════════════════════════════════════════════════
    // 6. Safe Cleanup
    // ════════════════════════════════════════════════════════════════════
    const adminToken = jwt.sign(
      { userId: 'admin_cleanup', email: 'mreducator4566@gmail.com', role: 'admin', isAdmin: true },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    try {
      await request.delete(`${BACKEND_BASE}/api/admin/utils/cleanup-test-user`, {
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        data: { email: testEmail }
      });
    } catch (e) {}
  });
});
