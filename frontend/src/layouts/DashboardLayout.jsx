import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { apiClient } from '../services/api';
import DashboardSidebar from '../components/DashboardSidebar';
import SubjectSidebar from '../components/SubjectSidebar';
import { MOCK_SUBJECTS, SCHEMES } from '../data/mockSubjects';
import { BRANCHES, toBackendBranch } from '../utils/constants';
import { 
    CalendarRange, BookOpen, GraduationCap, ChevronDown, 
    Home, Plus, User, Settings, Star, HelpCircle, LogOut, Sun, Moon, X, Bell 
} from 'lucide-react';
import NavLogo from '../components/navbar/NavLogo';
import SubjectContext from '../contexts/SubjectContext';
import RightPanel from '../components/dashboard/RightPanel';
import UniversalMobileDrawer from '../components/UniversalMobileDrawer';

const YEAR_SEMESTERS = {
    first:   { sem: 'Semester 1 & 2', label: '1st Year' },
    second:  { sem: 'Semester 3 & 4', label: '2nd Year' },
    third:   { sem: 'Semester 5 & 6', label: '3rd Year' },
    fourth:  { sem: 'Semester 7 & 8', label: '4th Year' },
};

const RIGHT_PANEL_WIDTH = 340;

const MAIN_NAV_ITEMS = [
    { id: 'home', label: 'Home', path: '/home', icon: Home },
    { id: 'plus', label: 'Plus', path: '/plus', icon: Plus },
];

