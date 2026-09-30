// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AttendanceSettings from '../AttendanceSettings.jsx';
import TimetableSettings from '../TimetableSettings.jsx';
import { AuthContext } from '../../../../context/AuthContext.jsx';
import { ThemeProvider } from '../../../../context/ThemeContext.jsx';
import { apiV2 } from '../../../../services/authService.js';

describe('Attendance & Timetable 3-State Access Control & Demo Architecture', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderWithContext = (Component, authValue, initialEntries = ['/home/attendance']) => {
        return renderToStaticMarkup(
            React.createElement(
                MemoryRouter,
                { initialEntries },
                React.createElement(
                    ThemeProvider,
                    null,
                    React.createElement(
                        AuthContext.Provider,
                        { value: authValue },
                        React.createElement(Component)
                    )
                )
            )
        );
    };

    // ═════════════════════════════════════════════════════════════════════════
    // 1. ATTENDANCE: NON-LOGGED-IN USER (GUEST)
    // ═════════════════════════════════════════════════════════════════════════
    describe('1. Attendance: Non-Logged-In User (Guest)', () => {
        it('renders full Attendance workspace with realistic static demo data', () => {
            const spyDashboard = vi.spyOn(apiV2, 'getAttendanceDashboard');
            const spyDay = vi.spyOn(apiV2, 'getAttendanceDay');

            const html = renderWithContext(AttendanceSettings, {
                user: null,
                isAuthenticated: false,
                hasPlusAccess: false
            });

            // Must NOT make personalized API calls
            expect(spyDashboard).not.toHaveBeenCalled();
            expect(spyDay).not.toHaveBeenCalled();

            // Renders complete workspace UI
            expect(html).toContain('Attendance Tracker');
            expect(html).toContain('Semester 4');
            // Contains realistic dummy subject names
            expect(html).toContain('Design &amp; Analysis of Algorithms');
            expect(html).toContain('Operating Systems');
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 2. ATTENDANCE: LOGGED-IN FREE USER
    // ═════════════════════════════════════════════════════════════════════════
    describe('2. Attendance: Logged-in Free User', () => {
        it('renders demo workspace and executes ZERO personalized attendance API calls', () => {
            const spyDashboard = vi.spyOn(apiV2, 'getAttendanceDashboard');
            const spyDay = vi.spyOn(apiV2, 'getAttendanceDay');
            const spyTimetable = vi.spyOn(apiV2, 'getTimetableSlots');

            const html = renderWithContext(AttendanceSettings, {
                user: { _id: 'u1', name: 'Free User', isPlus: false },
                isAuthenticated: true,
                hasPlusAccess: false
            });

            // Zero DB / API calls
            expect(spyDashboard).not.toHaveBeenCalled();
            expect(spyDay).not.toHaveBeenCalled();
            expect(spyTimetable).not.toHaveBeenCalled();

            // Renders demo attendance data
            expect(html).toContain('Attendance Tracker');
            expect(html).toContain('Semester 4');
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 3. ATTENDANCE: PLUS USER
    // ═════════════════════════════════════════════════════════════════════════
    describe('3. Attendance: Plus User', () => {
        it('renders personalized workspace fetching indicator for plus users', () => {
            const html = renderWithContext(AttendanceSettings, {
                user: { _id: 'u2', name: 'Plus User', isPlus: true, semester: 4 },
                isAuthenticated: true,
                hasPlusAccess: true
            });

            // Plus user triggers async fetch and shows initial loading state before data resolves
            expect(html).toContain('Loading attendance workspace...');
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 4. TIMETABLE: NON-LOGGED-IN USER (GUEST)
    // ═════════════════════════════════════════════════════════════════════════
    describe('4. Timetable: Non-Logged-In User (Guest)', () => {
        it('renders demo timetable grid with zero API calls and Demo lock badge', () => {
            const spyConfig = vi.spyOn(apiV2, 'getTimetableConfig');
            const spySlots = vi.spyOn(apiV2, 'getTimetableSlots');
            const spySubjects = vi.spyOn(apiV2, 'getAcademicSubjects');

            const html = renderWithContext(TimetableSettings, {
                user: null,
                isAuthenticated: false,
                hasPlusAccess: false
            }, ['/home/timetable']);

            // Zero API calls
            expect(spyConfig).not.toHaveBeenCalled();
            expect(spySlots).not.toHaveBeenCalled();
            expect(spySubjects).not.toHaveBeenCalled();

            // Shows Academic Timetable title and Demo badge
            expect(html).toContain('Academic Timetable');
            expect(html).toContain('Demo');
            // Weekly timetable grid rendered with demo subjects
            expect(html).toContain('Weekly Timetable Schedule');
            expect(html).toContain('Data Structures');
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 5. TIMETABLE: LOGGED-IN FREE USER
    // ═════════════════════════════════════════════════════════════════════════
    describe('5. Timetable: Logged-in Free User', () => {
        it('renders static demo timetable without querying database', () => {
            const spyConfig = vi.spyOn(apiV2, 'getTimetableConfig');
            const spySlots = vi.spyOn(apiV2, 'getTimetableSlots');

            const html = renderWithContext(TimetableSettings, {
                user: { _id: 'u3', name: 'Free Student', isPlus: false },
                isAuthenticated: true,
                hasPlusAccess: false
            }, ['/plus/timetable']);

            expect(spyConfig).not.toHaveBeenCalled();
            expect(spySlots).not.toHaveBeenCalled();

            expect(html).toContain('Academic Timetable');
            expect(html).toContain('Demo');
            expect(html).toContain('Weekly Timetable Schedule');
        });
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 6. TIMETABLE: PLUS USER
    // ═════════════════════════════════════════════════════════════════════════
    describe('6. Timetable: Plus User', () => {
        it('renders timetable for plus users without Demo lock indicator', () => {
            const html = renderWithContext(TimetableSettings, {
                user: { _id: 'u4', name: 'Plus Student', isPlus: true, semester: 4 },
                isAuthenticated: true,
                hasPlusAccess: true
            }, ['/plus/timetable']);

            expect(html).toContain('Academic Timetable');
            // Should NOT have the Demo locked pill for Plus users
            expect(html).not.toContain('>Demo</span>');
        });
    });
});
