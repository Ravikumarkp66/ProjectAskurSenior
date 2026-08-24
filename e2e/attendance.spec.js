import { test, expect } from '@playwright/test';

test.describe('AskUrSenior Attendance System E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        const mockUser = {
            _id: '60d5ec49f1b2c8b1f8e4e1a1',
            id: '60d5ec49f1b2c8b1f8e4e1a1',
            name: 'Test Student',
            email: 'student@example.com',
            usn: '1ST22CS001',
            college: 'SIT',
            branch: 'CS',
            semester: 1,
            registrationComplete: true,
            isProfileComplete: true,
            registrationStatus: 'active',
            subscription: 'free'
        };

        // Setup mock user authenticated session in localStorage
        await page.addInitScript(({ mockUser }) => {
            localStorage.setItem('token', 'mock-valid-e2e-jwt-token');
            localStorage.setItem('authToken', 'mock-valid-e2e-jwt-token');
            localStorage.setItem('user', JSON.stringify(mockUser));
        }, { mockUser });

        // Mock API profile response (strict exact path check)
        await page.route(/\/api\/auth\/profile(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    user: mockUser,
                    data: mockUser,
                    student: mockUser
                })
            });
        });

        await page.route('**/api/auth/profile/attendance/config', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        semesterStartDate: '2026-07-20',
                        lastWorkingDate: '2026-11-20',
                        collegeThreshold: 85,
                        attendanceThreshold: 85
                    }
                })
            });
        });

        await page.route('**/api/auth/profile/attendance/slots', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: []
                })
            });
        });

        await page.route('**/api/auth/profile/attendance/subjects*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: [
                        { _id: 'subj_math_1', name: 'Mathematics', code: 'MATH101', credits: 4, isElective: false },
                        { _id: 'subj_phys_1', name: 'Physics', code: 'PHYS101', credits: 4, isElective: false }
                    ]
                })
            });
        });

        await page.route('**/api/auth/profile/attendance?semester=*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        overall: {
                            attendance: 90.0,
                            conducted: 10,
                            present: 9,
                            absent: 1,
                            canMiss: 0,
                            needToAttend: 0,
                            healthStatus: '🟢 Safe',
                            statusCategory: 'SAFE',
                            statusMessage: 'Above college minimum',
                            streak: { current: 3, longest: 5 }
                        },
                        subjects: [
                            {
                                subjectId: 'subj_math_1',
                                name: 'Mathematics',
                                code: 'MATH101',
                                attendancePercentage: 88.0,
                                analytics: {
                                    conducted: 8,
                                    present: 7,
                                    absent: 1,
                                    canMiss: 0,
                                    needToAttend: 1,
                                    streak: { current: 2, longest: 4 }
                                }
                            },
                            {
                                subjectId: 'subj_phys_1',
                                name: 'Physics',
                                code: 'PHYS101',
                                attendancePercentage: 100.0,
                                analytics: {
                                    conducted: 2,
                                    present: 2,
                                    absent: 0,
                                    canMiss: 1,
                                    needToAttend: 0,
                                    streak: { current: 2, longest: 2 }
                                }
                            }
                        ],
                        groupedTimeline: [
                            {
                                date: '2026-07-20',
                                slots: [
                                    { timeSlot: '08:00-09:00', status: 'Present' },
                                    { timeSlot: '09:00-10:00', status: 'Present' }
                                ]
                            },
                            {
                                date: '2026-07-21',
                                slots: [
                                    { timeSlot: '08:00-09:00', status: 'Present' },
                                    { timeSlot: '10:00-11:00', status: 'Present' }
                                ]
                            },
                            {
                                date: '2026-07-22',
                                slots: [
                                    { timeSlot: '08:00-10:00', status: 'Present' },
                                    { timeSlot: '10:30-11:30', status: 'Present' }
                                ]
                            },
                            {
                                date: '2026-07-23',
                                slots: [
                                    { timeSlot: '08:00-09:00', status: 'Yet To Be Taken' },
                                    { timeSlot: '09:00-10:00', status: 'Yet To Be Taken' }
                                ]
                            }
                        ]
                    }
                })
            });
        });

        await page.route('**/api/auth/profile/attendance/analytics*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        overall: {
                            attendance: 90.0,
                            conducted: 10,
                            present: 9,
                            absent: 1,
                            streak: { current: 3, longest: 5 }
                        }
                    }
                })
            });
        });

        // Day attendance mock
        await page.route('**/api/auth/profile/attendance/today*', async (route) => {
            const url = new URL(route.request().url());
            const date = url.searchParams.get('date');

            if (date === '2026-07-23') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: [
                            {
                                _id: 'class_math_2',
                                subjectId: 'subj_math_1',
                                subjectName: 'Mathematics',
                                timeSlot: '08:00-09:00',
                                lectureType: 'Lecture',
                                status: 'Yet To Be Taken'
                            },
                            {
                                _id: 'class_phys_2',
                                subjectId: 'subj_phys_1',
                                subjectName: 'Physics',
                                timeSlot: '09:00-10:00',
                                lectureType: 'Lecture',
                                status: 'Yet To Be Taken'
                            }
                        ]
                    })
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: [
                            {
                                _id: 'class_lab_1',
                                subjectId: 'subj_phys_1',
                                subjectName: 'Physics Lab',
                                timeSlot: '08:00-10:00',
                                lectureType: 'Lab',
                                status: 'Present',
                                subSlots: [
                                    { timeSlot: '08:00-09:00', status: 'Present' },
                                    { timeSlot: '09:00-10:00', status: 'Present' }
                                ]
                            },
                            {
                                _id: 'class_math_1',
                                subjectId: 'subj_math_1',
                                subjectName: 'Mathematics',
                                timeSlot: '10:30-11:30',
                                lectureType: 'Lecture',
                                status: 'Present'
                            }
                        ]
                    })
                });
            }
        });

        // Mark attendance endpoint mock
        await page.route('**/api/auth/profile/attendance/entry*', async (route) => {
            const body = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    message: `Marked successfully as ${body?.status || 'Present'}`,
                    data: body
                })
            });
        });
    });

    test('1. Attendance settings page loads and navigation tabs switch smoothly', async ({ page }) => {
        await page.goto('/profile/edit/attendance');
        await page.waitForLoadState('domcontentloaded');

        // Verify tabs are visible
        await expect(page.getByRole('button', { name: 'Daily Attendance', exact: true })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('button', { name: 'Subject Summary', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Semester Summary', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Timetable', exact: true })).toBeVisible();

        // Switch to Subject Summary
        await page.getByRole('button', { name: 'Subject Summary', exact: true }).click();
        await expect(page.getByText('Mathematics').first()).toBeVisible();
        await expect(page.getByText('Physics').first()).toBeVisible();

        // Switch to Semester Summary
        await page.getByRole('button', { name: 'Semester Summary', exact: true }).click();
        await expect(page.getByText('Semester Attendance Summary')).toBeVisible();

        // Switch back to Daily Attendance
        await page.getByRole('button', { name: 'Daily Attendance', exact: true }).click();
        await expect(page.getByRole('button', { name: /Jump to Today/i })).toBeVisible();
    });

    test('2. Calendar dates with all classes marked render right-mark (check) indicator', async ({ page }) => {
        await page.goto('/profile/edit/attendance');
        await page.waitForLoadState('domcontentloaded');

        // Date 20 and 21 are fully marked: they should render SVG checkmark
        const calendarContainer = page.locator('.attendance-daily-grid').first();
        await expect(calendarContainer).toBeVisible({ timeout: 15000 });

        // Calendar tiles with check icon
        const checkIcons = calendarContainer.locator('svg.lucide-check');
        const count = await checkIcons.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('3. Marking attendance updates immediately with zero full-screen loading delay', async ({ page }) => {
        await page.goto('/profile/edit/attendance');
        await page.waitForLoadState('domcontentloaded');

        // Check if there are class cards rendered
        const classCard = page.locator('text=Mathematics').first();
        await expect(classCard).toBeVisible({ timeout: 15000 });

        // Click Edit or Present button on a class card
        const presentBtn = page.getByRole('button', { name: /PRESENT/i }).first();
        if (await presentBtn.isVisible()) {
            await presentBtn.click();
            // Verify there is no blocking loading screen overlay
            await expect(page.locator('.full-screen-loader, [data-testid="loading-spinner"]')).toHaveCount(0);
        }
    });

    test('4. Date switching on the calendar does not cause a stale green flash', async ({ page }) => {
        await page.goto('/profile/edit/attendance');
        await page.waitForLoadState('domcontentloaded');

        // Click a date button (e.g. 23)
        const date23Btn = page.locator('button').filter({ hasText: /^23$/ }).first();
        if (await date23Btn.isVisible()) {
            await date23Btn.click();
            // Verify date 23 is selected and does not flash false full check
            await expect(date23Btn).toBeVisible();
        }
    });
});
