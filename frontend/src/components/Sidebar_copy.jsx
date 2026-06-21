import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../utils/hooks';
import { apiClient, notificationAPI, subjectAPI, uploadAPI, userUploadAPI } from '../services/api';
import { ASLogo } from './Logo';

/* ─── Data ───────────────────────────────────────────────────────── */
const SUBJECTS = [
    { id: 'math1',   name: 'Mathematics-I',       icon: '∑',  color: '#8B5CF6' },
    { id: 'physics', name: 'Physics',              icon: '⚛',  color: '#3B82F6' },
    { id: 'chem',    name: 'Chemistry',            icon: '🧪', color: '#10B981' },
    { id: 'elec',    name: 'Electronics',          icon: '⚡', color: '#F59E0B' },
    { id: 'engraph', name: 'Engineering Graphics', icon: '📐', color: '#EF4444' },
    { id: 'ai',      name: 'AI Fundamentals',      icon: '🤖', color: '#6366F1' },
];

const RECENT_ACTIVITY = [
    { icon: '📝', text: '2 new notes uploaded',   time: '2h ago' },
    { icon: '📄', text: 'Physics PYQ added',       time: '5h ago' },
    { icon: '❓', text: '4 unanswered doubts',     time: '1d ago' },
];

const W_OPEN   = 280;
const W_CLOSED = 72;

