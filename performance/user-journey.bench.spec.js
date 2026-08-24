import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const journeyTimings = [];

const formatDuration = (ms) => `${(ms / 1000).toFixed(2)}s (${Math.round(ms)}ms)`;

const getTier = (ms) => {
  if (ms < 500) return '🟢 Excellent (<500ms)';
  if (ms < 1000) return '🟢 Good (<1s)';
  if (ms <= 2000) return '🟡 Acceptable (1-2s)';
  return '🔴 Needs work (>2s)';
};

test.describe('⚡ User-Perceived Journey Performance Benchmarks', () => {
  test.beforeEach(async ({ page }) => {
    // Mock S3 fallback for preview/download stability while measuring full UI render & DOM times
    await page.route('**/api/documents/*/preview-url', async (route) => {
      const json = { previewUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', title: 'Sample Preview Document' };
      await route.fulfill({ json, status: 200 });
    });

    await page.route('**/api/documents/*/download', async (route) => {
      const json = { downloadUrl: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf' };
      await route.fulfill({ json, status: 200 });
    });
  });

  test('Benchmark 1: First Year Complete Journey (Plus -> Year Card -> Subjects -> Materials -> Preview)', async ({ page }) => {
    const journeyStart = performance.now();

    // 1. Navigate to Plus Dashboard
    const navStart = performance.now();
    await page.goto('/plus');
    await page.waitForLoadState('domcontentloaded');

    // 2. Year Cards Visible & Stats Loaded
    const firstYearCard = page.locator('text=FIRST YEAR').or(page.locator('text=First Year')).first();
    await expect(firstYearCard).toBeVisible({ timeout: 15000 });
    const dashboardVisibleTime = performance.now() - navStart;

    // 3. Click First Year Card -> Sidebar Loaded
    const clickStart = performance.now();
    await firstYearCard.click();
    const searchInput = page.locator('input[placeholder*="Search subjects"]').first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    const sidebarPopulatedTime = performance.now() - clickStart;

    // 4. Search Subject & Select
    const searchStart = performance.now();
    await searchInput.fill('Python');
    const pythonBtn = page.locator('button').filter({ hasText: /Python Programming/i }).first();
    await expect(pythonBtn).toBeVisible({ timeout: 10000 });
    await pythonBtn.click();

    // 5. Materials Grid Visible
    const previewBtn = page.locator('button').filter({ hasText: /Preview/i }).first();
    await expect(previewBtn).toBeVisible({ timeout: 15000 });
    const materialsRenderTime = performance.now() - searchStart;

    // 6. Preview Modal Opened
    const previewStart = performance.now();
    await previewBtn.click();
    const modal = page.locator('iframe, div[class*="modal"], div[role="dialog"], button:has-text("✕")').first();
    await expect(modal).toBeVisible({ timeout: 10000 });
    const previewOpenTime = performance.now() - previewStart;

    await page.keyboard.press('Escape');

    const totalJourneyTime = performance.now() - journeyStart;

    journeyTimings.push({
      journey: 'First Year Complete Journey',
      totalTimeMs: totalJourneyTime,
      breakdown: {
        'Dashboard & Cards Render': dashboardVisibleTime,
        'Sidebar Population': sidebarPopulatedTime,
        'Search & Materials Render': materialsRenderTime,
        'PDF Preview Open': previewOpenTime,
      },
      tier: getTier(totalJourneyTime),
    });
  });

  test('Benchmark 2: Second Year Journey (Plus -> Second Year -> Subjects -> Materials)', async ({ page }) => {
    const start = performance.now();

    await page.goto('/plus/second-year');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input[placeholder*="Search subjects"]').first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    const anySubject = page.locator('button').filter({ hasText: /Engineering|Mathematics|Circuits|Data|Biology|Algorithms/i }).first();
    await expect(anySubject).toBeVisible({ timeout: 15000 });

    const totalTime = performance.now() - start;
    journeyTimings.push({
      journey: 'Second Year Journey',
      totalTimeMs: totalTime,
      breakdown: {
        'Sidebar & Subjects Render': totalTime,
      },
      tier: getTier(totalTime),
    });
  });

  test('Benchmark 3: Third Year Journey (Plus -> Third Year -> Subjects -> Materials)', async ({ page }) => {
    const start = performance.now();

    await page.goto('/plus/third-year');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input[placeholder*="Search subjects"]').first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    const subjectBtn = page.locator('button').filter({ hasText: /Software|Artificial|Database|Design|Communication/i }).first();
    await expect(subjectBtn).toBeVisible({ timeout: 15000 });

    const totalTime = performance.now() - start;
    journeyTimings.push({
      journey: 'Third Year Journey',
      totalTimeMs: totalTime,
      breakdown: {
        'Sidebar & Subjects Render': totalTime,
      },
      tier: getTier(totalTime),
    });
  });

  test('Benchmark 4: Fourth Year Journey (Plus -> Fourth Year Empty/Coming Soon)', async ({ page }) => {
    const start = performance.now();

    await page.goto('/plus/fourth-year');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input[placeholder*="Search subjects"]').first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    const totalTime = performance.now() - start;
    journeyTimings.push({
      journey: 'Fourth Year (Coming Soon)',
      totalTimeMs: totalTime,
      breakdown: {
        'Page & Placeholder Render': totalTime,
      },
      tier: getTier(totalTime),
    });
  });

  test.afterAll(() => {
    console.log('\n===============================================================');
    console.log('   ⏱️ USER-PERCEIVED PERFORMANCE JOURNEY BENCHMARKS           ');
    console.log('===============================================================\n');

    console.table(journeyTimings.map((j) => ({
      'User Journey': j.journey,
      'Total Perceived Time': formatDuration(j.totalTimeMs),
      'Engineering Target': j.tier,
    })));

    let md = '# User-Perceived Journey Benchmark Report\n\n';
    md += `**Timestamp:** ${new Date().toISOString()}\n\n`;
    md += '| User Journey | Total Perceived Time | Target Status |\n';
    md += '| :--- | :---: | :--- |\n';

    journeyTimings.forEach((j) => {
      md += `| **${j.journey}** | **${(j.totalTimeMs / 1000).toFixed(2)}s** (${Math.round(j.totalTimeMs)}ms) | ${j.tier} |\n`;
    });

    md += '\n### Step Breakdown\n';
    journeyTimings.forEach((j) => {
      md += `\n**${j.journey}:**\n`;
      Object.entries(j.breakdown).forEach(([step, ms]) => {
        md += `- ${step}: \`${Math.round(ms)} ms\`\n`;
      });
    });

    const reportPath = path.resolve('performance/reports/user-journey-benchmark-report.md');
    fs.writeFileSync(reportPath, md, 'utf8');
    console.log(`\nReport successfully saved to: ${reportPath}\n`);
  });
});
