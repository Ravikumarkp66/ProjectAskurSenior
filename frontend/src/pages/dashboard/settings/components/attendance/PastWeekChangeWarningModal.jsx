import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ShieldCheck, X, Clock, ArrowRight, History } from 'lucide-react';
import { useTheme } from '../../../../../context/ThemeContext';

const formatTime = (min) => {
    if (min === null || min === undefined) return '';
    const h = Math.floor(min / 60);
    const m = min % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
};

const PastWeekChangeWarningModal = ({
    isOpen,
    onClose,
    slot,
    oldSubjectName,
    newSubjectName,
    affectedCount = 4,
    onConfirmKeepPast,
    onConfirmApplyPast
}) => {
    const { isDark = true } = useTheme?.() || {};

    const t = {
        surface: isDark ? '#0D111C' : '#FFFFFF',
        surfaceSubtle: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
        surfaceElevated: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
        border: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
        borderSubtle: isDark ? 'rgba(255, 255, 255, 0.06)' : '#CBD5E1',
        text: isDark ? '#F1F5F9' : '#0F172A',
        textMuted: isDark ? '#94A3B8' : '#64748B',
        textFaint: isDark ? '#64748B' : '#94A3B8',
    };

    if (!isOpen || !slot) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div 
                className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors"
                style={{
                    backgroundColor: t.surface,
                    borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FCD34D',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: t.text
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div 
                    className="px-6 py-5 flex items-center justify-between"
                    style={{
                        borderBottom: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.2)' : '#FDE68A'}`,
                        backgroundColor: isDark ? 'rgba(245, 158, 11, 0.05)' : '#FFFBEB'
                    }}
                >
                    <div className="flex items-center gap-2.5" style={{ color: isDark ? '#FBBF24' : '#D97706' }}>
                        <AlertTriangle size={19} className="shrink-0" />
                        <h3 className="text-base font-bold tracking-tight" style={{ color: t.text }}>
                            Apply to previous weeks?
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg transition-all"
                        style={{ color: t.textMuted }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.surfaceElevated; e.currentTarget.style.color = t.text; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textMuted; }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-6 space-y-4">
                    {/* Slot change diff card */}
                    <div 
                        className="p-3.5 rounded-xl space-y-2"
                        style={{
                            backgroundColor: t.surfaceSubtle,
                            border: `1px solid ${t.borderSubtle}`
                        }}
                    >
                        <div className="text-[11px] font-mono flex items-center gap-1.5" style={{ color: t.textMuted }}>
                            <Clock size={12} />
                            <span>{formatTime(slot.startMinute)} – {formatTime(slot.endMinute)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold">
                            <span className="line-through opacity-70" style={{ color: t.textMuted }}>{oldSubjectName || 'Current Subject'}</span>
                            <ArrowRight size={14} style={{ color: isDark ? '#FBBF24' : '#D97706' }} />
                            <span className="font-bold" style={{ color: t.text }}>{newSubjectName || 'New Subject'}</span>
                        </div>
                    </div>

                    {/* Explanatory text */}
                    <p className="text-xs leading-relaxed" style={{ color: t.textMuted }}>
                        Applying this change to previous weeks can affect how historical attendance records are associated with your timetable.
                    </p>

                    {/* Affected occurrences pill */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-200">
                        <History size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold block text-amber-800 dark:text-amber-100">Historical Impact Notice</span>
                            <span className="text-[11.5px] leading-snug block mt-0.5" style={{ color: isDark ? '#FDE68A' : '#92400E' }}>
                                This change affects ~{affectedCount} previous class occurrences already recorded in your semester history.
                            </span>
                        </div>
                    </div>

                    <p className="text-[11px] leading-relaxed italic" style={{ color: t.textFaint }}>
                        Recommended: Keep past weeks unchanged so previous attendance logs preserve their original class identity.
                    </p>
                </div>

                {/* Actions */}
                <div 
                    className="p-4 flex flex-col sm:flex-row items-center justify-end gap-2.5"
                    style={{
                        borderTop: `1px solid ${t.border}`,
                        backgroundColor: t.surfaceSubtle
                    }}
                >
                    <button
                        type="button"
                        onClick={onConfirmKeepPast}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition-all shadow-md shadow-violet-600/25 flex items-center justify-center gap-1.5"
                    >
                        <ShieldCheck size={15} />
                        <span>Keep past unchanged</span>
                    </button>
                    <button
                        type="button"
                        onClick={onConfirmApplyPast}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center"
                        style={{
                            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7',
                            color: isDark ? '#FCD34D' : '#92400E',
                            border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'}`
                        }}
                    >
                        Apply to past weeks
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PastWeekChangeWarningModal;
