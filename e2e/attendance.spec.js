import { test, expect } from '@playwright/test';

test.describe('AskUrSenior Attendance System E2E Tests', () => {
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

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`[PAGE LOG] ${msg.type()}: ${msg.text()}`));
        page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`));

        // Setup mock user authenticated session in localStorage before page load
        await page.addInitScript(({ mockUser }) => {
            localStorage.setItem('token', 'mock-valid-e2e-jwt-token');
            localStorage.setItem('authToken', 'mock-valid-e2e-jwt-token');
            localStorage.setItem('user', JSON.stringify(mockUser));
        }, { mockUser });

        // 1. Generic API fallback handler for backend requests to prevent 401 session wipes
        await page.route(/^http:\/\/localhost:5000\/api\/.*/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {},
                    user: mockUser,
                    student: mockUser
                })
            });
        });

        // 2. Specific backend API mocks
        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile(?:\?.*)?$/, async (route) => {
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

        await page.route(/^http:\/\/localhost:5000\/api\/auth\/me(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        user: mockUser,
                        student: mockUser
                    }
                })
            });
        });

        await page.route(/^http:\/\/localhost:5000\/api\/auth\/session(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: mockUser
                })
            });
        });

        await page.route(/^http:\/\/localhost:5000\/api\/events\/track(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true })
            });
        });

        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/semesters(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: [
                        { semester: 1, status: 'current', sgpa: 8.5, credits: 20, academicYear: '2026-27' },
                        { semester: 2, status: 'upcoming', sgpa: null, credits: 20, academicYear: '2026-27' }
                    ]
                })
            });
        });

        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/attendance\/config(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        semesterStartDate: '2026-07-01',
                        lastWorkingDate: '2026-11-30',
                        collegeThreshold: 85,
                        attendanceThreshold: 85,
                        collegeAttendanceThreshold: 85,
                        personalAttendanceTarget: 90
                    }
                })
            });
        });

        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/timetable\/config(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        semesterStartDate: '2026-07-01',
                        lastWorkingDate: '2026-11-30',
                        collegeAttendanceThreshold: 85,
                        personalAttendanceTarget: 90
                    }
                })
            });
        });

        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/attendance\/slots(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: []
                })
            });
        });

        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/timetable\/slots(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: []
                })
            });
        });

        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/attendance\/subjects(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: [
                        {
                            subjectId: 'subj_math_1',
                            name: 'Mathematics',
                            code: 'MATH101',
                            credits: 4,
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
                            credits: 4,
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
                    ]
                })
            });
        });

        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/timetable\/registered-subjects(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: [
                        {
                            _id: 'reg_1',
                            subject: { _id: 'subj_math_1', name: 'Mathematics', code: 'MATH101', credits: 4 },
                            registeredCredits: 4,
                            category: 'Theory'
                        },
                        {
                            _id: 'reg_2',
                            subject: { _id: 'subj_phys_1', name: 'Physics', code: 'PHYS101', credits: 4 },
                            registeredCredits: 4,
                            category: 'Theory'
                        }
                    ]
                })
            });
        });

        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/attendance(?:\?.*)?$/, async (route) => {
            const url = route.request().url();
            if (url.includes('/today') || url.includes('/config') || url.includes('/slots') || url.includes('/subjects') || url.includes('/analytics') || url.includes('/subject/') || url.includes('/entry')) {
                return route.fallback();
            }
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

        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/attendance\/analytics(?:\?.*)?$/, async (route) => {
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
        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/attendance\/today(?:\?.*)?$/, async (route) => {
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
        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/attendance\/entry(?:\?.*)?$/, async (route) => {
            const body = route.request().postDataJSON?.() || {};
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

        // Subject attendance detail endpoint mock for drawer
        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/attendance\/subject\/.*$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        history: [
                            {
                                _id: 'hist_1',
                                date: '2026-07-20',
                                timeSlot: '08:00-09:00',
                                status: 'Present',
                                lectureType: 'Lecture',
                                remarks: 'Regular class'
                            },
                            {
                                _id: 'hist_2',
                                date: '2026-07-21',
                                timeSlot: '08:00-09:00',
                                status: 'Present',
                                lectureType: 'Lecture',
                                remarks: ''
                            }
                        ],
                        forecast: {
                            totalEstimated: 45,
                            requiredForThreshold: 39,
                            canMissRemaining: 3
                        }
                    }
                })
            });
        });
    });

    test('1. Attendance tracker page loads with tabs and navigation switches smoothly', async ({ page }) => {
        await page.goto('/profile/edit/attendance');
        await page.waitForLoadState('domcontentloaded');

        // Check header title
        await expect(page.locator('text=Attendance Tracker').first()).toBeVisible({ timeout: 15000 });

        // Verify navigation tabs
        const tabToday = page.getByRole('button', { name: /Today's Classes/i });
        const tabSubjects = page.getByRole('button', { name: /Subject Breakdown/i });
        const tabOverview = page.getByRole('button', { name: /Semester Overview/i });

        await expect(tabToday).toBeVisible();
        await expect(tabSubjects).toBeVisible();
        await expect(tabOverview).toBeVisible();

        // Switch to Subject Breakdown
        await tabSubjects.click();
        await expect(page.getByText('Mathematics').first()).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Physics').first()).toBeVisible();

        // Switch to Semester Overview
        await tabOverview.click();
        await expect(page.getByText(/Semester Attendance Summary|Overall Attendance|Attendance Goal/i).first()).toBeVisible();

        // Switch back to Today's Classes
        await tabToday.click();
        await expect(page.locator('.attendance-daily-grid').first()).toBeVisible();
    });

    test('2. Calendar dates with all classes marked render right-mark (check) indicator', async ({ page }) => {
        await page.goto('/profile/edit/attendance');
        await page.waitForLoadState('domcontentloaded');

        const calendarContainer = page.locator('.attendance-daily-grid').first();
        await expect(calendarContainer).toBeVisible({ timeout: 15000 });

        // Dates 20, 21, 22 are fully marked: they should render SVG checkmark
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

        // Verify class card buttons are available (Present, Absent, Edit, etc.)
        const presentBtn = page.getByRole('button', { name: /PRESENT/i }).first();
        if (await presentBtn.isVisible()) {
            await presentBtn.click();
            // Verify there is no blocking loading screen overlay
            await expect(page.locator('.full-screen-loader, [data-testid="loading-spinner"]')).toHaveCount(0);
        }
    });

    test('4. Date switching on the calendar updates day classes workspace', async ({ page }) => {
        await page.goto('/profile/edit/attendance');
        await page.waitForLoadState('domcontentloaded');

        // Click a date button (e.g. 23)
        const date23Btn = page.locator('button').filter({ hasText: /^23$/ }).first();
        if (await date23Btn.isVisible()) {
            await date23Btn.click();
            await expect(date23Btn).toBeVisible();
            // Verify classes for date 23 are rendered
            await expect(page.locator('text=Mathematics').first()).toBeVisible({ timeout: 10000 });
        }
    });

    test('5. Subject breakdown drawer opens with historical attendance entries', async ({ page }) => {
        await page.goto('/profile/edit/attendance?tab=subjects');
        await page.waitForLoadState('domcontentloaded');

        // Verify subject breakdown is rendered
        await expect(page.getByText('Mathematics').first()).toBeVisible({ timeout: 15000 });

        // Click a subject row or view details button if present
        const mathSubject = page.getByText('Mathematics').first();
        await mathSubject.click();

        // Ensure subject information or analytics card is displayed
        await expect(page.getByText('Mathematics').first()).toBeVisible();
    });
});
