// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AcademicOverviewSection from '../sections/AcademicOverviewSection';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock useStudentAcademics context
const mockSelectSemester = vi.fn();
vi.mock('../../../../contexts/StudentAcademicsContext', () => ({
    useStudentAcademics: () => ({
        profile: {
            cgpa: 8.18,
            scheme: { name: 'Scheme 2025' },
        },
        currentSemester: 3,
        selectedSemester: 3,
        selectSemester: mockSelectSemester,
        semestersData: [
            { number: 1, label: 'Semester 1' },
            { number: 2, label: 'Semester 2' },
            { number: 3, label: 'Semester 3' },
        ],
        registeredSubjects: [],
        totalRegisteredCredits: 20,
        timetableConfig: { attendanceThreshold: 85 },
    }),
}));

// Mock apiV2 results endpoint
vi.mock('../../../../services/authService', () => ({
    apiV2: {
        getStudentSemesterResults: vi.fn().mockResolvedValue({
            data: {
                data: {
                    semester: 3,
                    scheme: 'Scheme 2025',
                    student: {
                        usn: '1SI24CS001',
                        name: 'Test Student',
                        cgpa: 8.18,
                        currentSemester: 3,
                    },
                    availableSemesters: [1, 2, 3],
                    summary: {
                        totalSubjects: 4,
                        passedSubjects: 3,
                        failedSubjects: 0,
                        totalCreditsAttempted: 14,
                        totalCreditsEarned: 14,
                        sgpa: 8.42,
                        cgpa: 8.18,
                    },
                    subjects: [
                        {
                            code: 'CS301',
                            name: 'Data Structures',
                            credits: 4,
                            category: 'Theory',
                            pattern: 'Standard Theory',
                            attendance: { percentage: 89, status: 'SATISFIED' },
                            cie: { obtained: 43, max: 50 },
                            see: { marks: 42, max: 50, enabled: true },
                            aggregate: { marks: 85, max: 100 },
                            eligibility: { eligible: true, reasons: [] },
                            grade: { letter: 'A+', gradePoint: 9 },
                            contributesToSGPA: true,
                        },
                        {
                            code: 'CS302',
                            name: 'Database Management Systems',
                            credits: 4,
                            category: 'Theory',
                            pattern: 'Standard Theory',
                            attendance: { percentage: 86, status: 'SATISFIED' },
                            cie: { obtained: 41, max: 50 },
                            see: { marks: null, max: 50, enabled: true },
                            aggregate: { marks: null, max: 100 },
                            eligibility: { eligible: true, reasons: [] },
                            grade: { letter: 'PENDING', gradePoint: null },
                            contributesToSGPA: true,
                        },
                        {
                            code: 'CS303L',
                            name: 'Data Structures Laboratory',
                            credits: 2,
                            category: 'Laboratory',
                            pattern: 'Standard Laboratory',
                            attendance: { percentage: 92, status: 'SATISFIED' },
                            cie: { obtained: 46, max: 50 },
                            see: { marks: 45, max: 50, enabled: true },
                            aggregate: { marks: 91, max: 100 },
                            eligibility: { eligible: true, reasons: [] },
                            grade: { letter: 'O', gradePoint: 10 },
                            contributesToSGPA: true,
                        },
                        {
                            code: 'NCMC03',
                            name: 'Social Connect & Responsibility',
                            credits: 0,
                            category: 'NCMC',
                            pattern: 'NCMC Non-Credit',
                            attendance: { percentage: 80, status: 'SHORTAGE' },
                            cie: { obtained: 85, max: 100 },
                            see: { marks: null, max: 0, enabled: false },
                            aggregate: { marks: 85, max: 100 },
                            eligibility: { eligible: true, reasons: [] },
                            grade: { letter: 'PP', gradePoint: null },
                            contributesToSGPA: false,
                        },
                    ],
                },
            },
        }),
    },
}));

describe('F-08: Academic Overview CSES Table Sheet', () => {
    let container = null;
    let root = null;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
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

    it('renders compact header with semester metadata and selector', async () => {
        await act(async () => {
            root.render(<AcademicOverviewSection onNavigateTab={() => {}} />);
        });
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        expect(container.textContent).toContain('Academic Overview');
        expect(container.textContent).toContain('Semester 3 · Scheme 2025');
        expect(container.querySelector('select')).not.toBeNull();
    });

    it('renders single compact summary strip with SGPA, CGPA, Credits, Backlogs, Attendance, and CIE', async () => {
        await act(async () => {
            root.render(<AcademicOverviewSection onNavigateTab={() => {}} />);
        });
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        expect(container.textContent).toContain('SGPA');
        expect(container.textContent).toContain('8.42');
        expect(container.textContent).toContain('CGPA');
        expect(container.textContent).toContain('8.18');
        expect(container.textContent).toContain('Credits');
        expect(container.textContent).toContain('Backlogs');
        expect(container.textContent).toContain('Attendance');
        expect(container.textContent).toContain('CIE');
    });

    it('renders dense academic table with correct columns and data', async () => {
        await act(async () => {
            root.render(<AcademicOverviewSection onNavigateTab={() => {}} />);
        });
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        const table = container.querySelector('table');
        expect(table).not.toBeNull();

        // Check header columns
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
        expect(headers).toContain('Subject');
        expect(headers).toContain('Code');
        expect(headers).toContain('Cr');
        expect(headers).toContain('Attendance');
        expect(headers).toContain('CIE');
        expect(headers).toContain('SEE');
        expect(headers).toContain('Eligibility');
        expect(headers).toContain('Grade');
        expect(headers).toContain('Result');

        // Check Theory row
        expect(container.textContent).toContain('Data Structures');
        expect(container.textContent).toContain('CS301');
        expect(container.textContent).toContain('89%');
        expect(container.textContent).toContain('43 / 50');
        expect(container.textContent).toContain('42 / 50');
        expect(container.textContent).toContain('✓ Eligible');
        expect(container.textContent).toContain('A+');
        expect(container.textContent).toContain('Passed');

        // Check Lab row
        expect(container.textContent).toContain('Data Structures Laboratory');
        expect(container.textContent).toContain('CS303L');
        expect(container.textContent).toContain('46 / 50');
        expect(container.textContent).toContain('45 / 50');

        // Check NCMC row: SEE must be N/A, never 0/0
        expect(container.textContent).toContain('Social Connect & Responsibility');
        expect(container.textContent).toContain('NCMC03');
        expect(container.textContent).toContain('N/A');
        expect(container.textContent).not.toContain('0 / 0');
    });

    it('renders minimal semester summary footnote at the bottom', async () => {
        await act(async () => {
            root.render(<AcademicOverviewSection onNavigateTab={() => {}} />);
        });
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        expect(container.textContent).toContain('Total Credits:');
        expect(container.textContent).toContain('Earned Credits:');
        expect(container.textContent).toContain('SGPA:');
    });
});