/* ═══════════════════════════════════════════════════════════════════
   TOOLTIP — reusable, portal-free, CSS-driven
═══════════════════════════════════════════════════════════════════ */
const Tip = ({ label, color, children, side = 'right' }) => (
    <div className="relative group/tip flex items-center w-full">
        {children}
        <div
            className="pointer-events-none absolute z-[200] opacity-0 group-hover/tip:opacity-100 transition-all duration-150 translate-x-1 group-hover/tip:translate-x-0"
            style={{ left: '100%', top: '50%', transform: 'translateY(-50%) translateX(10px)', whiteSpace: 'nowrap' }}
        >
            <div
                className="ml-3 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white shadow-xl"
                style={{
                    background: 'rgba(12,7,30,0.97)',
                    border: `1px solid ${color ? color + '50' : 'rgba(139,92,246,0.35)'}`,
                    boxShadow: `0 4px 20px rgba(0,0,0,0.6)${color ? `, 0 0 10px ${color}25` : ''}`,
                }}
            >
                {label}
            </div>
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════
   SEARCH MODAL — command-palette style
═══════════════════════════════════════════════════════════════════ */
const SearchModal = ({ open, onClose, onSelect, activeSubject }) => {
    const [q, setQ] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 60); }
    }, [open]);

    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        if (open) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open, onClose]);

    const results = useMemo(() => {
        const query = q.trim().toLowerCase();
        return query ? SUBJECTS.filter(s => s.name.toLowerCase().includes(query)) : SUBJECTS;
    }, [q]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[18vh] px-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70"
                style={{ backdropFilter: 'blur(6px)' }}
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -12 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: 'rgba(8,4,22,0.98)',
                    border: '1px solid rgba(139,92,246,0.25)',
                    boxShadow: '0 0 60px rgba(139,92,246,0.2), 0 32px 64px rgba(0,0,0,0.7)',
                }}
            >
                {/* Input */}
                <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(139,92,246,0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Search subjects..."
                        className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-500"
                        style={{ fontFamily: "'Inter',sans-serif", caretColor: '#8B5CF6' }}
                    />
                    <kbd className="hidden sm:flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded text-slate-500"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="py-2 max-h-72 overflow-y-auto">
                    {results.length === 0 ? (
                        <p className="text-center py-6 text-sm text-slate-500">No subjects found</p>
                    ) : results.map((s, i) => (
                        <motion.button
                            key={s.id}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => { onSelect(s.id); onClose(); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-100 group"
                            style={{ background: activeSubject === s.id ? `${s.color}15` : 'transparent' }}
                            onMouseEnter={e => e.currentTarget.style.background = `${s.color}10`}
                            onMouseLeave={e => e.currentTarget.style.background = activeSubject === s.id ? `${s.color}15` : 'transparent'}
                        >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                                style={{ background: `${s.color}18`, border: `1px solid ${s.color}35`, color: s.color }}>
                                {s.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{s.name}</p>
                            </div>
                            {activeSubject === s.id && (
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                            )}
                        </motion.button>
                    ))}
                </div>

                <div className="px-4 py-2.5 flex items-center gap-4" style={{ borderTop: '1px solid rgba(139,92,246,0.08)' }}>
                    <span className="text-[10px] text-slate-600">↑↓ navigate</span>
                    <span className="text-[10px] text-slate-600">↵ select</span>
                    <span className="text-[10px] text-slate-600">esc close</span>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════════ */
const Sidebar = ({
    currentBranch, cycle,
    showProfile, onProfileClick,
    subjectSearch, onSubjectSearchChange,
    isCollapsed, onCollapsedChange,
}) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    /* ── modal state ── */
    const [showProfileMenu,       setShowProfileMenu]       = useState(false);
    const [showFeedbackModal,     setShowFeedbackModal]     = useState(false);
    const [feedbackRating,        setFeedbackRating]        = useState(0);
    const [feedbackMessage,       setFeedbackMessage]       = useState('');
    const [feedbackSubmitting,    setFeedbackSubmitting]    = useState(false);
    const [feedbackError,         setFeedbackError]         = useState('');
    const [feedbackStats,         setFeedbackStats]         = useState({ total: 0, avgRating: 0 });
    const [latestFeedback,        setLatestFeedback]        = useState(null);
    const [feedbackMetaLoading,   setFeedbackMetaLoading]   = useState(false);
    const [showBugModal,          setShowBugModal]          = useState(false);
    const [bugTitle,              setBugTitle]              = useState('');
    const [bugDescription,        setBugDescription]        = useState('');
    const [bugSubmitting,         setBugSubmitting]         = useState(false);
    const [bugError,              setBugError]              = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [notifications,         setNotifications]         = useState([]);
    const [notificationsLoading,  setNotificationsLoading]  = useState(false);
    const [unreadCount,           setUnreadCount]           = useState(0);
    const [mobileMenuOpen,        setMobileMenuOpen]        = useState(false);
    const [showAdminUploadModal,  setShowAdminUploadModal]  = useState(false);
    const [showUserUploadModal,   setShowUserUploadModal]   = useState(false);
    const [adminSubjects,         setAdminSubjects]         = useState([]);
    const [adminSubjectsLoading,  setAdminSubjectsLoading]  = useState(false);
    const [adminUploadLoading,    setAdminUploadLoading]    = useState(false);
    const [adminUploadError,      setAdminUploadError]      = useState('');
    const [adminSubjectId,        setAdminSubjectId]        = useState('');
    const [adminContentType,      setAdminContentType]      = useState('');
    const [adminFiles,            setAdminFiles]            = useState([]);
    const [adminUploadProgress,   setAdminUploadProgress]   = useState(0);
    const [adminUploadFileIndex,  setAdminUploadFileIndex]  = useState(0);
    const [adminUploadFileTotal,  setAdminUploadFileTotal]  = useState(0);
    const [userSubjects,          setUserSubjects]          = useState([]);
    const [userSubjectsLoading,   setUserSubjectsLoading]   = useState(false);
    const [userUploadLoading,     setUserUploadLoading]     = useState(false);
    const [userUploadError,       setUserUploadError]       = useState('');
    const [userSubjectCode,       setUserSubjectCode]       = useState('');
    const [userContentType,       setUserContentType]       = useState('');
    const [userFiles,             setUserFiles]             = useState([]);
    const [userUploadProgress,    setUserUploadProgress]    = useState(0);
    const [userUploadFileIndex,   setUserUploadFileIndex]   = useState(0);
    const [userUploadFileTotal,   setUserUploadFileTotal]   = useState(0);

    /* ── sidebar state ── */
    const [searchQuery,   setSearchQuery]   = useState('');
    const [activeSubject, setActiveSubject] = useState(null);
    const [showSearch,    setShowSearch]    = useState(false);
    const [theme, setTheme] = useState(() => {
        try { return localStorage.getItem('uiTheme') === 'light' ? 'light' : 'dark'; }
        catch { return 'dark'; }
    });

    const isLightMode = theme === 'light';
    const collapsed   = !!isCollapsed;

    useEffect(() => {
        try { localStorage.setItem('uiTheme', theme); window.dispatchEvent(new Event('uiThemeChange')); }
        catch { /* ignore */ }
    }, [theme]);

    /* ── ⌘K global shortcut ── */
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    /* ── notifications ── */
    const fetchNotifications = useCallback(async () => {
        try {
            setNotificationsLoading(true);
            const res = await notificationAPI.getNotifications(currentBranch, cycle, 30);
            setNotifications(res.data.notifications || []);
            setUnreadCount(res.data.unreadCount || 0);
        } catch { setNotifications([]); setUnreadCount(0); }
        finally { setNotificationsLoading(false); }
    }, [currentBranch, cycle]);

    useEffect(() => {
        fetchNotifications();
        const iv = setInterval(fetchNotifications, 120000);
        return () => clearInterval(iv);
    }, [fetchNotifications]);

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead(currentBranch, cycle);
            setNotifications(p => p.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch { /* ignore */ }
    };

    /* ── feedback ── */
    const closeFeedbackModal = () => { setShowFeedbackModal(false); setFeedbackSubmitting(false); setFeedbackError(''); };
    const loadFeedbackMeta = async () => {
        setFeedbackMetaLoading(true);
        try {
            const [sR, lR] = await Promise.all([apiClient.get('/feedback/stats'), apiClient.get('/feedback/me/latest')]);
            setFeedbackStats(sR?.data?.stats || { total: 0, avgRating: 0 });
            setLatestFeedback(lR?.data?.item || null);
        } catch { /* ignore */ }
        finally { setFeedbackMetaLoading(false); }
    };
    const closeBugModal = () => { setShowBugModal(false); setBugSubmitting(false); setBugError(''); };

    const submitFeedback = async () => {
        if (!feedbackRating || feedbackSubmitting) return;
        setFeedbackSubmitting(true); setFeedbackError('');
        try {
            await apiClient.post('/feedback', { rating: feedbackRating, message: feedbackMessage?.trim() || undefined });
            setFeedbackRating(0); setFeedbackMessage('');
            await loadFeedbackMeta(); closeFeedbackModal();
        } catch (e) { setFeedbackError(e?.response?.data?.error || 'Failed to submit'); }
        finally { setFeedbackSubmitting(false); }
    };

    const submitBug = async () => {
        if (!bugTitle.trim() || !bugDescription.trim() || bugSubmitting) return;
        setBugSubmitting(true); setBugError('');
        try {
            await apiClient.post('/bugs', { title: bugTitle.trim(), description: bugDescription.trim(), pageUrl: window.location.href });
            setBugTitle(''); setBugDescription(''); closeBugModal();
        } catch (e) { setBugError(e?.response?.data?.error || 'Failed to submit'); }
        finally { setBugSubmitting(false); }
    };

    /* ── upload helpers ── */
    const getUploadPercent = e => (!e || !e.total) ? 0 : Math.min(100, Math.round((e.loaded / e.total) * 100));
    const isZipFile = f => f && ((f.name||'').toLowerCase().endsWith('.zip') || (f.type||'').includes('zip'));
    const isPdfFile = f => f && ((f.name||'').toLowerCase().endsWith('.pdf') || (f.type||'').includes('pdf'));

    const loadAdminSubjects = async () => {
        if (!user?.isAdmin) return;
        setAdminSubjectsLoading(true); setAdminUploadError('');
        try {
            const branches = ['CS','IS','EC','EE','ME','CV','CSE','ISE','ECE','EEE','MECH','CIVIL','AIML','DS','CSBS','IT','CI','BT','IM','CH','ET','EI'];
            const results = await Promise.all(branches.flatMap(b => ['P','C'].map(c =>
                subjectAPI.getSubjectsByBranch(b, c).then(r => ({ subjects: r.data || [] })).catch(() => ({ subjects: [] }))
            )));
            const map = new Map();
            results.forEach(({ subjects }) => subjects.forEach(s => {
                const code = String(s.code || '').trim();
                if (code && !map.has(code)) map.set(code, s);
            }));
            setAdminSubjects([...map.values()].sort((a, b) => String(a.code).localeCompare(String(b.code))));
        } catch { setAdminUploadError('Failed to load subjects'); }
        finally { setAdminSubjectsLoading(false); }
    };

    const loadUserSubjects = async () => {
        setUserSubjectsLoading(true); setUserUploadError('');
        try { const r = await subjectAPI.getSubjectsByBranch(currentBranch, cycle); setUserSubjects(r.data || []); }
        catch { setUserUploadError('Failed to load subjects'); }
        finally { setUserSubjectsLoading(false); }
    };

    useEffect(() => { if (showAdminUploadModal && user?.isAdmin && !adminSubjects.length) loadAdminSubjects(); }, [showAdminUploadModal, user?.isAdmin]);
    useEffect(() => { if (showUserUploadModal && !userSubjects.length) loadUserSubjects(); }, [showUserUploadModal, currentBranch, cycle]);

    const handleAdminUploadSubmit = async (e) => {
        e.preventDefault();
        if (!adminSubjectId || !adminFiles.length) { setAdminUploadError('Please fill all required fields'); return; }
        const zipFile = adminFiles.find(isZipFile);
        if (zipFile && adminFiles.length > 1) { setAdminUploadError('Upload only one ZIP file at a time'); return; }
        if (!zipFile && !adminContentType) { setAdminUploadError('Please select a content type'); return; }
        if (!zipFile && adminFiles.some(f => !isPdfFile(f))) { setAdminUploadError('Only PDF files are supported'); return; }
        const total = zipFile ? 1 : adminFiles.length;
        setAdminUploadFileTotal(total); setAdminUploadFileIndex(0); setAdminUploadProgress(0);
        setAdminUploadLoading(true); setAdminUploadError('');
        try {
            if (zipFile) {
                setAdminUploadFileIndex(1);
                await uploadAPI.uploadSubjectZip(adminSubjectId, zipFile, { onUploadProgress: ev => setAdminUploadProgress(getUploadPercent(ev)) });
            } else {
                for (let i = 0; i < adminFiles.length; i++) {
                    setAdminUploadFileIndex(i + 1); setAdminUploadProgress(0);
                    await uploadAPI.uploadSubjectFiles(adminSubjectId, adminContentType, [adminFiles[i]], { onUploadProgress: ev => setAdminUploadProgress(getUploadPercent(ev)) });
                }
            }
            setAdminSubjectId(''); setAdminContentType(''); setAdminFiles([]);
            setShowAdminUploadModal(false); alert('Upload complete. Study materials updated.');
        } catch (err) { setAdminUploadError(err?.response?.data?.error || err?.message || 'Upload failed'); }
        finally { setAdminUploadLoading(false); setAdminUploadProgress(0); setAdminUploadFileIndex(0); setAdminUploadFileTotal(0); }
    };

    const handleUserUploadSubmit = async (e) => {
        e.preventDefault();
        if (!userSubjectCode || !userContentType || !userFiles.length) { setUserUploadError('Please fill all required fields'); return; }
        setUserUploadFileTotal(userFiles.length); setUserUploadFileIndex(0); setUserUploadProgress(0);
        setUserUploadLoading(true); setUserUploadError('');
        try {
            const fd = new FormData();
            userFiles.forEach(f => fd.append('files', f));
            fd.append('contentType', userContentType); fd.append('subjectCode', userSubjectCode);
            await userUploadAPI.createUpload(fd, { onUploadProgress: ev => {
                const pct = getUploadPercent(ev); setUserUploadProgress(pct);
                setUserUploadFileIndex(Math.min(userFiles.length, Math.max(1, Math.round((pct / 100) * userFiles.length))));
            }});
            setUserSubjectCode(''); setUserContentType(''); setUserFiles([]);
            setShowUserUploadModal(false); alert('Upload sent to admin for review.');
        } catch (err) { setUserUploadError(err?.response?.data?.error || err?.message || 'Upload failed'); }
        finally { setUserUploadLoading(false); setUserUploadProgress(0); setUserUploadFileIndex(0); setUserUploadFileTotal(0); }
    };

    /* ── derived ── */
    const filteredSubjects = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return q ? SUBJECTS.filter(s => s.name.toLowerCase().includes(q)) : SUBJECTS;
    }, [searchQuery]);

    /* ════════════════════════════════════════════════════════════════
       RENDER
    ════════════════════════════════════════════════════════════════ */
    return (
        <>
            {/* ── Search Command Palette ── */}
            <AnimatePresence>
                {showSearch && (
                    <SearchModal
                        open={showSearch}
                        onClose={() => setShowSearch(false)}
                        onSelect={(id) => { setActiveSubject(id); navigate(`/dashboard/subject/${id}/content`); }}
                        activeSubject={activeSubject}
                    />
                )}
            </AnimatePresence>

            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileMenuOpen(v => !v)}
                className="sm:hidden fixed top-4 left-4 z-50 h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(8,4,22,0.97)', border: '1px solid rgba(139,92,246,0.35)', boxShadow: '0 0 16px rgba(139,92,246,0.2)' }}
            >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
            </button>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div key="bk"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="sm:hidden fixed inset-0 z-40 bg-black/70"
                        style={{ backdropFilter: 'blur(4px)' }}
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* ══════════════════════════════════════════════════
                SIDEBAR SHELL
            ══════════════════════════════════════════════════ */}
            <motion.div
                animate={{ width: collapsed ? W_CLOSED : W_OPEN }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className={`h-screen fixed left-0 top-0 z-40 flex flex-col overflow-hidden
                    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}
                style={{
                    background: 'linear-gradient(180deg,#080416 0%,#050110 50%,#030711 100%)',
                    borderRight: '1px solid rgba(139,92,246,0.12)',
                    boxShadow: '4px 0 32px rgba(0,0,0,0.6)',
                }}
            >
                {/* Decorative grid */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(rgba(139,92,246,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.022) 1px,transparent 1px)',
                    backgroundSize: '28px 28px',
                }} />
                {/* Top glow */}
                <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none" style={{
                    background: 'radial-gradient(ellipse at 50% -20%,rgba(139,92,246,0.16) 0%,transparent 68%)',
                }} />

                {/* ── HEADER ─────────────────────────────────── */}
                <div className="relative z-10 flex items-center flex-shrink-0 px-3"
                    style={{ height: 56, borderBottom: '1px solid rgba(139,92,246,0.1)' }}>

                    {/* Logo — always centered when collapsed */}
                    <motion.div
                        animate={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden"
                    >
                        <motion.div
                            animate={{ width: collapsed ? 36 : 36, height: collapsed ? 36 : 36 }}
                            className="flex-shrink-0 flex items-center justify-center rounded-xl"
                            style={{
                                background: 'rgba(139,92,246,0.1)',
                                border: '1px solid rgba(139,92,246,0.28)',
                                boxShadow: '0 0 16px rgba(139,92,246,0.2)',
                            }}
                        >
                            <ASLogo size={22} className="drop-shadow-[0_0_8px_rgba(139,92,246,0.75)]" />
                        </motion.div>

                        <AnimatePresence initial={false}>
                            {!collapsed && (
                                <motion.span
                                    key="wordmark"
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.22 }}
                                    className="overflow-hidden whitespace-nowrap select-none"
                                    style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif", fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em' }}
                                >
                                    <span style={{ color: '#f8fafc' }}>Ask</span>
                                    <span style={{ color: '#8B5CF6' }}>UR</span>
                                    <span style={{ color: '#f8fafc' }}>Senior</span>
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Collapse button */}
                    <Tip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                        <motion.button
                            onClick={() => onCollapsedChange?.(!collapsed)}
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(139,92,246,0.16)' }}
                            whileTap={{ scale: 0.9 }}
                            className="hidden sm:flex items-center justify-center rounded-lg flex-shrink-0 transition-colors"
                            style={{
                                width: 28, height: 28,
                                background: 'rgba(139,92,246,0.08)',
                                border: '1px solid rgba(139,92,246,0.2)',
                                color: 'rgba(139,92,246,0.75)',
                                marginLeft: collapsed ? 'auto' : 4,
                                marginRight: collapsed ? 'auto' : 0,
                            }}
                        >
                            <motion.svg
                                animate={{ rotate: collapsed ? 180 : 0 }}
                                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </motion.svg>
                        </motion.button>
                    </Tip>
                </div>

                {/* ── SEARCH ─────────────────────────────────── */}
                <div className="relative z-10 px-2 flex-shrink-0" style={{ paddingTop: 10, paddingBottom: 6 }}>
                    <AnimatePresence initial={false} mode="wait">
                        {!collapsed ? (
                            <motion.div
                                key="search-full"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="relative flex items-center overflow-hidden"
                                style={{
                                    background: 'rgba(139,92,246,0.05)',
                                    border: '1px solid rgba(139,92,246,0.15)',
                                    borderRadius: 100,
                                }}
                            >
                                <svg className="absolute left-3 w-3.5 h-3.5 pointer-events-none flex-shrink-0"
                                    style={{ color: 'rgba(139,92,246,0.5)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    id="sidebar-subject-search"
                                    type="text" value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onClick={() => setShowSearch(true)}
                                    placeholder="Search subjects..."
                                    className="w-full bg-transparent outline-none text-xs py-2.5 pl-9 pr-12 cursor-pointer"
                                    style={{ color: '#e2e8f0', caretColor: '#8B5CF6', fontFamily: "'Inter',sans-serif" }}
                                    readOnly
                                />
                                <span className="absolute right-2.5 text-[9px] font-mono px-1.5 py-0.5 rounded select-none"
                                    style={{ color: 'rgba(139,92,246,0.45)', background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.13)' }}>
                                    ⌘K
                                </span>
                            </motion.div>
                        ) : (
                            <motion.div key="search-icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex justify-center">
                                <Tip label="Search Subjects">
                                    <motion.button
                                        onClick={() => setShowSearch(true)}
                                        whileHover={{ scale: 1.08, backgroundColor: 'rgba(139,92,246,0.14)' }}
                                        whileTap={{ scale: 0.93 }}
                                        className="w-full flex items-center justify-center rounded-xl transition-colors"
                                        style={{
                                            height: 36,
                                            background: 'rgba(139,92,246,0.07)',
                                            border: '1px solid rgba(139,92,246,0.15)',
                                            color: 'rgba(139,92,246,0.65)',
                                        }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </motion.button>
                                </Tip>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── SUBJECT LIST ────────────────────────────── */}
                <nav className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 custom-scrollbar-premium">
                    <div className="space-y-0.5 mt-0.5">
                        {filteredSubjects.map((subject, i) => (
                            <SubjectItem
                                key={subject.id}
                                subject={subject}
                                index={i}
                                isActive={activeSubject === subject.id}
                                collapsed={collapsed}
                                onClick={() => { setActiveSubject(subject.id); navigate(`/dashboard/subject/${subject.id}/content`); }}
                            />
                        ))}
                        {filteredSubjects.length === 0 && !collapsed && (
                            <p className="py-6 text-center text-xs" style={{ color: 'rgba(148,163,184,0.3)' }}>
                                No subjects found
                            </p>
                        )}
                    </div>

                    {/* Recent activity (expanded only) */}
                    <AnimatePresence initial={false}>
                        {!collapsed && (
                            <motion.div
                                key="activity"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-5 mb-1">
                                    <div className="flex items-center gap-2 px-1 mb-2">
                                        <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(139,92,246,0.38)', letterSpacing: '0.16em' }}>
                                            Recent Activity
                                        </span>
                                        <div className="flex-1 h-px" style={{ background: 'rgba(139,92,246,0.1)' }} />
                                    </div>
                                    <div className="space-y-0.5 px-1">
                                        {RECENT_ACTIVITY.map((item, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -6 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.1 + i * 0.04 }}
                                                className="flex items-center gap-2.5 py-1.5 group/act"
                                            >
                                                <span className="text-xs leading-none flex-shrink-0">{item.icon}</span>
                                                <span className="text-[11px] flex-1 truncate" style={{ color: 'rgba(148,163,184,0.5)' }}>
                                                    {item.text}
                                                </span>
                                                <span className="text-[9px] flex-shrink-0 font-medium" style={{ color: 'rgba(100,116,139,0.4)' }}>
                                                    {item.time}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </nav>

                {/* ── PROFILE ─────────────────────────────────── */}
                <div className="relative z-10 flex-shrink-0 p-2"
                    style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
                    <ProfileCard
                        user={user}
                        currentBranch={currentBranch}
                        collapsed={collapsed}
                        showProfileMenu={showProfileMenu}
                        setShowProfileMenu={setShowProfileMenu}
                        onProfileClick={onProfileClick}
                        onFeedback={() => { setFeedbackError(''); setFeedbackRating(0); setFeedbackMessage(''); loadFeedbackMeta(); setShowFeedbackModal(true); }}
                        onBug={() => { setBugError(''); setBugTitle(''); setBugDescription(''); setShowBugModal(true); }}
                        onNotifications={() => setShowNotificationModal(true)}
                        unreadCount={unreadCount}
                        theme={theme} setTheme={setTheme} isLightMode={isLightMode}
                        logout={logout} navigate={navigate}
                        user_isAdmin={user?.isAdmin}
                        setShowAdminUploadModal={setShowAdminUploadModal}
                        setShowUserUploadModal={setShowUserUploadModal}
                    />
                </div>

                {/* ── MODALS ──────────────────────────────────── */}
                {showFeedbackModal && (
                    <ModalShell isLightMode={isLightMode} title="Feedback" onClose={closeFeedbackModal}>
                        <div className="space-y-4">
                            <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-secondary-200'}`}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="font-semibold">Average rating</div>
                                    <div className="font-extrabold">{feedbackMetaLoading ? '...' : `${feedbackStats.avgRating}/5`}</div>
                                </div>
                                <div className={`mt-1 text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-500'}`}>{feedbackMetaLoading ? 'Loading...' : `${feedbackStats.total} total feedbacks`}</div>
                            </div>
                            <div className={`rounded-xl border px-3 py-2 ${isLightMode ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/5'}`}>
                                <div className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Your last feedback</div>
                                {!latestFeedback ? <div className={`mt-2 text-sm ${isLightMode ? 'text-slate-600' : 'text-secondary-300'}`}>No feedback yet.</div> : (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-secondary-500'}`}>{latestFeedback?.createdAt ? new Date(latestFeedback.createdAt).toLocaleString() : ''}</div>
                                            <div className="text-sm font-extrabold text-amber-500">{latestFeedback.rating}/5</div>
                                        </div>
                                        <div className={`mt-2 text-sm whitespace-pre-wrap ${isLightMode ? 'text-slate-700' : 'text-secondary-200'}`}>{latestFeedback.message || 'No message'}</div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Rating</p>
                                <div className="mt-2 flex items-center gap-2">
                                    {[1,2,3,4,5].map(v => (
                                        <button key={v} type="button" onClick={() => setFeedbackRating(v)}
                                            className={`h-10 w-10 rounded-xl border text-lg font-extrabold transition ${feedbackRating >= v ? isLightMode ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-500/10 border-amber-400/20 text-amber-300' : isLightMode ? 'bg-white border-slate-200 text-slate-300 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-secondary-500 hover:bg-white/10'}`}>★</button>
                                    ))}
                                </div>
                                <p className={`mt-2 text-xs ${isLightMode ? 'text-gray-500' : 'text-secondary-500'}`}>{feedbackRating ? `You selected ${feedbackRating}/5` : 'Select a rating'}</p>
                            </div>
                            <div>
                                <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Message (optional)</p>
                                <textarea value={feedbackMessage} onChange={e => setFeedbackMessage(e.target.value)} rows={4} className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode ? 'border-slate-200 bg-white text-slate-900 focus:border-purple-400' : 'border-white/10 bg-white/5 text-secondary-100 focus:border-purple-500/60'}`} placeholder="Tell us what you liked..." />
                            </div>
                            {feedbackError && <div className={`rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-red-200 bg-red-50 text-red-700' : 'border-red-500/20 bg-red-500/10 text-red-200'}`}>{feedbackError}</div>}
                            <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={closeFeedbackModal} className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${isLightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-white/5 text-secondary-200 hover:bg-white/10'}`} disabled={feedbackSubmitting}>Cancel</button>
                                <button type="button" onClick={submitFeedback} className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition ${feedbackRating && !feedbackSubmitting ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-600/40 cursor-not-allowed'}`} disabled={!feedbackRating || feedbackSubmitting}>{feedbackSubmitting ? 'Submitting...' : 'Submit'}</button>
                            </div>
                        </div>
                    </ModalShell>
                )}

                {showAdminUploadModal && (
                    <ModalShell isLightMode={isLightMode} title="Admin Upload" onClose={() => { setShowAdminUploadModal(false); setAdminUploadError(''); }}>
                        <form onSubmit={handleAdminUploadSubmit} className="space-y-4">
                            <div>
                                <label className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Subject</label>
                                <select value={adminSubjectId} onChange={e => setAdminSubjectId(e.target.value)} className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-white text-slate-900'}`}>
                                    <option value="">Select a subject</option>
                                    {adminSubjects.map(s => <option key={s._id} value={s._id}>{s.code}</option>)}
                                </select>
                                {adminSubjectsLoading && <p className="text-xs mt-1 text-secondary-400">Loading subjects...</p>}
                            </div>
                            <div>
                                <label className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Content Type</label>
                                <select value={adminContentType} onChange={e => setAdminContentType(e.target.value)} className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-white text-slate-900'}`}>
                                    <option value="">Select content type</option>
                                    <option value="notes">Notes</option><option value="pyqs">PYQs</option><option value="questionBanks">Question Banks</option><option value="syllabus">Syllabus</option><option value="resources">Resources</option>
                                </select>
                            </div>
                            <div>
                                <label className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Files</label>
                                <input type="file" multiple onChange={e => setAdminFiles(Array.from(e.target.files || []))} className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-white text-slate-900'}`} accept=".pdf,.zip" />
                                <p className="mt-1 text-xs text-secondary-400">PDF or ZIP with folder structure.</p>
                            </div>
                            {adminUploadError && <div className="rounded-xl border px-3 py-2 text-sm border-red-500/20 bg-red-500/10 text-red-200">{adminUploadError}</div>}
                            <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={() => setShowAdminUploadModal(false)} className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${isLightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-white/5 text-secondary-200 hover:bg-white/10'}`} disabled={adminUploadLoading}>Cancel</button>
                                <button type="submit" className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition ${adminUploadLoading ? 'bg-purple-600/40 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'}`} disabled={adminUploadLoading}>{adminUploadLoading ? `${adminUploadFileIndex}/${adminUploadFileTotal} (${adminUploadProgress}%)` : 'Upload'}</button>
                            </div>
                        </form>
                    </ModalShell>
                )}

                {showUserUploadModal && (
                    <ModalShell isLightMode={isLightMode} title="Upload Materials" onClose={() => { setShowUserUploadModal(false); setUserUploadError(''); }}>
                        <form onSubmit={handleUserUploadSubmit} className="space-y-4">
                            <div className="rounded-xl border px-3 py-2 text-xs border-white/10 bg-white/5 text-secondary-300">Your upload is sent to admin review.</div>
                            <div>
                                <label className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Subject</label>
                                <select value={userSubjectCode} onChange={e => setUserSubjectCode(e.target.value)} className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-white text-slate-900'}`}>
                                    <option value="">Select a subject</option>
                                    {userSubjects.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                                </select>
                                {userSubjectsLoading && <p className="text-xs mt-1 text-secondary-400">Loading...</p>}
                            </div>
                            <div>
                                <label className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Content Type</label>
                                <select value={userContentType} onChange={e => setUserContentType(e.target.value)} className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-white text-slate-900'}`}>
                                    <option value="">Select content type</option>
                                    <option value="notes">Notes</option><option value="pyqs">PYQs</option><option value="questionBanks">Question Banks</option><option value="syllabus">Syllabus</option><option value="resources">Resources</option>
                                </select>
                            </div>
                            <div>
                                <label className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Files</label>
                                <input type="file" multiple onChange={e => setUserFiles(Array.from(e.target.files || []))} className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm ${isLightMode ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-white text-slate-900'}`} accept=".pdf,.doc,.docx,.ppt,.pptx" />
                            </div>
                            {userUploadError && <div className="rounded-xl border px-3 py-2 text-sm border-red-500/20 bg-red-500/10 text-red-200">{userUploadError}</div>}
                            <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={() => setShowUserUploadModal(false)} className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${isLightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-white/5 text-secondary-200 hover:bg-white/10'}`} disabled={userUploadLoading}>Cancel</button>
                                <button type="submit" className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition ${userUploadLoading ? 'bg-purple-600/40 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500'}`} disabled={userUploadLoading}>{userUploadLoading ? `${userUploadFileIndex}/${userUploadFileTotal} (${userUploadProgress}%)` : 'Submit'}</button>
                            </div>
                        </form>
                    </ModalShell>
                )}

                {showBugModal && (
                    <ModalShell isLightMode={isLightMode} title="Report a Bug" onClose={closeBugModal}>
                        <div className="space-y-4">
                            <div>
                                <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Title</p>
                                <input value={bugTitle} onChange={e => setBugTitle(e.target.value)} className={`mt-2 h-10 w-full rounded-xl border px-3 text-sm outline-none ${isLightMode ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-white/5 text-secondary-100'}`} placeholder="Short summary" />
                            </div>
                            <div>
                                <p className={`text-sm font-semibold ${isLightMode ? 'text-slate-800' : 'text-secondary-100'}`}>Description</p>
                                <textarea value={bugDescription} onChange={e => setBugDescription(e.target.value)} rows={5} className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none ${isLightMode ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-white/5 text-secondary-100'}`} placeholder="What happened?" />
                            </div>
                            <div className="rounded-xl border px-3 py-2 text-xs border-white/10 bg-white/5 text-secondary-300">
                                <div className="font-semibold">Page URL</div>
                                <div className="mt-1 break-all">{typeof window !== 'undefined' ? window.location.href : ''}</div>
                            </div>
                            {bugError && <div className="rounded-xl border px-3 py-2 text-sm border-red-500/20 bg-red-500/10 text-red-200">{bugError}</div>}
                            <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={closeBugModal} className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${isLightMode ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-white/5 text-secondary-200 hover:bg-white/10'}`} disabled={bugSubmitting}>Cancel</button>
                                <button type="button" onClick={submitBug} className={`h-10 rounded-xl px-4 text-sm font-semibold text-white transition ${bugTitle.trim() && bugDescription.trim() && !bugSubmitting ? 'bg-purple-600 hover:bg-purple-500' : 'bg-purple-600/40 cursor-not-allowed'}`} disabled={!bugTitle.trim() || !bugDescription.trim() || bugSubmitting}>{bugSubmitting ? 'Submitting...' : 'Submit'}</button>
                            </div>
                        </div>
                    </ModalShell>
                )}

                {showNotificationModal && (
                    <ModalShell isLightMode={isLightMode} title="Notifications" onClose={() => { setShowNotificationModal(false); handleMarkAllAsRead(); }}>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {notificationsLoading ? (
                                <div className="text-center py-8 text-secondary-400">
                                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-sm">Loading...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-secondary-400">No notifications yet</p>
                                    <p className="text-xs mt-1 text-secondary-500 opacity-70">New content uploads will appear here</p>
                                </div>
                            ) : notifications.map(n => {
                                const isUnread = !n.isRead;
                                const typeColors = { notes:'bg-green-500/15 text-green-400 border-green-400/20', pyqs:'bg-purple-500/15 text-purple-400 border-purple-400/20', questionBanks:'bg-blue-500/15 text-blue-400 border-blue-400/20', syllabus:'bg-orange-500/15 text-orange-400 border-orange-400/20', feature:'bg-emerald-500/15 text-emerald-400 border-emerald-400/20', update:'bg-blue-500/15 text-blue-400 border-blue-400/20', announcement:'bg-amber-500/15 text-amber-400 border-amber-400/20' };
                                const typeLabels = { notes:'Notes', pyqs:'PYQs', questionBanks:'Q-Bank', syllabus:'Syllabus', feature:'New Feature', update:'Update', announcement:'Announcement' };
                                return (
                                    <div key={n._id} className={`rounded-xl border p-4 ${isUnread ? 'border-purple-500/30 bg-purple-500/10' : 'border-white/10 bg-white/5'}`}>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-secondary-100">{n.title}</h3>
                                            {isUnread && <span className="inline-flex items-center rounded-full bg-purple-500 text-white px-2 py-0.5 text-[10px] font-semibold">NEW</span>}
                                        </div>
                                        <p className="mt-1 text-sm text-secondary-300">{n.message}</p>
                                        {n.subjectCode && <div className="mt-2 text-xs text-secondary-400">📍 {n.subjectCode}{n.moduleName && ` → ${n.moduleName}`}</div>}
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-secondary-500">{n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }) : ''}</span>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${typeColors[n.type] || typeColors.update}`}>{typeLabels[n.type] || 'Update'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ModalShell>
                )}
            </motion.div>
        </>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   SUBJECT ITEM
═══════════════════════════════════════════════════════════════════ */
const SubjectItem = ({ subject, index, isActive, collapsed, onClick }) => {
    const content = (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.035, duration: 0.2 }}
            whileHover={!isActive ? { x: collapsed ? 0 : 2 } : {}}
            whileTap={{ scale: 0.96 }}
            className="w-full flex items-center rounded-xl text-left transition-all duration-200 relative overflow-hidden"
            style={{
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '8px' : '7px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive
                    ? `linear-gradient(135deg, ${subject.color}20 0%, ${subject.color}08 100%)`
                    : 'transparent',
                border: isActive
                    ? `1px solid ${subject.color}40`
                    : '1px solid transparent',
                boxShadow: isActive
                    ? `0 0 20px ${subject.color}15, inset 0 0 12px ${subject.color}06`
                    : 'none',
            }}
        >
            {/* Active left bar */}
            {isActive && (
                <motion.div
                    layoutId="active-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                    style={{
                        width: 3, height: 20,
                        background: `linear-gradient(180deg, ${subject.color}, ${subject.color}80)`,
                        boxShadow: `0 0 8px ${subject.color}, 0 0 16px ${subject.color}60`,
                    }}
                />
            )}

            {/* Icon */}
            <motion.div
                animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                className="flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-200"
                style={{
                    width: 28, height: 28, fontSize: 13,
                    background: isActive ? `${subject.color}28` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? subject.color + '50' : 'rgba(255,255,255,0.07)'}`,
                    color: isActive ? subject.color : 'rgba(100,116,139,0.75)',
                    boxShadow: isActive ? `0 0 10px ${subject.color}35` : 'none',
                }}
            >
                {subject.icon}
            </motion.div>

            {/* Label */}
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.span
                        key="label"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 text-[12.5px] font-medium truncate overflow-hidden whitespace-nowrap"
                        style={{ color: isActive ? '#f0ecff' : 'rgba(100,116,139,0.82)' }}
                    >
                        {subject.name}
                    </motion.span>
                )}
            </AnimatePresence>

            {/* Active dot (expanded) */}
            {isActive && !collapsed && (
                <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: subject.color, boxShadow: `0 0 6px ${subject.color}` }}
                />
            )}
        </motion.button>
    );

    // Wrap in tooltip when collapsed
    return collapsed ? (
        <Tip label={subject.name} color={subject.color}>{content}</Tip>
    ) : content;
};

/* ═══════════════════════════════════════════════════════════════════
   PROFILE CARD
═══════════════════════════════════════════════════════════════════ */
const ProfileCard = ({
    user, currentBranch, collapsed,
    showProfileMenu, setShowProfileMenu,
    onProfileClick, onFeedback, onBug, onNotifications,
    unreadCount, theme, setTheme, isLightMode,
    logout, navigate, user_isAdmin,
    setShowAdminUploadModal, setShowUserUploadModal,
}) => {
    const isAskPlus = user?.subscription === 'askplus';
    const isExpiringSoon = isAskPlus && user?.subscriptionExpiry && (new Date(user.subscriptionExpiry) - new Date()) < 3 * 24 * 60 * 60 * 1000;
    const avatarUrl = user?.profilePicture
        ? (user.profilePicture.startsWith('http') ? user.profilePicture : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profilePicture}`)
        : null;

    const trigger = (
        <motion.button
            type="button"
            onClick={() => setShowProfileMenu(v => !v)}
            whileHover={{ backgroundColor: 'rgba(139,92,246,0.1)' }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center rounded-xl transition-all duration-200"
            style={{
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '7px' : '7px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: showProfileMenu ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)',
                border: `1px solid ${showProfileMenu ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.12)'}`,
                boxShadow: showProfileMenu ? '0 0 16px rgba(139,92,246,0.15)' : 'none',
            }}
        >
            {/* Avatar */}
            <div className="flex-shrink-0 relative" style={{ width: 30, height: 30 }}>
                <div
                    className="w-full h-full rounded-full flex items-center justify-center text-white font-bold overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)',
                        border: '1.5px solid rgba(139,92,246,0.45)',
                        boxShadow: '0 0 10px rgba(139,92,246,0.3)',
                        fontSize: 12,
                    }}
                >
                    {avatarUrl
                        ? <img src={avatarUrl} alt={user?.usn} className="w-full h-full object-cover" />
                        : (user?.usn || 'U').slice(0, 1).toUpperCase()
                    }
                </div>
                {unreadCount > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#080416]" />
                )}
            </div>

            {/* Info */}
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        key="info"
                        initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-1 min-w-0 text-left overflow-hidden"
                    >
                        <p className="text-[12.5px] font-semibold text-white truncate whitespace-nowrap leading-tight">
                            {user?.usn || 'Student'}
                        </p>
                        <p className="text-[10px] truncate whitespace-nowrap mt-0.5 font-medium"
                            style={{ color: isAskPlus ? (isExpiringSoon ? '#f59e0b' : 'rgba(139,92,246,0.7)') : 'rgba(100,116,139,0.55)' }}>
                            {isAskPlus
                                ? `ASK+ • ${user.subscriptionExpiry ? new Date(user.subscriptionExpiry).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : 'Lifetime'}`
                                : 'Free Plan'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {!collapsed && (
                <motion.svg animate={{ rotate: showProfileMenu ? 180 : 0 }} transition={{ duration: 0.2 }}
                    className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(139,92,246,0.45)' }}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                </motion.svg>
            )}
        </motion.button>
    );

    return (
        <div className="relative">
            {collapsed ? <Tip label={user?.usn || 'Profile'}>{trigger}</Tip> : trigger}

            {/* Dropdown */}
            <AnimatePresence>
                {showProfileMenu && (
                    <motion.div
                        key="dropdown"
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute rounded-xl overflow-hidden"
                        style={{
                            bottom: '100%', marginBottom: 8,
                            left: collapsed ? '100%' : 0,
                            marginLeft: collapsed ? 8 : 0,
                            minWidth: 220,
                            right: collapsed ? 'auto' : 0,
                            background: 'rgba(8,4,22,0.98)',
                            border: '1px solid rgba(139,92,246,0.22)',
                            boxShadow: '0 -8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08)',
                            backdropFilter: 'blur(20px)',
                            zIndex: 100,
                        }}
                    >
                        {/* Header */}
                        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                            <p className="text-sm font-bold text-white truncate">{user?.name || user?.usn}</p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
                            {currentBranch && (
                                <span className="inline-flex mt-1.5 items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
                                    style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.22)' }}>
                                    {currentBranch}
                                </span>
                            )}
                        </div>

                        <div className="py-1">
                            <PMI icon={<UserIcon />}     label="My Profile"       onClick={onProfileClick} />
                            <PMI icon={<BellIcon cnt={unreadCount} />} label="Notifications" onClick={onNotifications} badge={unreadCount || null} />
                            <PMI icon={<FbIcon />}       label="Feedback"         onClick={onFeedback} />
                            <PMI icon={<BugIcon />}      label="Report a Bug"     onClick={onBug} />
                            <PMI icon={<DiscordIcon />}  label="Connect Discord"  color="#5865F2" onClick={() => { const t = localStorage.getItem('authToken'); window.location.href = `https://askursenior.onrender.com/api/discord/login?token=${t}`; }} />
                            <PMI icon={<ThemeIcon />}    label={isLightMode ? 'Dark Mode' : 'Light Mode'} onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
                            {user_isAdmin && <PMI icon={<UpIcon />} label="Admin Upload" color="#8B5CF6" onClick={() => setShowAdminUploadModal(true)} />}
                            <PMI icon={<UpIcon />}       label="Upload Materials" onClick={() => setShowUserUploadModal(true)} />
                            <div className="mx-3 my-1 h-px" style={{ background: 'rgba(139,92,246,0.1)' }} />
                            <PMI icon={<OutIcon />}      label="Logout"           color="#f87171" onClick={() => { logout(); navigate('/'); }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─── Profile menu item ─────────────────────────────────────────── */
const PMI = ({ icon, label, onClick, color, badge }) => (
    <button type="button" onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-2 text-[12.5px] font-medium group transition-all duration-100"
        style={{ color: color || 'rgba(148,163,184,0.85)' }}
        onMouseEnter={e => e.currentTarget.style.background = color ? `${color}14` : 'rgba(139,92,246,0.07)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
        <span style={{ color: color || 'rgba(100,116,139,0.7)', flexShrink: 0 }}>{icon}</span>
        <span className="flex-1 text-left group-hover:text-white transition-colors duration-100">{label}</span>
        {badge > 0 && <span className="h-4 min-w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center px-1">{badge > 9 ? '9+' : badge}</span>}
    </button>
);

/* ─── Icon set ──────────────────────────────────────────────────── */
const I = (d, extra) => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...extra}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
);
const UserIcon    = () => I("M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0");
const FbIcon      = () => I("M7 8h10M7 12h6m-6 4h8M5 20l2-2h12a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v14z");
const BugIcon     = () => I("M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z");
const ThemeIcon   = () => I("M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05L5.636 5.636M12 18a6 6 0 100-12 6 6 0 000 12z");
const UpIcon      = () => I("M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12");
const OutIcon     = () => I("M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1");
const BellIcon    = ({ cnt }) => (
    <span className="relative inline-flex">
        {I("M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9")}
        {cnt > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-[7px] font-bold text-white flex items-center justify-center">{cnt > 9 ? '9+' : cnt}</span>}
    </span>
);
const DiscordIcon = () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.102 18.079.114 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
);

/* ═══════════════════════════════════════════════════════════════════
   MODAL SHELL
═══════════════════════════════════════════════════════════════════ */
const ModalShell = ({ isLightMode, title, onClose, children }) => createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <button type="button" className="absolute inset-0 bg-black/65"
            onClick={onClose} aria-label="Close"
            style={{ backdropFilter: 'blur(4px)' }} />
        <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18 }}
            className={`relative w-full max-w-lg rounded-2xl border shadow-2xl ${isLightMode ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-[#07041a] text-secondary-100'}`}
            style={!isLightMode ? { boxShadow: '0 0 60px rgba(139,92,246,0.2)' } : {}}
        >
            <div className={`flex items-center justify-between px-5 py-4 border-b ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                <h2 className="text-sm font-bold">{title}</h2>
                <button type="button" onClick={onClose}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${isLightMode ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="px-5 py-4">{children}</div>
        </motion.div>
    </div>,
    document.body
);

export default Sidebar;
