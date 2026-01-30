import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/hooks';
import { apiClient } from '../services/api';

const Sidebar = ({
    currentBranch,
    showProfile,
    onProfileClick,
    subjectSearch,
    onSubjectSearchChange,
    isCollapsed,
    onCollapsedChange
}) => {
    const navigate = useNavigate();
    const { user, logout, updateUser } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [feedbackError, setFeedbackError] = useState('');
    const [feedbackStats, setFeedbackStats] = useState({ total: 0, avgRating: 0 });
    const [latestFeedback, setLatestFeedback] = useState(null);
    const [feedbackMetaLoading, setFeedbackMetaLoading] = useState(false);

    const [showBugModal, setShowBugModal] = useState(false);
    const [bugTitle, setBugTitle] = useState('');
    const [bugDescription, setBugDescription] = useState('');
    const [bugSubmitting, setBugSubmitting] = useState(false);
    const [bugError, setBugError] = useState('');
    const [theme, setTheme] = useState(() => {
        try {
            const saved = localStorage.getItem('uiTheme');
            return saved === 'light' ? 'light' : 'dark';
        } catch {
            return 'dark';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('uiTheme', theme);
            window.dispatchEvent(new Event('uiThemeChange'));
        } catch {
            // ignore
        }
    }, [theme]);

    const isLightMode = theme === 'light';

    const sidebarClasses = useMemo(() => {
        if (isLightMode) {
            return {
                shell: 'bg-white text-slate-700',
                border: 'border-slate-200',
                panel: 'bg-slate-50',
                panelHover: 'hover:bg-slate-100',
                title: 'text-slate-900',
                accent: 'text-purple-700',
                accentHover: 'hover:text-purple-800',
                itemHover: 'hover:bg-slate-100'
            };
        }
        return {
            shell: 'bg-primary-900 text-secondary-500',
            border: 'border-primary-700',
            panel: 'bg-dark-100',
            panelHover: 'hover:bg-dark-50',
            title: 'text-secondary-100',
            accent: 'text-primary-600',
            accentHover: 'hover:text-primary-500',
            itemHover: 'hover:bg-dark-100'
        };
    }, [isLightMode]);

    const closeFeedbackModal = () => {
        setShowFeedbackModal(false);
        setFeedbackSubmitting(false);
        setFeedbackError('');
    };

    const loadFeedbackMeta = async () => {
        setFeedbackMetaLoading(true);
        try {
            const [statsRes, latestRes] = await Promise.all([
                apiClient.get('/feedback/stats'),
                apiClient.get('/feedback/me/latest')
            ]);
            setFeedbackStats(statsRes?.data?.stats || { total: 0, avgRating: 0 });
            setLatestFeedback(latestRes?.data?.item || null);
        } catch {
            // ignore
        } finally {
            setFeedbackMetaLoading(false);
        }
    };

    const closeBugModal = () => {
        setShowBugModal(false);
        setBugSubmitting(false);
        setBugError('');
    };

    const submitFeedback = async () => {
        if (!feedbackRating || feedbackSubmitting) return;
        setFeedbackSubmitting(true);
        setFeedbackError('');
        try {
            await apiClient.post('/feedback', {
                rating: feedbackRating,
                message: feedbackMessage?.trim() ? feedbackMessage.trim() : undefined
            });
            setFeedbackRating(0);
            setFeedbackMessage('');
            await loadFeedbackMeta();
            closeFeedbackModal();
        } catch (e) {
            setFeedbackError(e?.response?.data?.error || 'Failed to submit feedback');
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const submitBug = async () => {
        if (!bugTitle.trim() || !bugDescription.trim() || bugSubmitting) return;
        setBugSubmitting(true);
        setBugError('');
        try {
            await apiClient.post('/bugs', {
                title: bugTitle.trim(),
                description: bugDescription.trim(),
                pageUrl: window.location.href
            });
            setBugTitle('');
            setBugDescription('');
            closeBugModal();
        } catch (e) {
            setBugError(e?.response?.data?.error || 'Failed to submit bug report');
        } finally {
            setBugSubmitting(false);
        }
    };

    return (
        <div
            className={`${isCollapsed ? 'w-20' : 'w-64'} ${sidebarClasses.shell} h-screen fixed left-0 top-0 shadow-lg flex flex-col transition-all duration-300 z-20 overflow-hidden`}
        >
            {/* Header with Collapse Button */}
            <div className={`p-4 border-b ${sidebarClasses.border} flex items-center justify-between`}>
                {!isCollapsed && (
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7 18V6l10 6-10 6z" fill="currentColor" />
                                </svg>
                            </div>
                            <div>
                                <h1 className={`text-xl font-extrabold leading-tight ${sidebarClasses.accent}`}>AskUrSenior</h1>
                                <p className="text-[11px] text-gray-400/70 -mt-0.5">Academic Tracker</p>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => onCollapsedChange?.(!isCollapsed)}
                    className={`${sidebarClasses.accent} ${sidebarClasses.accentHover} transition ml-auto h-11 w-11 flex items-center justify-center`}
                    title={isCollapsed ? "Expand" : "Collapse"}
                >
                    <svg className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-3 overflow-hidden">
                <div>
                    <button
                        type="button"
                        className={`${isCollapsed ? 'w-full flex items-center justify-center' : 'w-full'} ${sidebarClasses.panel} ${sidebarClasses.panelHover} rounded-xl p-3 transition ${isCollapsed ? '' : 'text-left'
                            }`}
                        title="Coming soon"
                    >
                        <div className={`flex ${isCollapsed ? 'items-center justify-center' : 'items-start'} gap-3`}>
                            <div className={isCollapsed ? '' : 'mt-0.5'}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                                </svg>
                            </div>
                            {!isCollapsed && (
                                <div className="min-w-0">
                                    <p className={`text-sm font-semibold ${sidebarClasses.title}`}>Interview Experiences</p>
                                    <span className="mt-1 inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 border border-emerald-400/20 text-[11px]">
                                        Coming soon
                                    </span>
                                </div>
                            )}
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/calculator')}
                        className={`${isCollapsed ? 'w-full flex items-center justify-center' : 'w-full'} ${sidebarClasses.panel} ${sidebarClasses.panelHover} rounded-xl p-3 transition mt-3 ${isCollapsed ? '' : 'text-left'
                            }`}
                        title="CGPA / SGPA Calculator"
                    >
                        <div className={`flex ${isCollapsed ? 'items-center justify-center' : 'items-start'} gap-3`}>
                            <div className={isCollapsed ? '' : 'mt-0.5'}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m-6 4h6m-6 4h6M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            {!isCollapsed && (
                                <div className="min-w-0">
                                    <p className={`text-sm font-semibold ${sidebarClasses.title}`}>CGPA / SGPA Calculator</p>
                                    <span className="mt-1 inline-flex items-center rounded-full bg-purple-500/15 text-purple-300 px-2 py-0.5 border border-purple-400/20 text-[11px]">
                                        New
                                    </span>
                                </div>
                            )}
                        </div>
                    </button>
                </div>
            </nav>

            {/* Profile (bottom) */}
            {!isCollapsed && (
                <div className={`p-4 border-t ${sidebarClasses.border}`}>
                    <button
                        type="button"
                        onClick={() => setShowProfileMenu((v) => !v)}
                        className={`w-full ${sidebarClasses.panel} ${sidebarClasses.panelHover} rounded-xl p-3 transition text-left`}
                        title="Profile menu"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {(user?.usn || 'U').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className={`text-sm font-semibold ${sidebarClasses.title} truncate`}>{user?.usn}</p>
                                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400 truncate">
                                    <span className="inline-flex items-center rounded-full bg-white/5 text-gray-300 px-2 py-0.5 border border-white/10">
                                        {currentBranch}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-auto">
                                <svg
                                    className={`w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                                </svg>
                            </div>
                        </div>
                    </button>

                    {showProfileMenu && (
                        <div className={`mt-3 ${sidebarClasses.panel} rounded-xl overflow-hidden border ${sidebarClasses.border}`}>
                            <div className="px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className={`text-sm font-semibold ${sidebarClasses.title} truncate`}>{user?.name || user?.usn}</p>
                                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 border border-emerald-400/20 text-[11px]">
                                            {currentBranch}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={onProfileClick}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold ${sidebarClasses.itemHover} transition`}
                                title="My Profile"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 20.25a7.5 7.5 0 0115 0" />
                                </svg>
                                <span>My Profile</span>
                            </button>

                            {user?.isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                        navigate('/admin/reviews');
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold ${sidebarClasses.itemHover} transition`}
                                    title="Admin reviews"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-6-8h6M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Admin Reviews</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setFeedbackError('');
                                    setFeedbackRating(0);
                                    setFeedbackMessage('');
                                    loadFeedbackMeta();
                                    setShowFeedbackModal(true);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold ${sidebarClasses.itemHover} transition`}
                                title="Send feedback"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h8M5 20l2-2h12a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v14z" />
                                </svg>
                                <span>Feedback</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setBugError('');
                                    setBugTitle('');
                                    setBugDescription('');
                                    setShowBugModal(true);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold ${sidebarClasses.itemHover} transition`}
                                title="Report a bug"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Report a Bug</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold ${sidebarClasses.itemHover} transition`}
                                title="Toggle theme"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05L5.636 5.636" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
                                </svg>
                                <span>{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
                            </button>

                            <button
                                type="button"
                                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold ${sidebarClasses.itemHover} transition`}
                                title="Coming soon"
                            >
                                <span className="flex items-center gap-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                                    </svg>
                                    <span>Notification</span>
                                </span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            <div className={`h-px ${sidebarClasses.border} opacity-60`} />

                            <button
                                type="button"
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10 transition"
                                title="Logout"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                                </svg>
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showFeedbackModal && (
                <ModalShell
                    isLightMode={isLightMode}
                    title="Feedback"
                    onClose={() => closeFeedbackModal()}
                >
                    <div className="space-y-4">
                        <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-secondary-200'}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="font-semibold">Average rating</div>
                                <div className="font-extrabold">{feedbackMetaLoading ? '...' : `${feedbackStats.avgRating}/5`}</div>
                            </div>
                            <div className={`mt-1 text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-500'}`}>
                                {feedbackMetaLoading ? 'Loading...' : `${feedbackStats.total} total feedbacks`}
                            </div>
                        </div>

                        <div className={`rounded-xl border px-3 py-2 ${isLightMode ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/5'}`}>
                            <div className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Your last feedback</div>
                            {!latestFeedback ? (
                                <div className={`mt-2 text-sm ${isLightMode ? 'text-slate-600' : 'text-secondary-300'}`}>No feedback yet.</div>
                            ) : (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-500'}`}>
                                            {latestFeedback?.createdAt ? new Date(latestFeedback.createdAt).toLocaleString() : ''}
                                        </div>
                                        <div className="text-sm font-extrabold text-amber-500">{latestFeedback.rating}/5</div>
                                    </div>
                                    <div className={`mt-2 text-sm whitespace-pre-wrap ${isLightMode ? 'text-slate-700' : 'text-secondary-200'}`}>
                                        {latestFeedback.message ? latestFeedback.message : 'No message'}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                Rating
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => setFeedbackRating(v)}
                                        className={`h-10 w-10 rounded-xl border text-lg font-extrabold transition ${feedbackRating >= v
                                                ? isLightMode
                                                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                                                    : 'bg-amber-500/10 border-amber-400/20 text-amber-300'
                                                : isLightMode
                                                    ? 'bg-white border-slate-200 text-slate-300 hover:bg-slate-50'
                                                    : 'bg-white/5 border-white/10 text-secondary-500 hover:bg-white/10'
                                            }`}
                                        aria-label={`Rate ${v} star`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <p className={`mt-2 text-xs ${isLightMode ? 'text-gray-500' : 'text-secondary-500'}`}>
                                {feedbackRating ? `You selected ${feedbackRating}/5` : 'Select a rating to submit'}
                            </p>
                        </div>

                        <div>
                            <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                Message (optional)
                            </p>
                            <textarea
                                value={feedbackMessage}
                                onChange={(e) => setFeedbackMessage(e.target.value)}
                                rows={4}
                                className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60'
                                    }`}
                                placeholder="Tell us what you liked, what to improve, or any suggestions..."
                            />
                        </div>

                        {feedbackError && (
                            <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}>
                                {feedbackError}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => closeFeedbackModal()}
                                className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${isLightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-white/5 text-secondary-200 hover:bg-white/10'
                                    }`}
                                disabled={feedbackSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitFeedback}
                                className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition ${feedbackRating && !feedbackSubmitting ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-600/40 cursor-not-allowed'
                                    }`}
                                disabled={!feedbackRating || feedbackSubmitting}
                            >
                                {feedbackSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </ModalShell>
            )}

            {showBugModal && (
                <ModalShell
                    isLightMode={isLightMode}
                    title="Report a Bug"
                    onClose={() => closeBugModal()}
                >
                    <div className="space-y-4">
                        <div>
                            <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                Title
                            </p>
                            <input
                                value={bugTitle}
                                onChange={(e) => setBugTitle(e.target.value)}
                                className={`mt-2 h-10 w-full rounded-xl border px-3 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60'
                                    }`}
                                placeholder="Short summary (e.g., Subject list not loading)"
                            />
                        </div>

                        <div>
                            <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>
                                Description
                            </p>
                            <textarea
                                value={bugDescription}
                                onChange={(e) => setBugDescription(e.target.value)}
                                rows={5}
                                className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode
                                        ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400'
                                        : 'border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60'
                                    }`}
                                placeholder="What happened? What did you expect? Steps to reproduce..."
                            />
                        </div>

                        <div className={`rounded-xl border px-3 py-2 text-xs ${isLightMode ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-secondary-300'}`}>
                            <div className="font-semibold">Page URL</div>
                            <div className="mt-1 break-all">{typeof window !== 'undefined' ? window.location.href : ''}</div>
                        </div>

                        {bugError && (
                            <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}>
                                {bugError}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => closeBugModal()}
                                className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${isLightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-white/5 text-secondary-200 hover:bg-white/10'
                                    }`}
                                disabled={bugSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitBug}
                                className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition ${bugTitle.trim() && bugDescription.trim() && !bugSubmitting
                                        ? 'bg-purple-600 hover:bg-purple-500'
                                        : 'bg-purple-600/40 cursor-not-allowed'
                                    }`}
                                disabled={!bugTitle.trim() || !bugDescription.trim() || bugSubmitting}
                            >
                                {bugSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </ModalShell>
            )}

            {/* Footer */}
        </div>
    );
};

const ModalShell = ({ isLightMode, title, onClose, children }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
                aria-label="Close modal"
            />
            <div
                className={`relative w-full max-w-lg rounded-2xl border shadow-xl ${isLightMode
                        ? 'border-slate-200 bg-white text-slate-900'
                        : 'border-white/10 bg-primary-900 text-secondary-100'
                    }`}
            >
                <div className={`flex items-center justify-between px-5 py-4 border-b ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                    <h2 className="text-base font-extrabold">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`h-9 w-9 rounded-lg ${isLightMode ? 'hover:bg-slate-100' : 'hover:bg-white/5'} transition`}
                        aria-label="Close"
                    >
                        <svg className="h-5 w-5 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    );
};

export default Sidebar;
