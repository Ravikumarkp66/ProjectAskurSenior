import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, PauseCircle, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../../../../context/ThemeContext';

const SuspendClassModal = ({
    isOpen,
    onClose,
    classItem,
    selectedDate,
    onConfirmSuspend
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

    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !classItem) return null;

    const subjectName = classItem?.subjectName || classItem?.subject?.name || 'Scheduled Class';
    const isAttendanceMarked = classItem?.status && 
        ['PRESENT', 'ABSENT', 'ON DUTY', 'MEDICAL LEAVE'].includes(String(classItem.status).trim().toUpperCase());

    const formatDateHeading = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T12:00:00');
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    };

    const handleSuspend = async () => {
        setIsSubmitting(true);
        try {
            await onConfirmSuspend(classItem);
            onClose();
        } catch (err) {
            console.error('Error suspending class:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalContent = (
        <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-[420px] rounded-xl shadow-2xl p-6 flex flex-col gap-4 font-sans transition-colors"
                style={{
                    backgroundColor: t.surface,
                    borderColor: t.border,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: t.text
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div 
                    className="flex items-center justify-between pb-3"
                    style={{ borderBottom: `1px solid ${t.borderSubtle}` }}
                >
                    <div className="flex items-center gap-2.5">
                        <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
                                color: isDark ? '#FCD34D' : '#D97706',
                                border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'}`
                            }}
                        >
                            <PauseCircle size={17} />
                        </div>
                        <h2 className="text-base font-bold leading-tight" style={{ color: t.text }}>
                            Suspend this class?
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded transition-colors"
                        style={{ color: t.textMuted }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.surfaceElevated; e.currentTarget.style.color = t.text; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = t.textMuted; }}
                    >
                        <X size={17} />
                    </button>
                </div>

                {/* Class Details summary */}
                <div 
                    className="p-3 rounded-lg flex flex-col gap-1"
                    style={{
                        backgroundColor: t.surfaceSubtle,
                        border: `1px solid ${t.borderSubtle}`
                    }}
                >
                    <span className="text-sm font-semibold" style={{ color: t.text }}>
                        {subjectName}
                    </span>
                    <span className="text-xs font-mono" style={{ color: t.textMuted }}>
                        {classItem.timeSlot} · {formatDateHeading(selectedDate)}
                    </span>
                </div>

                {/* Attendance already recorded warning */}
                {isAttendanceMarked ? (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-200">
                        <AlertTriangle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1 leading-relaxed">
                            <span className="font-semibold text-rose-800 dark:text-rose-300">Attendance already recorded</span>
                            <span>
                                Attendance is currently recorded as <strong>{classItem.status}</strong>. Suspending it will remove this class from attendance calculations.
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs leading-relaxed" style={{ color: t.textMuted }}>
                        This class will not be treated as a conducted class in your attendance record.
                    </p>
                )}

                {/* Actions */}
                <div 
                    className="flex items-center justify-end gap-2 pt-2"
                    style={{ borderTop: `1px solid ${t.borderSubtle}` }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-mono font-medium rounded-lg transition-all"
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
                        onClick={handleSuspend}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-mono font-semibold rounded-lg transition-all disabled:opacity-50"
                        style={{
                            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
                            color: isDark ? '#FCD34D' : '#B45309',
                            border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A'}`
                        }}
                    >
                        {isSubmitting ? 'Suspending...' : 'Suspend'}
                    </button>
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default SuspendClassModal;
