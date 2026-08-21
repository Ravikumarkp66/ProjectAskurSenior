import React, { useState, useEffect, useContext, Suspense, lazy } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../context/AuthContext';
import RightPanel, {
    StudentDetailsWidget,
    MaterialsOverviewWidget,
    AcademicStreakWidget,
    DailyPlannerWidget
} from '../../components/dashboard/RightPanel';
import { Star, BookOpen, Building2, MapPin, Search, ShoppingBag, Calculator, GraduationCap, FileText, ChevronRight, X, UserCheck, MessageSquare } from 'lucide-react';
import IllustrationCard from '../../components/common/IllustrationCard';

const CampusMap = lazy(() => import('../CampusMap'));
const CampusHub = lazy(() => import('../CampusHub'));
const AskFinderPage = lazy(() => import('../AskFinderPage'));
const InterviewExperiencesPage = lazy(() => import('../interviews/InterviewPage'));
const SGPACalculatorFeaturePage = lazy(() => import('../../features/academic-calculators/sgpa/pages/SGPACalculatorPage'));
const CGPACalculatorFeaturePage = lazy(() => import('../../features/academic-calculators/cgpa/pages/CGPACalculatorPage'));
const GuidesPage = lazy(() => import('../GuidesPage'));
const FacultyDirectoryPage = lazy(() => import('../faculty/FacultyDirectoryPage'));
const LostFoundPage = lazy(() => import('../../features/lost-found/pages/LostFoundPage'));
const MarketplacePage = lazy(() => import('../../features/marketplace/pages/MarketplacePage'));

/* ═══════════════════════════════════════════════════════════════════
   NESTED FEATURE MODAL WRAPPER
═══════════════════════════════════════════════════════════════════ */
const NestedFeatureModal = ({ isOpen, title, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', padding: 16 }}>
            <div style={{ backgroundColor: '#0D1117', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: '#161B22' }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#F1F5F9', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <Suspense fallback={
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: 14 }}>
                            Loading section…
                        </div>
                    }>
                        {children}
                    </Suspense>
                </div>
            </div>
        </div>
    );
};

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
   ACADEMIC CARD
═══════════════════════════════════════════════════════════════════ */
const AcademicCard = ({ title, badgeLabel, description, icon: Icon, colors, onClick }) => {
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
                overflow: 'hidden',
                border: `0.5px solid ${hovered ? colors.hoverBorder : colors.border}`,
                backgroundColor: colors.bg,
                cursor: 'pointer',
                transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: hovered ? '0 12px 28px rgba(0,0,0,0.45)' : 'none',
                height: '100%',
            }}
        >
            <div style={{ flex: 1, padding: '18px 16px 14px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: colors.iconBg,
                        border: `1px solid ${colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.accent
                    }}>
                        <Icon size={20} strokeWidth={2} />
                    </div>
                    {badgeLabel && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, backgroundColor: colors.badgeBg, color: colors.badgeText, letterSpacing: '0.04em' }}>
                            {badgeLabel}
                        </span>
                    )}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: colors.nameColor, margin: '0 0 6px 0', fontFamily: 'Outfit, sans-serif' }}>{title}</h3>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5, fontWeight: 400 }}>{description}</p>
            </div>
            <div style={{ padding: '10px 16px', borderTop: `0.5px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.accent }}>Explore Section</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent, transform: hovered ? 'translateX(3px)' : 'none', transition: 'transform 0.15s' }}>→</span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   CAMPUS CARD
═══════════════════════════════════════════════════════════════════ */
const CampusCard = ({ name, liveCount, latestLabel, latestValue, updated, icon: Icon, colors, onClick }) => {
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
                border: `0.5px solid ${hovered ? colors.accent : '#21262D'}`,
                backgroundColor: '#161B22',
                cursor: 'pointer',
                transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                boxShadow: hovered ? '0 12px 28px rgba(0,0,0,0.4)' : 'none',
                height: '100%',
            }}
        >
            <div style={{ padding: '18px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} strokeWidth={2} style={{ color: colors.accent }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#E2E8F0', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: colors.accent, boxShadow: `0 0 8px ${colors.accent}` }}></div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.accent }}>{liveCount}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 10, color: '#8B949E', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{latestLabel}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#CBD5E1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latestValue}</span>
                </div>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '0.5px solid #21262D', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                <span style={{ fontSize: 11, color: '#8B949E' }}>{updated}</span>
                <span style={{ fontSize: 12, color: hovered ? colors.accent : '#8B949E', transition: 'color 0.15s, transform 0.15s', transform: hovered ? 'translateX(3px)' : 'none' }}>→</span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   TOOL CARD
