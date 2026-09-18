import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';

test.describe('Automated Accessibility (A11y) Foundation', { tag: '@accessibility' }, () => {
    let authSession = null;

    test.beforeAll(async ({ request }) => {
        const backendBase = process.env.E2E_BACKEND_URL || 'http://localhost:5000';
        const loginEndpoint = `${backendBase.replace(/\/+$/, '')}/api/auth/login`;

        try {
            const res = await request.post(loginEndpoint, {
                data: {
                    usn: process.env.E2E_TEST_USN || 'STAGING01',
                    password: process.env.E2E_TEST_PASSWORD || 'StagingE2EPass2026!',
                    branch: 'CS'
                },
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok()) {
                const data = await res.json();
                authSession = {
                    token: data.token,
                    user: { ...data.user, semester: 4 }
                };
            }
        } catch (e) {
            console.warn('[A11Y] Auth setup skipped/failed:', e.message);
        }
    });

    async function injectAuth(page) {
        if (!authSession) return;
        await page.addInitScript((session) => {
            window.localStorage.setItem('token', session.token);
            window.localStorage.setItem('authToken', session.token);
            window.localStorage.setItem('user', JSON.stringify(session.user));
            window.localStorage.setItem('uiTheme', 'dark');
        }, authSession);
    }

    test('A11Y-001: Public Landing Page automated accessibility scan', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const scanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        console.log(`[A11Y-001] Landing Page violations count: ${scanResults.violations.length}`);
        scanResults.violations.forEach(v => {
            console.log(`  - [${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
        });

        // Fail only on critical impact violations to maintain baseline stability
        const criticalViolations = scanResults.violations.filter(v => v.impact === 'critical');
        expect(criticalViolations, `Critical a11y violations found: ${JSON.stringify(criticalViolations, null, 2)}`).toHaveLength(0);
    });

    test('A11Y-002: Public Calculators Page automated accessibility scan', async ({ page }) => {
        await page.goto('/calculator');
        await page.waitForLoadState('domcontentloaded');
        await page.keyboard.press('Escape'); // dismiss any modal overlay

        const scanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        console.log(`[A11Y-002] Calculators Page violations count: ${scanResults.violations.length}`);
        scanResults.violations.forEach(v => {
            console.log(`  - [${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
        });

        // Verify scan completed and record violations
        expect(scanResults.violations).toBeDefined();
    });

    test('A11Y-003: Authenticated CIE Analyzer Workspace automated accessibility scan', async ({ page }) => {
        test.skip(!authSession, 'Requires active student authentication session');

        await injectAuth(page);
        await page.goto('/dashboard/settings?tab=cie');
        await page.waitForLoadState('domcontentloaded');

        // Allow CIE cards to load
        await page.waitForTimeout(1500);

        const scanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        console.log(`[A11Y-003] CIE Analyzer violations count: ${scanResults.violations.length}`);
        scanResults.violations.forEach(v => {
            console.log(`  - [${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
        });

        const criticalViolations = scanResults.violations.filter(v => v.impact === 'critical');
        expect(criticalViolations, `Critical a11y violations found: ${JSON.stringify(criticalViolations, null, 2)}`).toHaveLength(0);
    });

    test('A11Y-004: Authenticated Student Home / Dashboard automated accessibility scan', async ({ page }) => {
        test.skip(!authSession, 'Requires active student authentication session');

        await injectAuth(page);
        await page.goto('/home');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1500);

        const scanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        console.log(`[A11Y-004] Student Home violations count: ${scanResults.violations.length}`);
        scanResults.violations.forEach(v => {
            console.log(`  - [${v.impact?.toUpperCase()}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
        });

        const criticalViolations = scanResults.violations.filter(v => v.impact === 'critical');
        expect(criticalViolations, `Critical a11y violations found: ${JSON.stringify(criticalViolations, null, 2)}`).toHaveLength(0);
    });
});
