import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * CIE Analyzer Student End-to-End Test Suite
 *
 * Covers:
 * - CIE-E2E-001: Student can open CIE Analyzer and view header navigation
 * - CIE-E2E-002: Student can select semester and view registered CIE subject cards
 * - CIE-E2E-003: Student can enter marks, auto-save occurs via API, and live CIE score updates
 * - CIE-E2E-004: Real-time client-side input validation prevents exceeding maximum allowed marks
 * - CIE-E2E-005: Student can switch between Entry workspace and CIE Summary tab
 * - CIE-E2E-006: Persistence across page reload via backend and database roundtrip
 *
 * Full-stack flow:
 * Browser -> Student CIE UI -> Frontend (Vite:3000) -> HTTP API (/api/auth/profile/cie) -> Backend (Express:5000) -> MongoDB
 */

const authDir = path.resolve('e2e/.auth');
const authFile = path.join(authDir, 'user.json');

test.describe('CIE Analyzer Student Experience E2E', { tag: ['@regression', '@critical'] }, () => {
    test.describe.configure({ mode: 'serial' });
    let authSession = null;

    test.beforeAll(async ({ request }) => {
        // Authenticate directly with backend API to obtain a fresh active JWT session
        const backendBase = process.env.E2E_BACKEND_URL || 'http://localhost:5000';
        const loginEndpoint = `${backendBase.replace(/\/+$/, '')}/api/auth/login`;

        const res = await request.post(loginEndpoint, {
            data: {
                usn: process.env.E2E_TEST_USN || 'STAGING01',
                password: process.env.E2E_TEST_PASSWORD || 'StagingE2EPass2026!',
                branch: 'CS'
            },
            headers: { 'Content-Type': 'application/json' }
        });

        expect(res.ok(), `API Login failed: ${res.status()}`).toBeTruthy();
        const data = await res.json();
        const userObj = {
            ...data.user,
            semester: 1
        };

        authSession = {
            token: data.token,
            user: userObj
        };

        // Update user.json with the freshly minted active session
        try {
            if (!fs.existsSync(authDir)) {
                fs.mkdirSync(authDir, { recursive: true });
            }
            fs.writeFileSync(authFile, JSON.stringify({
                cookies: [],
                origins: [
                    {
                        origin: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
                        localStorage: [
                            { name: 'token', value: data.token },
                            { name: 'authToken', value: data.token },
                            { name: 'user', value: JSON.stringify(userObj) },
                            { name: 'uiTheme', value: 'dark' }
                        ]
                    }
                ]
            }, null, 2));
        } catch (e) {
            console.warn('[CIE-E2E] Could not save updated authFile:', e.message);
        }
    });

    test.beforeEach(async ({ page }) => {
        // Inject authenticated session into localStorage prior to navigation
        await page.addInitScript(({ token, user }) => {
            localStorage.setItem('token', token);
            localStorage.setItem('authToken', token);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('uiTheme', 'dark');
        }, { token: authSession.token, user: authSession.user });
    });

    // Helper to navigate and switch to Semester 4 with deterministic state synchronization
    const openCieSemester4 = async (page) => {
        await page.goto('/home/cie');
        await page.waitForLoadState('networkidle');

        // 1. Wait for initial mount load and Semester 1 subject to fully settle
        await expect(page.getByText('Loading CIE Analyzer...')).not.toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('heading', { name: 'CIE Analyzer' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('heading', { name: 'Engineering Mathematics I', level: 2 })).toBeVisible({ timeout: 15000 });

        // 2. Select Semester 4 by label and synchronize with the backend response
        const semSelector = page.locator('select').filter({ hasText: /Semester/i });
        const sem4Response = page.waitForResponse(
            res => res.url().includes('/api/auth/profile/cie?semester=4') && res.status() === 200,
            { timeout: 15000 }
        );
        await semSelector.selectOption({ label: 'Semester 4' });
        await sem4Response;

        // 3. Await active workspace subject heading for Semester 4
        const subjectHeading = page.getByRole('heading', { name: 'E2E CIE Test Course (IPCC)', level: 2 });
        await expect(subjectHeading).toBeVisible({ timeout: 15000 });
        return subjectHeading;
    };

    test('CIE-E2E-001: Student can open CIE Analyzer and view header navigation', async ({ page }) => {
        await page.goto('/home/cie');
        await page.waitForLoadState('domcontentloaded');

        // Wait for initial load spinner to finish
        await expect(page.getByText('Loading CIE Analyzer...')).not.toBeVisible({ timeout: 15000 });

        // Verify primary heading
        const heading = page.getByRole('heading', { name: 'CIE Analyzer' });
        await expect(heading).toBeVisible({ timeout: 15000 });

        // Verify SIT Engine badge
        await expect(page.getByText('SIT Engine')).toBeVisible();

        // Verify semester dropdown exists
        const semSelector = page.locator('select').filter({ hasText: /Semester/i });
        await expect(semSelector).toBeVisible();

        // Verify view mode tabs exist
        const entryTab = page.getByRole('button', { name: /CIE Entry & Analysis/i });
        const summaryTab = page.getByRole('button', { name: /CIE Summary/i });
        await expect(entryTab).toBeVisible();
        await expect(summaryTab).toBeVisible();
    });

    test('CIE-E2E-002: Student can select semester and view registered CIE subject cards', async ({ page }) => {
        const subjectHeading = await openCieSemester4(page);
        await expect(subjectHeading).toBeVisible();

        // Verify course code and credits are rendered
        await expect(page.getByText('E2E-CIE-IPCC').first()).toBeVisible();
        await expect(page.getByText(/4 Credits/).first()).toBeVisible();

        // Verify evaluation type badge
        await expect(page.getByText('IPCC', { exact: true }).first()).toBeVisible();

        // Verify subcomponent group titles appear in workspace
        await expect(page.getByText('Tests', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('Quizzes', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('Assignments / ABL', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('Lab Record', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('Lab Test', { exact: true }).first()).toBeVisible();
    });

    test('CIE-E2E-003: Student can enter marks, auto-save occurs via API, and live CIE score updates', async ({ page }) => {
        await openCieSemester4(page);

        // Helper to locate input field by subcomponent label card
        const getInputByLabel = (labelName) => {
            return page.locator('label', { hasText: new RegExp(`^${labelName}$`) })
                .locator('..')
                .locator('input[type="number"]');
        };

        // Set up listener for the debounced PUT save API call
        const savePromise = page.waitForResponse(response =>
            response.url().includes('/api/auth/profile/cie') &&
            response.request().method() === 'PUT' &&
            response.status() === 200,
            { timeout: 15000 }
        );

        // Fill test input with a modified mark to guarantee an onChange event
        const test1Input = getInputByLabel('Test 01');
        const currentVal = await test1Input.inputValue();
        const newVal = currentVal === '47' ? '46' : '47';
        await test1Input.fill(newVal);

        // Wait for API save confirmation from backend
        const saveRes = await savePromise;
        expect(saveRes.status()).toBe(200);

        // Verify the auto-saved indicator is rendered
        await expect(page.getByText('✓ Auto-saved')).toBeVisible({ timeout: 10000 });

        // Verify CIE Score section is visible and rendered
        await expect(page.getByText('CIE Score', { exact: true })).toBeVisible();
        await expect(page.getByText('/ 50').first()).toBeVisible();

        // Verify contribution breakdown displays IPCC scaled sections
        await expect(page.getByText('Theory (Scaled /25)')).toBeVisible();
        await expect(page.getByText('Practical (Scaled /25)')).toBeVisible();
    });

    test('CIE-E2E-004: Real-time client-side input validation prevents exceeding maximum allowed marks', async ({ page }) => {
        await openCieSemester4(page);

        // Target Test 01 input component card directly via its label
        const test1Card = page.locator('label', { hasText: /^Test 01$/ }).locator('..');
        const test1Input = test1Card.locator('input[type="number"]');

        // Enter value exceeding maxRaw (55 > 50)
        await test1Input.fill('55');

        // Assert error message appears
        const maxError = test1Card.locator('text=Maximum allowed: 50');
        await expect(maxError).toBeVisible({ timeout: 5000 });

        // Enter negative value (-5)
        await test1Input.fill('-5');
        const negativeError = test1Card.locator('text=Cannot be negative');
        await expect(negativeError).toBeVisible({ timeout: 5000 });

        // Restore valid value (45)
        await test1Input.fill('45');

        // Assert error messages disappear
        await expect(maxError).not.toBeVisible();
        await expect(negativeError).not.toBeVisible();
    });

    test('CIE-E2E-005: Student can switch between Entry workspace and CIE Summary tab', async ({ page }) => {
        await openCieSemester4(page);

        // Click CIE Summary tab
        const summaryTab = page.getByRole('button', { name: /CIE Summary/i });
        await summaryTab.click();

        // Verify summary heading and overview metric
        await expect(page.getByRole('heading', { name: 'CIE Summary', level: 2 })).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('SUBJECTS').first()).toBeVisible();

        // Verify the subject is listed in the summary table cell
        await expect(page.getByRole('cell', { name: 'E2E CIE Test Course (IPCC)' })).toBeVisible();

        // Switch back to CIE Entry & Analysis tab
        const entryTab = page.getByRole('button', { name: /CIE Entry & Analysis/i });
        await entryTab.click();

        // Verify active subject workspace is restored
        await expect(page.getByRole('heading', { name: 'E2E CIE Test Course (IPCC)', level: 2 })).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Tests', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('Quizzes', { exact: true }).first()).toBeVisible();
    });

    test('CIE-E2E-006: Persistence across page reload via backend and database roundtrip', async ({ page }) => {
        await openCieSemester4(page);

        // Target Lab Record card directly via its label
        const labRecordCard = page.locator('label', { hasText: /^Lab Record$/ }).locator('..');
        const labRecordInput = labRecordCard.locator('input[type="number"]');

        const savePromise = page.waitForResponse(response =>
            response.url().includes('/api/auth/profile/cie') &&
            response.request().method() === 'PUT' &&
            response.status() === 200,
            { timeout: 15000 }
        );

        // Toggle value between 320 and 310 to ensure change event fires
        const currentLabVal = await labRecordInput.inputValue();
        const newLabVal = currentLabVal === '320' ? '310' : '320';

        await labRecordInput.fill(newLabVal);
        await savePromise;
        await expect(page.getByText('✓ Auto-saved')).toBeVisible({ timeout: 10000 });

        // Perform browser page reload and re-open Semester 4
        await page.reload();
        await openCieSemester4(page);

        // Verify persisted value loaded from the database
        const persistedCard = page.locator('label', { hasText: /^Lab Record$/ }).locator('..');
        const persistedLabRecordInput = persistedCard.locator('input[type="number"]');

        await expect(persistedLabRecordInput).toHaveValue(newLabVal);

        // Verify CIE score breakdown remains rendered
        await expect(page.getByText('Practical (Scaled /25)')).toBeVisible();
    });
});
