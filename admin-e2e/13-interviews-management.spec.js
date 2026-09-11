/**
 * 13-interviews-management.spec.js
 * 
 * End-to-End Tests for Admin Interview Experiences & Companies Management.
 * Validates UI interactions, filters, inspection, approvals, rejections,
 * archiving, company lifecycle, deactivation safeguards, and permission gating.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {
  SUPER1,
  ADMIN_CSE,
  ADMIN_ECE,
  ADMIN_ISE,
  ADMIN_PORTAL_URL
} from './helpers/test-accounts.js';
import {
  adminLogin,
  injectAdminAuth,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete
} from './helpers/api-client.js';

test.describe('Admin Interview Experiences & Companies Management', { tag: '@regression' }, () => {
  let superToken = null;
  let superUser = null;
  let cseToken = null;
  let cseUser = null;
  let eceToken = null;
  let eceUser = null;
  let iseToken = null;
  let iseUser = null;
  let testData = null;

  test.beforeAll(async () => {
    // Authenticate all test personas
    const superLogin = await adminLogin(SUPER1.email);
    expect(superLogin.ok, `Super Admin login failed: ${superLogin.error}`).toBeTruthy();
    superToken = superLogin.token;
    superUser = superLogin.user;

    const cseLogin = await adminLogin(ADMIN_CSE.email);
    expect(cseLogin.ok, `CSE Admin login failed: ${cseLogin.error}`).toBeTruthy();
    cseToken = cseLogin.token;
    cseUser = cseLogin.user;

    const eceLogin = await adminLogin(ADMIN_ECE.email);
    expect(eceLogin.ok, `ECE Admin login failed: ${eceLogin.error}`).toBeTruthy();
    eceToken = eceLogin.token;
    eceUser = eceLogin.user;

    const iseLogin = await adminLogin(ADMIN_ISE.email);
    expect(iseLogin.ok, `ISE Admin login failed: ${iseLogin.error}`).toBeTruthy();
    iseToken = iseLogin.token;
    iseUser = iseLogin.user;

    // Load isolated test-data fixtures
    const testDataPath = path.resolve('admin-e2e/.auth/test-data.json');
    if (fs.existsSync(testDataPath)) {
      testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
    }
    expect(testData?.experiences?.pending?._id).toBeTruthy();
    expect(testData?.experiences?.published?._id).toBeTruthy();
    expect(testData?.companies?.alpha?._id).toBeTruthy();
    expect(testData?.companies?.beta?._id).toBeTruthy();

    // Baseline reset once at suite start
    await apiPatch(`/api/experiences/${testData.experiences.pending._id}/status`, superToken, {
      status: 'Pending'
    });
    await apiPatch(`/api/experiences/${testData.experiences.published._id}/status`, superToken, {
      status: 'Published'
    });
    await apiPut(`/api/experiences/${testData.experiences.published._id}`, superToken, {
      role: '[E2E] Published Software Engineer',
      ctc: '18 LPA'
    });
    await apiPut(`/api/experiences/admin/companies/${testData.companies.alpha._id}`, superToken, {
      status: 'Active',
      isActive: true
    });
    await apiPut(`/api/experiences/admin/companies/${testData.companies.beta._id}`, superToken, {
      status: 'Active',
      isActive: true,
      industry: 'Consulting & IT'
    });
  });

  // ─── TEST INT-UI-001: NAVIGATION ─────────────────────────────────────
  test('INT-UI-001: Interview Management navigation', async ({ page }) => {
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: superToken, user: superUser });
    await page.goto(ADMIN_PORTAL_URL + '/users');
    await page.waitForLoadState('domcontentloaded');

    const navInterviews = page.getByRole('link', { name: /INTERVIEWS/i });
    await expect(navInterviews).toBeVisible({ timeout: 10000 });
    await navInterviews.click();

    await expect(page).toHaveURL(/.*\/interviews/);
    await expect(page.getByRole('heading', { name: /Interviews & Companies/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /EXPERIENCES/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /COMPANIES/i })).toBeVisible();
  });

  // ─── TEST INT-UI-002: EXPERIENCES TABLE ──────────────────────────────
  test('INT-UI-002: Experiences table', async ({ page }) => {
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: superToken, user: superUser });
    await page.goto(ADMIN_PORTAL_URL + '/interviews');
    await page.waitForLoadState('domcontentloaded');

    const table = page.locator('table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Verify key columns
    await expect(table.locator('th').filter({ hasText: 'Company' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'Role' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'CTC' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'Batch' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'Status' })).toBeVisible();
    await expect(table.locator('th').filter({ hasText: 'Actions' })).toBeVisible();

    // Verify seeded experiences are present
    await expect(page.getByText('[E2E] Pending Software Engineer')).toBeVisible();
    await expect(page.getByText('[E2E] Published Software Engineer')).toBeVisible();
  });

  // ─── TEST INT-UI-003: SEARCH ─────────────────────────────────────────
  test('INT-UI-003: Search', async ({ page }) => {
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: superToken, user: superUser });
    await page.goto(ADMIN_PORTAL_URL + '/interviews');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('#exp-search');
    await searchInput.fill('Pending Software Engineer');
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/experiences/list') && res.status() === 200),
      page.locator('form').filter({ has: page.locator('#exp-search') }).getByRole('button', { name: 'Search' }).click()
    ]);

    // Only the pending record should match
    await expect(page.getByText('[E2E] Pending Software Engineer')).toBeVisible();
    await expect(page.getByText('[E2E] Published Software Engineer')).toBeHidden();

    // Clear filters restores all items
    const clearBtn = page.getByRole('button', { name: /\[Clear Filters\]/i });
    await expect(clearBtn).toBeVisible();
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/experiences/list') && res.status() === 200),
      clearBtn.click()
    ]);

    await expect(page.getByText('[E2E] Pending Software Engineer')).toBeVisible();
    await expect(page.getByText('[E2E] Published Software Engineer')).toBeVisible();
  });

  // ─── TEST INT-UI-004: FILTERS & SORTING ──────────────────────────────
  test('INT-UI-004: Filters / sorting', async ({ page }) => {
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: superToken, user: superUser });
    await page.goto(ADMIN_PORTAL_URL + '/interviews');
    await page.waitForLoadState('domcontentloaded');

    // 1. Filter: Pending
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/experiences/list') && res.status() === 200),
      page.locator('#status-select').selectOption('Pending')
    ]);
    await expect(page.getByText('[E2E] Pending Software Engineer')).toBeVisible();
    await expect(page.getByText('[E2E] Published Software Engineer')).toBeHidden();

    // 2. Filter: Published
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/experiences/list') && res.status() === 200),
      page.locator('#status-select').selectOption('Published')
    ]);
    await expect(page.getByText('[E2E] Published Software Engineer')).toBeVisible();
    await expect(page.getByText('[E2E] Pending Software Engineer')).toBeHidden();

    // 3. Filter: All
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/experiences/list') && res.status() === 200),
      page.locator('#status-select').selectOption('all')
    ]);
    await expect(page.getByText('[E2E] Pending Software Engineer')).toBeVisible();
    await expect(page.getByText('[E2E] Published Software Engineer')).toBeVisible();

    // 4. Sort: Most Upvoted
    await page.locator('#sort-select').selectOption('upvotes');
    await expect(page.locator('table')).toBeVisible();
  });

  // ─── TEST INT-UI-005: INSPECT EXPERIENCE ─────────────────────────────
  test('INT-UI-005: Inspect experience', async ({ page }) => {
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: superToken, user: superUser });
    await page.goto(ADMIN_PORTAL_URL + '/interviews');
    await page.waitForLoadState('domcontentloaded');

    const pendingRow = page.locator('tr').filter({ hasText: '[E2E] Pending Software Engineer' });
    await expect(pendingRow).toBeVisible();
    await pendingRow.locator('button[title="Inspect Details"]').click();

    const modal = page.locator('[role="dialog"]').filter({ hasText: /Interview Experience Details/i });
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('[E2E] Pending Software Engineer');
    await expect(modal).toContainText('[E2E] Test Company Alpha');
    await expect(modal).toContainText('Reverse Linked List');

    // Close modal
    await modal.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(modal).toBeHidden();
  });

  // ─── TEST INT-UI-006: APPROVE PENDING EXPERIENCE ─────────────────────
  test('INT-UI-006: Approve Pending experience', { tag: ['@critical'] }, async ({ page }) => {
    try {
      await page.goto(ADMIN_PORTAL_URL + '/login');
      await injectAdminAuth(page, { token: superToken, user: superUser });
      await page.goto(ADMIN_PORTAL_URL + '/interviews');
      await page.waitForLoadState('domcontentloaded');

      const pendingRow = page.locator('tr').filter({ hasText: '[E2E] Pending Software Engineer' });
      await expect(pendingRow).toBeVisible();

      const approveBtn = pendingRow.locator('button[title="Approve & Publish"]');
      await expect(approveBtn).toBeVisible();
      await approveBtn.click();

      // Verify UI reflects Published status
      await expect(pendingRow.locator('td').filter({ hasText: /PUBLISHED/i })).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Experience approved and published successfully.')).toBeVisible();
    } finally {
      // Revert status back to Pending
      await apiPatch(`/api/experiences/${testData.experiences.pending._id}/status`, superToken, {
        status: 'Pending'
      });
    }
  });

  // ─── TEST INT-UI-007: REJECT PENDING EXPERIENCE ──────────────────────
  test('INT-UI-007: Reject Pending experience', { tag: ['@critical'] }, async ({ page }) => {
    try {
      await page.goto(ADMIN_PORTAL_URL + '/login');
      await injectAdminAuth(page, { token: superToken, user: superUser });
      await page.goto(ADMIN_PORTAL_URL + '/interviews');
      await page.waitForLoadState('domcontentloaded');

      const pendingRow = page.locator('tr').filter({ hasText: '[E2E] Pending Software Engineer' });
      await expect(pendingRow).toBeVisible();

      const rejectBtn = pendingRow.locator('button[title="Reject"]');
      await expect(rejectBtn).toBeVisible();
      await rejectBtn.click();

      const rejectModal = page.locator('[role="dialog"]').filter({ hasText: /Reject Experience Submission/i });
      await expect(rejectModal).toBeVisible();

      // Use quick preset
      await rejectModal.getByRole('button', { name: '+ Incomplete round details' }).click();
      await rejectModal.getByRole('button', { name: 'Confirm Rejection' }).click();

      await expect(page.getByText('Experience rejected.')).toBeVisible();
      await expect(pendingRow.locator('td').filter({ hasText: /REJECTED/i })).toBeVisible({ timeout: 5000 });
    } finally {
      // Revert status back to Pending
      await apiPatch(`/api/experiences/${testData.experiences.pending._id}/status`, superToken, {
        status: 'Pending'
      });
    }
  });

  // ─── TEST INT-UI-008: ARCHIVE EXPERIENCE ─────────────────────────────
  test('INT-UI-008: Archive experience', { tag: ['@critical'] }, async ({ page }) => {
    try {
      await page.goto(ADMIN_PORTAL_URL + '/login');
      await injectAdminAuth(page, { token: superToken, user: superUser });
      await page.goto(ADMIN_PORTAL_URL + '/interviews');
      await page.waitForLoadState('domcontentloaded');

      const pubRow = page.locator('tr').filter({ hasText: '[E2E] Published Software Engineer' });
      await expect(pubRow).toBeVisible();

      const archiveBtn = pubRow.locator('button[title="Archive"]');
      await expect(archiveBtn).toBeVisible();
      await archiveBtn.click();

      const archiveModal = page.locator('[role="dialog"]').filter({ hasText: /Archive Experience/i });
      await expect(archiveModal).toBeVisible();
      await archiveModal.getByRole('button', { name: 'Confirm Archive' }).click();

      await expect(page.getByText('Experience archived.')).toBeVisible();
      await expect(pubRow.locator('td').filter({ hasText: /ARCHIVED/i })).toBeVisible({ timeout: 5000 });
    } finally {
      // Restore Published status
      await apiPatch(`/api/experiences/${testData.experiences.published._id}/status`, superToken, {
        status: 'Published'
      });
    }
  });

  // ─── TEST INT-UI-009: EDIT EXPERIENCE ────────────────────────────────
  test('INT-UI-009: Edit experience', async ({ page }) => {
    try {
      await page.goto(ADMIN_PORTAL_URL + '/login');
      await injectAdminAuth(page, { token: superToken, user: superUser });
      await page.goto(ADMIN_PORTAL_URL + '/interviews');
      await page.waitForLoadState('domcontentloaded');

      const pubRow = page.locator('tr').filter({ hasText: '[E2E] Published Software Engineer' });
      await expect(pubRow).toBeVisible();

      await pubRow.locator('button[title="Edit"]').click();

      const editModal = page.locator('[role="dialog"]').filter({ hasText: /Edit Interview Experience/i });
      await expect(editModal).toBeVisible();

      const ctcInput = editModal.getByPlaceholder('e.g. 14');
      await ctcInput.fill('24');
      await editModal.getByRole('button', { name: 'Save Changes' }).click();

      await expect(page.getByText('Experience details updated.')).toBeVisible();
      await expect(pubRow).toContainText('24 LPA');
    } finally {
      await apiPut(`/api/experiences/${testData.experiences.published._id}`, superToken, {
        role: '[E2E] Published Software Engineer',
        ctc: '18 LPA'
      });
    }
  });

  // ─── TEST INT-UI-010: COMPANIES TAB ──────────────────────────────────
  test('INT-UI-010: Companies tab', async ({ page }) => {
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: superToken, user: superUser });
    await page.goto(ADMIN_PORTAL_URL + '/interviews');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: /COMPANIES/i }).click();

    const compTable = page.locator('table');
    await expect(compTable).toBeVisible({ timeout: 10000 });

    // Verify company headers
    await expect(compTable.locator('th').filter({ hasText: 'Company' })).toBeVisible();
    await expect(compTable.locator('th').filter({ hasText: 'Cutoff' })).toBeVisible();
    await expect(compTable.locator('th').filter({ hasText: 'Experiences' })).toBeVisible();
    await expect(compTable.locator('th').filter({ hasText: 'Status' })).toBeVisible();

    // Verify seeded companies
    await expect(page.getByText('[E2E] Test Company Alpha')).toBeVisible();
    await expect(page.getByText('[E2E] Test Company Beta')).toBeVisible();
  });

  // ─── TEST INT-UI-011: CREATE COMPANY ─────────────────────────────────
  test('INT-UI-011: Create company', async ({ page }) => {
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: superToken, user: superUser });
    await page.goto(ADMIN_PORTAL_URL + '/interviews');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: /COMPANIES/i }).click();
    await page.getByRole('button', { name: '+ Add Company' }).click();

    const modal = page.locator('[role="dialog"]').filter({ hasText: /\+ Add New Company/i });
    await expect(modal).toBeVisible();

    await modal.getByPlaceholder('e.g. Google, Cisco, Infosys...').fill('[E2E] Temp Modal Company');
    await modal.getByPlaceholder('e.g. 7.5 CGPA').fill('8.0 CGPA');
    await modal.getByPlaceholder('e.g. FinTech / Software').fill('Cloud Software');
    await modal.getByRole('button', { name: 'Create Company' }).click();

    await expect(page.getByText('Company created successfully.')).toBeVisible();
    await expect(page.getByText('[E2E] Temp Modal Company')).toBeVisible();

    // Immediate cleanup
    const compRes = await apiGet('/api/experiences/companies', superToken);
    if (compRes.ok) {
      const comps = await compRes.json();
      const tempComp = comps.find(c => c.name === '[E2E] Temp Modal Company');
      if (tempComp) {
        await apiDelete(`/api/experiences/admin/companies/${tempComp._id}`, superToken);
      }
    }
  });

  // ─── TEST INT-UI-012: EDIT COMPANY ───────────────────────────────────
  test('INT-UI-012: Edit company', async ({ page }) => {
    try {
      await page.goto(ADMIN_PORTAL_URL + '/login');
      await injectAdminAuth(page, { token: superToken, user: superUser });
      await page.goto(ADMIN_PORTAL_URL + '/interviews');
      await page.waitForLoadState('domcontentloaded');

      await page.getByRole('button', { name: /COMPANIES/i }).click();

      const betaRow = page.locator('tr').filter({ hasText: '[E2E] Test Company Beta' });
      await expect(betaRow).toBeVisible();
      await betaRow.locator('button[title="Edit Company"]').click();

      const editModal = page.locator('[role="dialog"]').filter({ hasText: /Edit Company/i });
      await expect(editModal).toBeVisible();

      const indInput = editModal.getByPlaceholder('e.g. FinTech / Software');
      await indInput.fill('IT Services & AI Consulting');
      await editModal.getByRole('button', { name: 'Save Changes' }).click();

      await expect(page.getByText('Company updated successfully.')).toBeVisible();
      await expect(betaRow).toContainText('IT Services & AI Consulting');
    } finally {
      await apiPut(`/api/experiences/admin/companies/${testData.companies.beta._id}`, superToken, {
        industry: 'Consulting & IT'
      });
    }
  });

  // ─── TEST INT-UI-013: COMPANY DEACTIVATION SAFEGUARD ─────────────────
  test('INT-UI-013: Company deactivation safeguard', { tag: ['@critical'] }, async ({ page }) => {
    try {
      await page.goto(ADMIN_PORTAL_URL + '/login');
      await injectAdminAuth(page, { token: superToken, user: superUser });
      await page.goto(ADMIN_PORTAL_URL + '/interviews');
      await page.waitForLoadState('domcontentloaded');

      await page.getByRole('button', { name: /COMPANIES/i }).click();

      const alphaRow = page.locator('tr').filter({ hasText: '[E2E] Test Company Alpha' });
      await expect(alphaRow).toBeVisible();

      // Alpha has linked experiences: button title is "Deactivate Company"
      await alphaRow.locator('button[title="Deactivate Company"]').click();

      const deactModal = page.locator('[role="dialog"]').filter({ hasText: /Deactivate Company/i });
      await expect(deactModal).toBeVisible();
      await expect(deactModal).toContainText('associated interview experience(s)');
      await expect(deactModal).toContainText('safely mark this company as Inactive rather than deleting it');

      await deactModal.getByRole('button', { name: 'Confirm Deactivate' }).click();

      await expect(page.getByText(/safely deactivated/i)).toBeVisible();
      await expect(alphaRow.locator('td').filter({ hasText: /INACTIVE/i })).toBeVisible();
    } finally {
      await apiPut(`/api/experiences/admin/companies/${testData.companies.alpha._id}`, superToken, {
        status: 'Active',
        isActive: true
      });
    }
  });

  // ─── TEST INT-UI-014: PERMISSION VISIBILITY ──────────────────────────
  test('INT-UI-014: Permission visibility', { tag: ['@security'] }, async ({ page }) => {
    // ── Scenario A: ADMIN_ECE (View-only for interviews & companies) ──
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: eceToken, user: eceUser });
    await page.goto(ADMIN_PORTAL_URL + '/interviews');
    await page.waitForLoadState('domcontentloaded');

    // Link is visible
    await expect(page.getByRole('link', { name: /INTERVIEWS/i })).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/.*\/interviews/);

    const pendingRow = page.locator('tr').filter({ hasText: '[E2E] Pending Software Engineer' });
    await expect(pendingRow).toBeVisible();

    // Inspect Details IS visible
    await expect(pendingRow.locator('button[title="Inspect Details"]')).toBeVisible();

    // Mutation buttons MUST NOT be visible for view-only admin
    await expect(pendingRow.locator('button[title="Approve & Publish"]')).toBeHidden();
    await expect(pendingRow.locator('button[title="Reject"]')).toBeHidden();
    await expect(pendingRow.locator('button[title="Archive"]')).toBeHidden();
    await expect(pendingRow.locator('button[title="Edit"]')).toBeHidden();

    // Companies tab: "+ Add Company" button must NOT be visible
    await page.getByRole('button', { name: /COMPANIES/i }).click();
    await expect(page.getByRole('button', { name: '+ Add Company' })).toBeHidden();

    const alphaRow = page.locator('tr').filter({ hasText: '[E2E] Test Company Alpha' });
    await expect(alphaRow).toBeVisible();
    await expect(alphaRow.locator('button[title="Edit Company"]')).toBeHidden();
    await expect(alphaRow.locator('button[title="Deactivate Company"]')).toBeHidden();

    // ── Scenario B: ADMIN_ISE (NO interview access) ──
    await page.goto(ADMIN_PORTAL_URL + '/login');
    await injectAdminAuth(page, { token: iseToken, user: iseUser });
    await page.goto(ADMIN_PORTAL_URL + '/users');
    await page.waitForLoadState('domcontentloaded');

    // Sidebar link INTERVIEWS must NOT be visible
    await expect(page.getByRole('link', { name: /INTERVIEWS/i })).toBeHidden();

    // Direct navigation must redirect away from /interviews
    await page.goto(ADMIN_PORTAL_URL + '/interviews');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/.*\/interviews/);
  });

  // ─── TEST INT-UI-015: ACTION PERMISSION GATING ───────────────────────
  test('INT-UI-015: Action permission gating', { tag: ['@security'] }, async () => {
    const pendingId = testData.experiences.pending._id;
    const alphaId = testData.companies.alpha._id;
    const betaId = testData.companies.beta._id;

    // 1. ADMIN_ECE (view-only): direct API attempts to mutate interview must return 403
    const eceApproveRes = await apiPatch(`/api/experiences/${pendingId}/status`, eceToken, { status: 'Published' });
    expect(eceApproveRes.status).toBe(403);
    const eceApproveErr = await eceApproveRes.json();
    expect(eceApproveErr.error).toMatch(/permission|forbidden/i);

    const eceEditExpRes = await apiPut(`/api/experiences/${pendingId}`, eceToken, { role: 'Hacked Role' });
    expect(eceEditExpRes.status).toBe(403);
    const eceEditErr = await eceEditExpRes.json();
    expect(eceEditErr.error).toMatch(/permission|forbidden/i);

    const eceDeleteExpRes = await apiDelete(`/api/experiences/${pendingId}`, eceToken);
    expect(eceDeleteExpRes.status).toBe(403);
    const eceDeleteErr = await eceDeleteExpRes.json();
    expect(eceDeleteErr.error).toMatch(/permission|forbidden/i);

    // 2. ADMIN_ECE: direct API attempts to mutate companies must return 403
    const eceCreateCompRes = await apiPost('/api/experiences/admin/companies', eceToken, {
      name: '[E2E] Hack Company Attempt',
      status: 'Active'
    });
    expect(eceCreateCompRes.status).toBe(403);
    const eceCreateCompErr = await eceCreateCompRes.json();
    expect(eceCreateCompErr.error).toMatch(/permission|forbidden/i);

    const eceEditCompRes = await apiPut(`/api/experiences/admin/companies/${alphaId}`, eceToken, {
      name: '[E2E] Hacked Company'
    });
    expect(eceEditCompRes.status).toBe(403);
    const eceEditCompErr = await eceEditCompRes.json();
    expect(eceEditCompErr.error).toMatch(/permission|forbidden/i);

    const eceDeleteCompRes = await apiDelete(`/api/experiences/admin/companies/${betaId}`, eceToken);
    expect(eceDeleteCompRes.status).toBe(403);
    const eceDeleteCompErr = await eceDeleteCompRes.json();
    expect(eceDeleteCompErr.error).toMatch(/permission|forbidden/i);

    // 3. ADMIN_ISE (no permissions): direct API attempts must return 403
    const iseStatusRes = await apiPatch(`/api/experiences/${pendingId}/status`, iseToken, { status: 'Published' });
    expect(iseStatusRes.status).toBe(403);

    const iseCompanyRes = await apiPost('/api/experiences/admin/companies', iseToken, {
      name: '[E2E] ISE Hack Company',
      status: 'Active'
    });
    expect(iseCompanyRes.status).toBe(403);
  });
});
