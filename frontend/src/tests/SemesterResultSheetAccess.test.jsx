// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SemesterResultSheet from '../components/SemesterResultSheet';
import { apiV2 } from '../services/authService';

// Mock react-router-dom
const mockNavigate = vi.fn();
let mockLocation = { pathname: '/dashboard/settings/sgpa' };

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => mockLocation,
    };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

// Mock apiV2
vi.mock('../services/authService', () => ({
    apiV2: {
        getStudentSemesterResults: vi.fn(),
        updateStudentCieMarks: vi.fn(),
        updateStudentSeeMarks: vi.fn(),
    },
}));

// Mock ThemeContext
vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({ isDark: true }),
}));

// Setup dynamic Auth state
let authState = {
    isAuthenticated: false,
    hasPlusAccess: false,
    user: null,
};

vi.mock('../context/AuthContext', () => ({
    useAuth: () => authState,
    AuthContext: {
        Provider: ({ children }) => children,
    },
}));

describe('SemesterResultSheet - 3-State Access Control & Demo Verification', () => {
    let container = null;
    let root = null;

    beforeEach(async () => {
        vi.clearAllMocks();
        mockNavigate.mockReset();
        mockLocation = { pathname: '/dashboard/settings/sgpa' };
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        if (root) {
            act(() => {
                root.unmount();
            });
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        container = null;
        root = null;
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 1: STATE 1 - NON-LOGGED-IN USER (GUEST)
    // ─────────────────────────────────────────────────────────────────────────
    describe('State 1: Non-Logged-In User (Anonymous Guest)', () => {
        beforeEach(() => {
            authState = {
                isAuthenticated: false,
                hasPlusAccess: false,
                user: null,
            };
        });

        it('GUEST-001: Renders static demo academic marks across Overview without errors', async () => {
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="overview" />);
            });

            // Demo subjects must be visible
            expect(container.innerHTML).toContain('Complex Analysis, Probability and Statistical Methods');
            expect(container.innerHTML).toContain('Design and Analysis of Algorithms');
            expect(container.innerHTML).toContain('Operating Systems');
            expect(container.innerHTML).toContain('Microcontrollers and Embedded Systems');
            expect(container.innerHTML).toContain('Design and Analysis of Algorithms Laboratory');
            expect(container.innerHTML).toContain('Constitution of India and Professional Ethics');

            // Realistic demo marks must be rendered (not 0 or undefined)
            expect(container.innerHTML).toContain('84 / 100'); // 84 / 100 aggregate
            expect(container.innerHTML).toContain('87 / 100'); // 87 / 100 aggregate
            expect(container.innerHTML).toContain('76 / 100'); // 76 / 100 aggregate
            expect(container.innerHTML).toContain('88.5 / 100'); // 88.5 / 100 aggregate
            expect(container.innerHTML).not.toContain('undefined / 100');

            // ZERO API calls must be made
            expect(apiV2.getStudentSemesterResults).not.toHaveBeenCalled();
        });

        it('GUEST-002: Renders realistic CIE components breakdown with above-average variations', async () => {
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="cie" />);
            });

            // Tests, Quizzes, Assignments, Labs, Lab Tests
            expect(container.innerHTML).toContain('29.50 / 34'); // Tests
            expect(container.innerHTML).toContain('6.80 / 8'); // Quizzes
            expect(container.innerHTML).toContain('6.20 / 8'); // Assignments
            expect(container.innerHTML).toContain('33.50 / 35'); // Labs
            expect(container.innerHTML).toContain('13.50 / 15'); // Lab test

            // CIE totals
            expect(container.innerHTML).toContain('42.50 / 50');
            expect(container.innerHTML).toContain('45.00 / 50');
            expect(container.innerHTML).toContain('38.50 / 50');
            expect(container.innerHTML).toContain('44.00 / 50');
            expect(container.innerHTML).toContain('47.00 / 50');
            expect(container.innerHTML).toContain('42.00 / 50');

            // ZERO API calls
            expect(apiV2.getStudentSemesterResults).not.toHaveBeenCalled();
        });

        it('GUEST-003: Renders realistic SEE marks on SEE tab', async () => {
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="see" />);
            });

            // Raw SEE marks and maximums
            expect(container.innerHTML).toContain('83');
            expect(container.innerHTML).toContain('84');
            expect(container.innerHTML).toContain('75');
            expect(container.innerHTML).toContain('89');
            expect(container.innerHTML).toContain('92');
            expect(container.innerHTML).toContain('/100');
            expect(container.innerHTML).toContain('Disabled / Not Applicable');

            // ZERO API calls
            expect(apiV2.getStudentSemesterResults).not.toHaveBeenCalled();
        });

        it('GUEST-004: Does NOT display any specific semester number or CURRENT badge', async () => {
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="cie" />);
            });

            // Heading should say generic "Semester Result", NOT "Semester 4" or "Semester 1"
            expect(container.innerHTML).toContain('Semester Result');
            expect(container.innerHTML).not.toContain('Semester 4');
            expect(container.innerHTML).not.toContain('Semester 1');
            expect(container.innerHTML).not.toContain('CURRENT');

            // Semester buttons block ("SEMESTERS") should not be present
            expect(container.innerHTML).not.toContain('SEMESTERS');
        });

        it('GUEST-005: Subject rows across all tabs redirect guest to /login', async () => {
            // Test CIE Tab
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="cie" />);
            });
            let rows = container.querySelectorAll('tbody tr');
            expect(rows[0].className).toContain('cursor-not-allowed');

            await act(async () => {
                rows[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
            });
            expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=%2Fdashboard%2Fsettings%2Fsgpa');

            // Test SEE Tab
            mockNavigate.mockReset();
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="see" />);
            });
            rows = container.querySelectorAll('tbody tr');
            await act(async () => {
                rows[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
            });
            expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=%2Fdashboard%2Fsettings%2Fsgpa');

            // Test Overview Tab
            mockNavigate.mockReset();
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="overview" />);
            });
            rows = container.querySelectorAll('tbody tr');
            await act(async () => {
                rows[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
            });
            expect(mockNavigate).toHaveBeenCalledWith('/login?redirect=%2Fdashboard%2Fsettings%2Fsgpa');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 2: STATE 2 - LOGGED-IN FREE USER
    // ─────────────────────────────────────────────────────────────────────────
    describe('State 2: Logged-In Free User (Non-Plus)', () => {
        beforeEach(() => {
            authState = {
                isAuthenticated: true,
                hasPlusAccess: false,
                user: {
                    id: 'student_free_001',
                    name: 'Free Student',
                    access: { plan: 'FREE' }
                },
            };
        });

        it('FREE-001: Renders static demo academic marks with ZERO API calls', async () => {
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="cie" />);
            });

            // Verify demo data rendered
            expect(container.innerHTML).toContain('Complex Analysis, Probability and Statistical Methods');
            expect(container.innerHTML).toContain('21MAT41');
            expect(container.innerHTML).toContain('42.50');

            // Verifies zero API calls to backend
            expect(apiV2.getStudentSemesterResults).not.toHaveBeenCalled();
        });

        it('FREE-002: Does NOT assign or display any specific semester or semester switcher', async () => {
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="overview" />);
            });

            // Check that no specific semester label is shown
            expect(container.innerHTML).not.toContain('Semester 4');
            expect(container.innerHTML).not.toContain('Semester 1');
            expect(container.innerHTML).not.toContain('SEM 4');
            expect(container.innerHTML).not.toContain('CURRENT');
            expect(container.innerHTML).not.toContain('SEMESTERS');
        });

        it('FREE-003: Clicking a subject row across any tab redirects to /plus', async () => {
            // Test CIE Tab
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="cie" />);
            });
            let rows = container.querySelectorAll('tbody tr');
            await act(async () => {
                rows[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
            });
            expect(mockNavigate).toHaveBeenCalledWith('/plus');

            // Test SEE Tab
            mockNavigate.mockReset();
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="see" />);
            });
            rows = container.querySelectorAll('tbody tr');
            await act(async () => {
                rows[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
            });
            expect(mockNavigate).toHaveBeenCalledWith('/plus');

            // Test Overview Tab
            mockNavigate.mockReset();
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="overview" />);
            });
            rows = container.querySelectorAll('tbody tr');
            await act(async () => {
                rows[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
            });
            expect(mockNavigate).toHaveBeenCalledWith('/plus');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 3: STATE 3 - LOGGED-IN PLUS USER
    // ─────────────────────────────────────────────────────────────────────────
    describe('State 3: Plus User (Personalized Real Data)', () => {
        const mockPlusResults = {
            semester: 3,
            scheme: 'Scheme 2025',
            student: {
                usn: '1RV23CS100',
                name: 'Verified Plus Member',
                currentSemester: 3,
            },
            availableSemesters: [1, 2, 3],
            summary: {
                sgpa: 9.15,
                cgpa: 9.05,
                totalCredits: 20,
                earnedCredits: 20,
            },
            subjects: [
                {
                    code: '21CS32',
                    name: 'Data Structures and Applications',
                    credits: 4,
                    evaluationGroup: 'ipcc',
                    contributesToSGPA: true,
                    cie: {
                        obtained: 48,
                        max: 50,
                        status: 'COMPLETE',
                        components: [
                            { key: 'TEST_1', name: 'Internal Assessment Test 1', targetMax: 17, normalizedMarks: 16.5, rawMarks: 29, rawMaxMarks: 30, status: 'ENTERED' },
                        ]
                    },
                    see: {
                        enabled: true,
                        obtained: 45,
                        max: 50,
                        marks: 90,
                    },
                    aggregate: {
                        obtained: 93,
                        max: 100,
                    },
                    grade: {
                        letter: 'O',
                        gradePoint: 10,
                        description: 'Outstanding'
                    },
                    eligibility: {
                        eligible: true,
                        status: 'ELIGIBLE',
                    }
                }
            ]
        };

        beforeEach(() => {
            authState = {
                isAuthenticated: true,
                hasPlusAccess: true,
                user: {
                    id: 'student_plus_001',
                    name: 'Verified Plus Member',
                    isPlus: true,
                    access: { plan: 'PLUS' }
                },
            };
            apiV2.getStudentSemesterResults.mockResolvedValue({
                data: {
                    success: true,
                    data: mockPlusResults,
                }
            });
        });

        it('PLUS-001: Fetches real student results from apiV2 on mount', async () => {
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="overview" />);
            });

            // Verifies API was called for semester
            expect(apiV2.getStudentSemesterResults).toHaveBeenCalled();

            // Verifies real user's subjects and semester are rendered
            expect(container.innerHTML).toContain('Data Structures and Applications');
            expect(container.innerHTML).toContain('21CS32');
            expect(container.innerHTML).toContain('Semester 1');
        });

        it('PLUS-002: Shows SEMESTERS switcher and permits interactive drawer opening', async () => {
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="cie" />);
            });

            // Semester switcher block should be rendered for Plus user
            expect(container.innerHTML).toContain('SEMESTERS');

            // Find subject rows
            const rows = container.querySelectorAll('tbody tr');
            expect(rows.length).toBeGreaterThan(0);

            // Row should not be cursor-not-allowed
            expect(rows[0].className).not.toContain('cursor-not-allowed');

            // Click row to open CIE Drawer
            await act(async () => {
                rows[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
            });

            // Should NOT redirect to /login or /plus
            expect(mockNavigate).not.toHaveBeenCalled();

            // Should open the CIE Drawer with editing fields and action buttons
            expect(container.innerHTML).toContain('Save Marks');
            expect(container.innerHTML).toContain('Component');
        });

        it('PLUS-003: Permits opening SEE drawer on SEE tab without redirect', async () => {
            await act(async () => {
                root.render(<SemesterResultSheet initialTab="see" />);
            });

            const rows = container.querySelectorAll('tbody tr');
            await act(async () => {
                rows[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
            });

            // Should NOT redirect to /login or /plus
            expect(mockNavigate).not.toHaveBeenCalled();

            // Should open SEE drawer
            expect(container.innerHTML).toContain('Evaluated SEE:');
            expect(container.innerHTML).toContain('Save Marks');
        });
    });
});