═══════════════════════════════════════════════════════════════════ */
const ToolCard = ({ name, hint, visualBg, accent, children, onClick }) => {
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
            <div style={{ backgroundColor: visualBg, padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>{children}</div>
            <div style={{ padding: '12px 16px', borderTop: '0.5px solid #21262D', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', fontFamily: 'Outfit, sans-serif' }}>{name}</span>
                    <span style={{ fontSize: 11, color: '#8B949E' }}>{hint}</span>
                </div>
                <ChevronRight size={16} style={{ color: hovered ? accent : '#8B949E', transition: 'color 0.15s, transform 0.15s', transform: hovered ? 'translateX(3px)' : 'none' }} />
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   BLOGS CARD
═══════════════════════════════════════════════════════════════════ */
const BlogCard = ({ title, tag, description, count, colors, onClick }) => {
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
                border: `0.5px solid ${hovered ? colors.accent : '#21262D'}`,
                backgroundColor: '#161B22',
                cursor: 'pointer',
                transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
                overflow: 'hidden',
                boxShadow: hovered ? '0 12px 28px rgba(0,0,0,0.4)' : 'none',
            }}
        >
            <div style={{ height: 4, backgroundColor: colors.accent }}></div>
            <div style={{ padding: '20px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: colors.tagColor, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{tag}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, backgroundColor: colors.pillBg, color: colors.accent }}>
                        Community
                    </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: '#E2E8F0', margin: 0, fontFamily: 'Outfit, sans-serif' }}>{title}</h3>
                <p style={{ fontSize: 12, color: '#8B949E', margin: 0, lineHeight: 1.55 }}>{description}</p>
            </div>
            <div style={{ padding: '12px 18px', borderTop: '0.5px solid #21262D', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.accent }}>{count}</span>
                <span style={{ fontSize: 14, color: hovered ? colors.accent : '#8B949E', transition: 'color 0.15s, transform 0.15s', transform: hovered ? 'translateX(3px)' : 'none' }}>→</span>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   HOME PAGE SECTION COMPONENT (/home)
═══════════════════════════════════════════════════════════════════ */
const UserHomePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const context = useOutletContext() || {};
    const { activeMobileTab = 'home' } = context;
    const { user } = useContext(AuthContext);
    const [rightSlot, setRightSlot] = useState(null);

    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isDesktop = windowWidth >= 1024;

    const isMaterials = location.pathname.includes('/materials');
    const isInterviews = location.pathname.includes('/interview-experiences');
    const isFaculty = location.pathname.includes('/faculty-ratings') || location.pathname.includes('/faculty-directory');
    const isCampusExplorer = location.pathname.includes('/campus-explorer');
    const isLostFound = location.pathname.includes('/lost-and-found');
    const isMarketplace = location.pathname.includes('/marketplace');
    const isSGPA = location.pathname.includes('/sgpa-calculator');
    const isCGPA = location.pathname.includes('/cgpa-calculator');
    const isBlogs = location.pathname.includes('/blogs');

    if (isMaterials) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-2 md:px-6 py-4 flex flex-col gap-6">
                <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-400">Loading Study Materials...</div>}>
                    <AskFinderPage />
                </Suspense>
            </div>
        );
    }

    if (isInterviews) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-2 md:px-6 py-4 flex flex-col gap-6">
                <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-400">Loading Interview Experiences...</div>}>
                    <InterviewExperiencesPage />
                </Suspense>
            </div>
        );
    }

    if (isFaculty) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-2 md:px-6 py-4 flex flex-col gap-6">
                <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-400">Loading Faculty Directory...</div>}>
                    <FacultyDirectoryPage />
                </Suspense>
            </div>
        );
    }

    if (isLostFound) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-2 md:px-6 py-4 flex flex-col gap-6">
                <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-400">Loading Lost & Found...</div>}>
                    <LostFoundPage />
                </Suspense>
            </div>
        );
    }

    if (isMarketplace) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-2 md:px-6 py-4 flex flex-col gap-6">
                <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-400">Loading Marketplace...</div>}>
                    <MarketplacePage />
                </Suspense>
            </div>
        );
    }

    if (isSGPA) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-2 md:px-6 py-4 flex flex-col gap-6">
                <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-400">Loading SGPA Calculator...</div>}>
                    <SGPACalculatorFeaturePage />
                </Suspense>
            </div>
        );
    }

    if (isCGPA) {
        return (
            <div id="dashboard-main-sections" className="flex-1 min-w-0 w-full overflow-y-auto px-2 md:px-6 py-4 flex flex-col gap-6">
                <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-400">Loading CGPA Calculator...</div>}>
                    <CGPACalculatorFeaturePage />
                </Suspense>
            </div>
        );
    }

    const academicCards = [
        {
            presetKey: 'materials',
            title: 'Materials',
            onClick: () => navigate('/home/materials')
        },
        {
            presetKey: 'interviews',
            title: 'Interview Experiences',
            onClick: () => navigate('/home/interview-experiences')
        },
        {
            presetKey: 'faculty',
            title: 'Faculty Ratings',
            onClick: () => navigate('/home/faculty-ratings')
        }
    ];

    const campusCards = [
        {
            presetKey: 'campusMap',
            title: 'Campus Explorer',
            onClick: () => navigate('/campus-map')
        },
        {
            presetKey: 'lostFound',
            title: 'Lost & Found',
            onClick: () => navigate('/home/lost-and-found')
        },
        {
            presetKey: 'marketplace',
            title: 'Marketplace',
            onClick: () => navigate('/home/marketplace')
        }
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
                            subtitle="Study resources, interview stories & faculty feedback"
                            badge={{ text: '3 core modules', color: '#a78bfa', borderColor: '#3b0764', bgColor: '#0f0520' }}
                        />
                        <div className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory touch-pan-x scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-2 md:pb-0">
                            {academicCards.map((card, i) => (
                                <div key={i} className="snap-start shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none md:shrink">
                                    <IllustrationCard presetKey={card.presetKey} title={card.title} onClick={card.onClick} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. CAMPUS */}
                    <div>
                        <SectionHeader
                            title="Campus"
                            subtitle="Everything happening on campus, live"
                            badge={{ text: '3 live modules', color: '#f97316', borderColor: 'rgba(249,115,22,.3)', bgColor: 'rgba(249,115,22,.06)' }}
                        />
                        <div className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory touch-pan-x scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-2 md:pb-0">
                            {campusCards.map((card, i) => (
                                <div key={i} className="snap-start shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none md:shrink">
                                    <IllustrationCard presetKey={card.presetKey} title={card.title} onClick={card.onClick} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. TOOLS */}
                    <div>
                        <SectionHeader
                            title="Tools"
                            subtitle="Academic calculators and grade estimators"
                            badge={{ text: '2 utilities', color: '#1D9E75', borderColor: 'rgba(29,158,117,.3)', bgColor: 'rgba(29,158,117,.06)' }}
                        />
                        <div className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory touch-pan-x scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 grid-cols-1 md:grid-cols-2 gap-3.5 pb-2 md:pb-0">
                            <div className="snap-start shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none md:shrink">
                                <IllustrationCard 
                                    presetKey="cgpaCalculator" 
                                    title="CGPA Calculator" 
                                    onClick={() => navigate('/home/cgpa-calculator')} 
                                />
                            </div>

                            <div className="snap-start shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none md:shrink">
                                <IllustrationCard 
                                    presetKey="sgpaCalculator" 
                                    title="SGPA Calculator" 
                                    onClick={() => navigate('/home/sgpa-calculator')} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4. COMMUNITY */}
                    <div>
                        <SectionHeader
                            title="Community"
                            subtitle="Senior articles, guides & placement insights"
                            badge={{ text: '24+ Blogs', color: '#1D9E75', borderColor: 'rgba(29,158,117,.3)', bgColor: 'rgba(29,158,117,.06)' }}
                        />
                        <div className="flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory touch-pan-x scrollbar-none -mx-4 px-4 md:mx-0 md:px-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-2 md:pb-0">
                            <div className="snap-start shrink-0 w-[82vw] max-w-[280px] md:w-auto md:max-w-none md:shrink">
                                <IllustrationCard
                                    presetKey="blogs"
                                    title="Blogs"
                                    onClick={() => navigate('/home/blogs')}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Nested Feature Modals rendering inside /home */}
            <NestedFeatureModal isOpen={isCampusExplorer} title="Campus Explorer & Interactive Map" onClose={() => navigate('/home')}>
                <CampusMap />
            </NestedFeatureModal>

            <NestedFeatureModal isOpen={isLostFound} title="Campus Lost & Found Noticeboard" onClose={() => navigate('/home')}>
                <CampusHub initialTab="lost" />
            </NestedFeatureModal>

            <NestedFeatureModal isOpen={isMarketplace} title="Campus Student Marketplace" onClose={() => navigate('/home')}>
                <CampusHub initialTab="mkt" />
            </NestedFeatureModal>

            <NestedFeatureModal isOpen={isMaterials} title="Study Materials & PYQs" onClose={() => navigate('/home')}>
                <AskFinderPage />
            </NestedFeatureModal>

            <NestedFeatureModal isOpen={isInterviews} title="Senior Interview Experiences" onClose={() => navigate('/home')}>
                <InterviewExperiencesPage />
            </NestedFeatureModal>

            <NestedFeatureModal isOpen={isBlogs} title="Senior Blogs & Placement Guides" onClose={() => navigate('/home')}>
                <GuidesPage />
            </NestedFeatureModal>
        </div>
    );
};

export default UserHomePage;
