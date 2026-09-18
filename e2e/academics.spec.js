import { test, expect } from '@playwright/test';

test.describe('Staging Academics & Study Materials', { tag: '@regression' }, () => {
  test('public materials finder loads subjects and hits staging backend', async ({ page }) => {
    const interceptedRequests = [];
    const forbiddenHost = 'askursenior.onrender.com';

    page.on('request', request => {
      const url = request.url();
      interceptedRequests.push(url);
      expect(url, `Request leaked to production backend: ${url}`).not.toContain(forbiddenHost);
    });

    const failedResponses = [];
    page.on('response', response => {
      const url = response.url();
      const status = response.status();
      // Only track failures on core materials/subjects/branches API paths
      const isCoreApi = /\/api\/(cms|subjects|materials|branches)/.test(url);
      if (isCoreApi && (status >= 500 || status === 404)) {
        failedResponses.push({ url, status });
      }
    });

    // Navigate to public Ask Finder / Materials page
    await page.goto('/ask-finder');
    await page.waitForLoadState('domcontentloaded');

    // Verify search input or branch/filter selector is present
    const searchOrFilter = page.locator('input[type="text"], input[type="search"], select, button').first();
    await expect(searchOrFilter).toBeVisible({ timeout: 20000 });

    // Ensure no 500 or 404 on core materials API requests
    expect(failedResponses, `Core API errors encountered: ${JSON.stringify(failedResponses)}`).toHaveLength(0);
  });

  test('notes that authenticated student dashboard requires login', async ({ page }) => {
    // Navigating to internal academic dashboard without session redirects to /login
    await page.goto('/home');
    await page.waitForURL(/\/login/, { timeout: 25000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
