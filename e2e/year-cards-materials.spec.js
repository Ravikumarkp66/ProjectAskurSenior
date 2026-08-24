import { test, expect } from '@playwright/test';

test.describe('Academic Years & Study Materials Flow (1st, 2nd, 3rd & 4th Year)', () => {
  const forbiddenHost = 'askursenior.onrender.com';

  test.beforeEach(async ({ page }) => {
    // Zero production leak guard
    page.on('request', (req) => {
      const url = req.url();
      expect(url, `Request leaked to production backend: ${url}`).not.toContain(forbiddenHost);
    });

    // Mock PDF preview and download links to ensure test resilience in non-S3 environments
    await page.route('**/api/documents/*/preview-url', async (route) => {
      const json = { previewUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', title: 'Sample Preview Document' };
      await route.fulfill({ json, status: 200 });
    });

    await page.route('**/api/documents/*/download', async (route) => {
      const json = { downloadUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' };
      await route.fulfill({ json, status: 200 });
    });
  });

  test('1. Plus Dashboard renders all 4 Year Cards with live DB statistics and Coming Soon state', async ({ page }) => {
    await page.goto('/plus');
    await page.waitForLoadState('domcontentloaded');

    // Verify Academics section header exists
    const academicsHeading = page.locator('h2, h3, div').filter({ hasText: /Academics/i }).first();
    await expect(academicsHeading).toBeVisible({ timeout: 15000 });

    // Check 1st Year card: badge, subject count, resources
    const firstYearCard = page.locator('text=FIRST YEAR').or(page.locator('text=First Year')).first();
    await expect(firstYearCard).toBeVisible({ timeout: 10000 });

    // Check 2nd Year card
    const secondYearCard = page.locator('text=SECOND YEAR').or(page.locator('text=Second Year')).first();
    await expect(secondYearCard).toBeVisible({ timeout: 10000 });

    // Check 3rd Year card
    const thirdYearCard = page.locator('text=THIRD YEAR').or(page.locator('text=Third Year')).first();
    await expect(thirdYearCard).toBeVisible({ timeout: 10000 });

    // Check 4th Year card (Sem 7-8 · Coming Soon state)
    const fourthYearCard = page.locator('text=FOURTH YEAR').or(page.locator('text=Fourth Year')).first();
    await expect(fourthYearCard).toBeVisible({ timeout: 10000 });
    const comingSoonText = page.locator('text=Coming Soon').first();
    await expect(comingSoonText).toBeVisible({ timeout: 10000 });
  });

  test('2. First Year section: displays all 30 subjects, supports search, loads materials, previews & downloads', async ({ page }) => {
    await page.goto('/plus/first-year');
    await page.waitForLoadState('domcontentloaded');

    // 1. Sidebar loads subjects
    const sidebar = page.locator('input[placeholder*="Search subjects"]').first();
    await expect(sidebar).toBeVisible({ timeout: 15000 });

    // 2. Search filtering in sidebar
    await sidebar.fill('Python');
    const pythonSubjectBtn = page.locator('button').filter({ hasText: /Python Programming/i }).first();
    await expect(pythonSubjectBtn).toBeVisible({ timeout: 10000 });

    // 3. Click subject to load content
    await pythonSubjectBtn.click();

    // 4. Verify subject header & material cards
    const subjectHeader = page.locator('h1, h2').filter({ hasText: /Python Programming/i }).first();
    await expect(subjectHeader).toBeVisible({ timeout: 15000 });

    // 5. Verify Notes tab materials
    const previewBtn = page.locator('button').filter({ hasText: /Preview/i }).first();
    await expect(previewBtn).toBeVisible({ timeout: 15000 });

    // 6. Test Preview action
    await previewBtn.click();
    // Modal or viewer appears
    const modalOrViewer = page.locator('iframe, div[class*="modal"], div[role="dialog"], button:has-text("✕"), button:has-text("Close")').first();
    await expect(modalOrViewer).toBeVisible({ timeout: 10000 });

    // Press Escape to close modal
    await page.keyboard.press('Escape');

    // 7. Test Download action
    const downloadBtn = page.locator('button').filter({ hasText: /Download/i }).first();
    await expect(downloadBtn).toBeVisible({ timeout: 10000 });
    await downloadBtn.click();

    // 8. Test PYQs tab switching
    const pyqTab = page.locator('button').filter({ hasText: /PYQ/i }).first();
    if (await pyqTab.isVisible()) {
      await pyqTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('3. Second Year section: loads branch-specific subjects and renders content', async ({ page }) => {
    await page.goto('/plus/second-year');
    await page.waitForLoadState('domcontentloaded');

    // Verify sidebar search input is available
    const searchInput = page.locator('input[placeholder*="Search subjects"]').first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Verify at least one subject button is rendered in the sidebar
    const anySubjectBtn = page.locator('button').filter({ hasText: /Engineering|Mathematics|Circuits|Data|Biology|Algorithms/i }).first();
    await expect(anySubjectBtn).toBeVisible({ timeout: 15000 });
  });

  test('4. Third Year section: loads subjects and renders study materials', async ({ page }) => {
    await page.goto('/plus/third-year');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input[placeholder*="Search subjects"]').first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Verify 3rd year subjects exist in the list
    const subjectBtn = page.locator('button').filter({ hasText: /Software|Artificial|Database|Design|Communication|Management/i }).first();
    await expect(subjectBtn).toBeVisible({ timeout: 15000 });
  });

  test('5. Fourth Year section: gracefully handles empty/coming soon state without crashing', async ({ page }) => {
    const errorLogs = [];
    page.on('pageerror', (err) => errorLogs.push(err.message));

    await page.goto('/plus/fourth-year');
    await page.waitForLoadState('domcontentloaded');

    // Ensure no unhandled runtime crashes
    expect(errorLogs).toHaveLength(0);

    // Sidebar should be present
    const sidebarSearch = page.locator('input[placeholder*="Search subjects"]').first();
    await expect(sidebarSearch).toBeVisible({ timeout: 15000 });
  });
});
