import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, AlertTriangle, Check, BookOpen, FlaskConical, Calendar, Search, RotateCcw, Trash2 } from 'lucide-react';
import { useTheme } from '../../../../../context/ThemeContext';

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatTime = (min) => {
    if (min === null || min === undefined) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
};

const getNextMondayString = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day === 0 ? 1 : 8 - day);
    const nextMon = new Date(d.setDate(d.getDate() + diff));
    return nextMon.toISOString().slice(0, 10);
};

const getTodayString = () => {
    return new Date().toISOString().slice(0, 10);
};

const TimetableSlotCustomizeModal = ({
    isOpen,
    onClose,
    slot,
    allSlots = [],
    uniqueIntervals = [],
    subjects = [],
    registeredSubjects = [],
    onApplyChange,
    onResetSlotToOfficial
}) => {
    const { isDark = true } = useTheme?.() || {};

    const t = {
        surface: isDark ? '#0D111C' : '#FFFFFF',
        surfaceSubtle: isDark ? 'rgba(255, 255, 255, 0.025)' : '#F8FAFC',
        surfaceElevated: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
        border: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
        borderSubtle: isDark ? 'rgba(255, 255, 255, 0.06)' : '#CBD5E1',
        text: isDark ? '#F1F5F9' : '#0F172A',
        textMuted: isDark ? '#94A3B8' : '#64748B',
        textFaint: isDark ? '#64748B' : '#94A3B8',
        inputBg: isDark ? '#141724' : '#FFFFFF',
        accent: '#6D28D9',
        accentLight: isDark ? '#C4B5FD' : '#6D28D9',
        accentBg: isDark ? 'rgba(109, 40, 217, 0.2)' : '#F5F3FF',
        accentBorder: isDark ? 'rgba(109, 40, 217, 0.4)' : '#DDD6FE',
    };

    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [lectureType, setLectureType] = useState('Lecture');
    const [scopeType, setScopeType] = useState('TODAY_ONWARD'); // 'TODAY_ONWARD' | 'NEXT_MONDAY' | 'SPECIFIC_DATE' | 'PAST_WEEKS'
    const [specificDate, setSpecificDate] = useState(getTodayString());
    const [subjectSearch, setSubjectSearch] = useState('');

    // Detect if this slot was originally part of a 2-period lab
    const isOriginallyMultiPeriodLab = useMemo(() => {
        if (!slot) return false;
        return Boolean(slot.isMultiPeriod || slot.totalPeriods === 2 || slot.linkedSlot);
    }, [slot]);

    // Available subject options (from registered subjects or general subjects)
    const subjectOptions = useMemo(() => {
        if (registeredSubjects && registeredSubjects.length > 0) {
            return registeredSubjects.map(reg => {
                const subj = reg.subject || {};
                const id = String(subj._id || reg._id || '');
                const name = reg.customName || subj.name || 'Unknown Subject';
                const code = reg.customCode || subj.code || '';
                const credits = reg.credits || subj.credits || null;
                return { id, name, code, category: reg.category || 'Theory', credits };
            });
        }
        return subjects.map(s => ({
            id: String(s._id || ''),
            name: s.name || 'Unknown Subject',
            code: s.code || '',
            category: s.category || 'Theory',
            credits: s.credits || null
        }));
    }, [registeredSubjects, subjects]);

    // Filtered subjects based on search query
    const filteredSubjectOptions = useMemo(() => {
        const q = subjectSearch.toLowerCase().trim();
        if (!q) return subjectOptions;
        return subjectOptions.filter(opt => 
            opt.name.toLowerCase().includes(q) || 
            opt.code.toLowerCase().includes(q)
        );
    }, [subjectOptions, subjectSearch]);

    useEffect(() => {
        if (slot) {
            const currentSubjId = String(slot.subject?._id || slot.subject || '');
            setSelectedSubjectId(currentSubjId);
            setLectureType(slot.lectureType === 'Lab' ? 'Lab' : 'Lecture');
            setScopeType('TODAY_ONWARD');
            setSpecificDate(getTodayString());
            setSubjectSearch('');
        }
    }, [slot]);

    // Day slots for consecutive lookup
    const daySlots = useMemo(() => {
        if (!slot) return [];
        const ds = slot.daySlots || allSlots.filter(s => s.dayOfWeek === slot.dayOfWeek);
        return [...ds].sort((a, b) => a.startMinute - b.startMinute);
    }, [slot, allSlots]);

    // Dynamic Theory <-> Lab Validation (Rule 10, Rule 32, Rule 33)
    const validationStatus = useMemo(() => {
        if (!slot) return { isValid: true, error: null, warning: null, info: null, nextSlot: null };

        // Scenario A: User wants a LAB session
        if (lectureType === 'Lab') {
            // If already a 2-period lab, it already safely occupies both periods
            if (isOriginallyMultiPeriodLab) {
                return {
                    isValid: true,
                    error: null,
                    warning: null,
                    info: `2-period lab block (${formatTime(slot.blockStartMinute || slot.startMinute)} – ${formatTime(slot.blockEndMinute || slot.endMinute)}). Both periods will update together.`,
                    nextSlot: slot.linkedSlot
                };
            }

            // Otherwise, slot was a 1-period Theory class. We must inspect the adjacent NEXT period!
            const slotEnd = Number(slot.endMinute);
            const nextSlot = daySlots.find(s => Number(s.startMinute) === slotEnd);

            if (!nextSlot) {
                return {
                    isValid: false,
                    error: 'Cannot create a 2-period lab here: this is the final period of the day.',
                    warning: null,
                    info: null,
                    nextSlot: null
                };
            }

            if (nextSlot.lectureType === 'Break') {
                return {
                    isValid: false,
                    error: `Cannot span a 2-period lab across ${nextSlot.room || nextSlot.breakName || 'an official break'}.`,
                    warning: null,
                    info: null,
                    nextSlot
                };
            }

            // Check if next slot is occupied by an assigned class
            const nextSubjId = nextSlot.subject?._id || nextSlot.subject;
            if (nextSubjId) {
                const nextSubjName = nextSlot.subject?.name || 'another class';
                return {
                    isValid: false,
                    error: `Cannot create a 2-period lab here. The next period (${formatTime(nextSlot.startMinute)} – ${formatTime(nextSlot.endMinute)}) is already occupied by ${nextSubjName}.`,
                    warning: null,
                    info: null,
                    nextSlot
                };
            }

            // Next slot is free!
            return {
                isValid: true,
                error: null,
                warning: null,
                info: `✓ Will automatically reserve the next free period (${formatTime(slot.startMinute)} – ${formatTime(nextSlot.endMinute)}) as a 2-period lab session.`,
                nextSlot
            };
        }

        // Scenario B: User wants a THEORY lecture
        if (lectureType === 'Lecture') {
            // If converting from an existing 2-period lab down to 1-period theory
            if (isOriginallyMultiPeriodLab) {
                const freedSlot = slot.linkedSlot;
                const freedTimeStr = freedSlot ? `${formatTime(freedSlot.startMinute)} – ${formatTime(freedSlot.endMinute)}` : 'the second period';
                return {
                    isValid: true,
                    error: null,
                    warning: `Converting 2-period lab into a 1-period theory class. The second period (${freedTimeStr}) will become free.`,
                    info: null,
                    nextSlot: freedSlot
                };
            }

            return { isValid: true, error: null, warning: null, info: null, nextSlot: null };
        }

        return { isValid: true, error: null, warning: null, info: null, nextSlot: null };
    }, [slot, lectureType, isOriginallyMultiPeriodLab, daySlots]);

    if (!isOpen || !slot) return null;

    const displayStartMin = slot.blockStartMinute ?? slot.startMinute;
    const displayEndMin = (lectureType === 'Lab' && validationStatus.nextSlot)
        ? (validationStatus.nextSlot.endMinute)
        : (lectureType === 'Lecture' && isOriginallyMultiPeriodLab)
            ? slot.endMinute
            : (slot.blockEndMinute ?? slot.endMinute);

    const currentSubjName = slot.subject?.name 
        || subjectOptions.find(o => o.id === String(slot.subject?._id || slot.subject))?.name 
        || 'Unassigned';
    const currentType = slot.lectureType || 'Theory';
    const newSubjObj = subjectOptions.find(o => o.id === selectedSubjectId);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (!selectedSubjectId || !validationStatus.isValid) return;

        let effectiveDate = getTodayString();
        let appliesToPast = false;

        if (scopeType === 'TODAY_ONWARD') {
            effectiveDate = getTodayString();
        } else if (scopeType === 'NEXT_MONDAY') {
            effectiveDate = getNextMondayString();
        } else if (scopeType === 'SPECIFIC_DATE') {
            effectiveDate = specificDate;
        } else if (scopeType === 'PAST_WEEKS') {
            appliesToPast = true;
            effectiveDate = 'SEMESTER_START';
        }

        onApplyChange({
            slot,
            linkedSlot: slot.linkedSlot || validationStatus.nextSlot,
            isMultiPeriod: lectureType === 'Lab',
            isConvertingToTheory: isOriginallyMultiPeriodLab && lectureType === 'Lecture',
            isConvertingToLab: !isOriginallyMultiPeriodLab && lectureType === 'Lab',
            newSubject: newSubjObj,
            newSubjectId: selectedSubjectId,
            lectureType,
            scopeType,
            effectiveDate,
            appliesToPast
        });
    };

    const handleClearSlot = () => {
        if (window.confirm('Clear this class assignment? It will become an unassigned free period for future dates.')) {
            let effectiveDate = scopeType === 'SPECIFIC_DATE' ? specificDate : getTodayString();
            onApplyChange({
                slot,
                linkedSlot: slot.linkedSlot,
                isClearSlot: true,
                newSubject: null,
                newSubjectId: null,
                lectureType: 'Free Period',
                scopeType,
                effectiveDate,
                appliesToPast: scopeType === 'PAST_WEEKS'
            });
        }
    };

    const handleResetToOfficial = () => {
        if (onResetSlotToOfficial) {
            onResetSlotToOfficial(slot);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div 
                className="w-full max-w-[560px] max-h-[min(92vh,680px)] rounded-xl shadow-2xl overflow-hidden flex flex-col transition-colors"
                style={{
                    backgroundColor: t.surface,
                    borderColor: t.border,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: t.text
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Fixed Header ── */}
                <div 
                    className="px-5 py-3.5 flex items-center justify-between shrink-0"
                    style={{
                        borderBottom: `1px solid ${t.border}`,
                        backgroundColor: t.surfaceSubtle
                    }}
                >
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold tracking-tight" style={{ color: t.text }}>
                                Customize Timetable Slot
                            </h3>
                            {isOriginallyMultiPeriodLab && (
                                <span 
                                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                                    style={{
                                        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF',
                                        color: isDark ? '#A5B4FC' : '#4F46E5',
                                        border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE'}`
                                    }}
                                >
                                    2-period Lab
                                </span>
                            )}
                        </div>
                        <p className="text-[11.5px] font-mono mt-0.5" style={{ color: t.textMuted }}>
                            {DAYS[slot.dayOfWeek]} · {formatTime(displayStartMin)} – {formatTime(displayEndMin)}
                            {isOriginallyMultiPeriodLab ? ' (2 consecutive periods)' : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: t.textMuted }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.surfaceElevated; e.currentTarget.style.color = t.text; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textMuted; }}
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* ── Scrollable Body Area ── */}
                <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                    {/* Compact Horizontal Current → Updated Preview */}
                    <div 
                        className="p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs"
                        style={{
                            backgroundColor: t.surfaceSubtle,
                            border: `1px solid ${t.borderSubtle}`
                        }}
                    >
                        <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-mono block mb-0.5" style={{ color: t.textMuted }}>Current</span>
                            <div className="font-medium truncate" style={{ color: t.text }} title={`${currentSubjName} · ${currentType}`}>
                                {currentSubjName}
                            </div>
                            <span className="text-[10.5px] block mt-0.5" style={{ color: t.textMuted }}>
                                {currentType} {isOriginallyMultiPeriodLab ? '· 2 periods' : ''}
                            </span>
                        </div>
                        <ArrowRight size={14} className="shrink-0 opacity-80" style={{ color: t.accentLight }} />
                        <div className="min-w-0 flex-1 text-right">
                            <span className="text-[10px] uppercase font-mono block mb-0.5" style={{ color: t.accentLight }}>Updated</span>
                            <div className="font-semibold truncate" style={{ color: t.text }} title={newSubjObj ? newSubjObj.name : 'Select below'}>
                                {newSubjObj ? newSubjObj.name : 'Select subject...'}
                            </div>
                            <span className="text-[10.5px] block mt-0.5" style={{ color: t.accentLight }}>
                                {lectureType} {lectureType === 'Lab' ? '· 2 periods' : '· 1 period'}
                            </span>
                        </div>
                    </div>

                    {/* Subject Selection with Inline Filter (Rule 45) */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                                Subject
                            </label>
                            {subjectOptions.length > 5 && (
                                <span className="text-[10.5px] font-mono" style={{ color: t.textFaint }}>
                                    {filteredSubjectOptions.length} available
                                </span>
                            )}
                        </div>

                        {/* Search Input */}
                        <div className="relative mb-2">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: t.textFaint }} />
                            <input
                                type="text"
                                placeholder="Search by name or course code..."
                                value={subjectSearch}
                                onChange={(e) => setSubjectSearch(e.target.value)}
                                className="w-full h-8 pl-8 pr-3 rounded-lg text-xs focus:outline-none focus:border-violet-500 transition-all font-sans"
                                style={{
                                    backgroundColor: t.inputBg,
                                    border: `1px solid ${t.borderSubtle}`,
                                    color: t.text
                                }}
                            />
                        </div>

                        {/* Select Dropdown */}
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg text-xs font-medium focus:outline-none focus:border-violet-500 transition-all cursor-pointer truncate"
                            style={{
                                backgroundColor: t.inputBg,
                                border: `1px solid ${t.borderSubtle}`,
                                color: t.text
                            }}
                        >
                            <option value="" disabled className={isDark ? 'bg-[#181622] text-zinc-400' : 'bg-white text-slate-400'}>
                                Choose a subject...
                            </option>
                            {filteredSubjectOptions.map((opt) => (
                                <option 
                                    key={opt.id} 
                                    value={opt.id} 
                                    className={isDark ? 'bg-[#181622] text-white' : 'bg-white text-slate-900'}
                                >
                                    {opt.name} {opt.code ? `[${opt.code}]` : ''} · {opt.category}{opt.credits ? ` (${opt.credits} Credits)` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Session Type Segmented Control */}
                    <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: t.textMuted }}>
                            Session Type
                        </label>
                        <div 
                            className="grid grid-cols-2 gap-2 p-1 rounded-lg"
                            style={{
                                backgroundColor: t.surfaceSubtle,
                                border: `1px solid ${t.borderSubtle}`
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => setLectureType('Lecture')}
                                className="py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                                style={lectureType === 'Lecture' ? {
                                    backgroundColor: isDark ? 'rgba(109, 40, 217, 0.25)' : '#EDE9FE',
                                    border: `1px solid ${isDark ? 'rgba(109, 40, 217, 0.4)' : '#C4B5FD'}`,
                                    color: isDark ? '#DDD6FE' : '#6D28D9'
                                } : {
                                    backgroundColor: 'transparent',
                                    border: '1px solid transparent',
                                    color: t.textMuted
                                }}
                            >
                                <BookOpen size={13} />
                                <span>Theory Lecture (1 period)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setLectureType('Lab')}
                                className="py-2 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                                style={lectureType === 'Lab' ? {
                                    backgroundColor: isDark ? 'rgba(109, 40, 217, 0.25)' : '#EDE9FE',
                                    border: `1px solid ${isDark ? 'rgba(109, 40, 217, 0.4)' : '#C4B5FD'}`,
                                    color: isDark ? '#DDD6FE' : '#6D28D9'
                                } : {
                                    backgroundColor: 'transparent',
                                    border: '1px solid transparent',
                                    color: t.textMuted
                                }}
                            >
                                <FlaskConical size={13} />
                                <span>Practical Lab (2 periods)</span>
                            </button>
                        </div>
                    </div>

                    {/* Dynamic Validation Alerts (Rule 10, Rule 32, Rule 33) */}
                    {validationStatus.error && (
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                            <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                                <strong className="font-semibold block text-rose-700 dark:text-rose-100">Cannot Create 2-Period Lab</strong>
                                <span>{validationStatus.error}</span>
                            </div>
                        </div>
                    )}

                    {validationStatus.warning && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                                <strong className="font-semibold block text-amber-800 dark:text-amber-100">Lab to Theory Conversion</strong>
                                <span>{validationStatus.warning}</span>
                            </div>
                        </div>
                    )}

                    {validationStatus.info && !validationStatus.error && (
                        <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-200 text-xs flex items-center gap-2 animate-fadeIn">
                            <FlaskConical size={14} className="text-indigo-500 shrink-0" />
                            <span>{validationStatus.info}</span>
                        </div>
                    )}

                    {/* Change Scope & Effective Date */}
                    <div 
                        className="pt-2 space-y-2"
                        style={{ borderTop: `1px solid ${t.borderSubtle}` }}
                    >
                        <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                            When should this change apply?
                        </label>

                        {/* Standard Safe Options */}
                        <div className="space-y-1.5">
                            {/* Option 1: From today (Default) */}
                            <label 
                                onClick={() => setScopeType('TODAY_ONWARD')}
                                className="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all"
                                style={scopeType === 'TODAY_ONWARD' ? {
                                    backgroundColor: isDark ? 'rgba(109, 40, 217, 0.1)' : '#F5F3FF',
                                    borderColor: isDark ? 'rgba(109, 40, 217, 0.4)' : '#DDD6FE'
                                } : {
                                    backgroundColor: t.surfaceSubtle,
                                    borderColor: t.borderSubtle
                                }}
                            >
                                <input
                                    type="radio"
                                    name="scope"
                                    checked={scopeType === 'TODAY_ONWARD'}
                                    onChange={() => setScopeType('TODAY_ONWARD')}
                                    className="mt-0.5 accent-violet-600"
                                />
                                <div className="text-xs leading-tight">
                                    <span className="font-semibold block" style={{ color: t.text }}>From today onward (Default)</span>
                                    <span className="text-[11px] mt-0.5 block" style={{ color: t.textMuted }}>Past records remain frozen. Takes effect from today.</span>
                                </div>
                            </label>

                            {/* Option 2: From next Monday */}
                            <label 
                                onClick={() => setScopeType('NEXT_MONDAY')}
                                className="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all"
                                style={scopeType === 'NEXT_MONDAY' ? {
                                    backgroundColor: isDark ? 'rgba(109, 40, 217, 0.1)' : '#F5F3FF',
                                    borderColor: isDark ? 'rgba(109, 40, 217, 0.4)' : '#DDD6FE'
                                } : {
                                    backgroundColor: t.surfaceSubtle,
                                    borderColor: t.borderSubtle
                                }}
                            >
                                <input
                                    type="radio"
                                    name="scope"
                                    checked={scopeType === 'NEXT_MONDAY'}
                                    onChange={() => setScopeType('NEXT_MONDAY')}
                                    className="mt-0.5 accent-violet-600"
                                />
                                <div className="text-xs leading-tight">
                                    <span className="font-semibold block" style={{ color: t.text }}>From next Monday</span>
                                    <span className="text-[11px] mt-0.5 block" style={{ color: t.textMuted }}>Starts next week ({getNextMondayString()}).</span>
                                </div>
                            </label>

                            {/* Option 3: From a specific date */}
                            <label 
                                onClick={() => setScopeType('SPECIFIC_DATE')}
                                className="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all"
                                style={scopeType === 'SPECIFIC_DATE' ? {
                                    backgroundColor: isDark ? 'rgba(109, 40, 217, 0.1)' : '#F5F3FF',
                                    borderColor: isDark ? 'rgba(109, 40, 217, 0.4)' : '#DDD6FE'
                                } : {
                                    backgroundColor: t.surfaceSubtle,
                                    borderColor: t.borderSubtle
                                }}
                            >
                                <input
                                    type="radio"
                                    name="scope"
                                    checked={scopeType === 'SPECIFIC_DATE'}
                                    onChange={() => setScopeType('SPECIFIC_DATE')}
                                    className="mt-0.5 accent-violet-600"
                                />
                                <div className="text-xs leading-tight w-full">
                                    <span className="font-semibold block" style={{ color: t.text }}>From a specific date</span>
                                    <span className="text-[11px] mt-0.5 block" style={{ color: t.textMuted }}>Choose custom effective date.</span>
                                    {scopeType === 'SPECIFIC_DATE' && (
                                        <input
                                            type="date"
                                            value={specificDate}
                                            onChange={(e) => setSpecificDate(e.target.value)}
                                            className="mt-1.5 h-7 px-2.5 rounded text-xs font-mono focus:outline-none focus:border-violet-500"
                                            style={{
                                                backgroundColor: t.inputBg,
                                                border: `1px solid ${t.borderSubtle}`,
                                                color: t.text
                                            }}
                                        />
                                    )}
                                </div>
                            </label>
                        </div>

                        {/* Advanced Divider */}
                        <div 
                            className="pt-2"
                            style={{ borderTop: `1px solid ${t.borderSubtle}` }}
                        >
                            <span className="text-[10px] uppercase tracking-wider font-mono block mb-1.5" style={{ color: t.textFaint }}>
                                Advanced
                            </span>

                            {/* Option 4: Apply to previous weeks too */}
                            <label 
                                onClick={() => setScopeType('PAST_WEEKS')}
                                className="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all"
                                style={scopeType === 'PAST_WEEKS' ? {
                                    backgroundColor: isDark ? 'rgba(244, 63, 94, 0.1)' : '#FFF1F2',
                                    borderColor: isDark ? 'rgba(244, 63, 94, 0.4)' : '#FECDD3'
                                } : {
                                    backgroundColor: t.surfaceSubtle,
                                    borderColor: t.borderSubtle
                                }}
                            >
                                <input
                                    type="radio"
                                    name="scope"
                                    checked={scopeType === 'PAST_WEEKS'}
                                    onChange={() => setScopeType('PAST_WEEKS')}
                                    className="mt-0.5 accent-rose-500"
                                />
                                <div className="text-xs leading-tight">
                                    <span className="font-semibold block" style={{ color: isDark ? '#FDA4AF' : '#E11D48' }}>Apply to previous weeks too</span>
                                    <span className="text-[11px] mt-0.5 block" style={{ color: t.textMuted }}>Modifies historical timetable associations. Requires explicit confirmation.</span>
                                </div>
                            </label>

                            {/* Inline Warning if Past Weeks selected */}
                            {scopeType === 'PAST_WEEKS' && (
                                <div className="mt-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-200 text-xs flex items-start gap-2">
                                    <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                                    <div className="leading-snug text-[11px]">
                                        <strong className="block text-rose-800 dark:text-rose-100 mb-0.5">Previous attendance records may be affected</strong>
                                        Changing the timetable for previous weeks can alter which subject historical attendance entries associate with.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Fixed Footer with Actions (Rule 34) ── */}
                <div 
                    className="px-5 py-3 flex items-center justify-between gap-2 shrink-0"
                    style={{
                        borderTop: `1px solid ${t.border}`,
                        backgroundColor: t.surfaceSubtle
                    }}
                >
                    <div className="flex items-center gap-1.5">
                        {slot.isPersonalChange && (
                            <button
                                type="button"
                                onClick={handleResetToOfficial}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1"
                                style={{
                                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7',
                                    color: isDark ? '#FCD34D' : '#D97706',
                                    border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A'}`
                                }}
                                title="Restore this slot to the official college timetable"
                            >
                                <RotateCcw size={12} />
                                <span>Reset to Official</span>
                            </button>
                        )}
                        {(slot.subject?._id || slot.subject) && (
                            <button
                                type="button"
                                onClick={handleClearSlot}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1"
                                style={{
                                    backgroundColor: t.surfaceElevated,
                                    color: t.textMuted,
                                    border: `1px solid ${t.borderSubtle}`
                                }}
                                title="Clear slot into a free period"
                            >
                                <Trash2 size={12} />
                                <span>Remove class</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                                backgroundColor: t.surfaceElevated,
                                color: t.textMuted,
                                border: `1px solid ${t.border}`
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!selectedSubjectId || !validationStatus.isValid}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-all shadow-sm shadow-violet-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                            <Check size={14} />
                            <span>Save Changes</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TimetableSlotCustomizeModal;
