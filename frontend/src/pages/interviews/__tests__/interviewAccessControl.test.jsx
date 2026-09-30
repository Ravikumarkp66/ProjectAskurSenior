// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { STATIC_DEMO_COMPANIES, getDemoCompanyDetail } from '../../../data/demoInterviewExperiences';
import InterviewPage from '../InterviewPage';
import CompanyRolePage from '../CompanyRolePage';
import InterviewSheetRow from '../../../components/interview/sheet/InterviewSheetRow';
import ExperienceCard from '../../../components/interview/ExperienceCard';
import * as hooks from '../../../utils/hooks';
import { interviewExperiencesAPI } from '../../../services/api';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

if (typeof process !== 'undefined') {
    process.on('unhandledRejection', (reason) => {
        if (reason?.name === 'AbortError' || reason?.message?.includes('animation')) {
            return;
        }
    });
}

if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason?.name === 'AbortError' || event.reason?.message?.includes('animation')) {
            event.preventDefault();
        }
    });
}

describe('Interview Experiences Access Control - Static Demo Dataset', () => {
    it('contains 13 companies with 238 total stories and correct structure', () => {
        expect(STATIC_DEMO_COMPANIES.length).toBe(13);
        const totalStories = STATIC_DEMO_COMPANIES.reduce((acc, c) => acc + (c.totalExperiences || 0), 0);
        expect(totalStories).toBe(238);

        // First company is Amazon 2027
        const amazon2027 = STATIC_DEMO_COMPANIES[0];
        expect(amazon2027.company).toBe('Amazon');
        expect(amazon2027.batch).toBe('2027');
        expect(amazon2027.role).toBe('SUPPORT ENGINEER');
        expect(amazon2027.totalExperiences).toBe(64);
        expect(amazon2027.ctc).toBe('Role Based');
        expect(amazon2027.cutoff).toBe(8.0);
        expect(amazon2027._navSlug).toBe('amazon--2027');

        // Second is Amazon 2026
        const amazon2026 = STATIC_DEMO_COMPANIES[1];
        expect(amazon2026.company).toBe('Amazon');
        expect(amazon2026.batch).toBe('2026');
        expect(amazon2026.totalExperiences).toBe(42);

        // Third is Morgan Stanley
        const morgan = STATIC_DEMO_COMPANIES[2];
        expect(morgan.company).toBe('Morgan Stanley');
        expect(morgan.batch).toBe('2026');
        expect(morgan.role).toBe('Intern (PPO)');
        expect(morgan.ctc).toBe('87K - 1.07L');
        expect(morgan.totalExperiences).toBe(6);
    });

    it('getDemoCompanyDetail resolves Amazon 2027 preview info and locked rounds', () => {
        const detail = getDemoCompanyDetail('amazon--2027');
        expect(detail.companyInfo.company).toBe('Amazon');
        expect(detail.companyInfo.batch).toBe('2027');
        expect(detail.companyInfo.role).toBe('SUPPORT ENGINEER');
        expect(detail.companyInfo.totalExperiences).toBe(64);
        expect(detail.companyInfo.avgRounds).toBe(1);

        // Grouped rounds
        const round1 = detail.groupedRounds['1'];
        expect(round1).toBeDefined();
        expect(round1[0].isLocked).toBe(true);
        expect(round1[0].totalStoriesInRound).toBe(57);
        expect(round1[0].topicsCovered).toContain('SQL Queries & Joins');
        expect(round1[0].topicsCovered).toContain('Object Oriented Programming (OOPS)');
    });

    it('getDemoCompanyDetail provides graceful fallback for arbitrary unknown slug', () => {
        const detail = getDemoCompanyDetail('some-startup-xyz');
        expect(detail.companyInfo.company).toBe('SOME STARTUP XYZ');
        expect(detail.groupedRounds['1']).toBeDefined();
        expect(detail.groupedRounds['1'][0].isLocked).toBe(true);
    });
});