const ACCOUNT_NAV_ITEMS = [
    { id: 'profile', label: 'My Profile', path: '/profile', icon: User },
    { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
    { id: 'notifications', label: 'Notifications', path: '/settings', icon: Bell },
    { id: 'support', label: 'Help & Support', path: '/support', icon: HelpCircle },
];

const DashboardLayout = () => {
    const { isDark, toggleTheme } = useTheme();
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Check if we are on a subject or registration route
    const yearMatch = location.pathname.match(/\/plus\/(first|second|third|fourth)-year/);
    const currentYearStr = yearMatch ? yearMatch[1] : null;
    const isSubjectRoute = !!currentYearStr;
    const isMySubjectsRoute = location.pathname.includes('my-subjects');
    const isSubjectRegistrationRoute = location.pathname.includes('subject-registration') || location.pathname.includes('academic-setup');
    const isStudentAcademicsRoute = location.pathname.startsWith('/student-academics') || location.pathname.includes('academic-register');
    const isMainDashboardRoute = location.pathname === '/home' || location.pathname === '/plus' || location.pathname === '/home/' || location.pathname === '/plus/';
    const isHomeOrPlusRoute = location.pathname.startsWith('/home') || location.pathname.startsWith('/plus');
    const isAttendanceRoute = location.pathname.includes('attendance') || location.pathname.includes('timetable') || location.pathname.includes('cie') || location.pathname.includes('sgpa');
    const showRightPanel = isHomeOrPlusRoute && !isSubjectRoute && !isMySubjectsRoute && !isSubjectRegistrationRoute && !isAttendanceRoute && !isStudentAcademicsRoute;
    
    // Active navigation states
    const isHomeActive = location.pathname === '/plus' || location.pathname === '/home';
    const isTrackActive = isSubjectRoute;

    // Sidebar Collapse state (Desktop only, persistent in localStorage)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            const saved = localStorage.getItem('sidebar_collapsed');
            return saved === 'true';
        } catch (e) {
            return false;
        }
    });

    const toggleCollapse = () => {
        setSidebarCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar_collapsed', String(next));
            return next;
        });
    };

    // Pinned subjects state (persistent in localStorage)
    const [pinnedIds, setPinnedIds] = useState(() => {
        try {
            const saved = localStorage.getItem('pinned_subjects');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const togglePin = (subjId) => {
        setPinnedIds(prev => {
            const next = prev.includes(subjId)
                ? prev.filter(id => id !== subjId)
                : [...prev, subjId];
            localStorage.setItem('pinned_subjects', JSON.stringify(next));
            return next;
        });
    };

    const sidebarWidth = isSubjectRoute ? (sidebarCollapsed ? 80 : 300) : 80;

    // Responsiveness & Single Authoritative Mobile Sidebar Drawer State
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeMobileTab, setActiveMobileTab] = useState('home');

    const isDesktop = windowWidth >= 768;
    const isLargeDesktop = windowWidth >= 1024;
    const isMobile  = windowWidth < 768;

    // Route change handling
    useEffect(() => {
        setActiveMobileTab('home');
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Scheme & Branch state — persisted in localStorage to survive navigation
    const [selectedScheme, setSelectedScheme] = useState(() => {
        try { return localStorage.getItem('year_scheme') || '2025 Scheme'; } catch { return '2025 Scheme'; }
    });
    const [selectedBranch, setSelectedBranch] = useState(() => {
        try { return localStorage.getItem('year_branch') || (user?.branch || user?.currentBranch || 'CS'); } catch { return 'CS'; }
    });

    const handleSchemeChange = (scheme) => {
        setSelectedScheme(scheme);
        localStorage.setItem('year_scheme', scheme);
    };
    const handleBranchChange = (branch) => {
        setSelectedBranch(branch);
        localStorage.setItem('year_branch', branch);
    };

    // Branches list — sourced from the canonical constants (excludes ALL)
    const branchesList = BRANCHES.filter(b => b.code !== 'ALL');
    // Full name of the selected branch
    const branchLabel = branchesList.find(b => b.code === selectedBranch)?.name || selectedBranch;

    // Fetch subjects list for SubjectSidebar
    const [subjects, setSubjects] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [subjectSearch, setSubjectSearch] = useState('');
    const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);

    useEffect(() => {
        if (!currentYearStr) return;

        let mounted = true;
        setLoadingSubjects(true);
        const backendBranch = toBackendBranch(selectedBranch);
        const params = { branch: backendBranch };

        apiClient.get('/cms/subjects', { params })
            .then(res => {
                if (!mounted) return;
                const yearMap = { first: '1st Year', second: '2nd Year', third: '3rd Year', fourth: '4th Year' };
                const targetYear = yearMap[currentYearStr];
                const raw = Array.isArray(res.data) ? res.data : [];
                
                // Filter by year or cycle (for 1st year)
                let list = raw
                    .filter(s => {
                        if (currentYearStr === 'first') {
                            return !s.year || s.year === '1st Year' || s.cycle;
                        }
                        return s.year === targetYear;
                    })
                    .map(s => ({
                        id: s.slug || s._id,
                        name: s.name,
                        code: s.code || '—',
                        credits: s.credits || 3,
                        semester: s.year || targetYear
                    }));

                // Fallback to MOCK_SUBJECTS if list is empty for 2nd/3rd/4th year
                if (list.length === 0 && currentYearStr !== 'first') {
                    const yearKey = `${currentYearStr}-year`;
                    const branchCode = selectedBranch === 'CS' ? 'CSE' : selectedBranch === 'IS' ? 'ISE' : selectedBranch === 'EC' ? 'ECE' : selectedBranch;
                    const mockObj = MOCK_SUBJECTS[yearKey]?.[selectedScheme]?.[branchCode] 
                        || MOCK_SUBJECTS[yearKey]?.['2025 Scheme']?.['CSE'] 
                        || [];
                    list = mockObj.map(s => ({ ...s, semester: targetYear }));
                }

                setSubjects(list);
            })
            .catch(() => {
                if (!mounted) return;
                // Fallback on API error
                const yearMap = { first: '1st Year', second: '2nd Year', third: '3rd Year', fourth: '4th Year' };
                const targetYear = yearMap[currentYearStr];
                const yearKey = `${currentYearStr}-year`;
                const branchCode = selectedBranch === 'CS' ? 'CSE' : selectedBranch === 'IS' ? 'ISE' : selectedBranch === 'EC' ? 'ECE' : selectedBranch;
                const mockObj = MOCK_SUBJECTS[yearKey]?.[selectedScheme]?.[branchCode] || MOCK_SUBJECTS[yearKey]?.['2025 Scheme']?.['CSE'] || [];
                const list = mockObj.map(s => ({ ...s, semester: targetYear }));
                setSubjects(list);
            })
            .finally(() => { if (mounted) setLoadingSubjects(false); });

        return () => { mounted = false; };
    }, [currentYearStr, selectedBranch, selectedScheme]);

    // When scheme/branch changes, reset subjects so useEffect re-runs
    useEffect(() => {
        if (currentYearStr) {
            setSubjects([]);
        }
    }, [selectedBranch, currentYearStr, selectedScheme]);

    const filteredSubjects = useMemo(() => {
        if (!subjectSearch.trim()) return subjects;
        const q = subjectSearch.trim().toLowerCase();
        return subjects.filter(s => s.name.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q));
    }, [subjects, subjectSearch]);

    // Extract active subjectId from route parameters
    const match = location.pathname.match(/\/subject\/([^/]+)/);
    const activeSubjectId = match ? decodeURIComponent(match[1]) : null;

    const onSelectSubject = (subj) => {
        if (currentYearStr) {
            navigate(`/plus/${currentYearStr}-year/subject/${encodeURIComponent(subj.id)}/content`);
        }
    };

    const handleHomeClick = () => {
        navigate('/plus');
    };

    const handleTrackClick = () => {
        navigate('/plus/first-year');
    };

    // Auto-navigate to the first subject if on any year base path (e.g. /plus/first-year, /plus/second-year, etc.)
    useEffect(() => {
        if (currentYearStr && (
            location.pathname === `/plus/${currentYearStr}-year` || 
            location.pathname === `/plus/${currentYearStr}-year/`
        ) && subjects.length > 0) {
            navigate(`/plus/${currentYearStr}-year/subject/${encodeURIComponent(subjects[0].id)}/content`, { replace: true });
        }
    }, [location.pathname, subjects, navigate, currentYearStr]);

    return (
        <div style={{
            height: '100vh',
            overflow: 'hidden',
            background: isDark ? '#07050f' : '#f1f5f9',
            color: isDark ? '#f8fafc' : '#0f172a',
            display: 'flex',
            position: 'relative'
        }}>
            {/* Desktop Sidebar Container (≥ 1024px) */}
            {isDesktop && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    width: sidebarWidth,
                    zIndex: 40,
                    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                    {isSubjectRoute ? (
                        <SubjectSidebar
                            search={subjectSearch}
                            onSearchChange={(e) => setSubjectSearch(e.target.value)}
                            subjects={filteredSubjects}
                            activeId={activeSubjectId}
                            onSelectSubject={onSelectSubject}
                            loading={loadingSubjects}
                            onHome={handleHomeClick}
                            onTrack={handleTrackClick}
                            user={user}
                            isCollapsed={sidebarCollapsed}
                            onToggleCollapse={toggleCollapse}
                            pinnedIds={pinnedIds}
                            onTogglePin={togglePin}
                            isHomeActive={isHomeActive}
                            isTrackActive={isTrackActive}
                        />
                    ) : (
                        <DashboardSidebar />
                    )}
                </div>
            )}



            {/* Main Content Area Wrapper */}
            <div
                style={{
                    flex: 1,
                    marginLeft: isDesktop ? sidebarWidth : 0,
                    height: '100vh',
                    display: (isLargeDesktop && showRightPanel) ? 'grid' : 'block',
                    gridTemplateColumns: (isLargeDesktop && showRightPanel) ? `minmax(0, 1fr) ${RIGHT_PANEL_WIDTH}px` : 'none',
                    columnGap: 0,
                    alignItems: 'stretch',
                    overflow: 'hidden',
                    transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    paddingTop: (isMobile && isMainDashboardRoute) ? '96px' : (isMobile ? '56px' : 0),
                }}
            >
                {/* Dedicated Mobile Header Bar (< 768px) */}
                {isMobile && (
                    <header
                        className="fixed top-0 left-0 right-0 z-30 backdrop-blur-md px-4 h-14"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto 1fr',
                            alignItems: 'center',
                            background: 'var(--navbar-bg)',
                            borderBottom: '1px solid var(--navbar-border)'
                        }}
                    >
                        {/* Left: AskUrSenior Logo */}
                        <div className="flex items-center justify-start">
                            <NavLogo />
                        </div>

                        {/* Center: "Subjects ▼" / "Subjects ▲" Selector (Only on subject routes) */}
                        <div className="flex items-center justify-center">
                            {isSubjectRoute && (
                                <button
                                    type="button"
                                    onClick={() => setIsSubjectsModalOpen(prev => !prev)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: isSubjectsModalOpen
                                            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(99, 102, 241, 0.25))'
                                            : 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(99, 102, 241, 0.12))',
                                        border: `1px solid ${isSubjectsModalOpen ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.3)'}`,
                                        borderRadius: '10px',
                                        padding: '6px 14px',
                                        color: '#c4b5fd',
                                        fontSize: '13px',
                                        fontWeight: 650,
                                        cursor: 'pointer',
                                        outline: 'none',
                                        boxShadow: isSubjectsModalOpen
                                            ? '0 0 12px rgba(124, 58, 237, 0.3)'
                                            : '0 2px 8px rgba(124, 58, 237, 0.15)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <BookOpen size={14} color="#a78bfa" />
                                    <span>Subjects {isSubjectsModalOpen ? '▲' : '▼'}</span>
                                </button>
                            )}
                        </div>

                        {/* Right: Hamburger button ☰ (3 horizontal lines) */}
                        <div className="flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="w-9 h-9 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30 hover:bg-purple-700 active:scale-90 transition-all border border-purple-500 flex items-center justify-center cursor-pointer"
                                aria-label="Open menu"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </header>
                )}

                {/* Mobile Segmented Navigation (< 768px) - ONLY ON HOME & PLUS MAIN PAGES */}
                {isMobile && isMainDashboardRoute && (
                    <div className="fixed top-14 left-0 right-0 z-20 bg-[#07050f]/95 backdrop-blur-md border-b border-white/10 px-4 py-2 flex items-center justify-center gap-2 overflow-x-auto scrollbar-none text-xs font-semibold">
                        <button
                            onClick={() => setActiveMobileTab('home')}
                            className={`px-4 py-1.5 rounded-full transition-all shrink-0 active:scale-95 ${
                                activeMobileTab === 'home'
                                    ? 'bg-purple-600/40 border border-purple-500/60 text-purple-100 font-bold shadow-lg shadow-purple-900/30'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300'
                            }`}
                        >
                            Home
                        </button>
                        <button
                            onClick={() => setActiveMobileTab('planner')}
                            className={`px-4 py-1.5 rounded-full transition-all shrink-0 active:scale-95 ${
                                activeMobileTab === 'planner'
                                    ? 'bg-purple-600/40 border border-purple-500/60 text-purple-100 font-bold shadow-lg shadow-purple-900/30'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300'
                            }`}
                        >
                            Planner
                        </button>
                        <button
                            onClick={() => setActiveMobileTab('overview')}
                            className={`px-4 py-1.5 rounded-full transition-all shrink-0 active:scale-95 ${
                                activeMobileTab === 'overview'
                                    ? 'bg-purple-600/40 border border-purple-500/60 text-purple-100 font-bold shadow-lg shadow-purple-900/30'
                                    : 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300'
                            }`}
                        >
                            Overview
                        </button>
                    </div>
                )}

                {/* Main Scrollable View */}

                {/* Main Scrollable View */}
                <main
                    style={{
                        height: (isMobile && isMainDashboardRoute) ? 'calc(100vh - 96px)' : (isMobile ? 'calc(100vh - 56px)' : (!isDesktop ? 'calc(100vh - 56px)' : '100vh')),
                        minWidth: 0,
                        padding: (isSubjectRoute || isMySubjectsRoute) ? '0' : (isDesktop ? '16px 0 16px 16px' : '12px 16px 24px'),
                        overflowY: 'auto',
                        overscrollBehavior: 'contain',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    className="dashboard-scroll-region"
                >
                    {/* ── Year Header with Scheme + Branch Switchers (2nd/3rd/4th year only) ── */}
                    {isSubjectRoute && currentYearStr !== 'first' && (
                        <div style={{
                            flexShrink: 0,
                            borderBottom: '1px solid rgba(139,92,246,0.12)',
                            background: 'rgba(7,5,15,0.98)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            position: 'sticky',
                            top: 0,
                            zIndex: 20,
                            padding: '14px 28px 12px',
                        }}>
                            {/* Row 1: Title + Chips */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                                {/* Left: Title + Subtitle */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <CalendarRange
                                            size={16}
                                            strokeWidth={1.75}
                                            style={{ color: 'rgba(139,92,246,0.65)', flexShrink: 0 }}
                                        />
                                        <h1 style={{
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: '#f1f5f9',
                                            letterSpacing: '-0.025em',
                                            margin: 0,
                                            lineHeight: 1,
                                        }}>
                                            {currentYearStr.charAt(0).toUpperCase() + currentYearStr.slice(1)} Year
                                        </h1>
                                    </div>
                                    {/* Subtitle: semester range */}
                                    <p style={{
                                        fontSize: 11,
                                        color: 'rgba(148,163,184,0.7)',
                                        margin: 0,
                                        letterSpacing: '0.01em',
                                        paddingLeft: 24,
                                    }}>
                                        {YEAR_SEMESTERS[currentYearStr]?.sem || 'Upcoming Semesters'}
                                    </p>
                                    {/* Personalized context line */}
                                    <p style={{
                                        fontSize: 11,
                                        color: 'rgba(167,139,250,0.55)',
                                        margin: '1px 0 0',
                                        letterSpacing: '0.005em',
                                        paddingLeft: 24,
                                    }}>
                                        {branchLabel} &bull; {selectedScheme}
                                    </p>
                                </div>

                                {/* Right: Chip selectors — equal width, matching style */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                    {/* Scheme Chip */}
                                    <div style={{
                                        position: 'relative',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '0 12px',
                                        borderRadius: 20,
                                        background: 'rgba(139,92,246,0.07)',
                                        border: '1px solid rgba(139,92,246,0.2)',
                                        cursor: 'pointer',
                                        height: 32,
                                        minWidth: 130,
                                        transition: 'border-color 0.15s, background 0.15s',
                                    }}>
                                        <BookOpen
                                            size={14}
                                            strokeWidth={1.75}
                                            style={{ color: 'rgba(139,92,246,0.7)', flexShrink: 0, pointerEvents: 'none' }}
                                        />
                                        <span style={{
                                            color: '#c4b5fd',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            letterSpacing: '0.01em',
                                            whiteSpace: 'nowrap',
                                            flex: 1,
                                            pointerEvents: 'none',
                                        }}>
                                            {selectedScheme}
                                        </span>
                                        <ChevronDown
                                            size={11}
                                            strokeWidth={2}
                                            style={{ color: 'rgba(139,92,246,0.5)', flexShrink: 0, pointerEvents: 'none' }}
                                        />
                                        <select
                                            value={selectedScheme}
                                            onChange={e => handleSchemeChange(e.target.value)}
                                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                        >
                                            {SCHEMES.map(s => <option key={s} value={s} style={{ background: '#0f0a1e', color: '#e2e8f0' }}>{s}</option>)}
                                        </select>
                                    </div>

                                    {/* Branch Chip */}
                                    <div style={{
                                        position: 'relative',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '0 12px',
                                        borderRadius: 20,
                                        background: 'rgba(139,92,246,0.07)',
                                        border: '1px solid rgba(139,92,246,0.2)',
                                        cursor: 'pointer',
                                        height: 32,
                                        minWidth: 130,
                                        transition: 'border-color 0.15s, background 0.15s',
                                    }}>
                                        <GraduationCap
                                            size={14}
                                            strokeWidth={1.75}
                                            style={{ color: 'rgba(139,92,246,0.7)', flexShrink: 0, pointerEvents: 'none' }}
                                        />
                                        <span style={{
                                            color: '#c4b5fd',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            letterSpacing: '0.01em',
                                            whiteSpace: 'nowrap',
                                            flex: 1,
                                            pointerEvents: 'none',
                                        }}>
                                            {branchLabel}
                                        </span>
                                        <ChevronDown
                                            size={11}
                                            strokeWidth={2}
                                            style={{ color: 'rgba(139,92,246,0.5)', flexShrink: 0, pointerEvents: 'none' }}
                                        />
                                        <select
                                            value={selectedBranch}
                                            onChange={e => handleBranchChange(e.target.value)}
                                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                        >
                                            {branchesList.map(b => <option key={b.code} value={b.code} style={{ background: '#0f0a1e', color: '#e2e8f0' }}>{b.code} – {b.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', scrollbarWidth: 'none' }} className="dashboard-scroll-region">
                        <SubjectContext.Provider value={{
                            subjects,
                            filteredSubjects,
                            subjectSearch,
                            setSubjectSearch: e => setSubjectSearch(e.target?.value ?? e),
                            onSelectSubject,
                            loadingSubjects,
                            activeSubjectId,
                            pinnedIds,
                            onTogglePin: togglePin,
                            isSubjectsModalOpen,
                            setIsSubjectsModalOpen
                        }}>
                            <Outlet context={{ isDark, theme: isDark ? 'dark' : 'light', isLightMode: !isDark, activeMobileTab, setActiveMobileTab, isMobile }} />
                        </SubjectContext.Provider>
                    </div>
                </main>

                {/* Right Panel (Only on main dashboard page on LARGE DESKTOP >= 1024px) */}
                {isLargeDesktop && showRightPanel && (
                    <aside
                        style={{
                            height: '100vh',
                            padding: '16px 16px 16px 0',
                            overflowY: 'auto',
                            overscrollBehavior: 'contain',
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                        }}
                        className="dashboard-scroll-region"
                    >
                        <div id="dashboard-right-panel">
                            <RightPanel />
                        </div>
                    </aside>
                )}
            </div>

            {/* Universal Mobile Sidebar Drawer (< 768px) */}
            <UniversalMobileDrawer
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />
        </div>
    );
};

export default DashboardLayout;
