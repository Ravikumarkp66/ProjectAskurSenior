import { test, expect } from '@playwright/test';

test.describe('Staging Public Navigation', () => {
  test('navigates through public routes correctly', async ({ page }) => {
    // 1. Home
    await page.goto('/');
    await expect(page).toHaveURL(/\//);
    await expect(page.locator('body')).toBeVisible();

    // 2. Pricing Page
    await page.goto('/pricing');
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.locator('h1, h2, main').first()).toBeVisible({ timeout: 15000 });

    // 3. CGPA / SGPA Calculator Page
    await page.goto('/calculator');
    await expect(page).toHaveURL(/\/calculator/);
    await expect(page.locator('h1, h2, main, button').first()).toBeVisible({ timeout: 15000 });

    // 4. Study Materials / Ask Finder Page
    await page.goto('/ask-finder');
    await expect(page).toHaveURL(/\/ask-finder/);
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });

    // 5. Login page loads and login options are rendered
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    const loginContent = page.locator('button, input, form').first();
    await expect(loginContent).toBeVisible({ timeout: 15000 });

    // 6. Protected routes redirect unauthenticated users to /login
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });
});
