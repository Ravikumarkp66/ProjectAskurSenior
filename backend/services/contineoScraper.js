const { chromium } = require('playwright');

class ScraperError extends Error {
    constructor(statusCode, userMessage) {
        super(userMessage);
        this.statusCode = statusCode;
        this.userMessage = userMessage;
    }
}

async function fetchOfficialResult({ usn, dobDay, dobMonth, dobYear }) {
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        context.setDefaultTimeout(30000); // 30 seconds default timeout
        const page = await context.newPage();

        try {
            await page.goto('https://sims.sit.ac.in/parents/');
        } catch (e) {
            throw new ScraperError(503, "Official result could not be fetched right now. Please try again later.");
        }

        await page.fill('#username', usn);
        await page.selectOption('#dd', dobDay);
        await page.selectOption('#mm', dobMonth);
        await page.selectOption('#yyyy', dobYear);

        // Wait briefly for the portal's putdate() JS to execute
        await page.waitForTimeout(500);

        try {
            await Promise.all([
                page.waitForNavigation(),
                page.click('input[type="submit"]')
            ]);
        } catch (e) {
            throw new ScraperError(503, "Official result could not be fetched right now. Please try again later.");
        }

        // Detect login failure: if the login form is still present, credentials were wrong
        const loginFormStillPresent = await page.$('#username');
        if (loginFormStillPresent) {
            throw new ScraperError(422, "Unable to log in. Please check your USN and date of birth.");
        }

        // Click Exam History
        try {
            await Promise.all([
                page.waitForNavigation(),
                page.click('a[href*="com_history"]')
            ]);
        } catch (e) {
            throw new ScraperError(404, "We couldn't find exam history on the portal. Please try again later.");
        }

        // Wait for exam result elements
        try {
            await page.waitForSelector('table.res-table, caption, .result-table', { timeout: 15000 });
        } catch (e) {
            throw new ScraperError(404, "We couldn't find a published result for your account yet.");
        }

        // Give any remaining scripts a brief moment to render tables
        await page.waitForTimeout(1000);

        // Find all captions first
        const captions = await page.$$('caption');
        console.log(`[OfficialResult] Found ${captions.length} caption(s)`);

        let targetText = '';

        if (captions.length > 0) {
            // Find the last caption that contains SGPA
            for (let i = captions.length - 1; i >= 0; i--) {
                const text = await captions[i].evaluate(el => el.textContent || '');
                if (/SGPA/i.test(text)) {
                    targetText = text;
                    break;
                }
            }
        }

        // Fallback to searching all table.res-table if captions didn't yield
        if (!targetText) {
            const resTables = await page.$$('.res-table');
            console.log(`[OfficialResult] Found ${resTables.length} .res-table element(s)`);
            for (let i = resTables.length - 1; i >= 0; i--) {
                const text = await resTables[i].evaluate(el => el.textContent || '');
                if (/SGPA/i.test(text)) {
                    targetText = text;
                    break;
                }
            }
        }

        // Final fallback to page text
        if (!targetText) {
            const pageText = await page.evaluate(() => document.body.innerText || '');
            if (/SGPA/i.test(pageText) && /CGPA/i.test(pageText)) {
                targetText = pageText;
            }
        }

        console.log(`[OfficialResult] Target text for extraction: "${targetText.replace(/\s+/g, ' ').trim().substring(0, 300)}"`);

        // Extract SGPA & CGPA
        // Can be "SGPA: 8" or "SGPA: 7.18" or "SGPA:  9.1"
        const sgpaMatches = [...targetText.matchAll(/SGPA\s*[:\-]?\s*([\d.]+)/gi)];
        const cgpaMatches = [...targetText.matchAll(/CGPA\s*[:\-]?\s*([\d.]+)/gi)];

        if (sgpaMatches.length === 0 || cgpaMatches.length === 0) {
            console.log(`[OfficialResult] Extraction failed. SGPA matches: ${sgpaMatches.length}, CGPA matches: ${cgpaMatches.length}`);
            throw new ScraperError(502, "Official result format has changed. Please try again later.");
        }

        // Take the last match in target text (or corresponding match)
        const lastSgpaMatch = sgpaMatches[sgpaMatches.length - 1];
        const lastCgpaMatch = cgpaMatches[cgpaMatches.length - 1];

        const latestSGPA = parseFloat(lastSgpaMatch[1]);
        const currentCGPA = parseFloat(lastCgpaMatch[1]);

        // Extract semester label (e.g. "EVEN 2025-26" or "ODD 2024-25")
        let semesterLabel = "Latest Semester";
        const semLabelMatch = targetText.match(/(ODD|EVEN|SUMMER)\s*\d{4}-\d{2}/i);
        if (semLabelMatch) {
            semesterLabel = semLabelMatch[0].trim();
        } else {
            const preSgpa = targetText.split(/SGPA/i)[0];
            const cleaned = preSgpa.replace(/Credits\s*(Registered|Earned)\s*:\s*\d+/gi, '').replace(/\s+/g, ' ').trim();
            if (cleaned.length > 0 && cleaned.length < 50) {
                semesterLabel = cleaned;
            }
        }

        console.log(`[OfficialResult] Successfully extracted — SGPA: ${latestSGPA}, CGPA: ${currentCGPA}, Semester: ${semesterLabel}`);

        return {
            success: true,
            latestSGPA,
            currentCGPA,
            sgpa: latestSGPA,
            cgpa: currentCGPA,
            semesterLabel,
            fetchedAt: new Date().toISOString()
        };

    } catch (error) {
        if (error instanceof ScraperError) {
            throw error;
        }
        throw new ScraperError(500, "Something went wrong while fetching your result. Please try again.");
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = {
    fetchOfficialResult
};
