import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = path.resolve('e2e/.auth/user.json');

test.describe('Authenticated Student Smoke Tests', () => {
  test.beforeEach(async () => {
    test.skip(!fs.existsSync(authFile), 'Skipping authenticated test: e2e/.auth/user.json is not present.');
  });

  test('authenticated student can load profile without login redirect and communicates with staging backend', async ({ page }) => {
    const interceptedUrls = [];
    const forbiddenHost = 'askursenior.onrender.com';
    let productionLeakDetected = false;
    let leakedUrl = '';

    page.on('request', request => {
      const url = request.url();
      interceptedUrls.push(url);
      if (url.includes(forbiddenHost)) {
        productionLeakDetected = true;
        leakedUrl = url;
      }
    });

    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');

    // 1. Confirm user stays on /profile and is not redirected to /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/profile/, { timeout: 15000 });

    // 2. Confirm profile page container is rendered
    const profileElement = page.locator('h1, h2, h3, main, nav').first();
    await expect(profileElement).toBeVisible({ timeout: 15000 });

    // 3. Confirm zero requests leaked to production
    expect(productionLeakDetected, `CRITICAL: Leaked request to production backend: ${leakedUrl}`).toBe(false);
  });
});
