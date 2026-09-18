import { test, expect } from '@playwright/test';

test.describe('Plus Dashboard Information Architecture & UI', () => {
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

  test('Plus Dashboard renders 5 structured sections with cards in controlled rows', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 2500 });
    await page.goto('/plus');
    await page.waitForLoadState('domcontentloaded');


    // 1. Section A: Academics
    const academicsSection = page.locator('h2:has-text("Academics")').first();
    await expect(academicsSection).toBeVisible({ timeout: 10000 });
    const mySubjectsCard = page.locator('text=My Subjects').first();
    await expect(mySubjectsCard).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Attendance').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=SGPA Calculator').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Academic Overview').first()).toBeVisible({ timeout: 10000 });

    // Verify card width is controlled (~260-280px) and not stretched full-width
    const cardBox = await mySubjectsCard.boundingBox();
    if (cardBox) {
      expect(cardBox.width).toBeLessThanOrEqual(300);
    }

    // 2. Section B: Academic Tools
    const toolsSection = page.locator('h2:has-text("Academic Tools")').first();
    await expect(toolsSection).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=CIE Analyzer').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Branch Change Predictor').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Eligibility Checker').first()).toBeVisible({ timeout: 10000 });

    // 3. Section C: Practice
    const practiceSection = page.locator('h2:has-text("Practice")').first();
    await expect(practiceSection).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Library').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Lab Programs').first()).toBeVisible({ timeout: 10000 });

    // 4. Section D: Career
    const careerSection = page.locator('h2:has-text("Career")').first();
    await expect(careerSection).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Roadmaps').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Interview Experiences').first()).toBeVisible({ timeout: 10000 });

    // 5. Section E: Campus
    const campusSection = page.locator('h2:has-text("Campus")').first();
    await expect(campusSection).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Campus Explorer').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Faculty Ratings').first()).toBeVisible({ timeout: 10000 });

    // Capture full-page screenshot of new layout
    await page.screenshot({
      path: 'C:/Users/Ravikumar K P/.gemini/antigravity/brain/1278c5ef-13d0-4988-a3ad-65f2d774d750/plus_dashboard.png',
      fullPage: true
    });

    // 7. Test Interactive Modal: Branch Change Predictor
    const branchCard = page.locator('text=Branch Change Predictor').first();
    await branchCard.click();
    const modal = page.getByTestId('tool-modal');
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=Your Expected 1st Year CGPA')).toBeVisible({ timeout: 5000 });
    const doneBtn = modal.locator('button:has-text("Done")');
    await doneBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // 8. Test Interactive Modal: Eligibility Checker
    const eligibilityCard = page.locator('text=Eligibility Checker').first();
    await eligibilityCard.click();
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('text=Year Progression Eligibility')).toBeVisible({ timeout: 5000 });
    const closeBtn = modal.locator('button:has-text("Close")');
    await closeBtn.click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });
});
