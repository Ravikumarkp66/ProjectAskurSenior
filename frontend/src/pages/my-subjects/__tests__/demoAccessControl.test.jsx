// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import TopicEditorialView from '../components/TopicEditorialView.jsx';
import { 
    DEMO_SUBJECTS, 
    getDemoTopicEditorial, 
    getDemoContentTree, 
    isDemoSubject 
} from '../../../data/demo/mySubjectsDemoData.js';
import * as academicContentApi from '../../../services/academicContentApi';
import { AuthContext } from '../../../context/AuthContext';

// Mock framer-motion to render synchronously without happy-dom animation rejections
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, whileTap, whileHover, initial, animate, exit, transition, ...props }) => <div {...props}>{children}</div>,
        button: ({ children, whileTap, whileHover, initial, animate, exit, transition, ...props }) => <button {...props}>{children}</button>,
        span: ({ children, whileTap, whileHover, initial, animate, exit, transition, ...props }) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('My Subjects Access Control & Demo Content Architecture', () => {
    let container = null;
    let root = null;

    beforeAll(() => {
        globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    });

    beforeEach(() => {
        vi.restoreAllMocks();
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        if (root) {
            await act(async () => {
                root.unmount();
            });
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
        container = null;
        root = null;
        vi.restoreAllMocks();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 1: Static Demo Registry Integrity
    // ─────────────────────────────────────────────────────────────────────────
    describe('Demo Registry Integrity', () => {
        it('DEMO-001: exports 8 realistic timetable demo subjects', () => {
            expect(DEMO_SUBJECTS).toHaveLength(8);
            const codes = DEMO_SUBJECTS.map(s => s.code);
            expect(codes).toContain('ACM');
            expect(codes).toContain('AMM1');
            expect(codes).toContain('CAED');
            expect(codes).toContain('CC08');
            expect(codes).toContain('CC10');
            expect(codes).toContain('ESC07');
            expect(codes).toContain('PLC5');
            expect(codes).toContain('SDC1');
        });

        it('DEMO-002: every demo subject has 5 modules with topics', () => {
            DEMO_SUBJECTS.forEach(subject => {
                expect(subject.modules).toHaveLength(5);
                subject.modules.forEach(mod => {
                    expect(mod.topics.length).toBeGreaterThanOrEqual(2);
                });
            });
        });

        it('DEMO-003: isDemoSubject correctly matches codes and slugs', () => {
            expect(isDemoSubject('ACM')).toBe(true);
            expect(isDemoSubject('acm')).toBe(true);
            expect(isDemoSubject('PLC5')).toBe(true);
            expect(isDemoSubject('applied-mathematics-i')).toBe(true);
            expect(isDemoSubject('UNKNOWN_SUBJ')).toBe(false);
        });

        it('DEMO-004: getDemoContentTree returns module structure for valid subjects', () => {
            const acmTree = getDemoContentTree('ACM');
            expect(acmTree).not.toBeNull();
            expect(acmTree).toHaveLength(5);

            const invalidTree = getDemoContentTree('INVALID');
            expect(invalidTree).toBeNull();
        });

        it('DEMO-005: all 82 topics in the demo registry have valid structured editorial docs', () => {
            let totalTopics = 0;
            DEMO_SUBJECTS.forEach(subj => {
                subj.modules.forEach(mod => {
                    mod.topics.forEach(top => {
                        totalTopics++;
                        const doc = getDemoTopicEditorial(subj.code, mod.slug, top.slug);
                        expect(doc).not.toBeNull();
                        expect(doc.title).toBe(top.title);
                        expect(doc.blocks.length).toBeGreaterThan(5);
                        expect(doc.sections.length).toBeGreaterThanOrEqual(5);
                    });
                });
            });
            expect(totalTopics).toBe(82);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 2: State 1 - Non-Logged-In User (Guest)
    // ─────────────────────────────────────────────────────────────────────────
    describe('State 1: Non-Logged-In User (Guest)', () => {
        it('GUEST-001: renders static demo editorial and shows "Log in to Access" in right column', () => {
            const apiSpy = vi.spyOn(academicContentApi, 'getAcademicTopicEditorial');

            const acmSubject = DEMO_SUBJECTS.find(s => s.code === 'ACM');
            const mod1 = acmSubject.modules[0];
            const topic1 = mod1.topics[0];

            const html = renderToStaticMarkup(
                React.createElement(
                    AuthContext.Provider,
                    { value: { user: null, hasPlusAccess: false } },
                    React.createElement(TopicEditorialView, {
                        activeSubject: acmSubject,
                        activeModule: mod1,
                        activeTopic: topic1,
                        hasPlusAccess: false,
                        isDark: true
                    })
                )
            );

            // Renders the demo editorial title and sections
            expect(html).toContain('Introduction to Chemical Sensors');
            expect(html).toContain('Core Concept');
            expect(html).toContain('Chemical / Physical Mechanism');

            // Shows the right rail access card with "Log in to Access"
            expect(html).toContain('Log in to Access');
            expect(html).toContain('Access Notes');

            // ZERO API calls to backend
            expect(apiSpy).not.toHaveBeenCalled();
        });

        it('GUEST-002: Guest clicking access card triggers navigation to /login', async () => {
            const onNavigateSpy = vi.fn();
            const acmSubject = DEMO_SUBJECTS.find(s => s.code === 'ACM');
            const mod1 = acmSubject.modules[0];
            const topic1 = mod1.topics[0];

            await act(async () => {
                root.render(
                    React.createElement(
                        AuthContext.Provider,
                        { value: { user: null, hasPlusAccess: false } },
                        React.createElement(TopicEditorialView, {
                            activeSubject: acmSubject,
                            activeModule: mod1,
                            activeTopic: topic1,
                            hasPlusAccess: false,
                            isDark: true,
                            onNavigate: onNavigateSpy
                        })
                    )
                );
            });

            const buttons = container.querySelectorAll('button');
            const loginBtn = Array.from(buttons).find(b => b.textContent.includes('Log in to Access'));
            expect(loginBtn).not.toBeNull();
            loginBtn.click();
            expect(onNavigateSpy).toHaveBeenCalledWith('/login');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 3: State 2 - Logged-In Free User (Non-Plus)
    // ─────────────────────────────────────────────────────────────────────────
    describe('State 2: Logged-In Free User (Non-Plus)', () => {
        it('FREE-001: renders demo editorial and shows "Upgrade to Plus" in right column', () => {
            const apiSpy = vi.spyOn(academicContentApi, 'getAcademicTopicEditorial');

            const mathSubject = DEMO_SUBJECTS.find(s => s.code === 'AMM1');
            const mod1 = mathSubject.modules[0];
            const topic1 = mod1.topics[0];

            const mockFreeUser = {
                id: 'student_free_123',
                name: 'Alex Student',
                access: { plan: 'FREE' }
            };

            const html = renderToStaticMarkup(
                React.createElement(
                    AuthContext.Provider,
                    { value: { user: mockFreeUser, hasPlusAccess: false } },
                    React.createElement(TopicEditorialView, {
                        activeSubject: mathSubject,
                        activeModule: mod1,
                        activeTopic: topic1,
                        hasPlusAccess: false,
                        isDark: true
                    })
                )
            );

            // Renders math-specific demo editorial
            expect(html).toContain('Angle Between Radius Vector and Tangent');
            expect(html).toContain('Concept Explanation');
            expect(html).toContain('Worked Example');

            // Shows the right rail access card with "Upgrade to Plus"
            expect(html).toContain('Upgrade to Plus');

            // ZERO API calls to backend
            expect(apiSpy).not.toHaveBeenCalled();
        });

        it('FREE-002: Free user clicking access card triggers navigation to /plus', async () => {
            const onNavigateSpy = vi.fn();
            const mathSubject = DEMO_SUBJECTS.find(s => s.code === 'AMM1');
            const mod1 = mathSubject.modules[0];
            const topic1 = mod1.topics[0];
            const mockFreeUser = {
                id: 'student_free_123',
                name: 'Alex Student',
                access: { plan: 'FREE' }
            };

            await act(async () => {
                root.render(
                    React.createElement(
                        AuthContext.Provider,
                        { value: { user: mockFreeUser, hasPlusAccess: false } },
                        React.createElement(TopicEditorialView, {
                            activeSubject: mathSubject,
                            activeModule: mod1,
                            activeTopic: topic1,
                            hasPlusAccess: false,
                            isDark: true,
                            onNavigate: onNavigateSpy
                        })
                    )
                );
            });

            const buttons = container.querySelectorAll('button');
            const upgradeBtn = Array.from(buttons).find(b => b.textContent.includes('Upgrade to Plus'));
            expect(upgradeBtn).not.toBeNull();
            upgradeBtn.click();
            expect(onNavigateSpy).toHaveBeenCalledWith('/plus');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 4: State 3 - Plus User
    // ─────────────────────────────────────────────────────────────────────────
    describe('State 3: Plus User', () => {

        it('PLUS-001: Plus user queries backend API and does NOT display demo access card', async () => {
            const { act } = await import('react');
            const mockApiEditorial = {
                success: true,
                data: {
                    editorial: {
                        title: 'Structure of a C Program & Compilation Workflow',
                        version: 2,
                        status: 'Published',
                        sections: [{ id: 'sec-intro', title: '1. Introduction' }],
                        blocks: [
                            { type: 'heading', level: 1, id: 'sec-title', text: 'Real Plus C Editorial' },
                            { type: 'paragraph', text: 'Proprietary Plus verified editorial content.' }
                        ]
                    }
                }
            };

            const apiSpy = vi.spyOn(academicContentApi, 'getAcademicTopicEditorial')
                .mockResolvedValue(mockApiEditorial);

            const plc5Subject = DEMO_SUBJECTS.find(s => s.code === 'PLC5');
            const mod1 = plc5Subject.modules[0];
            const topic1 = mod1.topics[0];

            const mockPlusUser = {
                id: 'student_plus_999',
                name: 'Premium Member',
                isPlus: true,
                access: { plan: 'PLUS' }
            };

            await act(async () => {
                root.render(
                    React.createElement(
                        AuthContext.Provider,
                        { value: { user: mockPlusUser, hasPlusAccess: true } },
                        React.createElement(TopicEditorialView, {
                            activeSubject: plc5Subject,
                            activeModule: mod1,
                            activeTopic: topic1,
                            hasPlusAccess: true,
                            isDark: true
                        })
                    )
                );
            });

            // Plus user triggers backend API call
            expect(apiSpy).toHaveBeenCalled();

            // Renders real Plus content returned by API
            expect(container.innerHTML).toContain('Proprietary Plus verified editorial content');

            // Right-rail access card ("Upgrade to Plus" / "Log in to Access") is NOT displayed
            expect(container.innerHTML).not.toContain('Upgrade to Plus');
            expect(container.innerHTML).not.toContain('Log in to Access');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // SUITE 5: Full MySubjectsPage & Tab Access Control
    // ─────────────────────────────────────────────────────────────────────────
    describe('State Flow & Tab Access Control in MySubjectsPage', () => {
        it('TABS-001: Guest on PYQs tab sees locked card with "Log in to Access →"', async () => {
            const MySubjectsPageModule = await import('../MySubjectsPage.jsx');
            const MySubjectsPage = MySubjectsPageModule.default;
            const { MemoryRouter, Routes, Route } = await import('react-router-dom');

            await act(async () => {
                root.render(
                    React.createElement(
                        AuthContext.Provider,
                        { value: { user: null, hasPlusAccess: false } },
                        React.createElement(
                            MemoryRouter,
                            { initialEntries: ['/my-subjects/acm/module-1/pyqs'] },
                            React.createElement(
                                Routes,
                                null,
                                React.createElement(Route, {
                                    path: '/my-subjects/:subjectSlug/:moduleSlug/:section',
                                    element: React.createElement(MySubjectsPage)
                                })
                            )
                        )
                    )
                );
            });

            expect(container.innerHTML).toContain('Plus Only');
            expect(container.innerHTML).toContain('Previous Year Questions');
            expect(container.innerHTML).toContain('Log in to Access →');
            expect(container.innerHTML).toContain('Log in to Access');
        });

        it('TABS-002: Logged-in free user on PYQs tab sees locked card with "Upgrade to Plus →"', async () => {
            const MySubjectsPageModule = await import('../MySubjectsPage.jsx');
            const MySubjectsPage = MySubjectsPageModule.default;
            const { MemoryRouter, Routes, Route } = await import('react-router-dom');

            const mockFreeUser = {
                id: 'student_free_456',
                name: 'Free Student',
                access: { plan: 'FREE' }
            };

            await act(async () => {
                root.render(
                    React.createElement(
                        AuthContext.Provider,
                        { value: { user: mockFreeUser, hasPlusAccess: false } },
                        React.createElement(
                            MemoryRouter,
                            { initialEntries: ['/my-subjects/acm/module-1/pyqs'] },
                            React.createElement(
                                Routes,
                                null,
                                React.createElement(Route, {
                                    path: '/my-subjects/:subjectSlug/:moduleSlug/:section',
                                    element: React.createElement(MySubjectsPage)
                                })
                            )
                        )
                    )
                );
            });

            expect(container.innerHTML).toContain('Plus Only');
            expect(container.innerHTML).toContain('Previous Year Questions');
            expect(container.innerHTML).toContain('Upgrade to Plus →');
            expect(container.innerHTML).toContain('Upgrade to Plus');
        });
    });
});
