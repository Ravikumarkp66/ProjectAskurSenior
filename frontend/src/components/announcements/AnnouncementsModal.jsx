import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Megaphone, Calendar, User, FileText, Download, 
    ChevronLeft, Lock, Inbox, ArrowRight 
} from 'lucide-react';
import { getAnnouncements, markAnnouncementRead } from '../../services/api/announcementApi';
import { useTheme } from '../../context/ThemeContext';

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────── */
const CATEGORIES = ['All', 'Academic', 'Features', 'System'];

// Map backend category enum → display label
const CAT_DISPLAY = { ACADEMIC: 'Academic', FEATURE: 'Features', SYSTEM: 'System' };

// Format ISO date string → readable date
const formatDate = (iso) => {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    } catch {
        return iso;
    }
};

// Format bytes → human-readable size
const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getCategoryColor = (category, isDark) => {
    switch (category) {
        case 'Academic':  return isDark ? 'text-purple-400' : 'text-purple-600';
        case 'Features':  return isDark ? 'text-emerald-400' : 'text-emerald-600';
        case 'System':    return isDark ? 'text-blue-400' : 'text-blue-600';
        default:          return isDark ? 'text-slate-400' : 'text-slate-500';
    }
};

/* ═══════════════════════════════════════════════════════════════════
   ANNOUNCEMENTS MODAL (PREMIUM, RESTRAINED PRODUCTION UI)
═══════════════════════════════════════════════════════════════════ */
const AnnouncementsModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedId, setSelectedId] = useState(null);
    const [mobileDetailView, setMobileDetailView] = useState(false);

    // API state
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState(null);

    // Keyboard ESC key handler
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Fetch announcements when modal opens or category changes
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        getAnnouncements({ category: selectedCategory })
            .then(res => {
                if (!isMounted) return;
                const normalized = (res?.data || []).map(a => ({
                    ...a,
                    displayCategory: CAT_DISPLAY[a.category] || a.category,
                    date: formatDate(a.publishedAt)
                }));
                setAnnouncements(normalized);
                setSelectedId(prev => {
                    if (normalized.length === 0) return null;
                    const exists = normalized.some(item => item.id === prev);
                    return exists ? prev : normalized[0].id;
                });
            })
            .catch(err => {
                if (!isMounted) return;
                console.error('Failed to load announcements:', err);
                if (err?.response?.status === 403) {
                    setError('Announcements are available for Plus members only.');
                } else {
                    setError('Failed to load announcements. Please try again.');
                }
                setAnnouncements([]);
                setSelectedId(null);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, selectedCategory]);

    // Filter announcements by display category
    const filteredAnnouncements = useMemo(() => {
        if (selectedCategory === 'All') return announcements;
        return announcements.filter(a => a.displayCategory === selectedCategory);
    }, [selectedCategory, announcements]);

    // Auto-select first matching item when switching categories
    useEffect(() => {
        if (filteredAnnouncements.length > 0) {
            const exists = filteredAnnouncements.some(a => a.id === selectedId);
            if (!exists) {
                setSelectedId(filteredAnnouncements[0].id);
            }
        }
    }, [selectedCategory, filteredAnnouncements, selectedId]);

    // Active selected announcement
    const selectedAnnouncement = useMemo(() => {
        return filteredAnnouncements.find(a => a.id === selectedId) || filteredAnnouncements[0] || null;
    }, [selectedId, filteredAnnouncements]);

    // Mark as read when user opens an announcement
    const handleSelectItem = useCallback((item) => {
        setSelectedId(item.id);
        setMobileDetailView(true);
        if (!item.isRead) {
            markAnnouncementRead(item.id);
            // Optimistic update
            setAnnouncements(prev =>
                prev.map(a => a.id === item.id ? { ...a, isRead: true } : a)
            );
        }
    }, []);

    if (!isOpen) return null;

    const isPlusLocked = error === 'Announcements are available for Plus members only.';

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-6"
                style={{
                    backgroundColor: isDark ? 'rgba(5, 3, 13, 0.82)' : 'rgba(15, 23, 42, 0.45)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose?.();
                }}
            >
                {/* Centered Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 6 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative w-full max-w-4xl rounded-2xl border flex flex-col overflow-hidden font-sans ${
                        isDark 
                            ? 'bg-[#0D111C] border-white/10 text-white' 
                            : 'bg-white border-slate-200 text-slate-900'
                    }`}
                    style={{
                        height: 'min(640px, 88vh)',
                        boxShadow: isDark
                            ? '0 24px 60px -12px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.1)'
                            : '0 20px 50px -12px rgba(15, 23, 42, 0.18), 0 1px 3px rgba(15, 23, 42, 0.08)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ── HEADER ── */}
                    <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${
                        isDark ? 'border-white/[0.08] bg-[#0D111C]' : 'border-slate-100 bg-white'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                                isDark 
                                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-300' 
                                    : 'bg-purple-50 border-purple-200 text-purple-600'
                            }`}>
                                <Megaphone size={16} strokeWidth={2.2} />
                            </div>
                            <div>
                                <h2 className={`text-base font-bold tracking-tight leading-none ${
                                    isDark ? 'text-white' : 'text-slate-900'
                                }`}>
                                    Announcements
                                </h2>
                                <p className={`text-xs mt-1 hidden sm:block ${
                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                    Official college notices, Plus updates and important information
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark 
                                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]' 
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            aria-label="Close modal"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* ── TWO-COLUMN BODY ── */}
                    <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">

                        {/* ── LEFT PANEL: FILTERS & LIST ── */}
                        <div
                            className={`w-full md:w-80 lg:w-[340px] shrink-0 border-r flex flex-col overflow-hidden ${
                                isDark 
                                    ? 'border-white/[0.08] bg-[#080512]' 
                                    : 'border-slate-200/80 bg-[#F8FAFC]'
                            } ${
                                mobileDetailView ? 'hidden md:flex' : 'flex'
                            }`}
                        >
                            {/* Refined Segmented Filter Tabs */}
                            <div className={`p-3 border-b ${isDark ? 'border-white/[0.06]' : 'border-slate-200/70'}`}>
                                <div className={`flex items-center gap-1 p-1 rounded-lg border ${
                                    isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-200/50 border-slate-200/80'
                                }`}>
                                    {CATEGORIES.map(cat => {
                                        const isCatActive = selectedCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer text-center ${
                                                    isCatActive
                                                        ? isDark 
                                                            ? 'bg-white/10 text-white font-semibold shadow-xs' 
                                                            : 'bg-white text-purple-700 font-semibold shadow-xs border border-purple-100/80'
                                                        : isDark 
                                                            ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]' 
                                                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* List Area / States */}
                            <div className={`flex-1 overflow-y-auto divide-y scrollbar-thin ${
                                isDark ? 'divide-white/[0.04]' : 'divide-slate-200/60'
                            }`}>
                                {loading ? (
                                    <div className="h-44 flex flex-col items-center justify-center text-xs gap-2 text-slate-400">
                                        <div className="w-5 h-5 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />
                                        <span>Loading announcements…</span>
                                    </div>
                                ) : isPlusLocked ? (
                                    /* Locked Plus State */
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                                            isDark ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-600 border border-purple-200'
                                        }`}>
                                            <Lock size={18} />
                                        </div>
                                        <h4 className={`text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                            Announcements Unavailable
                                        </h4>
                                        <p className={`text-[11px] leading-relaxed mb-3.5 max-w-[210px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Official notices are available for AskUrSenior Plus members.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onClose?.();
                                                navigate('/pricing');
                                            }}
                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                                isDark 
                                                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-xs' 
                                                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                                            }`}
                                        >
                                            <span>Explore Plus</span>
                                            <ArrowRight size={12} />
                                        </button>
                                    </div>
                                ) : error ? (
                                    <div className="h-44 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
                                        {error}
                                    </div>
                                ) : filteredAnnouncements.length === 0 ? (
                                    /* Empty Category State */
                                    <div className="h-44 flex flex-col items-center justify-center text-center p-6">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${
                                            isDark ? 'bg-white/[0.04] text-slate-400' : 'bg-slate-200/60 text-slate-500'
                                        }`}>
                                            <Inbox size={16} />
                                        </div>
                                        <p className={`text-xs font-semibold mb-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                            No announcements yet
                                        </p>
                                        <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                            You&apos;re all caught up in this category.
                                        </p>
                                    </div>
                                ) : (
                                    filteredAnnouncements.map(item => {
                                        const isSelected = selectedId === item.id;
                                        const catColor = getCategoryColor(item.displayCategory, isDark);

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelectItem(item)}
                                                className={`relative px-4 py-3.5 cursor-pointer transition-colors border-l-2 text-left ${
                                                    isSelected
                                                        ? isDark 
                                                            ? 'bg-white/[0.05] border-purple-400' 
                                                            : 'bg-purple-50/70 border-purple-600'
                                                        : isDark 
                                                            ? 'border-transparent hover:bg-white/[0.02]' 
                                                            : 'border-transparent hover:bg-slate-100/60'
                                                }`}
                                            >
                                                {/* Top Row: Category + Date / Unread */}
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className={`text-[11px] font-semibold tracking-wide uppercase ${catColor}`}>
                                                        {item.displayCategory}
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            {item.date}
                                                        </span>
                                                        {!item.isRead && (
                                                            <span
                                                                className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"
                                                                title="Unread"
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Title */}
                                                <h4 className={`text-[13px] font-medium leading-snug line-clamp-2 ${
                                                    isSelected 
                                                        ? isDark ? 'text-white font-semibold' : 'text-slate-900 font-semibold'
                                                        : isDark ? 'text-slate-200' : 'text-slate-700'
                                                }`}>
                                                    {item.title}
                                                </h4>

                                                {/* One-line preview */}
                                                <p className={`text-xs line-clamp-1 mt-1 font-normal ${
                                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                                }`}>
                                                    {item.summary}
                                                </p>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* ── RIGHT PANEL: CONTENT READER ── */}
                        <div
                            className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
                                isDark ? 'bg-[#0A0716]' : 'bg-white'
                            } ${
                                mobileDetailView ? 'flex' : 'hidden md:flex'
                            }`}
                        >
                            {selectedAnnouncement ? (
                                <div className="flex-1 flex flex-col min-h-0">
                                    {/* Mobile Back Button (< 768px) */}
                                    <div className={`md:hidden flex items-center px-4 py-2.5 border-b ${
                                        isDark ? 'border-white/[0.08] bg-[#080512]' : 'border-slate-200/80 bg-slate-50'
                                    }`}>
                                        <button
                                            type="button"
                                            onClick={() => setMobileDetailView(false)}
                                            className={`flex items-center gap-1 text-xs font-semibold cursor-pointer ${
                                                isDark ? 'text-purple-300' : 'text-purple-700'
                                            }`}
                                        >
                                            <ChevronLeft size={16} />
                                            <span>Back to notices</span>
                                        </button>
                                    </div>

                                    {/* Reading Scroll Area */}
                                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 scrollbar-thin">

                                        {/* Category Label */}
                                        <div className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${getCategoryColor(selectedAnnouncement.displayCategory, isDark)}`}>
                                            {selectedAnnouncement.displayCategory} Notice
                                        </div>

                                        {/* Main Heading */}
                                        <h1 className={`text-xl sm:text-2xl font-bold tracking-tight leading-snug ${
                                            isDark ? 'text-white' : 'text-slate-900'
                                        }`}>
                                            {selectedAnnouncement.title}
                                        </h1>

                                        {/* Understated Metadata Row */}
                                        <div className={`flex items-center gap-3 text-xs mt-2.5 ${
                                            isDark ? 'text-slate-400' : 'text-slate-500'
                                        }`}>
                                            <div className="flex items-center gap-1.5">
                                                <User size={13} className="shrink-0" />
                                                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                                                    {selectedAnnouncement.author?.name || 'AskUrSenior'}
                                                </span>
                                            </div>
                                            <span>•</span>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} className="shrink-0" />
                                                <span>{selectedAnnouncement.date}</span>
                                            </div>
                                        </div>

                                        {/* Hairline Divider */}
                                        <div className={`h-px my-6 ${isDark ? 'bg-white/[0.08]' : 'bg-slate-200/80'}`} />

                                        {/* Notice Body */}
                                        <div className={`space-y-4 text-sm leading-relaxed font-normal ${
                                            isDark ? 'text-slate-200' : 'text-slate-700'
                                        }`}>
                                            {typeof selectedAnnouncement.content === 'string'
                                                ? selectedAnnouncement.content.split('\n\n').map((para, i) => (
                                                    <p key={i} className="whitespace-pre-line">{para}</p>
                                                ))
                                                : Array.isArray(selectedAnnouncement.content)
                                                    ? selectedAnnouncement.content.map((para, i) => (
                                                        <p key={i} className="whitespace-pre-line">{para}</p>
                                                    ))
                                                    : null
                                            }
                                        </div>

                                        {/* Attachment Row */}
                                        {selectedAnnouncement.attachment && (
                                            <div className={`mt-8 pt-6 border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200/80'}`}>
                                                <div className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${
                                                    isDark ? 'text-slate-400' : 'text-slate-500'
                                                }`}>
                                                    Official Circular
                                                </div>
                                                <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                                                    isDark 
                                                        ? 'bg-white/[0.03] border-white/[0.08] hover:border-white/15' 
                                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                                }`}>
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                            isDark ? 'bg-purple-500/10 text-purple-300' : 'bg-purple-50 text-purple-600'
                                                        }`}>
                                                            <FileText size={16} />
                                                        </div>
                                                        <div className="min-w-0 truncate">
                                                            <div className={`text-xs sm:text-sm font-medium truncate ${
                                                                isDark ? 'text-slate-200' : 'text-slate-800'
                                                            }`}>
                                                                {selectedAnnouncement.attachment.name}
                                                            </div>
                                                            <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                                                {formatSize(selectedAnnouncement.attachment.size)}
                                                                {selectedAnnouncement.attachment.size ? ' • ' : ''}PDF Document
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {selectedAnnouncement.attachment.url ? (
                                                        <a
                                                            href={selectedAnnouncement.attachment.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 ml-3 transition-all cursor-pointer ${
                                                                isDark 
                                                                    ? 'text-purple-200 hover:text-white bg-purple-500/15 hover:bg-purple-500/25' 
                                                                    : 'text-white bg-purple-600 hover:bg-purple-700 shadow-xs'
                                                            }`}
                                                        >
                                                            <Download size={13} />
                                                            <span>Download</span>
                                                        </a>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 ml-3 cursor-not-allowed ${
                                                                isDark ? 'text-slate-500 bg-white/[0.04]' : 'text-slate-400 bg-slate-100'
                                                            }`}
                                                        >
                                                            <Download size={13} />
                                                            <span>Download</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            ) : !loading ? (
                                /* Intentional Detail Placeholder */
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border ${
                                        isDark ? 'bg-white/[0.04] text-slate-400 border-white/[0.08]' : 'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                        <FileText size={20} />
                                    </div>
                                    <h4 className={`text-sm font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                                        Select an announcement
                                    </h4>
                                    <p className={`text-xs max-w-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Choose a notice from the left panel to read circular details and download attachments.
                                    </p>
                                </div>
                            ) : null}
                        </div>

                    </div>

                    {/* ── MINIMAL CLEAN FOOTER ── */}
                    <div className={`px-5 py-2.5 border-t flex items-center justify-between text-xs shrink-0 ${
                        isDark 
                            ? 'border-white/[0.06] bg-[#080512] text-slate-400' 
                            : 'border-slate-100 bg-[#F8FAFC] text-slate-500'
                    }`}>
                        <span className="font-medium">AskUrSenior Plus Notices</span>
                        <span className="hidden sm:inline text-[11px]">
                            Press <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-sans ${
                                isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-200/80 text-slate-700'
                            }`}>ESC</kbd> to close
                        </span>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AnnouncementsModal;
