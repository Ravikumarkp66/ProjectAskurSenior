import React, { useEffect, Suspense } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, TrendingUp, Clock, Calendar, Bell, Loader2, BookOpen, BarChart3, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

import { EditProfileProvider, useEditProfile } from '../../contexts/EditProfileContext';
import { useAuth } from '../../utils/hooks';

// ── Settings navigation (Basic Information only) ──────────────────────────────
const desktopNavItems = [
    { label: 'Basic Information', path: '/profile/edit/basic', icon: User, chunk: () => import('./settings/BasicInformationSettings') },
];

// ── Mobile tab items ────────────────────────────────────────────────────────
const mobileTabs = [
    { label: 'Basic Information', path: '/profile/edit/basic', chunk: () => import('./settings/BasicInformationSettings') },
];

// Deep sub-pages (none — all settings consolidated in Basic Information)
const DEEP_PAGES = {};

const NO_SAVE_PATHS = [];

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
    const { isAuthenticated, loading } = useAuth();
    const { saving, isChanged, triggerSave } = useEditProfile();

    // Redirect to login if user is not authenticated
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/login', { replace: true, state: { from: location.pathname } });
        }
    }, [loading, isAuthenticated, navigate, location.pathname]);

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
                    className="settings-left-col rounded-2xl border p-4.5 backdrop-blur-xl flex flex-col gap-3 h-full box-border transition-all duration-200 bg-white dark:bg-[#0D111C] border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl"
                >
                    {/* Back to Profile link */}
                    <NavLink
                        to="/profile"
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer self-start mb-1"
                    >
                        <ArrowLeft size={13} />
                        <span>Back to Profile</span>
                    </NavLink>

                    <div className="flex flex-col gap-1">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                            Profile Settings
                        </h2>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Configure your academic profile workspace
                        </span>
                    </div>

                    <div className="h-px bg-slate-200/80 dark:bg-white/[0.08] my-1" />

                    {/* Navigation list */}
                    <nav className="flex flex-col gap-1.5 flex-1">
                        {desktopNavItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 text-left ${
                                        isActive
                                            ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-500/30 font-semibold shadow-xs'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] border border-transparent font-medium'
                                    }`}
                                >
                                    <Icon size={15} />
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
                    className="settings-content-col rounded-2xl border p-5 sm:p-7 min-w-0 h-full overflow-y-auto box-border transition-all duration-200 bg-white dark:bg-[#0D111C] border-slate-200/80 dark:border-white/[0.08] shadow-sm dark:shadow-xl text-slate-900 dark:text-white"
                >
                    <Suspense fallback={<SettingsSkeleton />}>
                        <Outlet />
                    </Suspense>
                </motion.div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                MOBILE LAYOUT (< 768px) — Shell
            ══════════════════════════════════════════════════════════════ */}
            <div className="mobile-edit-shell">

                {/* ── Mobile Header ─────────────────────────────────────── */}
                {isDeepPage ? (
                    /* Deep sub-page header: contextual "← Back to [Tab]" */
                    <div className="flex items-center gap-2.5 p-3.5 px-4 border-b border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0D111C]/95 backdrop-blur-md">
                        <button
                            type="button"
                            onClick={() => navigate(deepPage.backTo)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 cursor-pointer shrink-0"
                        >
                            <ArrowLeft size={13} />
                            <span>{deepPage.backLabel}</span>
                        </button>
                        <span className="flex-1 text-center text-sm font-extrabold text-slate-900 dark:text-white">
                            {deepPage.label}
                        </span>
                        <div style={{ width: 68 }} />
                    </div>
                ) : (
                    /* Normal header */
                    <>
                        <div className="flex items-center gap-2.5 p-3.5 px-4 border-b border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0D111C]/95 backdrop-blur-md">
                            <button
                                type="button"
                                onClick={() => navigate('/profile')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 cursor-pointer shrink-0"
                            >
                                <ArrowLeft size={13} />
                                <span>Back</span>
                            </button>
                            <span className="flex-1 text-center text-sm font-extrabold text-slate-900 dark:text-white">
                                Edit Profile
                            </span>
                            <div style={{ width: 48 }} />
                        </div>

                        {/* Mobile Tab Bar (only if multiple tabs) */}
                        {mobileTabs.length > 1 && (
                            <div className="flex p-3 px-4 gap-1.5 bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/[0.06]">
                                {mobileTabs.map(tab => {
                                    const isActive = currentPath === tab.path || currentPath.startsWith(tab.path + '/');
                                    return (
                                        <NavLink
                                            key={tab.path}
                                            to={tab.path}
                                            className={`flex-1 text-center py-2 px-1 rounded-lg text-xs font-bold transition-all duration-150 ${
                                                isActive
                                                    ? 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 shadow-xs'
                                                    : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]'
                                            }`}
                                        >
                                            {tab.label}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* Scrollable content area */}
                <div
                    style={{
                        paddingBottom: showSaveButton ? '80px' : '24px'
                    }}
                    className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 box-border"
                >
                    <Suspense fallback={<SettingsSkeleton />}>
                        <Outlet />
                    </Suspense>
                </div>

                {/* Sticky Save Button (hidden on Progress tab) */}
                {showSaveButton && (
                    <div className="fixed bottom-0 left-0 right-0 p-3.5 px-4 bg-white/95 dark:bg-[#0D111C]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/[0.08] z-50 box-border">
                        <button
                            type="button"
                            disabled={!isChanged || saving}
                            onClick={handleStickySave}
                            className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                                !isChanged
                                    ? 'bg-slate-100 dark:bg-white/[0.05] text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200/60 dark:border-white/[0.05]'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 cursor-pointer active:scale-[0.99]'
                            }`}
                        >
                            {saving && <Loader2 size={16} className="animate-spin" />}
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
