import { test, expect } from '@playwright/test';
import { ADMIN_CSE, STUDENT_CSE, ADMIN_PORTAL_URL } from './helpers/test-accounts.js';
import { adminLogin, studentLogin, injectAdminAuth, clearAuth, apiGet } from './helpers/api-client.js';

test.describe('TEST 24, 25 & 26: Direct Attack Vectors, URL Tampering & Session Manipulation', () => {
  let cseToken = null;
  let cseUser = null;
  let studentToken = null;

  test.beforeAll(async () => {
    const cseLogin = await adminLogin(ADMIN_CSE.email);
    expect(cseLogin.ok).toBeTruthy();
    cseToken = cseLogin.token;
    cseUser = cseLogin.user;

    const studLogin = await studentLogin(STUDENT_CSE.usn);
    expect(studLogin.ok).toBeTruthy();
    studentToken = studLogin.token;
  });

  test('TEST 24: Direct URL Navigation Attack to Super Admin Pages', async ({ page }) => {
    // 1. Authenticate as normal CSE Admin
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: cseToken, user: cseUser });

    // 2. Direct navigation to /admins
    await page.goto(ADMIN_PORTAL_URL + '/admins');
    await page.waitForLoadState('domcontentloaded');
    // Expect redirection away from /admins (e.g. to /materials or /users)
    await expect(page).not.toHaveURL(/.*\/admins$/);

    // 3. Direct navigation to /security
    await page.goto(ADMIN_PORTAL_URL + '/security');
    await page.waitForLoadState('domcontentloaded');
    // Expect redirection away from /security
    await expect(page).not.toHaveURL(/.*\/security$/);

    // 4. API attack: CSE Admin attempts direct calls to restricted endpoints
    const adminsApi = await apiGet('/api/admin/admins', cseToken);
    expect(adminsApi.status).toBe(403);

    const securityApi = await apiGet('/api/admin/security/overview', cseToken);
    expect(securityApi.status).toBe(403);
  });

  test('TEST 25: Logout, History Traversal (Back Button) & Stale Session Protection', async ({ page }) => {
    // 1. Login to admin portal
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: cseToken, user: cseUser });
    await page.goto(ADMIN_PORTAL_URL + '/users');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*\/users/);

    // 2. Simulate Logout: Clear auth storage
    await clearAuth(page);
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await page.waitForLoadState('domcontentloaded');

    // 3. Attempt Browser "Back" button traversal
    await page.goBack();
    await page.waitForTimeout(500);

    // Even if browser navigates back in history, client guards and api interceptors
    // must detect missing/invalid auth and redirect to /login
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('TEST 26: Token & Session Manipulation Defense', async () => {
    // 1. Normal student user token sent to Admin API -> MUST be rejected with 403
    const studentAttack1 = await apiGet('/api/admin/admins', studentToken);
    expect([401, 403]).toContain(studentAttack1.status);

    const studentAttack2 = await apiGet('/api/admin/materials', studentToken);
    expect([401, 403]).toContain(studentAttack2.status);

    const studentAttack3 = await apiGet('/api/admin/subjects', studentToken);
    expect([401, 403]).toContain(studentAttack3.status);

    // 2. Inactive / forged token sent to Admin API -> MUST be rejected with 401
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_signature';
    const fakeAttack = await apiGet('/api/admin/materials', fakeToken);
    expect(fakeAttack.status).toBe(401);

    // 3. Department spoofing attempt: CSE admin queries users with ?branch=ECE
    // API must enforce CSE and NOT leak ECE users
    const spoofRes = await apiGet('/api/auth/users', cseToken, { branch: 'ECE' });
    expect([200, 403]).toContain(spoofRes.status);
    if (spoofRes.status === 200) {
      const data = await spoofRes.json();
      const list = Array.isArray(data) ? data : data.users || [];
      const leakedEce = list.some(u => u.usn === 'E2EECE0001');
      expect(leakedEce, 'Spoofed query parameter must not leak ECE student').toBeFalsy();
    }
  });
});
