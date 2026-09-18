import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, Clock, CheckCircle2, AlertCircle, Sparkles, 
    ArrowRight, ChevronRight, X, ExternalLink, FileText, 
    Link as LinkIcon, RefreshCw, Search,
    Flame, BookOpen, AlertTriangle, ChevronDown
} from 'lucide-react';
import { apiClient } from '../../services/api';

/* ═══════════════════════════════════════════════════════════════════
   HELPERS & DATE FORMATTERS
═══════════════════════════════════════════════════════════════════ */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dPad(num) {
    return num.toString().padStart(2, '0');
}

function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getDate().toString().padStart(2, '0')} ${MONTH_NAMES[d.getMonth()].toUpperCase()}`;
}

function formatDateRange(startDateStr, endDateStr) {
    if (!startDateStr) return '';
    const s = new Date(startDateStr);
    if (isNaN(s.getTime())) return '';
    
    if (!endDateStr || startDateStr === endDateStr) {
        return `${dPad(s.getDate())} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
    }
    const e = new Date(endDateStr);
    if (isNaN(e.getTime())) {
        return `${dPad(s.getDate())} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
    }

    if (s.getFullYear() === e.getFullYear()) {
        if (s.getMonth() === e.getMonth()) {
            if (s.getDate() === e.getDate()) {
                return `${dPad(s.getDate())} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
            }
            return `${dPad(s.getDate())} – ${dPad(e.getDate())} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
        }
        return `${dPad(s.getDate())} ${MONTH_NAMES[s.getMonth()]} – ${dPad(e.getDate())} ${MONTH_NAMES[e.getMonth()]} ${s.getFullYear()}`;
    }
    return `${dPad(s.getDate())} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()} – ${dPad(e.getDate())} ${MONTH_NAMES[e.getMonth()]} ${e.getFullYear()}`;
}

function getDayOfWeek(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return DAY_NAMES[d.getDay()];
}

/* ═══════════════════════════════════════════════════════════════════
   EVENT TYPE COLOR THEMES (CSES Compact Pills)
═══════════════════════════════════════════════════════════════════ */

const EVENT_TYPE_STYLES = {
    CIE: {
        badge: 'bg-purple-950/70 text-purple-300 border-purple-500/40',
        dot: 'bg-purple-500',
        label: 'CIE'
    },
    EXAM: {
        badge: 'bg-rose-950/70 text-rose-300 border-rose-500/40',
        dot: 'bg-rose-500',
        label: 'Exam'
    },
    REGISTRATION: {
        badge: 'bg-sky-950/70 text-sky-300 border-sky-500/40',
        dot: 'bg-sky-500',
        label: 'Registration'
    },
    DEADLINE: {
        badge: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-500',
        label: 'Deadline'
    },
    CAREER: {
        badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-500',
        label: 'Career'
    },
    CAMPUS: {
        badge: 'bg-indigo-950/70 text-indigo-300 border-indigo-500/40',
        dot: 'bg-indigo-500',
        label: 'Campus'
    },
    HOLIDAY: {
        badge: 'bg-teal-950/70 text-teal-300 border-teal-500/40',
        dot: 'bg-teal-500',
        label: 'Holiday'
    },
    RESULT: {
        badge: 'bg-cyan-950/70 text-cyan-300 border-cyan-500/40',
        dot: 'bg-cyan-500',
        label: 'Result'
    },
    ACADEMIC: {
        badge: 'bg-blue-950/70 text-blue-300 border-blue-500/40',
        dot: 'bg-blue-500',
        label: 'Academic'
    },
    GENERAL: {
        badge: 'bg-slate-800 text-slate-300 border-slate-700',
        dot: 'bg-slate-400',
        label: 'General'
    }
};

function getEventTypeTheme(type) {
    return EVENT_TYPE_STYLES[type] || EVENT_TYPE_STYLES.ACADEMIC;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */

export default function RoadmapsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Data state
    const [roadmapData, setRoadmapData] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);

    // Filter and search state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, UPCOMING, ONGOING, COMPLETED
    const [typeFilter, setTypeFilter] = useState('ALL');

    // Slide-over drawer state
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Fetch roadmap data
    const fetchRoadmap = useCallback(async (sem = selectedSemester, year = selectedYear, isSilent = false) => {
        if (!isSilent) setLoading(true);
        setError(null);
        try {
            const params = {};
            if (sem) params.semester = sem;
            if (year) params.academicYear = year;

            const res = await apiClient.get('/student/academics/roadmap', { params });
            if (res.data?.success) {
                const data = res.data.data;
                setRoadmapData(data);
                if (data.semester && !selectedSemester) {
                    setSelectedSemester(data.semester);
                }
                if (data.academicYear && !selectedYear) {
                    setSelectedYear(data.academicYear);
                }
            } else {
                setError(res.data?.message || 'Failed to load semester roadmap');
            }
        } catch (err) {
            console.error('Roadmap fetch error:', err);
            setError(err.response?.data?.message || 'Failed to load semester roadmap. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedSemester, selectedYear]);

    useEffect(() => {
        fetchRoadmap(selectedSemester, selectedYear);
    }, [selectedSemester, selectedYear, fetchRoadmap]);

    // Handle ESC key for closing drawer
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && selectedEvent) {
                setSelectedEvent(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedEvent]);

    // Derived events list with filters
    const filteredEvents = useMemo(() => {
        if (!roadmapData?.events) return [];
        return roadmapData.events.filter(e => {
            if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
            if (typeFilter !== 'ALL' && e.eventType !== typeFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = e.title?.toLowerCase().includes(q);
                const matchDesc = e.shortDescription?.toLowerCase().includes(q);
                const matchType = e.eventType?.toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchType) return false;
            }
            return true;
        });
    }, [roadmapData?.events, statusFilter, typeFilter, searchQuery]);

    // Available event types present in this roadmap
    const availableTypes = useMemo(() => {
        if (!roadmapData?.events) return [];
        const set = new Set(roadmapData.events.map(e => e.eventType).filter(Boolean));
        return Array.from(set);
    }, [roadmapData?.events]);

    return (
        <div className="min-h-screen bg-[#07090E] text-slate-100 antialiased selection:bg-purple-900/50 selection:text-purple-200">
            {/* Ambient Background Gradient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-gradient-to-b from-purple-900/10 via-indigo-900/5 to-transparent blur-3xl" />
            </div>

            <div className="relative z-10 max-w-[920px] mx-auto px-4 sm:px-6 py-6 sm:py-10">

                {/* ═══════════════════════════════════════════════════════════════════
                   HEADER SECTION
                ═══════════════════════════════════════════════════════════════════ */}
                <header className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.07]">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide uppercase bg-purple-950/70 border border-purple-500/30 text-purple-300">
                                    <Sparkles className="w-3 h-3 text-purple-400" />
                                    Academic Timeline
                                </span>
                                {roadmapData?.branch && (
                                    <span className="text-xs font-mono text-slate-500">
                                        • {roadmapData.branch} {roadmapData.section ? `Sec ${roadmapData.section}` : ''}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
                                Semester Roadmaps
                            </h1>
                            <p className="mt-1 text-sm text-slate-400 max-w-xl">
                                Your academic milestones, exam schedules, and senior prep guides in one scannable timeline.
                            </p>
                        </div>

                        {/* Controls: Semester & Year Dropdowns */}
                        <div className="flex items-center gap-2.5">
                            {/* Semester Dropdown */}
                            {roadmapData?.availableSemesters && roadmapData.availableSemesters.length > 0 ? (
                                <div className="relative">
                                    <select
                                        value={selectedSemester || roadmapData?.semester || ''}
                                        onChange={(e) => {
                                            const sem = Number(e.target.value);
                                            setSelectedSemester(sem);
                                            const match = roadmapData.availableSemesters.find(s => s.semester === sem);
                                            if (match?.academicYear) setSelectedYear(match.academicYear);
                                        }}
                                        className="appearance-none bg-[#0D121F] hover:bg-[#12192B] border border-white/[0.1] hover:border-purple-500/40 text-slate-200 text-xs font-mono font-medium rounded-lg pl-3 pr-8 py-2 cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                    >
                                        {roadmapData.availableSemesters.map(s => (
                                            <option key={`${s.semester}-${s.academicYear}`} value={s.semester} className="bg-[#0D121F] text-slate-200">
                                                {s.label || `Semester ${s.semester}`} ({s.eventCount || 0} events)
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            ) : (
                                <div className="px-3 py-1.5 bg-[#0D121F] border border-white/[0.08] rounded-lg text-xs font-mono text-slate-300">
                                    Semester {roadmapData?.semester || 3}
                                </div>
                            )}

                            {/* Refresh Button */}
                            <button
                                onClick={() => {
                                    setRefreshing(true);
                                    fetchRoadmap(selectedSemester, selectedYear, true);
                                }}
                                disabled={refreshing || loading}
                                title="Refresh Roadmap"
                                className="p-2 bg-[#0D121F] hover:bg-[#12192B] border border-white/[0.1] hover:border-purple-500/40 rounded-lg text-slate-400 hover:text-purple-300 transition-colors focus:outline-none"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* ═══════════════════════════════════════════════════════════════════
                   LOADING SKELETON
                ═══════════════════════════════════════════════════════════════════ */}
                {loading && (
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-[#0D121F]/80 border border-white/[0.06] animate-pulse">
                            <div className="h-4 bg-slate-800 rounded w-1/3 mb-3" />
                            <div className="h-2 bg-slate-800 rounded-full w-full" />
                        </div>
                        <div className="space-y-4 pt-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-4 items-center p-3 rounded-xl bg-[#0D121F]/50 border border-white/[0.04] animate-pulse">
                                    <div className="w-16 h-8 bg-slate-800 rounded" />
                                    <div className="w-3 h-3 rounded-full bg-slate-800" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-800 rounded w-1/2" />
                                        <div className="h-3 bg-slate-800/60 rounded w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                   ERROR STATE
                ═══════════════════════════════════════════════════════════════════ */}
                {!loading && error && (
                    <div className="p-8 rounded-2xl bg-[#0E1322] border border-rose-500/20 text-center max-w-md mx-auto my-12 shadow-xl">
                        <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-semibold text-white mb-2">Couldn't load your roadmap</h3>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">{error}</p>
                        <button
                            onClick={() => fetchRoadmap(selectedSemester, selectedYear)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-purple-900/30"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════════
                   MAIN CONTENT (When Loaded Successfully)
                ═══════════════════════════════════════════════════════════════════ */}
                {!loading && !error && roadmapData && (
                    <div className="space-y-6">

                        {/* ── 1. SEMESTER PROGRESS CARD ── */}
                        {roadmapData.startDate && roadmapData.endDate && (
                            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0C101D] to-[#0E1424] border border-white/[0.08] shadow-lg">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-semibold tracking-wider uppercase text-slate-300">
                                            Semester Progression
                                        </span>
                                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 font-bold">
                                            {roadmapData.semesterProgressPercent ?? 0}%
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                                        <span>Started: <strong className="text-slate-200 font-medium">{formatDateShort(roadmapData.startDate)}</strong></span>
                                        <span className="text-slate-600">•</span>
                                        <span>Ends: <strong className="text-slate-200 font-medium">{formatDateShort(roadmapData.endDate)}</strong></span>
                                    </div>
                                </div>

                                {/* Linear Progress Track */}
                                <div className="relative h-2 w-full bg-[#141A2E] rounded-full overflow-hidden border border-white/[0.05]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(Math.max(roadmapData.semesterProgressPercent || 0, 0), 100)}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400 rounded-full shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── 2. UP NEXT HIGHLIGHT STRIP ── */}
                        {roadmapData.upNextEvent && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#0E1426] to-[#0D1222] border border-purple-500/30 p-4 sm:p-5 shadow-lg hover:border-purple-500/50 transition-all cursor-pointer"
                                onClick={() => {
                                    const fullEvt = roadmapData.events?.find(e => e.id === roadmapData.upNextEvent.id);
                                    if (fullEvt) setSelectedEvent(fullEvt);
                                }}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start sm:items-center gap-3.5">
                                        <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-300">
                                            <Flame className="w-5 h-5 text-purple-400 animate-pulse" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                    Up Next
                                                </span>
                                                <span className="text-xs font-mono text-slate-400">
                                                    {formatDateShort(roadmapData.upNextEvent.startDate)}
                                                </span>
                                                {roadmapData.upNextEvent.daysLeft != null && (
                                                    <span className="text-xs font-mono text-purple-300 font-semibold">
                                                        ({roadmapData.upNextEvent.daysLeft === 0 
                                                            ? 'Happening today!' 
                                                            : `${roadmapData.upNextEvent.daysLeft} ${roadmapData.upNextEvent.daysLeft === 1 ? 'day' : 'days'} left`})
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-base font-bold text-white group-hover:text-purple-200 transition-colors">
                                                {roadmapData.upNextEvent.title}
                                            </h2>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 self-end sm:self-center text-xs font-mono text-purple-400 group-hover:text-purple-300 shrink-0 font-medium">
                                        <span>View details</span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ── 3. FILTER & SEARCH TOOLBAR ── */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 pb-1">
                            {/* Status Filter Tabs */}
                            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                                {[
                                    { id: 'ALL', label: `All (${roadmapData.events?.length || 0})` },
                                    { id: 'UPCOMING', label: 'Upcoming' },
                                    { id: 'ONGOING', label: 'Ongoing' },
                                    { id: 'COMPLETED', label: 'Completed' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setStatusFilter(tab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                                            statusFilter === tab.id
                                                ? 'bg-purple-950/90 border border-purple-500/50 text-purple-200 font-semibold shadow-sm'
                                                : 'bg-[#0D121F] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-[#12192B]'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Search & Event Type Filter */}
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1 sm:w-48">
                                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Search milestones..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#0D121F] border border-white/[0.08] focus:border-purple-500/50 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                {availableTypes.length > 0 && (
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="bg-[#0D121F] border border-white/[0.08] text-slate-300 text-xs font-mono rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-purple-500/50"
                                    >
                                        <option value="ALL">All Types</option>
                                        {availableTypes.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* ── 4. CSES VERTICAL TIMELINE ── */}
                        {filteredEvents.length === 0 ? (
                            <div className="p-12 rounded-2xl bg-[#0C101D] border border-white/[0.06] text-center my-6">
                                <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                                <h3 className="text-sm font-semibold text-slate-300 mb-1">No milestones match your criteria</h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                    {searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                                        ? 'Try clearing the search query or resetting filters.'
                                        : 'No academic events are configured for this semester yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="relative pl-2 sm:pl-4 py-2">
                                {/* Vertical Rail */}
                                <div className="absolute left-[78px] sm:left-[118px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-purple-500/30 via-slate-700/40 to-transparent" />

                                <div className="space-y-4">
                                    {filteredEvents.map((event, idx) => {
                                        const typeTheme = getEventTypeTheme(event.eventType);
                                        const isCompleted = event.status === 'COMPLETED';
                                        const isOngoing = event.status === 'ONGOING';
                                        const isImportant = event.priority === 'Important';
                                        const isCritical = event.priority === 'Critical';

                                        return (
                                            <motion.div
                                                key={event.id || idx}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: idx * 0.02 }}
                                                onClick={() => setSelectedEvent(event)}
                                                className={`group relative flex items-start gap-4 sm:gap-6 p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                                                    isOngoing
                                                        ? 'bg-[#0E1428] border-purple-500/40 shadow-md shadow-purple-950/20 hover:border-purple-500/70'
                                                        : isCompleted
                                                            ? 'bg-[#0A0E18]/60 border-white/[0.05] hover:bg-[#0D1222] hover:border-white/[0.12] opacity-85 hover:opacity-100'
                                                            : 'bg-[#0B0F1D] border-white/[0.07] hover:bg-[#0E1426] hover:border-purple-500/30'
                                                }`}
                                            >
                                                {/* Date Column (Left) */}
                                                <div className="w-[58px] sm:w-[94px] shrink-0 text-right pt-0.5">
                                                    <div className="font-mono text-xs sm:text-sm font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                                                        {formatDateShort(event.startDate)}
                                                    </div>
                                                    <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                                                        {getDayOfWeek(event.startDate)}
                                                    </div>
                                                </div>

                                                {/* Rail Node Dot (Center) */}
                                                <div className="relative z-10 shrink-0 mt-1">
                                                    {isCompleted ? (
                                                        <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                        </div>
                                                    ) : isOngoing ? (
                                                        <div className="relative flex items-center justify-center">
                                                            <div className="w-5 h-5 rounded-full bg-purple-900 border-2 border-purple-400 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-[#07090E] border-2 border-slate-600 group-hover:border-purple-400 transition-colors flex items-center justify-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-purple-400 transition-colors" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content Block (Right) */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <h3 className="text-sm font-semibold text-white group-hover:text-purple-200 transition-colors truncate">
                                                            {event.title}
                                                        </h3>

                                                        {/* Type Badge */}
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${typeTheme.badge}`}>
                                                            {event.eventType || 'Academic'}
                                                        </span>

                                                        {/* Priority Pill */}
                                                        {isCritical && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/90 text-rose-300 border border-rose-500/40">
                                                                <AlertTriangle className="w-2.5 h-2.5" />
                                                                Critical
                                                            </span>
                                                        )}
                                                        {isImportant && (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/80 text-amber-300 border border-amber-500/30">
                                                                ● Important
                                                            </span>
                                                        )}

                                                        {/* Status Pill */}
                                                        <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                                            isCompleted
                                                                ? 'bg-slate-900 text-slate-400 border-slate-700'
                                                                : isOngoing
                                                                    ? 'bg-purple-950/80 text-purple-300 border-purple-500/40 font-bold'
                                                                    : 'bg-slate-900/60 text-slate-400 border-white/[0.08]'
                                                        }`}>
                                                            {event.status}
                                                        </span>
                                                    </div>

                                                    {/* Short Description */}
                                                    {event.shortDescription ? (
                                                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-0.5">
                                                            {event.shortDescription}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-slate-500 italic">
                                                            Click to open milestone details & senior guide.
                                                        </p>
                                                    )}

                                                    {/* Resources Indicator */}
                                                    {Array.isArray(event.resources) && event.resources.length > 0 && (
                                                        <div className="flex items-center gap-1 mt-2 text-[11px] font-mono text-purple-400/80 group-hover:text-purple-300">
                                                            <FileText className="w-3 h-3" />
                                                            <span>{event.resources.length} {event.resources.length === 1 ? 'resource' : 'resources'} attached</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
               SLIDE-OVER EXPLAINER DRAWER
            ═══════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
                {selectedEvent && (
                    <div className="fixed inset-0 z-50 overflow-hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedEvent(null)}
                            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
                        />

                        {/* Drawer Panel */}
                        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                                className="w-screen max-w-lg bg-[#0B0F1C] border-l border-white/[0.1] shadow-2xl flex flex-col overflow-hidden"
                            >
                                {/* Drawer Header */}
                                <div className="p-6 border-b border-white/[0.08] bg-[#0E1324]/80">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Type Badge */}
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${getEventTypeTheme(selectedEvent.eventType).badge}`}>
                                                {selectedEvent.eventType || 'Academic'}
                                            </span>

                                            {/* Status Badge */}
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono border ${
                                                selectedEvent.status === 'COMPLETED'
                                                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                                                    : selectedEvent.status === 'ONGOING'
                                                        ? 'bg-purple-950 text-purple-300 border-purple-500/50 font-bold'
                                                        : 'bg-slate-900 text-slate-400 border-white/[0.08]'
                                            }`}>
                                                {selectedEvent.status}
                                            </span>

                                            {/* Priority */}
                                            {selectedEvent.priority === 'Critical' && (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                                                    Critical
                                                </span>
                                            )}
                                            {selectedEvent.priority === 'Important' && (
                                                <span className="px-2 py-0.5 rounded text-[11px] font-mono text-amber-300 bg-amber-950/80 border border-amber-500/30">
                                                    Important
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setSelectedEvent(null)}
                                            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <h2 className="text-xl font-bold text-white tracking-tight">
                                        {selectedEvent.title}
                                    </h2>

                                    {/* Date & Time Range */}
                                    <div className="flex items-center gap-2 mt-2 text-xs font-mono text-purple-300">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{formatDateRange(selectedEvent.startDate, selectedEvent.endDate)}</span>
                                    </div>
                                </div>

                                {/* Drawer Body (CSES Academic Guide / Blog-like Content) */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300 text-sm leading-relaxed">
                                    
                                    {/* Short Description */}
                                    {selectedEvent.shortDescription && (
                                        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-200 text-xs font-medium leading-relaxed">
                                            {selectedEvent.shortDescription}
                                        </div>
                                    )}

                                    {/* 1. Overview */}
                                    {selectedEvent.content?.overview && (
                                        <div>
                                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                                                Overview
                                            </h4>
                                            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-[#0E1322] p-4 rounded-xl border border-white/[0.05]">
                                                {selectedEvent.content.overview}
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. What Usually Happens */}
                                    {selectedEvent.content?.whatHappens && (
                                        <div>
                                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-blue-400" />
                                                What Usually Happens
                                            </h4>
                                            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-[#0E1322] p-4 rounded-xl border border-white/[0.05]">
                                                {selectedEvent.content.whatHappens}
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. What Should You Do */}
                                    {selectedEvent.content?.whatToDo && (
                                        <div>
                                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                What Should You Do?
                                            </h4>
                                            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-[#0E1322] p-4 rounded-xl border border-white/[0.05]">
                                                {selectedEvent.content.whatToDo}
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. Preparation Tips */}
                                    {selectedEvent.content?.preparationTips && (
                                        <div>
                                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                                Preparation Tips
                                            </h4>
                                            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-[#0E1322] p-4 rounded-xl border border-white/[0.05]">
                                                {selectedEvent.content.preparationTips}
                                            </div>
                                        </div>
                                    )}

                                    {/* 5. Important Notes */}
                                    {selectedEvent.content?.importantNotes && (
                                        <div>
                                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                                Important Notes & Rules
                                            </h4>
                                            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-rose-950/20 p-4 rounded-xl border border-rose-500/20">
                                                {selectedEvent.content.importantNotes}
                                            </div>
                                        </div>
                                    )}

                                    {/* 6. Resources & Downloads */}
                                    {Array.isArray(selectedEvent.resources) && selectedEvent.resources.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                                                <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                                                Resources & Links
                                            </h4>
                                            <div className="space-y-2">
                                                {selectedEvent.resources.map((res, rIdx) => (
                                                    <a
                                                        key={rIdx}
                                                        href={res.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-between p-3 rounded-xl bg-[#0E1322] hover:bg-[#131B30] border border-white/[0.06] hover:border-purple-500/40 transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="w-7 h-7 rounded-lg bg-purple-950/80 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-300">
                                                                {res.type === 'PDF' ? (
                                                                    <FileText className="w-3.5 h-3.5" />
                                                                ) : (
                                                                    <LinkIcon className="w-3.5 h-3.5" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-medium text-slate-200 group-hover:text-purple-300 truncate transition-colors">
                                                                    {res.title || res.url}
                                                                </div>
                                                                <div className="text-[10px] font-mono text-slate-500 uppercase">
                                                                    {res.type || 'Link'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-colors shrink-0 ml-2" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fallback if no guide content */}
                                    {!selectedEvent.content?.overview && 
                                     !selectedEvent.content?.whatHappens && 
                                     !selectedEvent.content?.whatToDo && 
                                     !selectedEvent.content?.preparationTips && 
                                     !selectedEvent.content?.importantNotes && 
                                     (!selectedEvent.resources || selectedEvent.resources.length === 0) && (
                                        <div className="p-8 text-center rounded-xl bg-[#0E1322] border border-white/[0.05] my-6">
                                            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                                            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                                                Detailed guide and senior notes for this event are being prepared. Check back closer to the milestone!
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Drawer Footer */}
                                <div className="p-4 border-t border-white/[0.08] bg-[#0E1324] flex items-center justify-between text-xs font-mono text-slate-500">
                                    <span>AskUrSenior Roadmaps</span>
                                    <span>Press Esc to close</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
