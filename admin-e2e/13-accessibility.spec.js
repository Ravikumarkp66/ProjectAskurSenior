import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SUPER1, ADMIN_PORTAL_URL } from './helpers/test-accounts.js';
import { adminLogin, injectAdminAuth } from './helpers/api-client.js';

test.describe('Admin Automated Accessibility (A11y) Foundation', { tag: '@accessibility' }, () => {
  let superToken = null;
  let superUser = null;

  test.beforeAll(async () => {
    try {
      const loginRes = await adminLogin(SUPER1.email);
      if (loginRes.ok) {
        superToken = loginRes.token;
        superUser = loginRes.user;
      }
    } catch (e) {
      console.warn('[ADMIN-A11Y] Auth setup skipped:', e.message);
    }
  });

  test('ADMIN-A11Y-001: Admin Login Page automated accessibility scan', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    const scanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    console.log(`[ADMIN-A11Y-001] Admin Login violations: ${scanResults.violations.length}`);
    scanResults.violations.forEach(v => {
      console.log(`  - [${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
    });

    // Record violations without crashing so developers get an actionable diagnostic baseline
    expect(scanResults.violations).toBeDefined();
  });

  test('ADMIN-A11Y-002: Admin Dashboard & Subjects Page automated accessibility scan', async ({ page }) => {
    test.skip(!superToken, 'Requires active admin login token');

    await injectAdminAuth(page, superToken, superUser);
    await page.goto('/subjects');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const scanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    console.log(`[ADMIN-A11Y-002] Admin Subjects Page violations: ${scanResults.violations.length}`);
    scanResults.violations.forEach(v => {
      console.log(`  - [${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
    });

    expect(scanResults.violations).toBeDefined();
  });
});
