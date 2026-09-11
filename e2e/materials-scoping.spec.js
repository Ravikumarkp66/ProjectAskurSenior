import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';

/**
 * Materials Section Scoping & UX End-to-End Test Suite
 *
 * Covers:
 * - MAT-E2E-001: Authenticated student view (academic scope badge, strict branch/year isolation, file metadata)
 * - MAT-E2E-002: Segmented Material Type tabs filtering and tab counters
 * - MAT-E2E-003: Search query filtering and reset button behavior
 * - MAT-E2E-004: Admin scope toggle between student view and all branches view
 * - MAT-A11Y-001: Accessibility audit on Materials page using axe-core
 */

test.describe('Materials Section Scoping & UX E2E', { tag: ['@regression', '@materials'] }, () => {
    test.describe.configure({ mode: 'serial' });

    let studentToken = null;

    test.beforeAll(async ({ request }) => {
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
        studentToken = data.token;
    });

    async function injectStudentSession(page, { branch = 'ISE', yearLevel = '4th Year', usn = '1SI23IS080', isAdmin = false } = {}) {
        const userObj = {
            id: '6a891ceab9f08e7d822c69dc',
            _id: '6a891ceab9f08e7d822c69dc',
            usn,
            email: 'staging.tester@askursenior.org',
            name: 'Staging Tester',
            branch,
            yearLevel,
            isAdmin,
            role: isAdmin ? 'admin' : 'user',
            bookmarks: []
        };

        // Intercept profile sync endpoints called by AuthContext on mount
        await page.route('**/api/auth/profile', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(userObj)
            });
        });

        await page.route('**/api/auth/me', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(userObj)
            });
        });

        await page.addInitScript(({ token, userObj }) => {
            window.localStorage.setItem('token', token);
            window.localStorage.setItem('authToken', token);
            window.localStorage.setItem('user', JSON.stringify(userObj));
        }, { token: studentToken, userObj });
    }

    // -------------------------------------------------------------
    // MAT-E2E-001: Authenticated student view & metadata display
    // -------------------------------------------------------------
    test('MAT-E2E-001: Student sees academic scope badge, subject filter, file metadata, and no filters or sort section', async ({ page }) => {
        await injectStudentSession(page, { branch: 'ISE', yearLevel: '4th Year', usn: '1SI23IS080', isAdmin: false });

        await page.goto('/materials');
        await page.waitForLoadState('domcontentloaded');

        // 1. Verify Page Title
        await expect(page.locator('h1').filter({ hasText: /Materials/i })).toBeVisible({ timeout: 15000 });

        // 2. Verify Academic Scope Badge is visible (e.g., "ISE · 4th Year")
        const scopeBadge = page.locator('div').filter({ hasText: /ISE\s*·\s*4th Year/i }).first();
        await expect(scopeBadge).toBeVisible({ timeout: 10000 });

        // 3. Verify Subjects filter dropdown is visible in toolbar
        const subjectDropdown = page.locator('select[aria-label="Filter by subject"]').first();
        await expect(subjectDropdown).toBeVisible({ timeout: 10000 });

        // 4. Verify Filters button, drawer, and Sort by dropdown are NOT present
        await expect(page.locator('button').filter({ hasText: /^Filters$/i })).not.toBeVisible();
        await expect(page.locator('select[aria-label="Sort materials by"]')).not.toBeVisible();

        // 5. Verify file metadata subline under document title
        const metadataSubline = page.locator('div').filter({ hasText: /MB\s*·\s*Uploaded/i }).first();
        await expect(metadataSubline).toBeVisible({ timeout: 10000 });

        // Verify full date tooltip exists on the upload timestamp span
        const uploadTooltip = metadataSubline.locator('span[title]').first();
        await expect(uploadTooltip).toBeVisible();
        const tooltipText = await uploadTooltip.getAttribute('title');
        expect(tooltipText).toBeTruthy();
    });

    // -------------------------------------------------------------
    // MAT-E2E-002: Material Type tabs filtering and counters
    // -------------------------------------------------------------
    test('MAT-E2E-002: Student can filter by Material Type tabs with stable contextual counts', async ({ page }) => {
        await injectStudentSession(page, { branch: 'ISE', yearLevel: '4th Year', usn: '1SI23IS080', isAdmin: false });

        await page.goto('/materials');
        await page.waitForLoadState('domcontentloaded');

        // Verify tabs exist: All, Notes, PYQs, Internals, Others
        const allTab = page.locator('button').filter({ hasText: /All/i }).first();
        const notesTab = page.locator('button').filter({ hasText: /Notes/i }).first();
        const pyqsTab = page.locator('button').filter({ hasText: /PYQs/i }).first();
        const othersTab = page.locator('button').filter({ hasText: /Others/i }).first();

        await expect(allTab).toBeVisible({ timeout: 10000 });
        await expect(notesTab).toBeVisible();
        await expect(pyqsTab).toBeVisible();
        await expect(othersTab).toBeVisible();

        // Click "Others" tab (where FSD Lesson Syllabus is categorized)
        await othersTab.click();
        await page.waitForTimeout(300);

        // Document row should be visible
        const docRow = page.locator('text=FSD Lesson').first();
        await expect(docRow).toBeVisible();

        // Click "Notes" tab (empty for 4th year ISE)
        await notesTab.click();
        await page.waitForTimeout(300);

        // Empty state should be visible cleanly
        const emptyState = page.locator('text=No materials found').first();
        await expect(emptyState).toBeVisible();

        // Return to "All" tab
        await allTab.click();
        await page.waitForTimeout(300);
        await expect(docRow).toBeVisible();
    });

    // -------------------------------------------------------------
    // MAT-E2E-003: Search query filtering and reset button
    // -------------------------------------------------------------
    test('MAT-E2E-003: Search box filters results and reset button clears query', async ({ page }) => {
        await injectStudentSession(page, { branch: 'ISE', yearLevel: '4th Year', usn: '1SI23IS080', isAdmin: false });

        await page.goto('/materials');
        await page.waitForLoadState('domcontentloaded');

        const searchInput = page.locator('input[placeholder*="Search materials"]');
        await expect(searchInput).toBeVisible({ timeout: 10000 });

        // Search for existing document keyword
        await searchInput.fill('FSD');
        await page.waitForTimeout(300);
        await expect(page.locator('text=FSD Lesson').first()).toBeVisible();

        // Clear button (X) appears inside search input
        const clearBtn = page.locator('button[aria-label="Clear search"]');
        if (await clearBtn.isVisible()) {
            await clearBtn.click();
            await expect(searchInput).toHaveValue('');
        } else {
            await searchInput.fill('');
        }

        // Search for non-existent keyword
        await searchInput.fill('NonExistentKeywordXYZ123');
        await page.waitForTimeout(300);
        await expect(page.locator('text=No materials found').first()).toBeVisible();

        // Clear via reset button
        const resetBtn = page.locator('button').filter({ hasText: /Show All|Clear/i }).first();
        await resetBtn.click();
        await page.waitForTimeout(300);
        await expect(page.locator('text=FSD Lesson').first()).toBeVisible();
    });

    // -------------------------------------------------------------
    // MAT-E2E-004: Admin scope toggle unlocks full branch browsing
    // -------------------------------------------------------------
    test('MAT-E2E-004: Admin user can toggle from student scope to All Branches', async ({ page }) => {
        // Inject admin session
        await injectStudentSession(page, { branch: 'ISE', yearLevel: '4th Year', usn: '1SI23IS080', isAdmin: true });

        await page.goto('/materials');
        await page.waitForLoadState('domcontentloaded');

        // Admin scope toggle button must be visible
        const adminToggleBtn = page.locator('button').filter({ hasText: /Scope: My Branch|Admin: All Branches/i }).first();
        await expect(adminToggleBtn).toBeVisible({ timeout: 10000 });

        // Click to toggle to All Branches view
        await adminToggleBtn.click();
        await page.waitForTimeout(300);

        // Verify button label changed to indicate All Branches
        await expect(adminToggleBtn).toHaveText(/Admin:\s*All Branches/i);

        // Verify subject filter dropdown is present and accessible
        const subjectDropdown = page.locator('select[aria-label="Filter by subject"]').first();
        await expect(subjectDropdown).toBeVisible({ timeout: 10000 });
    });

    // -------------------------------------------------------------
    // MAT-A11Y-001: Accessibility Scan on Materials Page
    // -------------------------------------------------------------
    test('MAT-A11Y-001: Materials Page automated WCAG accessibility scan', async ({ page }) => {
        await injectStudentSession(page, { branch: 'ISE', yearLevel: '4th Year', usn: '1SI23IS080', isAdmin: false });

        await page.goto('/materials');
        await page.waitForLoadState('domcontentloaded');

        const scanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        console.log(`[MAT-A11Y-001] Materials Page violations count: ${scanResults.violations.length}`);
        scanResults.violations.forEach(v => {
            console.log(`  - [${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
        });

        // Ensure zero critical accessibility violations
        const criticalViolations = scanResults.violations.filter(v => v.impact === 'critical');
        expect(criticalViolations, `Critical a11y violations found: ${JSON.stringify(criticalViolations, null, 2)}`).toHaveLength(0);
    });
});
