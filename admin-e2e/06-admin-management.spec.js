import { test, expect } from '@playwright/test';
import { SUPER1, ADMIN_CSE, ADMIN_PORTAL_URL, TEST_PASSWORD } from './helpers/test-accounts.js';
import { adminLogin, apiGet, apiPost, apiPatch, apiDelete } from './helpers/api-client.js';

test.describe('TEST 13, 14 & 15: Admin Management & Account Suspension', () => {
  let superToken = null;
  let cseToken = null;
  let cseAdminId = null;

  test.beforeAll(async () => {
    const superLogin = await adminLogin(SUPER1.email);
    expect(superLogin.ok).toBeTruthy();
    superToken = superLogin.token;

    const cseLogin = await adminLogin(ADMIN_CSE.email);
    expect(cseLogin.ok).toBeTruthy();
    cseToken = cseLogin.token;
    cseAdminId = cseLogin.user?.id || cseLogin.user?._id;
  });

  test('TEST 13: Super Admin Can Create & Configure New Admin', async () => {
    const newAdminEmail = `e2e-temp-admin-${Date.now()}@test.askursenior.org`;
    
    // Super Admin creates a new normal admin
    const createRes = await apiPost('/api/admin/admins', superToken, {
      name: 'E2E Temp Admin',
      email: newAdminEmail,
      role: 'ADMIN',
      department: 'CSE',
      permissions: {
        users: { view: true },
        materials: { view: true, create: true }
      }
    });

    expect([200, 201]).toContain(createRes.status);
    const createdData = await createRes.json();
    const createdAdminId = createdData._id || createdData.admin?._id;

    // Clean up created temp admin
    if (createdAdminId) {
      await apiDelete(`/api/admin/admins/${createdAdminId}`, superToken);
    }
  });

  test('TEST 14: Normal Admin Cannot Access Admin Management API or UI', async ({ page }) => {
    // 1. Normal admin tries to access GET /api/admin/admins directly
    const apiRes = await apiGet('/api/admin/admins', cseToken);
    expect(apiRes.status).toBe(403);
    const errData = await apiRes.json();
    expect(errData.error).toMatch(/super admin/i);

    // 2. Normal admin navigates to /admins URL in frontend
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(user));
    }, { token: cseToken, user: { role: 'ADMIN', isSuperAdmin: false } });

    await page.goto(ADMIN_PORTAL_URL + '/admins');
    await page.waitForLoadState('domcontentloaded');

    // SuperAdminRoute redirects non-super admins to /materials or shows access denied
    await expect(page).not.toHaveURL(/.*\/admins$/);
  });

  test('TEST 15: Disabling Admin Immediately Revokes Access & Blocks Login', async () => {
    expect(cseAdminId, 'CSE Admin ID must be available').toBeDefined();

    // 1. Super Admin disables CSE Admin
    const disableRes = await apiPatch(`/api/admin/admins/${cseAdminId}/status`, superToken, {
      status: 'INACTIVE'
    });
    expect([200, 204]).toContain(disableRes.status);

    try {
      // 2. Attempt to login as disabled CSE Admin -> MUST return 403
      const loginAttempt = await adminLogin(ADMIN_CSE.email, TEST_PASSWORD);
      expect(loginAttempt.ok).toBeFalsy();
      expect(loginAttempt.status).toBe(403);
      expect(loginAttempt.error).toMatch(/disabled|inactive/i);

      // 3. Any subsequent API call with old token -> MUST return 401 or 403
      const protectedCall = await apiGet('/api/auth/users', cseToken);
      expect([401, 403]).toContain(protectedCall.status);
    } finally {
      // Re-enable CSE Admin so subsequent tests have a valid active account
      await apiPatch(`/api/admin/admins/${cseAdminId}/status`, superToken, {
        status: 'ACTIVE'
      });
    }
  });
});
