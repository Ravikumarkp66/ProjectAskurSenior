import React, { useState, useMemo } from 'react';
import { Search, Settings, X, Check, AlertCircle, ShieldCheck, Sparkles, Flame } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../../../../context/ThemeContext';
import { apiV2 } from '../../../../../services/authService';
import toast from 'react-hot-toast';

/* ── Status helpers (exported for other files) ── */
export const getAttendanceState = (pct, collegeThreshold = 85, userThreshold = 85) => {
    if (pct === null || pct === undefined) {
        return { color: '#64748b', dotColor: 'rgba(100,116,139,0.55)', stateKey: 'NOT_STARTED', label: 'Not started' };
    }
    const val = Number(pct);
    const cThresh = Number(collegeThreshold) || 85;
    const uThresh = Number(userThreshold) || cThresh;

    if (val < cThresh) {
        return { color: '#f43f5e', dotColor: '#f43f5e', stateKey: 'CRITICAL', label: 'Below college minimum' };
    }
    if (cThresh !== uThresh && val < uThresh) {
        return { color: '#f59e0b', dotColor: '#f59e0b', stateKey: 'ATTENTION', label: 'Below personal target' };
    }
    return { color: '#10b981', dotColor: '#10b981', stateKey: 'SAFE', label: 'On target' };
};

/* ── Tiny status dot ── */
const StatusDot = ({ color, size = 7 }) => (
    <span style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
    }} />
);

/* ── Format percentage ── */
const fmtPct = (val) => {
    if (val === null || val === undefined) return '—';
    return Number(val).toFixed(1) + '%';
};

/* ── Helper to resolve subject streak (consecutive classes attended) ── */
export const getStreakInfo = (item) => {
    const streakObj = item?.analytics?.streak || item?.streak || {};
    let current = Number(streakObj.current ?? item?.currentStreak ?? item?.analytics?.currentStreak ?? 0);
    let longest = Number(streakObj.longest ?? item?.longestStreak ?? item?.analytics?.longestStreak ?? 0);

    // If streak is not populated but timeline exists, calculate from timeline
    if (!current && Array.isArray(item?.timeline) && item.timeline.length > 0) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const sorted = [...item.timeline]
            .filter(t => t.date <= todayStr && t.status !== 'Suspended' && t.status !== 'Cancelled')
            .sort((a, b) => {
                const cmp = (a.date || '').localeCompare(b.date || '');
                if (cmp !== 0) return cmp;
                return (a.timeSlot || '').localeCompare(b.timeSlot || '');
            });
        
        let cur = 0;
        for (let i = sorted.length - 1; i >= 0; i--) {
            const st = String(sorted[i].status || '').trim().toLowerCase();
            if (st === 'present' || st === 'on duty' || st === 'onduty') {
                cur++;
            } else if (st === 'absent') {
                break;
            }
        }
        current = cur;
    }

    return { current, longest: Math.max(longest, current) };
};

const getSubjectRowKey = (item, idx) => item._id || item.subjectId || item.code || idx;

