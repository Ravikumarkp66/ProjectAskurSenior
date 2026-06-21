import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { subjectAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

/* ─── Tab config ─────────────────────────────────────────────────── */
const TABS = [
    {
        id: 'notes',
        label: 'Notes',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        color: '#10B981',
        comingSoonText: 'High-quality notes and study materials will be available here.',
    },
    {
        id: 'pyqs',
        label: 'PYQs',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        color: '#8B5CF6',
        comingSoonText: 'Previous Year Question Papers and Question Banks will be available here.',
    },
    {
        id: 'others',
        label: 'Others',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        ),
        color: '#3B82F6',
        comingSoonText: 'Additional resources, references and study materials will be available here.',
    },
    {
        id: 'cie',
        label: 'CIE Analyzer',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        color: '#F59E0B',
        comingSoonText: 'Track internals, eligibility, and required marks for this subject.',
    },
    {
        id: 'community',
        label: 'Community',
        icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        color: '#EC4899',
        comingSoonText: 'Discuss doubts with classmates and seniors in a dedicated subject-specific community.',
        features: [
            { icon: '🙋', text: 'Ask Questions' },
            { icon: '💬', text: 'Answer Doubts' },
            { icon: '👆', text: 'Upvote Responses' },
            { icon: '📁', text: 'Resource Sharing' },
            { icon: '🎓', text: 'Senior Guidance' },
        ],
    },
];

/* ─── Subject color map (matches sidebar) ────────────────────────── */
const SUBJECT_META = {
    math1:   { icon: '∑',  color: '#8B5CF6', sem: '1st' },
    physics: { icon: '⚛',  color: '#3B82F6', sem: '1st' },
    chem:    { icon: '🧪', color: '#10B981', sem: '1st' },
    elec:    { icon: '⚡', color: '#F59E0B', sem: '1st' },
    engraph: { icon: '📐', color: '#EF4444', sem: '1st' },
    ai:      { icon: '🤖', color: '#6366F1', sem: '1st' },
};

const getSubjectAccent = (id = '', code = '') => {
    const key = Object.keys(SUBJECT_META).find(k => id.includes(k) || code.toLowerCase().includes(k));
    return key ? SUBJECT_META[key] : { icon: '📚', color: '#8B5CF6', sem: '1st' };
};

/* ─── Skeleton ───────────────────────────────────────────────────── */
const Skeleton = ({ className }) => (
    <div className={`rounded-xl animate-pulse ${className}`}
        style={{ background: 'rgba(139,92,246,0.06)' }} />
);

/* ═══════════════════════════════════════════════════════════════════
   COMING SOON PANEL
═══════════════════════════════════════════════════════════════════ */
const ComingSoonPanel = ({ tab }) => {
    return (
        <motion.div
            key={tab.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center justify-center min-h-[340px] px-6 py-14 text-center"
        >
            {/* Glow orb */}
            <div className="relative mb-8">
                <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl relative z-10"
                    style={{
                        background: `linear-gradient(135deg, ${tab.color}22, ${tab.color}0a)`,
                        border: `1px solid ${tab.color}35`,
                        boxShadow: `0 0 40px ${tab.color}25, 0 0 80px ${tab.color}10`,
                    }}
                >
                    <span style={{ filter: 'drop-shadow(0 0 10px ' + tab.color + '80)' }}>
                        {tab.icon}
                    </span>
                </div>
                {/* Ripple rings */}
                <div className="absolute inset-0 rounded-2xl animate-ping"
                    style={{ background: `${tab.color}08`, animationDuration: '2.4s' }} />
                <div className="absolute inset-0 rounded-2xl animate-ping"
                    style={{ background: `${tab.color}05`, animationDuration: '3.2s', animationDelay: '0.6s' }} />
            </div>

            {/* Badge */}
            <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-5"
                style={{
                    background: `${tab.color}14`,
                    border: `1px solid ${tab.color}30`,
                    color: tab.color,
                }}
            >
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: tab.color }} />
                Coming Soon
            </div>

            <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
                {tab.label} — <span style={{ color: tab.color }}>In Progress</span>
            </h2>

            <p className="text-sm max-w-md leading-relaxed mb-8" style={{ color: 'rgba(148,163,184,0.7)' }}>
                {tab.comingSoonText}
            </p>

            {/* Feature pills (Community only) */}
            {tab.features && (
                <div className="flex flex-wrap gap-2 justify-center max-w-sm mb-6">
                    {tab.features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + i * 0.07 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                            style={{
                                background: `${tab.color}10`,
                                border: `1px solid ${tab.color}25`,
                                color: 'rgba(148,163,184,0.8)',
                            }}
                        >
                            <span>{f.icon}</span>
                            <span>{f.text}</span>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Notify CTA (decorative) */}
            <button
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                    background: `linear-gradient(135deg, ${tab.color}cc, ${tab.color}88)`,
                    boxShadow: `0 4px 20px ${tab.color}30`,
                    border: `1px solid ${tab.color}50`,
                }}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notify me when ready
            </button>
        </motion.div>
    );
};

