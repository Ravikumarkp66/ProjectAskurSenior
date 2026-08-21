import React, { useEffect, Suspense } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, TrendingUp, Clock, Calendar, Bell, Loader2, BookOpen, BarChart3, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

import { EditProfileProvider, useEditProfile } from '../../contexts/EditProfileContext';

// ── All settings nav items (used by desktop sidebar) ─────────────────────────
const desktopNavItems = [
    { label: 'Basic Information', path: '/profile/edit/basic',       icon: User,       chunk: () => import('./settings/BasicInformationSettings') },
    { label: 'SGPA Calculator',   path: '/profile/edit/sgpa',        icon: TrendingUp, chunk: () => import('./settings/SgpaSettings') },
    { label: 'Attendance Overview', path: '/profile/edit/attendance', icon: Clock,      chunk: () => import('./settings/AttendanceSettings') },
    { label: 'CIE Analyzer',      path: '/profile/edit/cie',         icon: Sparkles,   chunk: () => import('./settings/CieSettings') },
    { label: 'Events',            path: '/profile/edit/events',       icon: Bell,       chunk: () => import('./settings/EventsSettings') },
];

// ── Mobile 3-tab items ────────────────────────────────────────────────────────
const mobileTabs = [
    { label: 'Profile',  path: '/profile/edit/basic',    chunk: () => import('./settings/BasicInformationSettings') },
    { label: 'Academic', path: '/profile/edit/academic', chunk: () => import('./settings/AcademicSettings') },
    { label: 'Progress', path: '/profile/edit/progress', chunk: () => import('./settings/ProgressSettings') },
];

// Deep sub-pages that are reached via Manage → buttons (not in tab bar)
// Maps path prefix → { label, backTo, backLabel }
const DEEP_PAGES = {
    '/profile/edit/cgpa':        { label: 'CGPA Progress',      backTo: '/profile/edit/progress', backLabel: 'Progress' },
    '/profile/edit/attendance':  { label: 'Attendance',          backTo: '/profile/edit/progress', backLabel: 'Progress' },
    '/profile/edit/cie':         { label: 'CIE Analyzer',        backTo: '/profile/edit/academic', backLabel: 'Academic' },
    '/profile/edit/events':      { label: 'Events',              backTo: '/profile/edit/basic',    backLabel: 'Profile' },
};

// Paths that hide the save button (Progress tab + its deep pages are read-display)
const NO_SAVE_PATHS = ['/profile/edit/progress'];

const SettingsSkeleton = () => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '240px',
        gap: '12px',
        color: 'rgba(148, 163, 184, 0.5)'
    }}>
        <Loader2 className="animate-spin" size={24} color="#a78bfa" />
        <span style={{ fontSize: '12.5px', fontWeight: 500 }}>Loading section...</span>
    </div>
);

