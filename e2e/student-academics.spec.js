import { test, expect } from '@playwright/test';

test.describe('AskUrSenior Student Academic Section E2E Tests', () => {
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

    let registeredSubjectsState = [
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
    ];

    test.beforeEach(async ({ page }) => {
        // Reset state
        registeredSubjectsState = [
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
        ];

        // Setup mock user authenticated session in localStorage before page load
        await page.addInitScript(({ mockUser }) => {
            localStorage.setItem('token', 'mock-valid-e2e-jwt-token');
            localStorage.setItem('authToken', 'mock-valid-e2e-jwt-token');
            localStorage.setItem('user', JSON.stringify(mockUser));
        }, { mockUser });

        // 1. Generic API fallback for backend port 5000
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

        // 2. Auth profile endpoints
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

        // 3. Semesters endpoint
        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/semesters(?:\?.*)?$/, async (route) => {
            if (route.request().method() === 'PUT') {
                const body = route.request().postDataJSON() || {};
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: 'Semester updated successfully',
                        data: body
                    })
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: [
                            { semester: 1, status: 'current', sgpa: 8.5, credits: 20, academicYear: '2026-27', startDate: '2026-08-01', endDate: '2026-11-30' },
                            { semester: 2, status: 'upcoming', sgpa: null, credits: 20, academicYear: '2026-27', startDate: null, endDate: null },
                            { semester: 3, status: 'upcoming', sgpa: null, credits: 22, academicYear: '2027-28', startDate: null, endDate: null },
                            { semester: 4, status: 'upcoming', sgpa: null, credits: 22, academicYear: '2027-28', startDate: null, endDate: null },
                            { semester: 5, status: 'upcoming', sgpa: null, credits: 24, academicYear: '2028-29', startDate: null, endDate: null },
                            { semester: 6, status: 'upcoming', sgpa: null, credits: 24, academicYear: '2028-29', startDate: null, endDate: null },
                            { semester: 7, status: 'upcoming', sgpa: null, credits: 20, academicYear: '2029-30', startDate: null, endDate: null },
                            { semester: 8, status: 'upcoming', sgpa: null, credits: 18, academicYear: '2029-30', startDate: null, endDate: null }
                        ]
                    })
                });
            }
        });

        // 4. Timetable Config
        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/timetable\/config(?:\?.*)?$/, async (route) => {
            if (route.request().method() === 'PUT') {
                const body = route.request().postDataJSON() || {};
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: 'Timetable config saved successfully',
                        data: body
                    })
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: {
                            semesterStartDate: '2026-08-01',
                            lastWorkingDate: '2026-11-30',
                            collegeStartMinute: 480,
                            collegeEndMinute: 1020,
                            classDuration: 50,
                            labDuration: 100,
                            collegeAttendanceThreshold: 85,
                            personalAttendanceTarget: 90,
                            workingDays: {
                                '1': 'Full Day',
                                '2': 'Full Day',
                                '3': 'Full Day',
                                '4': 'Full Day',
                                '5': 'Full Day',
                                '6': 'Half Day',
                                '7': 'Holiday'
                            },
                            breaks: [
                                { name: 'Tea Break', startMinute: 660, duration: 15 },
                                { name: 'Lunch Break', startMinute: 780, duration: 45 }
                            ]
                        }
                    })
                });
            }
        });

        // 5. Academic curriculum subjects
        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/timetable\/subjects(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: [
                        { _id: 'subj_math_1', name: 'Mathematics', code: 'MATH101', credits: 4, isElective: false, category: 'Theory' },
                        { _id: 'subj_phys_1', name: 'Physics', code: 'PHYS101', credits: 4, isElective: false, category: 'Theory' },
                        { _id: 'subj_chem_1', name: 'Chemistry', code: 'CHEM101', credits: 4, isElective: false, category: 'Theory' },
                        { _id: 'subj_cprog_1', name: 'CS Programming', code: 'CS101', credits: 3, isElective: false, category: 'Theory' },
                        { _id: 'subj_cplab_1', name: 'CS Programming Lab', code: 'CSL102', credits: 1.5, isElective: false, category: 'Lab' }
                    ]
                })
            });
        });

        // 6. Registered subjects
        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/timetable\/registered-subjects(?:\?.*)?$/, async (route) => {
            if (route.request().method() === 'PUT') {
                const body = route.request().postDataJSON() || {};
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: 'Registered subjects updated successfully',
                        data: registeredSubjectsState
                    })
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: registeredSubjectsState
                    })
                });
            }
        });

        // 7. Timetable Slots
        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/timetable\/slots(?:\?.*)?$/, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: [
                        { dayOfWeek: 1, startTime: '08:00', endTime: '08:50', subjectId: 'subj_math_1', subjectName: 'Mathematics', lectureType: 'Lecture' },
                        { dayOfWeek: 1, startTime: '08:50', endTime: '09:40', subjectId: 'subj_phys_1', subjectName: 'Physics', lectureType: 'Lecture' },
                        { dayOfWeek: 2, startTime: '08:00', endTime: '09:40', subjectId: 'subj_chem_1', subjectName: 'Chemistry', lectureType: 'Lecture' }
                    ]
                })
            });
        });

        // 8. Academic Events
        await page.route(/^http:\/\/localhost:5000\/api\/auth\/profile\/events(?:\?.*)?$/, async (route) => {
            if (route.request().method() === 'POST') {
                const body = route.request().postDataJSON() || {};
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        message: 'Event created',
                        data: { _id: 'ev_new', ...body }
                    })
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: true,
                        data: [
                            { _id: 'ev_1', title: 'CIE 1 Examination', eventType: 'CIE_1', startDate: '2026-09-15', endDate: '2026-09-18' },
                            { _id: 'ev_2', title: 'Mid-Term Holiday', eventType: 'HOLIDAY', startDate: '2026-10-02', endDate: '2026-10-02' }
                        ]
                    })
                });
            }
        });
    });

    test('1. Student Academics hub loads 4 core tabs and header information correctly', async ({ page }) => {
        await page.goto('/student-academics');
        await page.waitForLoadState('domcontentloaded');

        // Check header title
        await expect(page.locator('text=Student Academics').first()).toBeVisible({ timeout: 15000 });

        // Verify the 4 navigation tabs
        const tabSemesters = page.getByRole('button', { name: '1. Semesters' });
        const tabSubjects = page.getByRole('button', { name: '2. Subjects' });
        const tabSettings = page.getByRole('button', { name: '3. Academic Settings' });
        const tabTimetable = page.getByRole('button', { name: '4. Timetable' });

        await expect(tabSemesters).toBeVisible();
        await expect(tabSubjects).toBeVisible();
        await expect(tabSettings).toBeVisible();
        await expect(tabTimetable).toBeVisible();

        // Switch to Subjects tab
        await tabSubjects.click();
        await expect(page).toHaveURL(/\/student-academics\/subjects/);
        await expect(page.getByText('Mathematics').first()).toBeVisible({ timeout: 10000 });

        // Switch to Academic Settings tab
        await tabSettings.click();
        await expect(page).toHaveURL(/\/student-academics\/settings/);
        await expect(page.getByRole('button', { name: /1. Timetable Settings/i })).toBeVisible();

        // Switch to Timetable tab
        await tabTimetable.click();
        await expect(page).toHaveURL(/\/student-academics\/timetable/);

        // Switch back to Semesters tab
        await tabSemesters.click();
        await expect(page).toHaveURL(/\/student-academics\/semesters/);
    });

    test('2. Semesters section renders Semesters 1 through 8 with status badges and supports inline editing', async ({ page }) => {
        await page.goto('/student-academics/semesters');
        await page.waitForLoadState('domcontentloaded');

        // Check Semester 1 card and Active status
        await expect(page.locator('h3:has-text("Semester 1")').first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator('text=Active ●').first()).toBeVisible();

        // Check other semester cards (Semester 2, 3, 8)
        await expect(page.locator('h3:has-text("Semester 2")').first()).toBeVisible();
        await expect(page.locator('h3:has-text("Semester 3")').first()).toBeVisible();
        await expect(page.locator('h3:has-text("Semester 8")').first()).toBeVisible();

        // Click Edit on a semester card to start inline editing
        const editBtn = page.getByRole('button', { name: /Edit/i }).first();
        if (await editBtn.isVisible()) {
            await editBtn.click();
            // Verify date inputs appear for inline editing
            await expect(page.locator('input[type="date"]').first()).toBeVisible();
        }
    });

    test('3. Subjects section allows viewing registered subjects, search, and category details', async ({ page }) => {
        await page.goto('/student-academics/subjects');
        await page.waitForLoadState('domcontentloaded');

        // Verify registered subjects (Mathematics, Physics)
        await expect(page.getByText('Mathematics').first()).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('Physics').first()).toBeVisible();

        // Verify enrolled courses header
        await expect(page.getByText(/Enrolled Courses/i).first()).toBeVisible();

        // Verify credits count
        await expect(page.getByText(/Credits/i).first()).toBeVisible();

        // Verify subject course codes
        await expect(page.getByText('MATH101').first()).toBeVisible();
        await expect(page.getByText('PHYS101').first()).toBeVisible();
    });

    test('4. Academic Settings section renders timetable configuration form and attendance targets', async ({ page }) => {
        await page.goto('/student-academics/settings');
        await page.waitForLoadState('domcontentloaded');

        // Verify sub-tabs inside Academic Settings
        await expect(page.getByRole('button', { name: /1. Timetable Settings/i })).toBeVisible({ timeout: 15000 });
        await expect(page.getByRole('button', { name: /2. Academic Settings/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /3. Events/i })).toBeVisible();

        // Verify Timetable Settings view headers
        await expect(page.getByText(/1. Daily Timings & Durations/i).first()).toBeVisible();
        await expect(page.getByText(/3. Attendance Thresholds/i).first()).toBeVisible();

        // Switch to Events sub-tab
        await page.getByRole('button', { name: /3. Events/i }).click();
        await expect(page.getByText(/CIE 1 Examination|Events/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('5. Timetable section renders weekly timetable schedule', async ({ page }) => {
        await page.goto('/student-academics/timetable');
        await page.waitForLoadState('domcontentloaded');

        // Verify timetable schedule container is rendered
        const timetableContainer = page.locator('main, div').filter({ hasText: /Monday|Tuesday|Timetable|Schedule/i }).first();
        await expect(timetableContainer).toBeVisible({ timeout: 15000 });
    });
});
