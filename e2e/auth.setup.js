import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authDir = path.resolve('e2e/.auth');
const authFile = path.join(authDir, 'user.json');

setup('authenticate staging test student', async ({ page, request, baseURL }) => {
  const testUsn = (process.env.E2E_TEST_USN || 'STAGING01').toUpperCase().trim();
  const testPassword = process.env.E2E_TEST_PASSWORD || 'StagingE2EPass2026!';

  // Staging backend API URL
  const backendBase = process.env.E2E_BACKEND_URL || 'https://askursenior-staging.onrender.com';
  const loginEndpoint = `${backendBase.replace(/\/+$/, '')}/api/auth/login`;

  console.log(`[auth.setup] Authenticating test user (${testUsn}) via ${loginEndpoint}...`);

  // 1. Authenticate via staging backend direct credential endpoint
  const loginResponse = await request.post(loginEndpoint, {
    data: {
      usn: testUsn,
      password: testPassword,
      branch: 'CS',
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  expect(loginResponse.ok(), `Failed to login test user: ${loginResponse.status()} ${await loginResponse.text()}`).toBeTruthy();
  const resData = await loginResponse.json();

  const token = resData.token;
  const user = resData.user;

  expect(token, 'No token returned by staging login endpoint').toBeTruthy();
  expect(user, 'No user profile returned by staging login endpoint').toBeTruthy();

  console.log(`[auth.setup] Successfully received token for user ID: ${user.id || user._id}`);

  // 2. Open frontend origin and inject authenticated session into localStorage
  await page.goto('/login');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user });

  // 3. Verify session by navigating to protected route
  await page.goto('/profile');
  await page.waitForLoadState('domcontentloaded');

  // Ensure user stays on /profile and is not kicked out to /login
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
  await expect(page).toHaveURL(/\/profile/, { timeout: 15000 });

  // 4. Ensure .auth directory exists and save storageState
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await page.context().storageState({ path: authFile });
  console.log(`[auth.setup] Authenticated storage state saved to ${authFile}`);
});