// Inner layout that can access the EditProfileContext
const LayoutInner = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { saving, isChanged, triggerSave } = useEditProfile();

    const currentPath = location.pathname;

    // Detect if we're on a deep sub-page (reached via Manage → buttons)
    const deepPage = Object.entries(DEEP_PAGES).find(([prefix]) => currentPath.startsWith(prefix))?.[1] || null;
    const isDeepPage = !!deepPage;

    // On deep pages, treat them all as having their own save button (from the sub-page components)
    // Hide our sticky save button on: progress tab + deep CGPA/Attendance/Timetable/Events pages
    const showSaveButton = !isDeepPage && !NO_SAVE_PATHS.some(p => currentPath.startsWith(p));

    // Eagerly preload all chunks on mount
    useEffect(() => {
        [...desktopNavItems, ...mobileTabs].forEach(item => {
            try { item.chunk(); } catch (e) {}
        });
    }, []);

    const handleStickySave = async () => {
        if (!isChanged || saving) return;
        await triggerSave();
    };

    return (
        <div style={{
            width: '100%',
            height: 'calc(100vh - 32px)',
            overflow: 'hidden',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* ══════════════════════════════════════════════════════════════
                DESKTOP LAYOUT (≥ 768px) — unchanged sidebar + content panel
            ══════════════════════════════════════════════════════════════ */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '260px 1fr',
                    gap: '16px',
                    width: '100%',
                    height: '100%',
                }}
                className="settings-layout-grid"
            >
                {/* ── Left Navigation Column ─────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: 'rgba(19, 18, 26, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '16px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        height: '100%',
                        boxSizing: 'border-box'
                    }}
                    className="settings-left-col"
                >
                    {/* Back to Profile link */}
                    <NavLink
                        to="/profile"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: 'rgba(148, 163, 184, 0.65)',
                            fontSize: '11px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'color 0.15s',
                            cursor: 'pointer',
                            alignSelf: 'flex-start'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(148, 163, 184, 0.65)'}
                    >
                        <ArrowLeft size={12} />
                        <span>Back to Profile</span>
                    </NavLink>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
                            Settings
                        </h2>
                        <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)', fontWeight: 500 }}>
                            Configure your academic profile workspace
                        </span>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '4px 0' }} />

                    {/* Navigation list */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        {desktopNavItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    style={({ isActive }) => ({
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        color: isActive ? '#a78bfa' : 'rgba(148, 163, 184, 0.65)',
                                        background: isActive
                                            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(99, 102, 241, 0.12))'
                                            : 'transparent',
                                        border: isActive
                                            ? '1px solid rgba(139, 92, 246, 0.25)'
                                            : '1px solid transparent',
                                        boxShadow: isActive ? '0 4px 12px rgba(124, 58, 237, 0.08)' : 'none',
                                        fontSize: '12.5px',
                                        fontWeight: isActive ? 600 : 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        textDecoration: 'none',
                                        transition: 'all 0.18s',
                                        cursor: 'pointer'
                                    })}
                                    onMouseEnter={e => {
                                        try { item.chunk(); } catch (err) {}
                                        if (!e.currentTarget.style.background || e.currentTarget.style.background === 'transparent') {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                            e.currentTarget.style.color = 'rgba(148, 163, 184, 0.85)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (e.currentTarget.style.border === '1px solid transparent') {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'rgba(148, 163, 184, 0.65)';
                                        }
                                    }}
                                >
                                    <Icon size={14} />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                </motion.div>

                {/* ── Right Content Column ───────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    style={{
                        background: 'rgba(19, 18, 26, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '20px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        minWidth: 0,
                        height: '100%',
                        overflowY: 'auto',
                        overflowX: 'auto',
                        boxSizing: 'border-box'
                    }}
                    className="settings-content-col"
                >
                    <Suspense fallback={<SettingsSkeleton />}>
                        <Outlet />
                    </Suspense>
                </motion.div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                MOBILE LAYOUT (< 768px) — 3-tab shell
            ══════════════════════════════════════════════════════════════ */}
            <div className="mobile-edit-shell">

                {/* ── Mobile Header ─────────────────────────────────────── */}
                {isDeepPage ? (
                    /* Deep sub-page header: contextual "← Back to [Tab]" */
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 16px 12px',
                        boxSizing: 'border-box',
                        borderBottom: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <button
                            type="button"
                            onClick={() => navigate(deepPage.backTo)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: 'rgba(139,92,246,0.08)',
                                border: '1px solid rgba(139,92,246,0.2)',
                                borderRadius: '8px',
                                color: '#c4b5fd',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '5px 11px',
                                outline: 'none',
                                transition: 'all 0.15s',
                                flexShrink: 0
                            }}
                        >
                            <ArrowLeft size={13} />
                            <span>{deepPage.backLabel}</span>
                        </button>
                        <span style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#fff',
                            letterSpacing: '-0.01em'
                        }}>
                            {deepPage.label}
                        </span>
                        {/* Spacer to balance the back pill */}
                        <div style={{ width: 68 }} />
                    </div>
                ) : (
                    /* Normal 3-tab header */
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '14px 16px 0',
                            boxSizing: 'border-box'
                        }}>
                            <button
                                type="button"
                                onClick={() => navigate('/profile')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(148,163,184,0.75)',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: 0,
                                    outline: 'none'
                                }}
                            >
                                <ArrowLeft size={15} />
                                <span>Back</span>
                            </button>
                            <span style={{ flex: 1, textAlign: 'center', fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                                Edit Profile
                            </span>
                            {/* Spacer */}
                            <div style={{ width: 48 }} />
                        </div>

                        {/* Mobile Tab Bar */}
                        <div style={{
                            display: 'flex',
                            padding: '12px 16px 0',
                            gap: '6px',
                            boxSizing: 'border-box'
                        }}>
                            {mobileTabs.map(tab => {
                                const isActive = currentPath === tab.path || currentPath.startsWith(tab.path + '/');
                                return (
                                    <NavLink
                                        key={tab.path}
                                        to={tab.path}
                                        style={{
                                            flex: 1,
                                            textAlign: 'center',
                                            padding: '8px 4px',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: isActive ? 700 : 500,
                                            color: isActive ? '#fff' : 'rgba(148,163,184,0.55)',
                                            background: isActive
                                                ? 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(99,102,241,0.18))'
                                                : 'rgba(255,255,255,0.03)',
                                            border: isActive
                                                ? '1px solid rgba(139,92,246,0.35)'
                                                : '1px solid rgba(255,255,255,0.06)',
                                            textDecoration: 'none',
                                            transition: 'all 0.18s',
                                            boxSizing: 'border-box',
                                            letterSpacing: '-0.01em'
                                        }}
                                    >
                                        {tab.label}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Scrollable content area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '14px 16px',
                    boxSizing: 'border-box',
                    // leave room for sticky save button
                    paddingBottom: showSaveButton ? '80px' : '24px'
                }}>
                    <Suspense fallback={<SettingsSkeleton />}>
                        <Outlet />
                    </Suspense>
                </div>

                {/* Sticky Save Button (hidden on Progress tab) */}
                {showSaveButton && (
                    <div style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '12px 16px',
                        background: 'rgba(13,11,23,0.92)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderTop: '1px solid rgba(255,255,255,0.07)',
                        zIndex: 60,
                        boxSizing: 'border-box'
                    }}>
                        <button
                            type="button"
                            disabled={!isChanged || saving}
                            onClick={handleStickySave}
                            style={{
                                width: '100%',
                                padding: '13px',
                                borderRadius: '10px',
                                border: 'none',
                                outline: 'none',
                                background: !isChanged
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                color: !isChanged ? 'rgba(255,255,255,0.25)' : '#fff',
                                fontSize: '14px',
                                fontWeight: 700,
                                cursor: !isChanged || saving ? 'not-allowed' : 'pointer',
                                boxShadow: isChanged && !saving ? '0 4px 20px rgba(124,58,237,0.35)' : 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                letterSpacing: '-0.01em'
                            }}
                        >
                            {saving && <Loader2 size={15} className="animate-spin" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            {/* Responsive CSS */}
            <style dangerouslySetInnerHTML={{__html: `
                /* Desktop: show sidebar layout, hide mobile shell */
                @media (min-width: 768px) {
                    .settings-layout-grid {
                        display: grid !important;
                    }
                    .mobile-edit-shell {
                        display: none !important;
                    }
                }

                /* Mobile: hide sidebar layout, show mobile shell */
                @media (max-width: 767px) {
                    .settings-layout-grid {
                        display: none !important;
                    }
                    .mobile-edit-shell {
                        display: flex !important;
                        flex-direction: column;
                        width: 100%;
                        height: 100%;
                        overflow: hidden;
                        background: transparent;
                    }
                    .settings-left-col {
                        display: none !important;
                    }
                    .settings-content-col {
                        height: auto !important;
                        min-height: 300px !important;
                    }
                }
            `}} />
        </div>
    );
};

// Wrap inner layout with the shared EditProfileContext provider
const ProfileSettingsLayout = () => (
    <EditProfileProvider>
        <LayoutInner />
    </EditProfileProvider>
);

export default ProfileSettingsLayout;
