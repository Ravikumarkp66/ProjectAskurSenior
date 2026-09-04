import { test, expect } from '@playwright/test';
import { ADMIN_CSE, ADMIN_PORTAL_URL, STUDENT_CSE, STUDENT_ECE, TEST_SUBJECTS } from './helpers/test-accounts.js';
import { adminLogin, injectAdminAuth, apiGet, apiPost } from './helpers/api-client.js';

test.describe('TEST 3, 4 & 5: Normal Admin Access & Department Confinement', () => {
  let cseToken = null;
  let cseUser = null;

  test.beforeAll(async () => {
    const loginRes = await adminLogin(ADMIN_CSE.email);
    expect(loginRes.ok, `CSE Admin login failed: ${loginRes.error}`).toBeTruthy();
    cseToken = loginRes.token;
    cseUser = loginRes.user;
  });

  test('TEST 3: Normal Admin Login & Module Visibility Restrictions', async ({ page }) => {
    // Inject auth into admin portal
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: cseToken, user: cseUser });
    await page.goto(ADMIN_PORTAL_URL + '/users');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/.*\/users/);

    // Normal admin must see USERS, SUBJECTS, MATERIALS
    await expect(page.getByRole('link', { name: /USERS/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /SUBJECTS/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /MATERIALS/i })).toBeVisible();

    // Normal admin must NOT see ADMINS or SECURITY links in navbar
    const navAdmins = page.getByRole('link', { name: /ADMINS/i });
    const navSecurity = page.getByRole('link', { name: /SECURITY/i });
    await expect(navAdmins).not.toBeVisible();
    await expect(navSecurity).not.toBeVisible();

    // Verify department header indicator shows CSE
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/CSE/i);
  });

  test('TEST 4: CSE Admin -> Users Isolation & Query Parameter Tampering Attack', async () => {
    // 1. Fetch users with normal request
    const usersRes = await apiGet('/api/auth/users', cseToken);
    expect(usersRes.status).toBe(200);
    const usersData = await usersRes.json();
    const usersList = Array.isArray(usersData) ? usersData : usersData.users || [];

    // Verify CSE students are visible
    const hasCseStudent = usersList.some(u => u.usn === STUDENT_CSE.usn);
    expect(hasCseStudent, 'CSE admin should see CSE students').toBeTruthy();

    // Verify ECE students are NOT visible
    const hasEceStudent = usersList.some(u => u.usn === STUDENT_ECE.usn);
    expect(hasEceStudent, 'CSE admin must NOT see ECE students').toBeFalsy();

    // 2. CRITICAL API ATTACK: CSE Admin attempts to bypass scoping with ?branch=ECE
    const attackRes = await apiGet('/api/auth/users', cseToken, { branch: 'ECE' });
    // Backend enforceDepartmentScope must either return 403 or force branch to CSE
    expect([200, 403]).toContain(attackRes.status);

    if (attackRes.status === 200) {
      const attackData = await attackRes.json();
      const attackList = Array.isArray(attackData) ? attackData : attackData.users || [];
      const leakedEce = attackList.some(u => u.usn === STUDENT_ECE.usn);
      expect(leakedEce, 'API must enforce department scope and block ECE users').toBeFalsy();
    }
  });

  test('TEST 5: CSE Admin -> Subjects Department Isolation & Subject Creation', async () => {
    // 1. Fetch subjects as CSE admin
    const subjectsRes = await apiGet('/api/admin/subjects', cseToken);
    expect(subjectsRes.status).toBe(200);
    const subjectsData = await subjectsRes.json();
    const subjectList = Array.isArray(subjectsData) ? subjectsData : subjectsData.subjects || [];

    // CSE subject must be present
    const hasCseSubject = subjectList.some(s => s.code === TEST_SUBJECTS.cse.code);
    expect(hasCseSubject, 'CSE admin should see CSE subjects').toBeTruthy();

    // ECE and ISE subjects must NOT be present
    const hasEceSubject = subjectList.some(s => s.code === TEST_SUBJECTS.ece.code);
    const hasIseSubject = subjectList.some(s => s.code === TEST_SUBJECTS.ise.code);
    expect(hasEceSubject, 'CSE admin must NOT see ECE subjects').toBeFalsy();
    expect(hasIseSubject, 'CSE admin must NOT see ISE subjects').toBeFalsy();

    // 2. Attempt to create a test subject via API
    const newSubjectCode = 'E2E-CSE-SUBJ-' + Date.now();
    const createRes = await apiPost('/api/admin/subjects', cseToken, {
      name: '[E2E] Temp CSE Subject',
      code: newSubjectCode,
      year: '3rd Year',
      credits: 3,
      branch: 'CSE', // Client claims CSE
    });

    if (createRes.status === 201 || createRes.status === 200) {
      const created = await createRes.json();
      expect(created.code || created.subject?.code).toBe(newSubjectCode);
    }
  });
});
