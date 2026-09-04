import { test, expect } from '@playwright/test';
import { SUPER1, ADMIN_PORTAL_URL, BACKEND_URL, STUDENT_CSE, STUDENT_ECE } from './helpers/test-accounts.js';
import { adminLogin, injectAdminAuth, apiGet, apiPut } from './helpers/api-client.js';

test.describe('TEST 1 & 2: Super Admin Login & Global Access', () => {
  let superToken = null;
  let superUser = null;

  test.beforeAll(async () => {
    const loginRes = await adminLogin(SUPER1.email);
    expect(loginRes.ok, `Super Admin login failed: ${loginRes.error}`).toBeTruthy();
    superToken = loginRes.token;
    superUser = loginRes.user;
  });

  test('TEST 1: Super Admin Dashboard Navigation & Modules', async ({ page }) => {
    // Inject auth into admin portal and navigate to dashboard
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: superToken, user: superUser });
    await page.goto(ADMIN_PORTAL_URL + '/users');
    await page.waitForLoadState('domcontentloaded');

    // Verify Admin Portal UI loads
    await expect(page).toHaveURL(/.*\/users/);

    // Verify active navigation modules are visible for SUPER_ADMIN
    const navUsers = page.getByRole('link', { name: /USERS/i });
    const navSubjects = page.getByRole('link', { name: /SUBJECTS/i });
    const navMaterials = page.getByRole('link', { name: /MATERIALS/i });
    const navAdmins = page.getByRole('link', { name: /ADMINS/i });
    const navSecurity = page.getByRole('link', { name: /SECURITY/i });

    await expect(navUsers).toBeVisible({ timeout: 10000 });
    await expect(navSubjects).toBeVisible();
    await expect(navMaterials).toBeVisible();
    await expect(navAdmins).toBeVisible();
    await expect(navSecurity).toBeVisible();

    // Verify system placeholders exist or are present in topbar
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/SUPER ADMIN/i);

    // Verify Super Admin can view all departments via API
    const usersRes = await apiGet('/api/auth/users', superToken);
    expect(usersRes.status).toBe(200);
    const usersData = await usersRes.json();
    const userList = Array.isArray(usersData) ? usersData : usersData.users || [];

    // Verify presence of both CSE and ECE users
    const hasCse = userList.some(u => (u.branch === 'CSE' || u.currentBranch === 'CSE' || u.branch === 'CS') && (u.usn?.includes('E2E') || u.email?.includes('e2e')));
    const hasEce = userList.some(u => (u.branch === 'ECE' || u.currentBranch === 'ECE' || u.branch === 'EC') && (u.usn?.includes('E2E') || u.email?.includes('e2e')));
    expect(hasCse, 'Super Admin must be able to view CSE users').toBeTruthy();
    expect(hasEce, 'Super Admin must be able to view ECE users').toBeTruthy();
  });

  test('TEST 2: Super Admin Users Management, Search & Audit Log', async ({ page }) => {
    // 1. Search users by USN, Name, Email via API
    const searchByUsn = await apiGet('/api/auth/users', superToken, { search: STUDENT_CSE.usn });
    expect(searchByUsn.status).toBe(200);
    const usnResults = await searchByUsn.json();
    const usnUsers = Array.isArray(usnResults) ? usnResults : usnResults.users || [];
    expect(usnUsers.some(u => u.usn === STUDENT_CSE.usn)).toBeTruthy();

    const searchByName = await apiGet('/api/auth/users', superToken, { search: STUDENT_ECE.name });
    expect(searchByName.status).toBe(200);
    const nameResults = await searchByName.json();
    const nameUsers = Array.isArray(nameResults) ? nameResults : nameResults.users || [];
    expect(nameUsers.some(u => u.email === STUDENT_ECE.email)).toBeTruthy();

    // 2. Test user modification & persistence via Admin Management
    const adminsListRes = await apiGet('/api/admin/admins', superToken);
    expect(adminsListRes.status).toBe(200);
    const adminsData = await adminsListRes.json();
    const adminList = Array.isArray(adminsData) ? adminsData : adminsData.admins || [];
    const targetAdmin = adminList.find(a => a.email === 'e2e-admin-cse@test.askursenior.org');
    expect(targetAdmin, 'Target admin should exist').toBeDefined();

    const updateRes = await apiPut(`/api/admin/admins/${targetAdmin._id}`, superToken, {
      name: 'E2E Admin CSE Verified'
    });
    expect([200, 204]).toContain(updateRes.status);

    // Verify change persists
    const profileCheck = await apiGet(`/api/admin/admins/${targetAdmin._id}/profile`, superToken);
    expect(profileCheck.status).toBe(200);
    const updatedProfile = await profileCheck.json();
    expect(updatedProfile.admin?.name || updatedProfile.name).toBe('E2E Admin CSE Verified');

    // 3. Verify audit log entry
    const auditRes = await apiGet('/api/admin/admins/activities', superToken);
    expect(auditRes.status).toBe(200);
    const auditData = await auditRes.json();
    const logs = Array.isArray(auditData) ? auditData : auditData.activities || [];
    expect(logs.length).toBeGreaterThan(0);
  });
});
