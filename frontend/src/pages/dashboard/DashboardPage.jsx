import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../context/AuthContext';
import { apiV2 } from '../../services/authService';
import RightPanel, {
    StudentDetailsWidget,
    MaterialsOverviewWidget,
    AcademicStreakWidget,
    DailyPlannerWidget
} from '../../components/dashboard/RightPanel';
import { subjectAPI } from '../../services/api';
import { 
    X, Check, Plus, Trash2, Award, Flame, Calendar, Clock, BookOpen, 
    Calculator, Sparkles, ExternalLink, ShieldCheck, 
    AlertTriangle, TrendingUp, Compass, Video, Users, CheckSquare, MessageSquare
} from 'lucide-react';
import IllustrationCard from '../../components/common/IllustrationCard';
import YearCardSVG from '../../components/common/YearCardSVG';

/* ═══════════════════════════════════════════════════════════════════
   SECTION HEADER
═══════════════════════════════════════════════════════════════════ */
const SectionHeader = ({ title, subtitle, badge, action }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#E2E8F0', margin: 0, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>{title}</h2>
            {subtitle && <p style={{ fontSize: 13, color: '#8B949E', margin: '4px 0 0 0' }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {badge && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: `0.5px solid ${badge.borderColor}`, color: badge.color, backgroundColor: badge.bgColor }}>
                    {badge.text}
                </span>
            )}
            {action && (
                <button onClick={action.onClick} style={{ background: 'none', border: 'none', color: action.color || '#7C3AED', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
                    {action.label}
                </button>
            )}
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   YEAR CARD (Academics)
═══════════════════════════════════════════════════════════════════ */
const renderCardIcon = (iconName, color) => {
    const style = { width: 22, height: 22, color, display: 'block' };
    switch (iconName) {
        case 'ti-atom':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={style}>
                    <circle cx="12" cy="12" r="2.5" />
                    <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(30 12 12)" />
                    <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(90 12 12)" />
                    <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(150 12 12)" />
                </svg>
            );
        case 'ti-cpu':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={style}>
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <rect x="9" y="9" width="6" height="6" rx="1" />
                    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
                </svg>
            );
        case 'ti-brain':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={style}>
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2Z" />
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2Z" />
                </svg>
            );
        case 'ti-rocket':
            return (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={style}>
                    <path d="M4.5 16.5c-1.5 1.26-2 3.5-2 3.5s2.24-.5 3.5-2M9 15l-3-3L22 2L12 22L9 15Z" />
                    <path d="M9 15l-3-3" />
                    <path d="M15 9l-3-3" />
                </svg>
            );
        default:
            return <i className={iconName} style={{ fontSize: 20, color }}></i>;
    }
};