describe('Interview Experiences Access Control - Listing & Detail Component Renders', () => {
    let container = null;
    let root = null;

    beforeEach(() => {
        vi.clearAllMocks();
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

    const testItem = STATIC_DEMO_COMPANIES[0]; // Amazon 2027

    it('NON-LOGGED-IN: View button shows lock icon, tooltip "Login to view experiences", and navigates to /login', () => {
        vi.spyOn(hooks, 'useAuth').mockReturnValue({
            isAuthenticated: false,
            hasPlusAccess: false,
            user: null
        });

        act(() => {
            root.render(
                <MemoryRouter>
                    <table>
                        <tbody>
                            <InterviewSheetRow item={testItem} />
                        </tbody>
                    </table>
                </MemoryRouter>
            );
        });

        const viewButton = container.querySelector('button[title="Login to view experiences"]');
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent).toContain('View');

        act(() => {
            viewButton.click();
        });
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('LOGGED-IN FREE: View button shows lock icon, tooltip "Upgrade to Plus to view experiences", and navigates to /plus', () => {
        vi.spyOn(hooks, 'useAuth').mockReturnValue({
            isAuthenticated: true,
            hasPlusAccess: false,
            user: { name: 'Free User', plan: 'FREE' }
        });

        act(() => {
            root.render(
                <MemoryRouter>
                    <table>
                        <tbody>
                            <InterviewSheetRow item={testItem} />
                        </tbody>
                    </table>
                </MemoryRouter>
            );
        });

        const viewButton = container.querySelector('button[title="Upgrade to Plus to view experiences"]');
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent).toContain('View');

        act(() => {
            viewButton.click();
        });
        expect(mockNavigate).toHaveBeenCalledWith('/plus');
    });

    it('PLUS USER: View button works normally and navigates to /home/interview/:slug', () => {
        vi.spyOn(hooks, 'useAuth').mockReturnValue({
            isAuthenticated: true,
            hasPlusAccess: true,
            user: { name: 'Plus User', isPlus: true }
        });

        act(() => {
            root.render(
                <MemoryRouter>
                    <table>
                        <tbody>
                            <InterviewSheetRow item={testItem} />
                        </tbody>
                    </table>
                </MemoryRouter>
            );
        });

        const viewButton = container.querySelector('button');
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent).toContain('View');

        act(() => {
            viewButton.click();
        });
        expect(mockNavigate).toHaveBeenCalledWith('/home/interview/amazon--2027');
    });

    it('Row click navigates to detail preview for exploration', () => {
        vi.spyOn(hooks, 'useAuth').mockReturnValue({
            isAuthenticated: false,
            hasPlusAccess: false,
            user: null
        });

        act(() => {
            root.render(
                <MemoryRouter>
                    <table>
                        <tbody>
                            <InterviewSheetRow item={testItem} />
                        </tbody>
                    </table>
                </MemoryRouter>
            );
        });

        const row = container.querySelector('tr');
        act(() => {
            row.click();
        });
        expect(mockNavigate).toHaveBeenCalledWith('/home/interview/amazon--2027');
    });

    const lockedData = {
        _id: 'demo-exp-1-1',
        experienceId: 'EXPERIENCE 01',
        roundNumber: 1,
        roundType: 'Technical',
        role: 'SUPPORT ENGINEER',
        companyName: 'Amazon',
        isLocked: true,
        topicsCovered: ['SQL Queries & Joins', 'Object Oriented Programming (OOPS)', 'Hadoop & Distributed Storage'],
        totalStoriesInRound: 57
    };

    it('ExperienceCard: Renders locked state with topics covered and Login to Unlock for guest', () => {
        vi.spyOn(hooks, 'useAuth').mockReturnValue({
            isAuthenticated: false,
            hasPlusAccess: false,
            user: null
        });

        act(() => {
            root.render(
                <MemoryRouter>
                    <ExperienceCard data={lockedData} isLightMode={false} defaultExpanded={true} />
                </MemoryRouter>
            );
        });

        expect(container.textContent).toContain('EXPERIENCE 01');
        expect(container.textContent).toContain('Round 1');
        expect(container.textContent).toContain('Technical');
        expect(container.textContent).toContain('Locked');
        expect(container.textContent).toContain('Topics covered');
        expect(container.textContent).toContain('SQL Queries & Joins');
        expect(container.textContent).toContain('Interview experience locked');
        expect(container.textContent).toContain('Login to Unlock');

        const unlockBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('Login to Unlock'));
        expect(unlockBtn).toBeDefined();

        act(() => {
            unlockBtn.click();
        });
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('ExperienceCard: Renders Unlock with Plus and navigates to /plus for free user', () => {
        vi.spyOn(hooks, 'useAuth').mockReturnValue({
            isAuthenticated: true,
            hasPlusAccess: false,
            user: { name: 'Free Student', plan: 'FREE' }
        });

        act(() => {
            root.render(
                <MemoryRouter>
                    <ExperienceCard data={lockedData} isLightMode={false} defaultExpanded={true} />
                </MemoryRouter>
            );
        });

        expect(container.textContent).toContain('Unlock with Plus');

        const unlockBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.includes('Unlock with Plus'));
        expect(unlockBtn).toBeDefined();

        act(() => {
            unlockBtn.click();
        });
        expect(mockNavigate).toHaveBeenCalledWith('/plus');
    });
});

describe('Interview Experiences - Full Page Zero API & Access Behavior', () => {
    let container = null;
    let root = null;

    beforeEach(() => {
        vi.clearAllMocks();
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

    it('InterviewPage (Listing): Non-logged-in guest generates ZERO API calls and displays demo data', async () => {
        const getCompaniesSpy = vi.spyOn(interviewExperiencesAPI, 'getCompanies');

        vi.spyOn(hooks, 'useAuth').mockReturnValue({
            isAuthenticated: false,
            hasPlusAccess: false,
            user: null
        });

        act(() => {
            root.render(
                <MemoryRouter initialEntries={['/home/interview']}>
                    <InterviewPage />
                </MemoryRouter>
            );
        });

        // ZERO API calls must be made
        expect(getCompaniesSpy).not.toHaveBeenCalled();

        // Displays animated Hero stats and companies
        expect(container.textContent).toContain('ASK+ EXPERIENCES');
        expect(container.textContent).toContain('Amazon');
        expect(container.textContent).toContain('Morgan Stanley');
        expect(container.textContent).toContain('Impact Analytics');

        // View buttons show login tooltip
        const lockedButtons = container.querySelectorAll('button[title="Login to view experiences"]');
        expect(lockedButtons.length).toBeGreaterThan(0);
    });

    it('InterviewPage (Listing): Logged-in Free user generates ZERO API calls and has Upgrade to Plus tooltip', async () => {
        const getCompaniesSpy = vi.spyOn(interviewExperiencesAPI, 'getCompanies');

        vi.spyOn(hooks, 'useAuth').mockReturnValue({
            isAuthenticated: true,
            hasPlusAccess: false,
            user: { name: 'Free User', plan: 'FREE' }
        });

        act(() => {
            root.render(
                <MemoryRouter initialEntries={['/home/interview']}>
                    <InterviewPage />
                </MemoryRouter>
            );
        });

        // ZERO API calls
        expect(getCompaniesSpy).not.toHaveBeenCalled();

        // View buttons show upgrade tooltip
        const lockedButtons = container.querySelectorAll('button[title="Upgrade to Plus to view experiences"]');
        expect(lockedButtons.length).toBeGreaterThan(0);
    });

    it('CompanyRolePage (Detail): Non-Plus user generates ZERO API calls and renders preview structure', async () => {
        const getCompaniesSpy = vi.spyOn(interviewExperiencesAPI, 'getCompanies');
        const getExperiencesSpy = vi.spyOn(interviewExperiencesAPI, 'getExperiences');

        vi.spyOn(hooks, 'useAuth').mockReturnValue({
            isAuthenticated: false,
            hasPlusAccess: false,
            user: null
        });

        act(() => {
            root.render(
                <MemoryRouter initialEntries={['/home/interview/amazon--2027']}>
                    <Routes>
                        <Route path="/home/interview/:id" element={<CompanyRolePage />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        // ZERO API calls
        expect(getCompaniesSpy).not.toHaveBeenCalled();
        expect(getExperiencesSpy).not.toHaveBeenCalled();

        // Displays Amazon 2027 header info
        expect(container.textContent).toContain('Amazon');
        expect(container.textContent).toContain('SUPPORT ENGINEER');
        expect(container.textContent).toContain('2027');
        expect(container.textContent).toContain('64 experiences');

        // Metrics strip
        expect(container.textContent).toContain('Role Based');

        // Interview rounds structure
        expect(container.textContent).toContain('INTERVIEW ROUNDS');
        expect(container.textContent).toContain('ROUND 01');
        expect(container.textContent).toContain('57 STORIES');

        // Locked content
        expect(container.textContent).toContain('Interview experience locked');
        expect(container.textContent).toContain('Topics covered');
        expect(container.textContent).toContain('Login to Unlock');
    });

    it('CompanyRolePage (Detail): Plus user fetches live data and displays full interactive content', async () => {
        const mockCompany = {
            _id: 'comp-123',
            name: 'Amazon',
            representativeRole: 'Software Development Engineer',
            representativeBatch: '2027',
            representativeCtc: 'Role Based'
        };

        const mockExperiences = [
            {
                _id: 'exp-live-1',
                role: 'Software Development Engineer',
                batch: '2027',
                rounds: [
                    {
                        roundNumber: 1,
                        type: 'Technical Interview',
                        notes: ['Dynamic programming discussion', 'Graph traversal live coding'],
                        questions: [
                            { text: 'Implement LRU Cache in O(1)', solveLink: 'https://leetcode.com/problems/lru-cache' }
                        ]
                    }
                ]
            }
        ];

        vi.spyOn(interviewExperiencesAPI, 'getCompanies').mockResolvedValue({
            status: 200,
            data: [mockCompany]
        });

        vi.spyOn(interviewExperiencesAPI, 'getExperiences').mockResolvedValue({
            status: 200,
            data: mockExperiences
        });

        vi.spyOn(hooks, 'useAuth').mockReturnValue({
            isAuthenticated: true,
            hasPlusAccess: true,
            user: { name: 'Plus Student', isPlus: true }
        });

        await act(async () => {
            root.render(
                <MemoryRouter initialEntries={['/home/interview/comp-123']}>
                    <Routes>
                        <Route path="/home/interview/:id" element={<CompanyRolePage />} />
                    </Routes>
                </MemoryRouter>
            );
        });

        expect(interviewExperiencesAPI.getCompanies).toHaveBeenCalled();
        expect(interviewExperiencesAPI.getExperiences).toHaveBeenCalled();

        expect(container.textContent).toContain('Amazon');
        expect(container.textContent).toContain('ROUND 01');
        expect(container.textContent).toContain('Implement LRU Cache in O(1)');
        expect(container.textContent).toContain('Solve Problem');
        expect(container.textContent).not.toContain('Interview experience locked');
    });
});
