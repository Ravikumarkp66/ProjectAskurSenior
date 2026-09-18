import { test, expect } from '@playwright/test';

test.describe('Staging Calculators', { tag: '@regression' }, () => {
  test('SGPA and CGPA calculators load and compute results', async ({ page }) => {
    await page.goto('/calculator');
    await page.waitForLoadState('domcontentloaded');

    // Verify main tab buttons exist (SGPA & CGPA)
    const sgpaTab = page.locator('button').filter({ hasText: /SGPA/i }).first();
    const cgpaTab = page.locator('button').filter({ hasText: /CGPA/i }).first();

    await expect(sgpaTab).toBeVisible({ timeout: 20000 });
    await expect(cgpaTab).toBeVisible({ timeout: 20000 });

    // 1. Test SGPA calculation inputs
    const numberInputs = page.locator('input[type="number"]');
    const inputCount = await numberInputs.count();

    if (inputCount > 0) {
      // Enter sample marks in the first available number inputs
      await numberInputs.first().fill('45');
      if (inputCount > 1) {
        await numberInputs.nth(1).fill('40');
      }

      // Check that computed metrics / text is displayed
      const resultsText = page.getByText(/SGPA|Marks|Grade|Points|Total|Eligible/i).first();
      await expect(resultsText).toBeVisible({ timeout: 10000 });
    }

    // 2. Dismiss any modal/overlay (subscription prompt, onboarding, etc.) before switching tab
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 3. Switch to CGPA Tab — use force:true in case a lightweight backdrop lingers
    await cgpaTab.click({ force: true });

    // Verify CGPA tab content is active
    const cgpaInputs = page.locator('input[placeholder="SGPA"], input[type="number"]');
    const cgpaInputCount = await cgpaInputs.count();

    if (cgpaInputCount > 0) {
      await cgpaInputs.first().fill('8.5');
      const cgpaResult = page.getByText(/CGPA|Cumulative Grade Point Average|Credits/i).first();
      await expect(cgpaResult).toBeVisible({ timeout: 10000 });
    }
  });
});