const YearCard = ({ num, badgeLabel, icon, name, detail, subjects, colors, onClick }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            style={{
                display: 'flex', flexDirection: 'column', borderRadius: 14, overflow: 'hidden',
                border: `0.5px solid ${hovered ? colors.hoverBorder : colors.border}`,
                backgroundColor: colors.bg, cursor: 'pointer',
                transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: hovered ? '0 12px 28px rgba(0,0,0,0.45)' : 'none',
                height: '100%',
            }}
        >
            <div style={{ flex: 1, padding: '16px 14px 12px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-4px', bottom: '-10px', fontSize: 64, fontWeight: 800, opacity: 0.07, color: colors.accent, userSelect: 'none', lineHeight: 1 }}>{num}</div>
                <div style={{ display: 'flex', marginBottom: 12 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, backgroundColor: colors.badgeBg, color: colors.badgeText, letterSpacing: '0.05em' }}>{badgeLabel}</span>
                </div>
                <div style={{ marginBottom: 10 }}>{renderCardIcon(icon, colors.accent)}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: colors.nameColor, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>{name}</h3>
                <p style={{ fontSize: 11, color: colors.detailColor, margin: 0, fontWeight: 500 }}>{detail}</p>
            </div>
            <div style={{ padding: '10px 14px', borderTop: `0.5px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                    {subjects.map(s => (
                        <span key={s} style={{ fontSize: 9, color: '#8B949E', backgroundColor: 'rgba(255,255,255,0.03)', padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap' }}>{s}</span>
                    ))}
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: colors.accent, whiteSpace: 'nowrap' }}>Explore →</span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   GENERIC CARD
═══════════════════════════════════════════════════════════════════ */
const CustomCard = ({ title, badge, subtitle, icon: Icon, accent, visualContent, footerText, onClick }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 14,
                border: `0.5px solid ${hovered ? accent : '#21262D'}`,
                backgroundColor: '#161B22',
                cursor: 'pointer',
                transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                overflow: 'hidden',
                boxShadow: hovered ? '0 12px 28px rgba(0,0,0,0.4)' : 'none',
                height: '100%',
            }}
        >
            <div style={{ padding: '18px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: `${accent}15`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} style={{ color: accent }} />
                    </div>
                    {badge && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, backgroundColor: `${accent}20`, color: accent, letterSpacing: '0.04em' }}>
                            {badge}
                        </span>
                    )}
                </div>
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#E2E8F0', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{title}</h3>
                    {subtitle && <p style={{ fontSize: 11, color: '#8B949E', margin: '4px 0 0', lineHeight: 1.45 }}>{subtitle}</p>}
                </div>
                {visualContent && (
                    <div style={{ marginTop: 4 }}>
                        {visualContent}
                    </div>
                )}
            </div>
            <div style={{ padding: '10px 16px', borderTop: '0.5px solid #21262D', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.18)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: accent }}>{footerText || 'Open Tool →'}</span>
                <span style={{ fontSize: 12, color: hovered ? accent : '#8B949E', transition: 'color 0.15s, transform 0.15s', transform: hovered ? 'translateX(3px)' : 'none' }}>→</span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   PREDICTORS & UTILITY MODALS
═══════════════════════════════════════════════════════════════════ */
const ToolModal = ({ title, isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ backgroundColor: '#0F0B1E', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16, width: '100%', maxWidth: 500, overflowY: 'auto', padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94A3B8', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={16} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN DASHBOARD PAGE
═══════════════════════════════════════════════════════════════════ */
const DashboardPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const context = useOutletContext() || {};
    const { activeMobileTab = 'home' } = context;
    const { user } = useContext(AuthContext);
    const [rightSlot, setRightSlot] = useState(null);

    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    // Registered Subjects state for Academic Journey dependency derivation
    const [registeredSubjects, setRegisteredSubjects] = useState([]);
    const [isRegisteredLoading, setIsRegisteredLoading] = useState(true);

    useEffect(() => {
        const fetchRegistered = async () => {
            try {
                const res = await apiV2.getRegisteredSubjects();
                if (res?.data?.data) {
                    setRegisteredSubjects(res.data.data);
                }
            } catch (err) {
                console.warn('[DashboardPage] Failed to fetch registered subjects:', err);
            } finally {
                setIsRegisteredLoading(false);
            }
        };
        fetchRegistered();
    }, []);

    const isSubjectRegistrationComplete = registeredSubjects.length > 0;
    const totalRegisteredCredits = registeredSubjects.reduce(
        (sum, item) => sum + (item.registeredCredits || item.subject?.credits || 0),
        0
    );

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isDesktop = windowWidth >= 1024;

    // Modal states
    const [activeModal, setActiveModal] = useState(null);

    // Year stats state
    const [firstYearStats,  setFirstYearStats]  = useState({ subjects: 6, materials: 0 });
    const [secondYearStats, setSecondYearStats] = useState({ subjects: 0, materials: 0 });
    const [thirdYearStats,  setThirdYearStats]  = useState({ subjects: 0, materials: 0 });
    const [fourthYearStats, setFourthYearStats] = useState({ subjects: 0, materials: 0 });

    // Interactive predictor state
    const [cieMarks, setCieMarks] = useState(38);
    const [attPct, setAttPct] = useState(82);
    const [backlogs, setBacklogs] = useState(1);
    const [sgpaVal, setSgpaVal] = useState(8.8);
    const [targetBranch, setTargetBranch] = useState('CSE (Computer Science)');

    // Interactive Todo list state
    const [todos, setTodos] = useState([
        { id: 1, text: 'Submit OS Assignment Module 3', done: false, tag: 'Urgent' },
        { id: 2, text: 'Revise DBMS SQL Queries for CIE', done: true, tag: 'Academics' },
        { id: 3, text: 'Solve 2 LeetCode Tree Problems', done: false, tag: 'Coding' },
    ]);
    const [newTodo, setNewTodo] = useState('');

    useEffect(() => {
        if (location.pathname.includes('/eligibility-checker')) setActiveModal('eligibility');
        else if (location.pathname.includes('/year-back-predictor')) setActiveModal('yearback');
        else if (location.pathname.includes('/branch-change-predictor')) setActiveModal('branch');
        else if (location.pathname.includes('/sessions')) setActiveModal('sessions');
        else if (location.pathname.includes('/todo')) setActiveModal('todo');
        else if (location.pathname.includes('/leaderboard')) setActiveModal('leaderboard');
        else if (location.pathname.includes('/whatsapp-community')) {
            window.open('https://chat.whatsapp.com/demo-invite-link', '_blank');
        }

        const fetchStats = async () => {
            try {
                const [r1, r2, r3, r4] = await Promise.allSettled([
                    subjectAPI.getFirstYearStats(),
                    subjectAPI.getYearStats('2nd Year'),
                    subjectAPI.getYearStats('3rd Year'),
                    subjectAPI.getYearStats('4th Year'),
                ]);
                if (r1.status === 'fulfilled' && r1.value.data) setFirstYearStats({ subjects: r1.value.data.subjectsCount, materials: r1.value.data.materialsCount });
                if (r2.status === 'fulfilled' && r2.value.data) setSecondYearStats({ subjects: r2.value.data.subjectsCount, materials: r2.value.data.materialsCount });
                if (r3.status === 'fulfilled' && r3.value.data) setThirdYearStats({ subjects: r3.value.data.subjectsCount, materials: r3.value.data.materialsCount });
                if (r4.status === 'fulfilled' && r4.value.data) setFourthYearStats({ subjects: r4.value.data.subjectsCount, materials: r4.value.data.materialsCount });
            } catch (err) {
                console.error('Failed to fetch year stats', err);
            }
        };
        fetchStats();
    }, [location.pathname]);

    const buildDetail = ({ subjects, materials }) =>
        subjects > 0 ? `${subjects} subjects${materials > 0 ? ` · ${materials} materials` : ''}` : 'Loading…';

    const firstYearDetail  = buildDetail(firstYearStats);
    const secondYearDetail = buildDetail(secondYearStats);
    const thirdYearDetail  = buildDetail(thirdYearStats);
    const fourthYearDetail = fourthYearStats.subjects > 0 ? buildDetail(fourthYearStats) : 'Sem 7–8 · Coming Soon';
    const totalSubjects    = (firstYearStats.subjects || 0) + (secondYearStats.subjects || 0) + (thirdYearStats.subjects || 0) + (fourthYearStats.subjects || 0);

    const academicCards = [
        { year: 1, title: 'First Year', stats: firstYearStats, onClick: () => navigate('/plus/first-year') },
        { year: 2, title: 'Second Year', stats: secondYearStats, onClick: () => navigate('/plus/second-year') },
        { year: 3, title: 'Third Year', stats: thirdYearStats, onClick: () => navigate('/plus/third-year') },
        { year: 4, title: 'Fourth Year', stats: fourthYearStats, onClick: () => navigate('/plus/fourth-year') },
    ];

    return (
        <div id="dashboard-main-sections" className="flex-1 min-w-0 overflow-y-auto px-4 md:px-6 py-5 flex flex-col gap-6 md:gap-10">

            {/* OVERVIEW TAB CONTENT (MOBILE ONLY) */}
            {!isDesktop && activeMobileTab === 'overview' && (
                <div id="dashboard-overview-section" className="flex flex-col gap-4">
                    <SectionHeader
                        title="Student Overview"
                        subtitle="Your profile info & study material statistics"
                        badge={{ text: 'Student Profile', color: '#3b82f6', borderColor: 'rgba(59,130,246,.3)', bgColor: 'rgba(59,130,246,.06)' }}
                    />
                    <StudentDetailsWidget user={user} />
                    <MaterialsOverviewWidget user={user} />
                </div>
            )}

            {/* PLANNER TAB CONTENT (MOBILE ONLY) */}
            {!isDesktop && activeMobileTab === 'planner' && (
                <div id="dashboard-planner-section" className="flex flex-col gap-4">
                    <SectionHeader
                        title="Daily Planner & Streaks"
                        subtitle="Track your study habits, tasks and academic streak"
                        badge={{ text: 'Habits & Planner', color: '#f59e0b', borderColor: 'rgba(245,158,11,.3)', bgColor: 'rgba(245,158,11,.06)' }}
                    />
                    <AcademicStreakWidget user={user} />
                    <DailyPlannerWidget />
                </div>
            )}

            {/* HOME TAB CONTENT (DESKTOP OR MOBILE HOME TAB) */}
            {(isDesktop || activeMobileTab === 'home') && (
                <>
                    {/* 1. ACADEMICS */}
                    <div>
                        <SectionHeader 
                            title="Academics" 
                            subtitle="Year-wise notes, PYQs and subject resources"
                            badge={{ text: `4 years · ${totalSubjects} subjects`, color: '#a78bfa', borderColor: '#3b0764', bgColor: '#0f0520' }} 
                        />
                        <div className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory touch-pan-x scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pb-2 md:pb-0">
                            {academicCards.map((c, i) => (
                                <div key={i} className="snap-start shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none md:shrink">
                                    <YearCardSVG year={c.year} title={c.title} stats={c.stats} onClick={c.onClick} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. MY ACADEMICS (5 UNIFIED MODULES) */}
                    <div>
                        <SectionHeader 
                            title="My Academics" 
                            subtitle="Set up, track and understand your complete academic journey."
                        />
                        <div className="flex flex-col gap-3.5">
                            {/* Row 1: Top 3 Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {/* Card 1: Subject Registration */}
                                <div className="w-full">
                                    <IllustrationCard
                                        presetKey="subjectRegistration"
                                        title="Subject Registration"
                                        subtitle="Set up your current semester and subjects."
                                        onClick={() => navigate('/plus/subject-registration')}
                                        isSubdued={false}
                                        isActiveGlow={true}
                                        ctaText={
                                            isSubjectRegistrationComplete 
                                                ? `✓ ${registeredSubjects.length} subjects · ${totalRegisteredCredits} credits` 
                                                : 'Start →'
                                        }
                                    />
                                </div>

                                {/* Card 2: Attendance */}
                                <div className="w-full">
                                    <IllustrationCard
                                        presetKey="attendance"
                                        title="Attendance"
                                        subtitle="Track your classes and daily attendance history."
                                        onClick={() => navigate('/home/attendance')}
                                        isSubdued={!isSubjectRegistrationComplete}
                                        dependencyText="Complete Subject Registration first to start tracking attendance."
                                        onGoToRegistration={() => navigate('/plus/subject-registration')}
                                        ctaText="View attendance →"
                                    />
                                </div>

                                {/* Card 3: CIE Analyzer */}
                                <div className="w-full">
                                    <IllustrationCard
                                        presetKey="academicSummary"
                                        title="CIE Analyzer"
                                        subtitle="Analyze your internal marks, eligibility & CIE summary."
                                        onClick={() => navigate('/home/cie')}
                                        isSubdued={!isSubjectRegistrationComplete}
                                        dependencyText="Complete Subject Registration first to analyze CIE."
                                        onGoToRegistration={() => navigate('/plus/subject-registration')}
                                        ctaText="Analyze CIE →"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Bottom 2 Cards (Centered 3+2 Desktop Grid) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                <div className="hidden lg:block lg:col-span-3">
                                    <div className="flex justify-center gap-3.5">
                                        <div className="w-[calc(33.333%-9px)]">
                                            <IllustrationCard
                                                presetKey="sgpaGpa"
                                                title="SGPA Calculator"
                                                subtitle="Calculate your semester result, SEE marks & grade points."
                                                onClick={() => navigate('/home/sgpa')}
                                                isSubdued={!isSubjectRegistrationComplete}
                                                dependencyText="Complete Subject Registration first to calculate your semester result."
                                                onGoToRegistration={() => navigate('/plus/subject-registration')}
                                                ctaText="Calculate SGPA →"
                                            />
                                        </div>
                                        <div className="w-[calc(33.333%-9px)]">
                                            <IllustrationCard
                                                presetKey="academicSummary"
                                                title="Academic Summary"
                                                subtitle="Review your complete academic journey."
                                                onClick={() => navigate('/home/academic-summary')}
                                                isSubdued={false}
                                                ctaText="View summary →"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile / Tablet fallback for bottom 2 cards */}
                                <div className="lg:hidden w-full">
                                    <IllustrationCard
                                        presetKey="sgpaGpa"
                                        title="SGPA Calculator"
                                        subtitle="Calculate your semester result, SEE marks & grade points."
                                        onClick={() => navigate('/home/sgpa')}
                                        isSubdued={!isSubjectRegistrationComplete}
                                        dependencyText="Complete Subject Registration first to calculate your semester result."
                                        onGoToRegistration={() => navigate('/plus/subject-registration')}
                                        ctaText="Calculate SGPA →"
                                    />
                                </div>

                                <div className="lg:hidden w-full">
                                    <IllustrationCard
                                        presetKey="academicSummary"
                                        title="Academic Summary"
                                        subtitle="Review your complete academic journey."
                                        onClick={() => navigate('/plus/eligibility-checker')}
                                        isSubdued={false}
                                        ctaText="View summary →"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. CAREER GROWTH */}
                    <div>
                        <SectionHeader 
                            title="Career Growth" 
                            subtitle="Placement prep roadmaps & live senior mentorship sessions"
                            badge={{ text: '2 programs', color: '#7C3AED', borderColor: 'rgba(124,58,237,.3)', bgColor: 'rgba(124,58,237,.06)' }} 
                        />
                        <div className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory touch-pan-x scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 grid-cols-1 md:grid-cols-2 gap-3 pb-2 md:pb-0">
                            <div className="snap-start shrink-0 w-[82vw] max-w-[290px] md:w-auto md:max-w-none md:shrink">
                                <IllustrationCard
                                    presetKey="roadmaps"
                                    title="Roadmaps"
                                    onClick={() => navigate('/plus/roadmaps')}
                                />
                            </div>

                            <div className="snap-start shrink-0 w-[82vw] max-w-[290px] md:w-auto md:max-w-none md:shrink">
                                <IllustrationCard
                                    presetKey="sessions"
                                    title="Sessions"
                                    onClick={() => navigate('/plus/sessions')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5. PRODUCTIVITY */}
                    <div>
                        <SectionHeader 
                            title="Productivity" 
                            subtitle="Daily streak tracker, study todo checklist & campus rankings"
                            badge={{ text: '3 utilities', color: '#1D9E75', borderColor: 'rgba(29,158,117,.3)', bgColor: 'rgba(29,158,117,.06)' }} 
                        />
                        <div className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory touch-pan-x scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-2 md:pb-0">
                            <div className="snap-start shrink-0 w-[82vw] max-w-[290px] md:w-auto md:max-w-none md:shrink">
                                <IllustrationCard
                                    presetKey="streaks"
                                    title="Streaks"
                                    onClick={() => navigate('/plus/streaks')}
                                />
                            </div>

                            <div className="snap-start shrink-0 w-[82vw] max-w-[290px] md:w-auto md:max-w-none md:shrink">
                                <IllustrationCard
                                    presetKey="todo"
                                    title="Todo"
                                    onClick={() => navigate('/plus/todo')}
                                />
                            </div>

                            <div className="snap-start shrink-0 w-[82vw] max-w-[290px] md:w-auto md:max-w-none md:shrink">
                                <IllustrationCard
                                    presetKey="leaderboard"
                                    title="Leaderboard"
                                    onClick={() => navigate('/plus/leaderboard')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 6. PREMIUM COMMUNITY */}
                    <div>
                        <SectionHeader 
                            title="Premium Community" 
                            subtitle="Exclusive WhatsApp group for study notes & exam alerts"
                            badge={{ text: 'WhatsApp Link', color: '#25D366', borderColor: 'rgba(37,211,102,.3)', bgColor: 'rgba(37,211,102,.08)' }} 
                        />
                        <div className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory touch-pan-x scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-2 md:pb-0">
                            <div className="snap-start shrink-0 w-[82vw] max-w-[290px] md:w-auto md:max-w-none md:shrink">
                                <IllustrationCard
                                    presetKey="whatsapp"
                                    title="WhatsApp Community"
                                    onClick={() => navigate('/plus/whatsapp-community')}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
};

export default DashboardPage;