/* ── Subject row with Streak & Planning ── */
const SubjectRow = ({ 
    item, 
    index, 
    collegeThreshold, 
    userTarget,
    t,
    isDark
}) => {
    const an = item.analytics || {};
    const present = an.present ?? 0;
    const conducted = an.conducted ?? 0;
    const pct = item.attendancePercentage;

    const cThresh = item.collegeThreshold || collegeThreshold;
    const uThresh = item.userThreshold || userTarget || cThresh;
    const state = getAttendanceState(pct, cThresh, uThresh);
    const hasData = conducted > 0;

    // Remaining valid scheduled classes from engine
    const remaining = an.toBeConducted !== undefined 
        ? an.toBeConducted 
        : Math.max(0, (an.expected ?? 0) - conducted);

    // Need to attend consecutive classes calculation
    const uFrac = uThresh / 100;
    const needToAttend = (pct !== null && uFrac < 1)
        ? Math.max(0, Math.ceil((uThresh * conducted - 100 * present) / (100 - uThresh)))
        : 0;

    const isTargetReached = pct !== null && pct >= uThresh;
    const isUnreachable = !isTargetReached && needToAttend > remaining;

    const { current: currentStreak, longest: longestStreak } = getStreakInfo(item);
    const typeLabel = (item.category || 'Theory').replace(/Integrated|IPCC/gi, 'Theory+Lab');

    return (
        <tr
            style={{
                borderTop: `1px solid ${t?.borderSubtle || 'rgba(255,255,255,0.05)'}`,
                transition: 'background 0.15s',
            }}
            className="hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"
        >
            {/* # */}
            <td style={{ padding: '14px 10px 14px 16px', color: t?.textFaint || 'rgba(148,163,184,0.4)', fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'middle', width: 32 }}>
                {String(index + 1).padStart(2, '0')}
            </td>

            {/* Subject */}
            <td style={{ padding: '14px 8px', verticalAlign: 'middle' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: t?.text || '#f1f5f9', lineHeight: 1.35 }}>
                    {item.name || 'Unknown Subject'}
                </div>
                <div style={{ fontSize: 11, color: t?.textMuted || 'rgba(148,163,184,0.6)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {item.code && <span style={{ fontWeight: 600, color: t?.accent || 'rgba(167,139,250,0.75)', fontFamily: 'monospace' }}>{item.code}</span>}
                    {item.code && <span style={{ color: t?.border || 'rgba(255,255,255,0.15)' }}>·</span>}
                    <span>{typeLabel}</span>
                </div>
            </td>

            {/* Attendance */}
            <td style={{ padding: '14px 12px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: hasData ? state.color : (t?.textFaint || 'rgba(148,163,184,0.35)'), fontVariantNumeric: 'tabular-nums' }}>
                        {hasData ? fmtPct(pct) : '—'}
                    </span>
                    <StatusDot color={state.dotColor} />
                </div>
            </td>

            {/* Classes (Conducted & Remaining) */}
            <td style={{ padding: '14px 12px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: hasData ? (t?.text || '#e2e8f0') : (t?.textFaint || 'rgba(148,163,184,0.35)') }}>
                    {hasData ? `${present} / ${conducted}` : '—'}
                </div>
                <div style={{ fontSize: 10.5, color: t?.textMuted || 'rgba(148,163,184,0.5)', fontFamily: 'monospace', marginTop: 1 }}>
                    {remaining} remaining
                </div>
            </td>

            {/* Streak (Attending Consecutively) */}
            <td style={{ padding: '14px 12px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                {currentStreak > 0 ? (
                    <div 
                        title={`Attended ${currentStreak} consecutive ${currentStreak === 1 ? 'class' : 'classes'}${longestStreak > currentStreak ? ` · Best streak: ${longestStreak}` : ''}`}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-xs font-bold border ${
                            isDark 
                                ? 'bg-amber-500/10 border-amber-500/25 text-amber-300' 
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                    >
                        <Flame size={12} className="text-amber-500 flex-shrink-0" />
                        <span>{currentStreak} in a row</span>
                    </div>
                ) : (
                    <span 
                        title={longestStreak > 0 ? `Best streak: ${longestStreak} in a row` : 'No active streak'}
                        style={{ fontSize: 12, color: t?.textFaint || 'rgba(148,163,184,0.3)', fontFamily: 'monospace' }}
                    >
                        —
                    </span>
                )}
            </td>

            {/* Planning */}
            <td style={{ padding: '14px 16px 14px 12px', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                {isTargetReached ? (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#10b981' }}>
                        On target
                    </span>
                ) : isUnreachable ? (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#f43f5e' }}>
                        ⚠ Unreachable
                    </span>
                ) : (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#f59e0b' }}>
                        {needToAttend} to reach {uThresh}%
                    </span>
                )}
            </td>
        </tr>
    );
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const AttendanceSummaryView = ({
    progressList = [],
    overallMetrics = null,
    onOpenBaselineModal,
    readOnly,
    selectedSemester = 1,
    onTargetUpdated
}) => {
    const { isDark } = useTheme();

    const t = useMemo(() => ({
        surface: isDark ? '#0D111C' : '#FFFFFF',
        surfaceSubtle: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
        surfaceElevated: isDark ? '#13151D' : '#F1F5F9',
        border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
        borderSubtle: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)',
        text: isDark ? '#F8FAFC' : '#0F172A',
        textMuted: isDark ? '#94A3B8' : '#64748B',
        textFaint: isDark ? '#64748B' : '#94A3B8',
        accent: isDark ? '#C4B5FD' : '#6D28D9',
        accentBg: isDark ? 'rgba(124, 58, 237, 0.16)' : '#F5F3FF',
        accentBorder: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(124, 58, 237, 0.25)',
        popoverBg: isDark ? '#13111c' : '#FFFFFF',
        popoverShadow: isDark 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)' 
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        inputBg: isDark ? 'rgba(0, 0, 0, 0.4)' : '#FFFFFF',
        inputBorder: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
    }), [isDark]);

    // Determine college baseline threshold (default 85%)
    const collegeThreshold = Number(overallMetrics?.collegeThreshold || progressList[0]?.collegeThreshold || 85);
    
    // User personal target (default from overallMetrics or college min)
    const initialTarget = Number(overallMetrics?.userThreshold || progressList[0]?.userThreshold || overallMetrics?.threshold || collegeThreshold);
    
    const [userTarget, setUserTarget] = useState(initialTarget);
    const [targetInput, setTargetInput] = useState(initialTarget);
    const [simulateN, setSimulateN] = useState(5);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [targetError, setTargetError] = useState('');
    const [isSavingTarget, setIsSavingTarget] = useState(false);

    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'NEEDS_ATTENTION' | 'ON_TARGET'
    const [searchQuery, setSearchQuery] = useState('');

    // Keep userTarget synced if overallMetrics changes
    React.useEffect(() => {
        if (initialTarget && initialTarget >= collegeThreshold) {
            setUserTarget(initialTarget);
            setTargetInput(initialTarget);
        }
    }, [initialTarget, collegeThreshold]);

    // Handle Saving Target
    const handleSaveTarget = async () => {
        const val = parseFloat(targetInput);
        if (isNaN(val) || val < collegeThreshold) {
            setTargetError(`Your target must be at least the college minimum of ${collegeThreshold}%.`);
            return;
        }
        if (val > 100) {
            setTargetError('Target cannot exceed 100%.');
            return;
        }

        setIsSavingTarget(true);
        setTargetError('');
        try {
            const res = await apiV2.updateAttendanceTarget({
                semester: selectedSemester,
                targetPercentage: val
            });
            if (res.data?.success) {
                setUserTarget(val);
                setIsSettingsOpen(false);
                toast.success(`Target updated to ${val}%`);
                if (onTargetUpdated) onTargetUpdated();
            } else {
                setTargetError(res.data?.message || 'Failed to update target');
            }
        } catch (err) {
            setTargetError(err.response?.data?.message || err.message || 'Failed to update target');
        } finally {
            setIsSavingTarget(false);
        }
    };

    /* Aggregate totals across all subjects */
    const totals = useMemo(() => {
        let totalConducted = 0;
        let totalPresent = 0;
        let totalRemaining = 0;
        let needsAttentionCount = 0;
        let onTargetCount = 0;

        progressList.forEach(item => {
            const an = item.analytics || {};
            const c = an.conducted ?? 0;
            const p = an.present ?? 0;
            const exp = an.expected ?? 0;
            const rem = an.toBeConducted !== undefined ? an.toBeConducted : Math.max(0, exp - c);

            totalConducted += c;
            totalPresent += p;
            totalRemaining += rem;

            const cThresh = item.collegeThreshold || collegeThreshold;
            const uThresh = item.userThreshold || userTarget || cThresh;
            const state = getAttendanceState(item.attendancePercentage, cThresh, uThresh);
            if (state.stateKey === 'CRITICAL' || state.stateKey === 'ATTENTION') {
                needsAttentionCount++;
            } else if (state.stateKey === 'SAFE') {
                onTargetCount++;
            }
        });

        return { totalConducted, totalPresent, totalRemaining, needsAttentionCount, onTargetCount };
    }, [progressList, collegeThreshold, userTarget]);

    /* Filtered list */
    const filteredSubjects = useMemo(() => {
        return progressList.filter(item => {
            const cThresh = item.collegeThreshold || collegeThreshold;
            const uThresh = item.userThreshold || userTarget || cThresh;
            const state = getAttendanceState(item.attendancePercentage, cThresh, uThresh);
            const isNeedsAttention = state.stateKey === 'CRITICAL' || state.stateKey === 'ATTENTION';

            if (statusFilter === 'NEEDS_ATTENTION' && !isNeedsAttention) return false;
            if (statusFilter === 'ON_TARGET' && state.stateKey !== 'SAFE') return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const nm = (item.name || '').toLowerCase().includes(q);
                const cd = (item.code || '').toLowerCase().includes(q);
                if (!nm && !cd) return false;
            }
            return true;
        });
    }, [progressList, statusFilter, searchQuery, collegeThreshold, userTarget]);

    /* ── Filter tab styles ── */
    const tabStyle = (active) => ({
        padding: '5px 12px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        border: 'none',
        background: active ? t.accentBg : 'transparent',
        color: active ? t.accent : t.textMuted,
        transition: 'all 0.15s',
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── Compact Header & Totals ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: t.text, margin: 0, letterSpacing: '-0.01em' }}>
                        Semester Overview
                    </h2>
                    <span style={{ fontSize: 12, color: t.textMuted, fontFamily: 'monospace' }}>
                        {progressList.length} subjects · {totals.totalConducted} conducted · {totals.totalRemaining} scheduled ahead
                    </span>
                </div>
            </div>

            {/* ── Table Toolbar ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, position: 'relative' }}>
                {/* Left: Filter Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <button style={tabStyle(statusFilter === 'ALL')} onClick={() => setStatusFilter('ALL')}>
                        All <span style={{ opacity: 0.6, fontSize: 11 }}>({progressList.length})</span>
                    </button>
                    {totals.needsAttentionCount > 0 && (
                        <button style={tabStyle(statusFilter === 'NEEDS_ATTENTION')} onClick={() => setStatusFilter('NEEDS_ATTENTION')}>
                            Needs attention
                            <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>
                                {totals.needsAttentionCount}
                            </span>
                        </button>
                    )}
                    <button style={tabStyle(statusFilter === 'ON_TARGET')} onClick={() => setStatusFilter('ON_TARGET')}>
                        On target
                        <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, color: '#10b981' }}>
                            {totals.onTargetCount}
                        </span>
                    </button>
                </div>

                {/* Right: Search & Settings Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Search */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: t.surfaceSubtle,
                        border: `1px solid ${t.border}`,
                        borderRadius: 8,
                        padding: '5px 10px',
                    }}>
                        <Search size={13} style={{ color: t.textFaint }} />
                        <input
                            type="text"
                            placeholder="Search subjects..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: t.text,
                                fontSize: 12,
                                width: 130,
                            }}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textFaint, padding: 0 }}
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* Settings Button */}
                    <button
                        type="button"
                        onClick={() => setIsSettingsOpen(prev => !prev)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: isSettingsOpen ? t.accentBg : t.surfaceSubtle,
                            border: isSettingsOpen ? `1px solid ${t.accentBorder}` : `1px solid ${t.border}`,
                            borderRadius: 8,
                            color: isSettingsOpen ? t.accent : t.textMuted,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                    >
                        <Settings size={13} style={{ color: isSettingsOpen ? t.accent : t.textMuted }} />
                        <span>Attendance Settings</span>
                    </button>

                    {/* Settings Popover Card */}
                    <AnimatePresence>
                        {isSettingsOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: 8,
                                    zIndex: 40,
                                    width: 290,
                                    background: t.popoverBg,
                                    border: `1px solid ${t.border}`,
                                    borderRadius: 14,
                                    padding: '16px',
                                    boxShadow: t.popoverShadow,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 14
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.borderSubtle}`, paddingBottom: 8 }}>
                                    <span style={{ fontSize: 11.5, fontWeight: 700, color: t.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Attendance Planning
                                    </span>
                                    <button
                                        onClick={() => setIsSettingsOpen(false)}
                                        style={{ background: 'none', border: 'none', color: t.textFaint, cursor: 'pointer', padding: 2 }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                {/* College Minimum (Read-only) */}
                                <div>
                                    <span style={{ fontSize: 11, color: t.textMuted, display: 'block', marginBottom: 4 }}>
                                        College minimum
                                    </span>
                                    <div style={{
                                        padding: '6px 10px',
                                        background: t.surfaceSubtle,
                                        border: `1px solid ${t.border}`,
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        fontFamily: 'monospace',
                                        color: t.text
                                    }}>
                                        {collegeThreshold}% (Mandatory institutional policy)
                                    </div>
                                </div>

                                {/* Personal Target */}
                                <div>
                                    <span style={{ fontSize: 11, color: t.textMuted, display: 'block', marginBottom: 4 }}>
                                        My target
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input
                                            type="number"
                                            min={collegeThreshold}
                                            max={100}
                                            value={targetInput}
                                            onChange={e => {
                                                setTargetInput(e.target.value);
                                                setTargetError('');
                                            }}
                                            style={{
                                                width: 70,
                                                padding: '6px 10px',
                                                background: t.inputBg,
                                                border: targetError ? '1px solid #f43f5e' : `1px solid ${t.inputBorder}`,
                                                borderRadius: 8,
                                                color: t.text,
                                                fontSize: 13,
                                                fontWeight: 700,
                                                textAlign: 'center',
                                                fontFamily: 'monospace',
                                                outline: 'none'
                                            }}
                                        />
                                        <span style={{ color: t.textMuted, fontWeight: 700 }}>%</span>
                                        <button
                                            type="button"
                                            onClick={handleSaveTarget}
                                            disabled={isSavingTarget}
                                            style={{
                                                marginLeft: 'auto',
                                                padding: '6px 14px',
                                                background: '#7c3aed',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 8,
                                                fontSize: 11.5,
                                                fontWeight: 600,
                                                cursor: isSavingTarget ? 'not-allowed' : 'pointer',
                                                opacity: isSavingTarget ? 0.6 : 1,
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {isSavingTarget ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                    {targetError && (
                                        <p style={{ fontSize: 10.5, color: '#f43f5e', marginTop: 4, lineHeight: 1.3 }}>
                                            {targetError}
                                        </p>
                                    )}
                                </div>

                                {/* Simulation Count */}
                                <div style={{ borderTop: `1px solid ${t.borderSubtle}`, paddingTop: 10 }}>
                                    <span style={{ fontSize: 11, color: t.textMuted, display: 'block', marginBottom: 4 }}>
                                        What if I attend next
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input
                                            type="number"
                                            min={1}
                                            max={50}
                                            value={simulateN}
                                            onChange={e => setSimulateN(Math.max(1, parseInt(e.target.value) || 1))}
                                            style={{
                                                width: 70,
                                                padding: '6px 10px',
                                                background: t.inputBg,
                                                border: `1px solid ${t.inputBorder}`,
                                                borderRadius: 8,
                                                color: t.text,
                                                fontSize: 13,
                                                fontWeight: 700,
                                                textAlign: 'center',
                                                fontFamily: 'monospace',
                                                outline: 'none'
                                            }}
                                        />
                                        <span style={{ fontSize: 12, color: t.textMuted }}>classes?</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── CSES Academic Table (5 Columns) ── */}
            <div style={{
                background: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: 12,
                overflow: 'hidden',
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 620 }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${t.border}`, background: t.surfaceSubtle }}>
                                <th style={{ padding: '10px 10px 10px 16px', fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', width: 32 }}>
                                    #
                                </th>
                                <th style={{ padding: '10px 8px', fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Subject
                                </th>
                                <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                                    Attendance
                                </th>
                                <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                                    Classes
                                </th>
                                <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                                    Streak
                                </th>
                                <th style={{ padding: '10px 16px 10px 12px', fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                                    Planning
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubjects.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: t.textMuted, fontSize: 13 }}>
                                        {searchQuery ? 'No subjects match your search.' : 'No subjects found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredSubjects.map((item, idx) => {
                                    const rowKey = getSubjectRowKey(item, idx);
                                    return (
                                        <SubjectRow
                                            key={rowKey}
                                            item={item}
                                            index={idx}
                                            collegeThreshold={collegeThreshold}
                                            userTarget={userTarget}
                                            t={t}
                                            isDark={isDark}
                                        />
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default AttendanceSummaryView;
