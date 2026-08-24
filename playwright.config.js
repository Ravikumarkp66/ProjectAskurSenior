import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

const extraHTTPHeaders = {};
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  extraHTTPHeaders['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}

const authFile = path.resolve('e2e/.auth/user.json');
const hasAuthState = fs.existsSync(authFile);

export default defineConfig({
  testDir: '.',
  timeout: 45000,
  expect: {
    timeout: 15000
  },
  fullyParallel: false,
  workers: 2,
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  use: {
    baseURL,
    extraHTTPHeaders,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /e2e\/auth\.setup\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'public-chromium',
      testMatch: /e2e\/(?!authenticated\/|auth\.setup\.js).*\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'authenticated-chromium',
      testMatch: /e2e\/authenticated\/.*/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },
    {
      name: 'performance',
      testMatch: /performance\/.*\.spec\.js/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
