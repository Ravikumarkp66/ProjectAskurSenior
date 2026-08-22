import { test, expect } from '@playwright/test';

test.describe('Staging Landing Page', () => {
  test('homepage loads successfully with hero, navigation, and CTA', async ({ page }) => {
    // Collect console errors to detect fatal runtime errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');

    // Verify page title is present
    await expect(page).toHaveTitle(/AskUrSenior/i);

    // Verify navbar/header exists
    const nav = page.locator('nav, header').first();
    await expect(nav).toBeVisible({ timeout: 15000 });

    // Verify primary hero heading or section is visible
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible({ timeout: 15000 });

    // Verify primary call-to-action button or link is visible
    const ctaButton = page.locator('a, button').filter({ hasText: /Get Started|Explore|Start/i }).first();
    await expect(ctaButton).toBeVisible({ timeout: 15000 });

    // Verify no fatal uncaught error banner exists
    const fatalError = page.locator('text="Something went wrong"').first();
    await expect(fatalError).not.toBeVisible();
  });
});
