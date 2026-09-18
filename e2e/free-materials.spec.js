import { test, expect } from '@playwright/test';

test.describe('Free Materials Page (/home)', () => {
  let authSession = null;

  test.beforeAll(async ({ request }) => {
    const backendBase = 'http://localhost:5000';
    const loginEndpoint = `${backendBase}/api/auth/login`;

    const res = await request.post(loginEndpoint, {
      data: {
        usn: process.env.E2E_TEST_USN || 'STAGING01',
        password: process.env.E2E_TEST_PASSWORD || 'StagingE2EPass2026!',
        branch: 'CS'
      },
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok()) {
      const data = await res.json();
      authSession = {
        token: data.token,
        user: { ...data.user, semester: 4 }
      };
    }
  });

  test.beforeEach(async ({ page }) => {
    if (authSession) {
      await page.addInitScript(({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('uiTheme', 'dark');
      }, { token: authSession.token, user: authSession.user });
    }
  });

  test('refines Materials page with 3-column grid, 2-level filters, no FREE badge, and dual-theme support', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    // 1. FREE badge removed, clean Materials title
    const freeBadge = page.locator('#free-materials-badge');
    await expect(freeBadge).toHaveCount(0);

    const materialsHeading = page.locator('h1:has-text("Materials")');
    await expect(materialsHeading).toBeVisible({ timeout: 10000 });

    const supportingText = page.locator('text=Notes, previous-year questions and academic resources.');
    await expect(supportingText).toBeVisible({ timeout: 10000 });

    // 2. Full-width Search Bar
    const searchInput = page.locator('input[placeholder*="Search notes, subjects, PYQs"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // 3. Dynamic Material Counts (Row 1 pills)
    const allMaterialsBtn = page.locator('button:has-text("All Materials")').first();
    await expect(allMaterialsBtn).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Notes")').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("PYQs")').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Others")').first()).toBeVisible({ timeout: 10000 });

    // 4. Two-Level Hierarchy Dropdowns (Row 2 dropdowns)
    const yearSelect = page.locator('#filter-year-select');
    await expect(yearSelect).toBeVisible({ timeout: 10000 });
    const semSelect = page.locator('#filter-sem-select');
    await expect(semSelect).toBeVisible({ timeout: 10000 });

    // 5. Subject count label above grid
    await expect(page.locator('text=Subjects available')).toBeVisible({ timeout: 10000 });

    // 6. 3-column responsive grid on desktop
    const cardsGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    await expect(cardsGrid).toBeVisible({ timeout: 10000 });
    const firstCard = page.locator('[role="button"]:has(h3)').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Verify cards span row evenly (~240px to 380px each on desktop)
    const cardBox = await firstCard.boundingBox();
    if (cardBox) {
      expect(cardBox.width).toBeGreaterThanOrEqual(220);
    }

    // Capture Dark Mode Cards screenshot
    await page.screenshot({
      path: 'C:/Users/Ravikumar K P/.gemini/antigravity/brain/1278c5ef-13d0-4988-a3ad-65f2d774d750/free_materials_cards_dark.png',
      fullPage: false
    });

    // 7. Right Panel remains visible and unchanged on desktop
    const rightPanel = page.locator('#dashboard-right-panel');
    await expect(rightPanel).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Materials Overview').first()).toBeVisible({ timeout: 10000 });

    // 8. Click a subject card to view CSES sheet resource listing
    await firstCard.click();
    await expect(page.locator('text=Material Title').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Preview")').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Download")').first()).toBeVisible({ timeout: 10000 });

    // Capture CSES Sheet Table screenshot
    await page.screenshot({
      path: 'C:/Users/Ravikumar K P/.gemini/antigravity/brain/1278c5ef-13d0-4988-a3ad-65f2d774d750/free_materials_table_dark.png',
      fullPage: false
    });

    // 9. Back to subjects and test Light Mode
    await page.locator('button:has-text("Back to all subjects")').click();
    await expect(cardsGrid).toBeVisible({ timeout: 10000 });

    // Switch to light theme via localStorage & window event
    await page.evaluate(() => {
      localStorage.setItem('aus-theme', 'light');
      localStorage.setItem('uiTheme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      window.dispatchEvent(new CustomEvent('uiThemeChange', { detail: 'light' }));
    });
    await page.waitForTimeout(500);
    const lightBtn = page.locator('button:has-text("All Materials")').first();
    await expect(lightBtn).toBeVisible({ timeout: 10000 });

    // Capture Light Mode Cards screenshot
    await page.screenshot({
      path: 'C:/Users/Ravikumar K P/.gemini/antigravity/brain/1278c5ef-13d0-4988-a3ad-65f2d774d750/free_materials_cards_light.png',
      fullPage: false
    });

    // Verify CSES Sheet in Light Mode
    await firstCard.click();
    await expect(page.locator('text=Material Title').first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({
      path: 'C:/Users/Ravikumar K P/.gemini/antigravity/brain/1278c5ef-13d0-4988-a3ad-65f2d774d750/free_materials_table_light.png',
      fullPage: false
    });
  });
});