/* ─── Local subject map (static sidebar IDs → display data) ────────── */
const LOCAL_SUBJECTS = {
    math1:   { name: 'Mathematics-I',       code: 'MATH101', credits: 4, semester: '1' },
    physics: { name: 'Physics',             code: 'PHY101',  credits: 4, semester: '1' },
    chem:    { name: 'Chemistry',           code: 'CHEM101', credits: 4, semester: '1' },
    elec:    { name: 'Electronics',         code: 'ELEC101', credits: 3, semester: '1' },
    engraph: { name: 'Engineering Graphics',code: 'EG101',   credits: 3, semester: '1' },
    ai:      { name: 'AI Fundamentals',     code: 'AI101',   credits: 3, semester: '1' },
};

/** Returns true for 24-char hex MongoDB ObjectIds */
const isObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

/* ═══════════════════════════════════════════════════════════════════
   SUBJECT CONTENT PAGE
═══════════════════════════════════════════════════════════════════ */
const SubjectContentPage = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [subject, setSubject] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('notes');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfTitle, setPdfTitle] = useState('');
    const [showPdfModal, setShowPdfModal] = useState(false);

    const accent = getSubjectAccent(subjectId, subject?.code || '');

    /* ── load subject ── */
    const loadContent = useCallback(async () => {
        // Static sidebar ID (math1, physics, …) — no API call needed
        if (!isObjectId(subjectId)) {
            const local = LOCAL_SUBJECTS[subjectId];
            if (local) {
                setSubject({ name: local.name, code: local.code, credits: local.credits, semester: local.semester });
                setContent({ notes: [], pyqs: [], questionBanks: [], syllabus: [] });
            } else {
                setError('Subject not found');
            }
            setLoading(false);
            return;
        }

        // Real MongoDB ObjectId — hit the API
        try {
            setLoading(true);
            setError(null);
            const res = await subjectAPI.getSubjectContent(subjectId);
            const data = res.data;
            if (!data) { setError('Subject not found'); return; }
            setSubject(data);
            setContent({
                notes: data.notes || [],
                pyqs: data.pyqs || [],
                questionBanks: data.questionBanks || [],
                syllabus: data.syllabus || [],
            });
        } catch (err) {
            if (err.response?.status === 404) setError('Subject not found');
            else setError('Failed to load content. Please try again.');
            setContent({ notes: [], pyqs: [], questionBanks: [], syllabus: [] });
        } finally {
            setLoading(false);
        }
    }, [subjectId]);

    useEffect(() => { loadContent(); }, [loadContent]);

    const handleViewContent = async (contentType, contentId) => {
        try {
            const res = await subjectAPI.getContentUrl(subjectId, contentType, contentId);
            setPdfUrl(res.data.url);
            setPdfTitle(res.data.title);
            setShowPdfModal(true);
        } catch (err) { alert(err.response?.data?.error || 'Failed to load content'); }
    };

    /* ── derived ── */
    const subjectName = subject?.subjectInfo?.name || subject?.name || 'Subject';
    const subjectCode = subject?.subjectInfo?.code || subject?.code || '—';
    const credits     = subject?.subjectInfo?.credits || subject?.credits || '—';
    const semester    = subject?.subjectInfo?.semester || subject?.semester || accent.sem;
    const activeTabObj = TABS.find(t => t.id === activeTab);

    /* ════════════════════════════════════════════════════════════════
       LOADING
    ════════════════════════════════════════════════════════════════ */
    if (loading) return (
        <div className="min-h-screen px-6 py-8" style={{ background: 'transparent' }}>
            <div className="max-w-5xl mx-auto space-y-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-36 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-80 w-full" />
            </div>
        </div>
    );

    /* ════════════════════════════════════════════════════════════════
       ERROR
    ════════════════════════════════════════════════════════════════ */
    if (error) return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
                <p className="text-sm mb-6" style={{ color: 'rgba(148,163,184,0.6)' }}>
                    The subject you're looking for might not exist yet.
                </p>
                <button onClick={() => navigate('/dashboard')}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{
                        background: 'linear-gradient(135deg,#8B5CF6,#6366F1)',
                        boxShadow: '0 4px 20px rgba(139,92,246,0.35)'
                    }}>
                    Go to Dashboard
                </button>
            </div>
        </div>
    );

    /* ════════════════════════════════════════════════════════════════
       MAIN RENDER
    ════════════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen" style={{ background: 'transparent' }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* ── Back button ─────────────────────────────── */}
                <motion.button
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm font-medium transition-all duration-150 hover:-translate-x-0.5"
                    style={{ color: 'rgba(148,163,184,0.65)' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(148,163,184,1)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(148,163,184,0.65)'}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </motion.button>

                {/* ── Subject Header Card ──────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, rgba(8,4,22,0.98) 0%, rgba(5,1,16,0.98) 100%)`,
                        border: `1px solid ${accent.color}28`,
                        boxShadow: `0 0 60px ${accent.color}12, 0 8px 40px rgba(0,0,0,0.4)`,
                    }}
                >
                    {/* Background glow */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: `radial-gradient(ellipse at 10% 50%, ${accent.color}12 0%, transparent 55%)`,
                    }} />
                    {/* Grid */}
                    <div className="absolute inset-0 pointer-events-none opacity-30" style={{
                        backgroundImage: `linear-gradient(${accent.color}08 1px, transparent 1px), linear-gradient(90deg, ${accent.color}08 1px, transparent 1px)`,
                        backgroundSize: '32px 32px',
                    }} />

                    <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        {/* Icon */}
                        <div
                            className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                            style={{
                                background: `linear-gradient(135deg, ${accent.color}25, ${accent.color}0a)`,
                                border: `1px solid ${accent.color}40`,
                                boxShadow: `0 0 24px ${accent.color}30`,
                            }}
                        >
                            {accent.icon}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span
                                    className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                                    style={{ background: `${accent.color}18`, color: accent.color, border: `1px solid ${accent.color}30` }}
                                >
                                    {subjectCode}
                                </span>
                                <span
                                    className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full"
                                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(148,163,184,0.6)', border: '1px solid rgba(255,255,255,0.07)' }}
                                >
                                    Semester {semester}
                                </span>
                                {credits !== '—' && (
                                    <span
                                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(148,163,184,0.6)', border: '1px solid rgba(255,255,255,0.07)' }}
                                    >
                                        {credits} Credits
                                    </span>
                                )}
                            </div>
                            <h1
                                className="text-2xl sm:text-3xl font-extrabold text-white leading-tight"
                                style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}
                            >
                                {subjectName}
                            </h1>
                            <p className="mt-1.5 text-sm" style={{ color: 'rgba(148,163,184,0.55)' }}>
                                Access notes, PYQs, resources, CIE analysis and community discussions.
                            </p>
                        </div>

                        {/* Stat chips */}
                        <div className="hidden lg:flex flex-col gap-2 flex-shrink-0">
                            {[
                                { label: 'Notes', value: content?.notes?.length ?? 0 },
                                { label: 'PYQs',  value: content?.pyqs?.length ?? 0 },
                            ].map(s => (
                                <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <span className="text-lg font-extrabold" style={{ color: accent.color }}>{s.value}</span>
                                    <span className="text-xs" style={{ color: 'rgba(148,163,184,0.5)' }}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── Tab Navigation ───────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.28 }}
                    className="relative rounded-2xl overflow-hidden"
                    style={{
                        background: 'rgba(8,4,22,0.95)',
                        border: '1px solid rgba(139,92,246,0.12)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                    }}
                >
                    {/* Grid */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        backgroundImage: 'linear-gradient(rgba(139,92,246,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.02) 1px,transparent 1px)',
                        backgroundSize: '32px 32px',
                    }} />

                    {/* Tabs */}
                    <div className="relative z-10 flex overflow-x-auto scrollbar-none"
                        style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                        {TABS.map((tab, i) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    whileHover={!isActive ? { backgroundColor: 'rgba(139,92,246,0.06)' } : {}}
                                    whileTap={{ scale: 0.98 }}
                                    className="relative flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
                                    style={{
                                        color: isActive ? tab.color : 'rgba(100,116,139,0.75)',
                                        borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                                        background: isActive ? `${tab.color}08` : 'transparent',
                                    }}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.12 + i * 0.05 }}
                                >
                                    {/* Icon */}
                                    <motion.span
                                        animate={{ color: isActive ? tab.color : 'rgba(100,116,139,0.65)' }}
                                        style={{ flexShrink: 0 }}
                                    >
                                        {tab.icon}
                                    </motion.span>
                                    {tab.label}

                                    {/* Active glow dot */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="tab-dot"
                                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                                            style={{ background: tab.color, boxShadow: `0 0 6px ${tab.color}` }}
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="relative z-10 min-h-[360px]">
                        <AnimatePresence mode="wait">
                            <ComingSoonPanel key={activeTab} tab={activeTabObj} />
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* ── Content exists: render real items ─────────── */}
                {content && (
                    (activeTab === 'notes' && content.notes?.length > 0) ||
                    (activeTab === 'pyqs' && content.pyqs?.length > 0)
                ) && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28 }}
                        className="rounded-2xl overflow-hidden"
                        style={{
                            background: 'rgba(8,4,22,0.95)',
                            border: '1px solid rgba(139,92,246,0.12)',
                        }}
                    >
                        <div className="p-6">
                            <ContentList
                                items={activeTab === 'notes' ? content.notes : content.pyqs}
                                contentType={activeTab}
                                subjectId={subjectId}
                                onView={handleViewContent}
                                accent={activeTabObj?.color || '#8B5CF6'}
                            />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ── PDF Modal ────────────────────────────────────── */}
            <AnimatePresence>
                {showPdfModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/70"
                            style={{ backdropFilter: 'blur(6px)' }}
                            onClick={() => setShowPdfModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.2 }}
                            className="relative w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden flex flex-col"
                            style={{
                                background: 'rgba(8,4,22,0.99)',
                                border: '1px solid rgba(139,92,246,0.2)',
                                boxShadow: '0 0 80px rgba(139,92,246,0.25)',
                            }}
                        >
                            <div className="flex items-center justify-between px-5 py-4"
                                style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                                <h3 className="text-sm font-bold text-white truncate">{pdfTitle}</h3>
                                <button onClick={() => setShowPdfModal(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-white/5"
                                    style={{ color: 'rgba(148,163,184,0.6)' }}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 p-4">
                                <iframe src={pdfUrl} className="w-full h-full rounded-xl" title={pdfTitle} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════
   CONTENT LIST — real files from API
═══════════════════════════════════════════════════════════════════ */
const ContentList = ({ items, contentType, subjectId, onView, accent }) => {
    if (!items?.length) return null;
    return (
        <div className="space-y-3">
            {items.map((item, i) => (
                <motion.div
                    key={item._id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = `${accent}08`;
                        e.currentTarget.style.borderColor = `${accent}25`;
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    }}
                >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                        <svg className="w-5 h-5" style={{ color: accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{item.title || `${contentType} ${i + 1}`}</p>
                        {item.description && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(148,163,184,0.55)' }}>
                                {item.description}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => onView(contentType, item._id)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all duration-150 hover:scale-105 active:scale-95"
                        style={{ background: `linear-gradient(135deg, ${accent}cc, ${accent}88)`, boxShadow: `0 2px 12px ${accent}30` }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                    </button>
                </motion.div>
            ))}
        </div>
    );
};

export default SubjectContentPage;