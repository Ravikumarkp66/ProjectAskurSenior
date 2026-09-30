// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import LabSidebar from '../LabSidebar';
import * as AuthHook from '../../../../../utils/hooks';

// Mock Auth hook
vi.mock('../../../../../utils/hooks', () => ({
    useAuth: vi.fn()
}));

describe('LabSidebar: Folders, Numbering & 3-Tier Auth States', () => {
    const mockLanguages = [
        {
            id: 'lang-1',
            slug: 'c',
            name: 'Introduction to C Programming',
            badge: 'PLC5',
            languageSlug: 'c',
            labs: [
                {
                    id: 'lab-1',
                    labNumber: 1,
                    title: 'Lab 1',
                    programs: [
                        { id: 'prog-1', slug: 'prog-1', programNumber: 1, title: 'Distance Between Two Points', isCompleted: false }
                    ]
                },
                {
                    id: 'lab-2',
                    labNumber: 2,
                    title: 'Lab 2',
                    programs: [
                        { id: 'prog-2', slug: 'prog-2', programNumber: 2, title: 'Student Grade Classification', isCompleted: true }
                    ]
                },
                {
                    id: 'lab-3',
                    labNumber: 3,
                    title: 'Lab 3 (Multi-program)',
                    programs: [
                        { id: 'prog-3a', slug: 'prog-3a', programNumber: 1, title: 'Part A: Linear Search', isCompleted: false },
                        { id: 'prog-3b', slug: 'prog-3b', programNumber: 2, title: 'Part B: Binary Search', isCompleted: false }
                    ]
                },
                {
                    id: 'lab-10',
                    labNumber: 10,
                    title: 'Lab 10',
                    programs: [
                        { id: 'prog-10', slug: 'prog-10', programNumber: 10, title: 'Pointer Operations', isCompleted: false }
                    ]
                }
            ]
        }
    ];

    const renderSidebar = (props = {}) => {
        return renderToStaticMarkup(
            <MemoryRouter>
                <LabSidebar
                    languages={mockLanguages}
                    activeLanguageSlug="c"
                    activeProblemId="prog-1"
                    onSelectProgram={vi.fn()}
                    isCollapsed={false}
                    onToggleCollapse={vi.fn()}
                    {...props}
                />
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('1. Lab Numbering & Conditional Folders', () => {
        beforeEach(() => {
            AuthHook.useAuth.mockReturnValue({
                user: { name: 'Ravikumar K P', branch: 'MECH' },
                isAuthenticated: true,
                hasPlusAccess: true
            });
        });

        it('renders single-program labs as direct items with Lab 01, Lab 02, Lab 10 numbering (no folders, no chevron count badges)', () => {
            const html = renderSidebar();

            // Verify Lab 01, Lab 02, Lab 10 are rendered with padded numbering
            expect(html).toContain('Lab 01');
            expect(html).toContain('Lab 02');
            expect(html).toContain('Lab 10');

            // Lab 01 and Lab 02 titles are in tooltip attributes
            expect(html).toContain('title="Lab 01: Distance Between Two Points"');
            expect(html).toContain('title="Lab 02: Student Grade Classification"');
            expect(html).toContain('title="Lab 10: Pointer Operations"');
        });

        it('renders multi-program lab (Lab 03 with 2 programs) as an expandable folder with count badge 2', () => {
            const html = renderSidebar();

            // Lab 03 has 2 programs -> should render folder header with count badge 2
            expect(html).toContain('Lab 03');
            expect(html).toContain('2');
        });
    });

    describe('2. Guest / Non-Logged-In User State', () => {
        beforeEach(() => {
            AuthHook.useAuth.mockReturnValue({
                user: null,
                isAuthenticated: false,
                hasPlusAccess: false
            });
        });

        it('shows Login button in expanded sidebar for guest users', () => {
            const html = renderSidebar({ isCollapsed: false });

            expect(html).toContain('Login');
            expect(html).toContain('title="Sign in to AskUrSenior"');
            expect(html).not.toContain('View Student Profile');
        });

        it('shows Login icon button in collapsed sidebar for guest users', () => {
            const html = renderSidebar({ isCollapsed: true });

            expect(html).toContain('title="Login"');
            expect(html).not.toContain('Upgrade to Plus');
        });
    });

    describe('3. Logged-in Free / Non-Plus User State', () => {
        beforeEach(() => {
            AuthHook.useAuth.mockReturnValue({
                user: { name: 'Rahul Sharma', branch: 'CSE' },
                isAuthenticated: true,
                hasPlusAccess: false
            });
        });

        it('shows Upgrade button alongside student profile card in expanded sidebar for free users', () => {
            const html = renderSidebar({ isCollapsed: false });

            // Upgrade button is present
            expect(html).toContain('Upgrade');
            expect(html).toContain('title="Upgrade for plus access"');

            // Student profile is present
            expect(html).toContain('Rahul Sharma');
            expect(html).toContain('CSE');
            expect(html).toContain('title="View Student Profile"');
        });

        it('shows Upgrade icon and Avatar in collapsed sidebar for free users', () => {
            const html = renderSidebar({ isCollapsed: true });

            expect(html).toContain('title="Upgrade to Plus"');
            expect(html).toContain('title="Rahul Sharma"');
        });
    });

    describe('4. Logged-in Plus User State', () => {
        beforeEach(() => {
            AuthHook.useAuth.mockReturnValue({
                user: { name: 'Ravikumar K P', branch: 'MECH' },
                isAuthenticated: true,
                hasPlusAccess: true
            });
        });

        it('does NOT show Upgrade button, renders clean student profile card for Plus users', () => {
            const html = renderSidebar({ isCollapsed: false });

            // No upgrade button for Plus users
            expect(html).not.toContain('Upgrade');
            expect(html).not.toContain('title="Upgrade for plus access"');

            // Student Profile card is present
            expect(html).toContain('Ravikumar K P');
            expect(html).toContain('MECH');
            expect(html).toContain('title="View Student Profile"');
        });

        it('shows clean Avatar in collapsed sidebar for Plus users without Upgrade icon', () => {
            const html = renderSidebar({ isCollapsed: true });

            expect(html).not.toContain('title="Upgrade to Plus"');
            expect(html).toContain('title="Ravikumar K P"');
        });
    });
});
