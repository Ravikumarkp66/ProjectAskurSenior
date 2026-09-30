// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AcademicSummaryPage from '../../settings/AcademicSummaryPage';
import { AuthContext } from '../../../../context/AuthContext';
import { apiV2 } from '../../../../services/authService';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock apiV2 results and student academics endpoints
vi.mock('../../../../services/authService', () => ({
    apiV2: {
        getStudentSemesterResults: vi.fn().mockResolvedValue({
            data: {
                data: {
                    semester: 3,
                    scheme: 'Scheme 2025',
                    student: {
                        usn: '1SI24CS001',
                        name: 'Real Plus Student',
                        cgpa: 8.95,
                        currentSemester: 3,
                    },
                    availableSemesters: [1, 2, 3],
                    summary: {
                        totalSubjects: 1,
                        passedSubjects: 1,
                        failedSubjects: 0,
                        totalCreditsAttempted: 4,
                        totalCreditsEarned: 4,
                        sgpa: 9.00,
                        cgpa: 8.95,
                    },
                    subjects: [
                        {
                            code: 'CS301-REAL',
                            name: 'Real Network Architecture',
                            credits: 4,
                            category: 'Theory',
                            pattern: 'Standard Theory',
                            attendance: { percentage: 95, status: 'SATISFIED' },
                            cie: { obtained: 48, max: 50 },
                            see: { marks: 46, max: 50, enabled: true },
                            aggregate: { marks: 94, max: 100 },
                            eligibility: { eligible: true, reasons: [] },
                            grade: { letter: 'O', gradePoint: 10 },
                            contributesToSGPA: true,
                        }
                    ],
                },
            },
        }),
        getStudentAcademicsOverview: vi.fn().mockResolvedValue({
            data: {
                data: {
                    student: { currentSemester: 3, branch: 'CSE' },
                    visibleSemesters: [{ number: 1 }, { number: 2 }, { number: 3 }],
                },
            },
        }),
        getStudentAcademicsSemesters: vi.fn().mockResolvedValue({
            data: { data: [{ number: 1 }, { number: 2 }, { number: 3 }] },
        }),
        getStudentAcademicsSections: vi.fn().mockResolvedValue({
            data: { data: { sections: [] } },
        }),
        getStudentAcademicsSettings: vi.fn().mockResolvedValue({
            data: { data: {} },
        }),
        getStudentAcademicsTimetable: vi.fn().mockResolvedValue({
            data: { data: {} },
        }),
        getStudentAcademicsSubjects: vi.fn().mockResolvedValue({
            data: { data: { curriculumSubjects: [], registeredSubjects: [] } },
        }),
    },
}));

