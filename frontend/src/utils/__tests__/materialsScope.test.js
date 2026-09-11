import { describe, it, expect } from 'vitest';
import {
    formatSize,
    getTimeAgo,
    formatFullDate,
    isBranchMatch,
    isYearMatch,
    deriveStudentScope
} from '../askUtils.js';

describe('Materials Section - Unit Tests', () => {

    // -------------------------------------------------------------
    // MAT-UNIT-001: Relative Upload Time Formatting
    // -------------------------------------------------------------
    describe('MAT-UNIT-001: getTimeAgo relative time formatting', () => {
        it('handles null, undefined, or invalid dates with fallback', () => {
            expect(getTimeAgo(null)).toBe('Recently');
            expect(getTimeAgo(undefined)).toBe('Recently');
            expect(getTimeAgo('invalid-date-string')).toBe('Recently');
        });

        it('returns "Just now" for timestamps within 60 seconds or future drift', () => {
            const now = new Date();
            expect(getTimeAgo(now)).toBe('Just now');

            const tenSecAgo = new Date(Date.now() - 10 * 1000);
            expect(getTimeAgo(tenSecAgo)).toBe('Just now');

            const futureDate = new Date(Date.now() + 5000);
            expect(getTimeAgo(futureDate)).toBe('Just now');
        });

        it('returns correct minute phrasing with singular and plural boundaries', () => {
            const oneMinAgo = new Date(Date.now() - 65 * 1000);
            expect(getTimeAgo(oneMinAgo)).toBe('1 minute ago');

            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
            expect(getTimeAgo(fiveMinsAgo)).toBe('5 minutes ago');

            const fiftyNineMinsAgo = new Date(Date.now() - 59 * 60 * 1000);
            expect(getTimeAgo(fiftyNineMinsAgo)).toBe('59 minutes ago');
        });

        it('returns correct hour phrasing with singular and plural boundaries', () => {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            expect(getTimeAgo(oneHourAgo)).toBe('1 hour ago');

            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            expect(getTimeAgo(twoHoursAgo)).toBe('2 hours ago');

            const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000);
            expect(getTimeAgo(twentyThreeHoursAgo)).toBe('23 hours ago');
        });

        it('returns correct day phrasing with singular and plural boundaries', () => {
            const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
            expect(getTimeAgo(oneDayAgo)).toBe('1 day ago');

            const twoDaysAgo = new Date(Date.now() - 49 * 60 * 60 * 1000);
            expect(getTimeAgo(twoDaysAgo)).toBe('2 days ago');

            const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
            expect(getTimeAgo(twentyNineDaysAgo)).toBe('29 days ago');
        });

        it('returns correct month and year phrasing', () => {
            const thirtyFiveDaysAgo = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
            expect(getTimeAgo(thirtyFiveDaysAgo)).toBe('1 month ago');

            const sixtyFiveDaysAgo = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000);
            expect(getTimeAgo(sixtyFiveDaysAgo)).toBe('2 months ago');

            const oneYearAgo = new Date(Date.now() - 370 * 24 * 60 * 60 * 1000);
            expect(getTimeAgo(oneYearAgo)).toBe('1 year ago');

            const twoYearsAgo = new Date(Date.now() - 740 * 24 * 60 * 60 * 1000);
            expect(getTimeAgo(twoYearsAgo)).toBe('2 years ago');
        });

        it('formatFullDate outputs clean human date for tooltips', () => {
            expect(formatFullDate(null)).toBe('');
            expect(formatFullDate(undefined)).toBe('');
            expect(formatFullDate('2026-09-08T18:21:49.970Z')).toContain('Sep 8, 2026');
        });
    });

    // -------------------------------------------------------------
    // MAT-UNIT-002: File Size Formatting
    // -------------------------------------------------------------
    describe('MAT-UNIT-002: formatSize byte conversion', () => {
        it('handles boundary and falsy inputs cleanly', () => {
            expect(formatSize(0)).toBe('0.00 MB');
            expect(formatSize(null)).toBe('0.00 MB');
            expect(formatSize(undefined)).toBe('0.00 MB');
            expect(formatSize(-500)).toBe('0.00 MB');
            expect(formatSize('not-a-number')).toBe('0.00 MB');
        });

        it('formats sub-megabyte and multi-megabyte values accurately', () => {
            // 384075 bytes = 0.37 MB
            expect(formatSize(384075)).toBe('0.37 MB');
            // 1 MB = 1048576 bytes
            expect(formatSize(1048576)).toBe('1.00 MB');
            // 2.5 MB = 2621440 bytes
            expect(formatSize(2621440)).toBe('2.50 MB');
            // 15 MB = 15728640 bytes
            expect(formatSize(15728640)).toBe('15.00 MB');
        });
    });

    // -------------------------------------------------------------
    // MAT-UNIT-003: Year Matching Logic
    // -------------------------------------------------------------
    describe('MAT-UNIT-003: isYearMatch academic year vs semester mapping', () => {
        it('returns true when targetYear is empty or falsy', () => {
            expect(isYearMatch({ yearLevel: '4th Year' }, '')).toBe(true);
            expect(isYearMatch({ yearLevel: '4th Year' }, null)).toBe(true);
        });

        it('matches exact yearLevel', () => {
            expect(isYearMatch({ yearLevel: '4th Year' }, '4th Year')).toBe(true);
            expect(isYearMatch({ yearLevel: '3rd Year' }, '3rd Year')).toBe(true);
            expect(isYearMatch({ yearLevel: '2nd Year' }, '2nd Year')).toBe(true);
            expect(isYearMatch({ yearLevel: '1st Year' }, '1st Year')).toBe(true);

            expect(isYearMatch({ yearLevel: '3rd Year' }, '4th Year')).toBe(false);
            expect(isYearMatch({ yearLevel: '2nd Year' }, '4th Year')).toBe(false);
        });

        it('correctly parses semester field containing "year" without conflating with sem number', () => {
            // Document has semester: "4th Year" -> MUST NOT be parsed as 4th semester (2nd Year)
            const doc = { semester: '4th Year', yearLevel: '' };
            expect(isYearMatch(doc, '4th Year')).toBe(true);
            expect(isYearMatch(doc, '2nd Year')).toBe(false);
            expect(isYearMatch(doc, '3rd Year')).toBe(false);
        });

        it('maps semesters 1-2 to 1st Year', () => {
            expect(isYearMatch({ semester: '1st Sem' }, '1st Year')).toBe(true);
            expect(isYearMatch({ semester: '2nd Sem' }, '1st Year')).toBe(true);
            expect(isYearMatch({ semester: '1st Sem' }, '2nd Year')).toBe(false);
        });

        it('maps semesters 3-4 to 2nd Year', () => {
            expect(isYearMatch({ semester: '3rd sem' }, '2nd Year')).toBe(true);
            expect(isYearMatch({ semester: '4th sem' }, '2nd Year')).toBe(true);
            expect(isYearMatch({ semester: '4th sem' }, '4th Year')).toBe(false);
        });

        it('maps semesters 5-6 to 3rd Year', () => {
            expect(isYearMatch({ semester: '5th sem' }, '3rd Year')).toBe(true);
            expect(isYearMatch({ semester: '6th sem' }, '3rd Year')).toBe(true);
            expect(isYearMatch({ semester: '5th sem' }, '4th Year')).toBe(false);
        });

        it('maps semesters 7-8 to 4th Year', () => {
            expect(isYearMatch({ semester: '7th sem' }, '4th Year')).toBe(true);
            expect(isYearMatch({ semester: '8th sem' }, '4th Year')).toBe(true);
            expect(isYearMatch({ semester: '7th sem' }, '3rd Year')).toBe(false);
        });
    });

    // -------------------------------------------------------------
    // MAT-UNIT-004: Branch Matching Logic
    // -------------------------------------------------------------
    describe('MAT-UNIT-004: isBranchMatch branch isolation', () => {
        it('returns true when targetBranch is ALL or empty', () => {
            expect(isBranchMatch('CSE', 'ALL')).toBe(true);
            expect(isBranchMatch('ISE', '')).toBe(true);
            expect(isBranchMatch('COMMON', null)).toBe(true);
        });

        it('allows all materials for 1st Year students (common courses across college)', () => {
            expect(isBranchMatch('COMMON', 'ISE', '1st Year')).toBe(true);
            expect(isBranchMatch('CSE', 'ISE', '1st Year')).toBe(true);
            expect(isBranchMatch('MECH', 'ISE', '1st Year')).toBe(true);
        });

        it('strictly matches matching branch or Common for higher years', () => {
            // ISE student in 4th Year
            expect(isBranchMatch('ISE', 'ISE', '4th Year')).toBe(true);
            expect(isBranchMatch('IS', 'ISE', '4th Year')).toBe(true);
            expect(isBranchMatch('Common', 'ISE', '4th Year')).toBe(true);
            expect(isBranchMatch('COMMON', 'ISE', '4th Year')).toBe(true);
            expect(isBranchMatch('ALL', 'ISE', '4th Year')).toBe(true);

            // Other branches must be excluded
            expect(isBranchMatch('CSE', 'ISE', '4th Year')).toBe(false);
            expect(isBranchMatch('CS', 'ISE', '4th Year')).toBe(false);
            expect(isBranchMatch('BT', 'ISE', '4th Year')).toBe(false);
            expect(isBranchMatch('EEE', 'ISE', '4th Year')).toBe(false);
            expect(isBranchMatch('MECH', 'ISE', '4th Year')).toBe(false);
            expect(isBranchMatch('', 'ISE', '4th Year')).toBe(false);
            expect(isBranchMatch(null, 'ISE', '4th Year')).toBe(false);
        });
    });

    // -------------------------------------------------------------
    // MAT-UNIT-005: Student Academic Scope Derivation
    // -------------------------------------------------------------
    describe('MAT-UNIT-005: deriveStudentScope profile resolution', () => {
        it('returns unscoped state for falsy user', () => {
            expect(deriveStudentScope(null)).toEqual({ branch: '', yearLevel: '', isScoped: false });
            expect(deriveStudentScope(undefined)).toEqual({ branch: '', yearLevel: '', isScoped: false });
        });

        it('derives branch and year from explicit user fields', () => {
            const user = {
                branch: 'IS',
                yearLevel: '4th Year'
            };
            const scope = deriveStudentScope(user);
            expect(scope.branch).toBe('ISE');
            expect(scope.yearLevel).toBe('4th Year');
            expect(scope.isScoped).toBe(true);
        });

        it('derives branch from USN when user.branch is missing', () => {
            const user = {
                usn: '1SI23IS080',
                semester: 7
            };
            const scope = deriveStudentScope(user);
            expect(scope.branch).toBe('ISE');
            expect(scope.yearLevel).toBe('4th Year');
            expect(scope.isScoped).toBe(true);
        });

        it('derives yearLevel from semester when yearLevel is missing', () => {
            expect(deriveStudentScope({ branch: 'CS', semester: 1 }).yearLevel).toBe('1st Year');
            expect(deriveStudentScope({ branch: 'CS', semester: 3 }).yearLevel).toBe('2nd Year');
            expect(deriveStudentScope({ branch: 'CS', semester: 5 }).yearLevel).toBe('3rd Year');
            expect(deriveStudentScope({ branch: 'CS', semester: 8 }).yearLevel).toBe('4th Year');
        });

        it('derives yearLevel from USN admission year if semester is also missing', () => {
            // USN 1SI23... in 2026 -> 3 years -> 4th Year
            const user = {
                usn: '1SI23IS080'
            };
            const scope = deriveStudentScope(user);
            expect(scope.branch).toBe('ISE');
            expect(scope.yearLevel).toBe('4th Year');
            expect(scope.isScoped).toBe(true);
        });
    });
});
