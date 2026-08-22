import { test, expect } from '@playwright/test';

test.describe('API Routing Verification', () => {
  test('staging frontend never sends requests to production backend', async ({ page }) => {
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

    // Visit multiple primary public routes to trigger initial API calls
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/calculator');
    await page.waitForLoadState('domcontentloaded');

    await page.goto('/ask-finder');
    await page.waitForLoadState('domcontentloaded');

    // Assert that no request ever hit production
    expect(productionLeakDetected, `CRITICAL: Leaked request to production backend: ${leakedUrl}`).toBe(false);

    // Filter intercepted API requests
    const backendApiRequests = interceptedUrls.filter(u => u.includes('/api/'));

    // Check if running against staging URL
    const isStaging = (process.env.PLAYWRIGHT_BASE_URL || '').includes('vercel.app');
    if (isStaging && backendApiRequests.length > 0) {
      const allTargetStagingOrRelative = backendApiRequests.every(
        u => u.includes('askursenior-staging.onrender.com') || u.includes('vercel.app')
      );
      expect(allTargetStagingOrRelative, `Unexpected API request destination found in: ${JSON.stringify(backendApiRequests)}`).toBe(true);
    }
  });
});
