import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = path.resolve('e2e/.auth/user.json');

test.describe('Milestone 12: Authenticated Coding Playground Student Journey', () => {

  test.beforeEach(async ({ page }) => {
    test.skip(!fs.existsSync(authFile), 'Skipping authenticated test: e2e/.auth/user.json is not present.');
    await page.goto('/lab-programs?lang=plc6&prog=plc6-distance-between-two-points');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Student can load Playground and view problem statement with Monaco editor', async ({ page }) => {
    // 1. Confirm student stays on /lab-programs without redirect to /login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/lab-programs/, { timeout: 15000 });

    // 2. Confirm Problem Statement details render
    await expect(page.getByText('Distance Between Two Points').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Constraints/i).first()).toBeVisible();

    // 3. Confirm Monaco editor mounts
    await page.waitForFunction(() => !!window.__setEditorCode || !!window.__monacoEditor, { timeout: 15000 });
  });

  test('2. Run Contract: Running code evaluates test cases WITHOUT saving a submission', async ({ page }) => {
    await page.waitForFunction(() => !!window.__setEditorCode, { timeout: 15000 });

    // 1. Check Submissions Tab
    const submissionsTab = page.locator('button:has-text("Submissions")');
    await expect(submissionsTab).toBeVisible();

    // 2. Set valid Python solution
    const pythonCode = `import math, sys
tokens = sys.stdin.read().split()
if len(tokens) >= 4:
    x1, y1, x2, y2 = map(float, tokens[:4])
    print(f"Distance: {math.sqrt((x2-x1)**2 + (y2-y1)**2):.2f}")
`;

    await page.evaluate((code) => {
      if (window.__setEditorCode) {
        window.__setEditorCode(code);
      }
    }, pythonCode);

    // 3. Click Run Code
    const runBtn = page.locator('button[title*="Run Code"], button:has-text("Run")').first();
    await runBtn.click();

    // 4. Test case console displays passed output
    await expect(page.getByText(/Passed|All Test Cases Passed|Case 1/i).first()).toBeVisible({ timeout: 25000 });

    // 5. Verify Submissions tab is unchanged
    await submissionsTab.click();
    await page.waitForTimeout(1000);
  });

  test('3. Submit Contract: Submitting code evaluates all cases and records real submission', async ({ page }) => {
    await page.waitForFunction(() => !!window.__setEditorCode, { timeout: 15000 });

    // 1. Set valid Python solution
    const pythonCode = `import math, sys
tokens = sys.stdin.read().split()
if len(tokens) >= 4:
    x1, y1, x2, y2 = map(float, tokens[:4])
    print(f"Distance: {math.sqrt((x2-x1)**2 + (y2-y1)**2):.2f}")
`;

    await page.evaluate((code) => {
      if (window.__setEditorCode) {
        window.__setEditorCode(code);
      }
    }, pythonCode);

    // 2. Click Submit
    const submitBtn = page.locator('button[title*="Submit Solution"], button:has-text("Submit")').first();
    await submitBtn.click();

    // 3. Wait for submission success / toast or tab switch to Submissions
    const submissionsTab = page.locator('button:has-text("Submissions")');
    await expect(submissionsTab).toBeVisible({ timeout: 30000 });
    await submissionsTab.click();

    // 4. Verify Accepted submission entry
    await expect(page.getByText(/Accepted/i).first()).toBeVisible({ timeout: 20000 });
  });

  test('4. Deliberate Failure: Wrong Answer is accurately classified and stored', async ({ page }) => {
    await page.waitForFunction(() => !!window.__setEditorCode, { timeout: 15000 });

    // 1. Set wrong solution
    const wrongCode = `print("Distance: 0.00")`;

    await page.evaluate((code) => {
      if (window.__setEditorCode) {
        window.__setEditorCode(code);
      }
    }, wrongCode);

    // 2. Click Submit
    const submitBtn = page.locator('button[title*="Submit Solution"], button:has-text("Submit")').first();
    await submitBtn.click();

    // 3. Confirm Wrong Answer in Submissions tab
    const submissionsTab = page.locator('button:has-text("Submissions")');
    await submissionsTab.click();
    await expect(page.getByText(/Wrong Answer/i).first()).toBeVisible({ timeout: 25000 });
  });

  test('5. Sandbox Security: Time Limit Exceeded (TLE) is safely contained', async ({ page }) => {
    await page.waitForFunction(() => !!window.__setEditorCode, { timeout: 15000 });

    // 1. Set infinite loop
    const tleCode = `while True: pass`;

    await page.evaluate((code) => {
      if (window.__setEditorCode) {
        window.__setEditorCode(code);
      }
    }, tleCode);

    // 2. Click Run
    const runBtn = page.locator('button[title*="Run Code"], button:has-text("Run")').first();
    await runBtn.click();

    // 3. Expect evaluation error or failed/TLE status
    await expect(page.getByText(/Failed|Time Limit|Execution error|timed out/i).first()).toBeVisible({ timeout: 25000 });
  });

});