describe('F-08: Academic Summary Access Control & Preview Verification', () => {
    let container = null;
    let root = null;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        vi.clearAllMocks();
    });

    afterEach(() => {
        if (root) {
            act(() => {
                root.unmount();
            });
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    it('PLUS USER: calls real APIs, displays real data, enables sync button, and omits Preview badge', async () => {
        const plusAuth = {
            isAuthenticated: true,
            hasPlusAccess: true,
            user: {
                name: 'Plus Student',
                access: { plan: 'PLUS' },
                isPlus: true,
                semester: 3,
            },
        };

        await act(async () => {
            root.render(
                <AuthContext.Provider value={plusAuth}>
                    <AcademicSummaryPage />
                </AuthContext.Provider>
            );
        });
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 80));
        });

        // Real result API must be called
        expect(apiV2.getStudentSemesterResults).toHaveBeenCalled();

        // Must display real user data
        expect(container.textContent).toContain('CS301-REAL');
        expect(container.textContent).toContain('Real Network Architecture');

        // Must NOT render Preview badge
        expect(container.textContent).not.toContain('Preview');

        // Sync button must be enabled
        const syncButton = container.querySelector('button[title="Sync Academic Data"]');
        expect(syncButton).not.toBeNull();
        expect(syncButton.disabled).toBe(false);
    });

    it('LOGGED-IN FREE USER: zero API calls, renders complete static dummy preview, and disables sync button', async () => {
        const freeAuth = {
            isAuthenticated: true,
            hasPlusAccess: false,
            user: {
                name: 'Free Student',
                access: { plan: 'FREE' },
                isPlus: false,
                semester: 3,
            },
        };

        await act(async () => {
            root.render(
                <AuthContext.Provider value={freeAuth}>
                    <AcademicSummaryPage />
                </AuthContext.Provider>
            );
        });
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 80));
        });

        // ZERO API calls must be made
        expect(apiV2.getStudentSemesterResults).not.toHaveBeenCalled();
        expect(apiV2.getStudentAcademicsOverview).not.toHaveBeenCalled();
        expect(apiV2.getStudentAcademicsSemesters).not.toHaveBeenCalled();
        expect(apiV2.getStudentAcademicsSections).not.toHaveBeenCalled();
        expect(apiV2.getStudentAcademicsSettings).not.toHaveBeenCalled();
        expect(apiV2.getStudentAcademicsTimetable).not.toHaveBeenCalled();
        expect(apiV2.getStudentAcademicsSubjects).not.toHaveBeenCalled();

        // Must render Preview badge
        expect(container.textContent).toContain('Preview');

        // Must render static dummy dataset representing diverse states
        expect(container.textContent).toContain('Mathematics for Computer Science');
        expect(container.textContent).toContain('Data Structures and Applications');
        expect(container.textContent).toContain('Digital Design and Computer Organization');
        expect(container.textContent).toContain('Constitution of India & Cyber Law');
        expect(container.textContent).toContain('Environmental Studies');
        expect(container.textContent).toContain('Full Stack Web Development');

        // Shows status badges
        expect(container.textContent).toContain('Eligible');
        expect(container.textContent).toContain('At Risk');
        expect(container.textContent).toContain('Failed');
        expect(container.textContent).toContain('Passed');

        // Shows dummy metrics
        expect(container.textContent).toContain('8.42');
        expect(container.textContent).toContain('8.18');

        // Sync button must be disabled with correct title
        const syncButton = container.querySelector('button[title="Data synchronization disabled in Preview mode"]');
        expect(syncButton).not.toBeNull();
        expect(syncButton.disabled).toBe(true);

        // Clicking sync button does not trigger any API call
        await act(async () => {
            syncButton.click();
        });
        expect(apiV2.getStudentSemesterResults).not.toHaveBeenCalled();

        // Semester selector works in-memory without making API calls
        const select = container.querySelector('select');
        expect(select).not.toBeNull();

        await act(async () => {
            select.value = '2';
            select.dispatchEvent(new Event('change', { bubbles: true }));
        });

        expect(container.textContent).toContain('Semester 2');
        expect(apiV2.getStudentSemesterResults).not.toHaveBeenCalled();
    });

    it('NON-LOGGED-IN GUEST USER: zero API calls, renders complete static dummy preview, and disables sync button', async () => {
        const guestAuth = {
            isAuthenticated: false,
            hasPlusAccess: false,
            user: null,
            token: null,
        };

        await act(async () => {
            root.render(
                <AuthContext.Provider value={guestAuth}>
                    <AcademicSummaryPage />
                </AuthContext.Provider>
            );
        });
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 80));
        });

        // ZERO API calls must be made
        expect(apiV2.getStudentSemesterResults).not.toHaveBeenCalled();
        expect(apiV2.getStudentAcademicsOverview).not.toHaveBeenCalled();
        expect(apiV2.getStudentAcademicsSemesters).not.toHaveBeenCalled();
        expect(apiV2.getStudentAcademicsSections).not.toHaveBeenCalled();
        expect(apiV2.getStudentAcademicsSettings).not.toHaveBeenCalled();
        expect(apiV2.getStudentAcademicsTimetable).not.toHaveBeenCalled();
        expect(apiV2.getStudentAcademicsSubjects).not.toHaveBeenCalled();

        // Must render Preview badge
        expect(container.textContent).toContain('Preview');

        // Dummy subjects are rendered
        expect(container.textContent).toContain('Mathematics for Computer Science');
        expect(container.textContent).toContain('Data Structures Laboratory');

        // Sync button is disabled
        const syncButton = container.querySelector('button[title="Data synchronization disabled in Preview mode"]');
        expect(syncButton).not.toBeNull();
        expect(syncButton.disabled).toBe(true);
    });
});
