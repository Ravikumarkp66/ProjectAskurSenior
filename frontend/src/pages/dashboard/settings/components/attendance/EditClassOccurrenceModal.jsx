import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../../../../context/ThemeContext';

const EditClassOccurrenceModal = ({
    isOpen,
    onClose,
    classItem,
    selectedDate,
    registeredSubjects = [],
    onConfirmOverride,
    onRestoreOriginal
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
        inputBg: isDark ? '#141724' : '#FFFFFF',
        accent: '#6D28D9',
        accentLight: isDark ? '#C4B5FD' : '#6D28D9'
    };

    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [hasConfirmedAttendanceWarning, setHasConfirmedAttendanceWarning] = useState(false);

    const originalSubjectName = classItem?.scheduledSubjectName || classItem?.subjectName || 'Current Subject';
    const isLabOccurrence = String(classItem?.lectureType || '').toLowerCase() === 'lab';
    const isAttendanceMarked = classItem?.status && 
        ['PRESENT', 'ABSENT', 'ON DUTY', 'MEDICAL LEAVE'].includes(String(classItem.status).trim().toUpperCase());

    // Format date string: e.g. "Tuesday · September 15"
    const formatDateHeading = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T12:00:00');
        if (isNaN(d.getTime())) return dateStr;
        const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
        const monthDay = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        return `${weekday} · ${monthDay}`;
    };

    // Filter available subjects based on occurrence session type (Lab ↔ Lab, Theory ↔ Theory)
    const availableSubjects = (registeredSubjects || []).filter(reg => {
        const subjObj = reg.subject && typeof reg.subject === 'object' ? reg.subject : (reg.subjectId && typeof reg.subjectId === 'object' ? reg.subjectId : null);
        const catStr = String(reg.category || '').toLowerCase();
        const typeStr = String(subjObj?.type || subjObj?.lectureType || '').toLowerCase();
        const isLab = catStr.includes('lab') || typeStr.includes('lab') || (reg.weeklyPlan?.lab?.required > 0);
        return isLabOccurrence ? isLab : !isLab;
    });

    useEffect(() => {
        if (classItem) {
            setHasConfirmedAttendanceWarning(false);
            const currentSubjId = classItem.subjectId?.toString() || '';
            setSelectedSubjectId(currentSubjId);
        }
    }, [classItem, isOpen]);

    if (!isOpen || !classItem) return null;

    const isCurrentSubjectSelected = selectedSubjectId === classItem.subjectId?.toString();
    const isSubjectModifiedFromOriginal = Boolean(classItem.isSubjectChanged || (classItem.scheduledSubjectId && classItem.scheduledSubjectId !== classItem.subjectId));

    const handleSave = async () => {
        if (!selectedSubjectId) {
            toast.error('Please select a subject.');
            return;
        }

        // If attendance is marked and user hasn't acknowledged the warning step yet
        if (isAttendanceMarked && !hasConfirmedAttendanceWarning && !isCurrentSubjectSelected) {
            setHasConfirmedAttendanceWarning(true);
            return;
        }

        setIsSaving(true);
        try {
            await onConfirmOverride({
                classItem,
                scheduledSubjectId: classItem.scheduledSubjectId || classItem.subjectId,
                newSubjectId: selectedSubjectId,
                status: classItem.status === 'Yet To Be Taken' ? 'Present' : classItem.status
            });
            onClose();
        } catch (err) {
            console.error('Error overriding class subject:', err);
            toast.error('Failed to change class.');
        } finally {
            setIsSaving(false);
        }
    };

    const modalContent = (
        <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-[460px] rounded-xl shadow-2xl p-6 flex flex-col gap-5 font-sans transition-colors"
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
                                backgroundColor: isDark ? 'rgba(109, 40, 217, 0.2)' : '#EDE9FE',
                                color: isDark ? '#DDD6FE' : '#6D28D9',
                                border: `1px solid ${isDark ? 'rgba(109, 40, 217, 0.3)' : '#DDD6FE'}`
                            }}
                        >
                            <ArrowRightLeft size={16} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight" style={{ color: t.text }}>
                                Edit class
                            </h2>
                            <p className="text-xs font-mono" style={{ color: t.textMuted }}>
                                Single-day occurrence override
                            </p>
                        </div>
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

                {/* Occurrence Date & Time Anchor */}
                <div 
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-mono"
                    style={{
                        backgroundColor: t.surfaceSubtle,
                        border: `1px solid ${t.borderSubtle}`
                    }}
                >
                    <span className="font-medium" style={{ color: t.text }}>
                        {formatDateHeading(selectedDate)}
                    </span>
                    <span className="font-bold" style={{ color: t.accentLight }}>
                        {classItem.timeSlot}
                    </span>
                </div>

                {/* Warning if class already has recorded attendance */}
                {isAttendanceMarked && !isCurrentSubjectSelected && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-200">
                        <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-1 leading-relaxed">
                            <span className="font-semibold text-amber-800 dark:text-amber-300">Attendance is already recorded</span>
                            <span>
                                Changing this class will transfer the recorded <strong>{classItem.status}</strong> status to the new subject for this slot.
                            </span>
                        </div>
                    </div>
                )}

                {/* Original Subject */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                        Original class
                    </label>
                    <div 
                        className="px-3.5 py-2 rounded-lg text-xs font-mono flex items-center justify-between"
                        style={{
                            backgroundColor: t.surfaceSubtle,
                            border: `1px solid ${t.borderSubtle}`,
                            color: t.text
                        }}
                    >
                        <span>{originalSubjectName}</span>
                        <span 
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                                backgroundColor: t.surfaceElevated,
                                color: t.textMuted
                            }}
                        >
                            {isLabOccurrence ? 'Lab' : 'Theory'}
                        </span>
                    </div>
                </div>

                {/* Target Subject Selector */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono font-semibold uppercase tracking-wider" style={{ color: t.textMuted }}>
                        This class
                    </label>
                    <select
                        value={selectedSubjectId}
                        onChange={(e) => {
                            setSelectedSubjectId(e.target.value);
                            setHasConfirmedAttendanceWarning(false);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-lg text-xs font-mono focus:border-violet-500 focus:outline-none cursor-pointer"
                        style={{
                            backgroundColor: t.inputBg,
                            border: `1px solid ${t.borderSubtle}`,
                            color: t.text
                        }}
                    >
                        {availableSubjects.length === 0 ? (
                            <option value="" disabled className={isDark ? 'bg-[#141724] text-zinc-400' : 'bg-white text-slate-400'}>
                                No registered subjects found
                            </option>
                        ) : (
                            availableSubjects.map((reg) => {
                                const subjObj = reg.subject && typeof reg.subject === 'object' ? reg.subject : (reg.subjectId && typeof reg.subjectId === 'object' ? reg.subjectId : null);
                                const sId = subjObj?._id || reg.subject || reg.subjectId || reg._id;
                                const name = reg.customName || subjObj?.name || reg.name || 'Subject';
                                const code = subjObj?.code || reg.code;
                                return (
                                    <option 
                                        key={sId?.toString()} 
                                        value={sId?.toString()}
                                        className={isDark ? 'bg-[#141724] text-white' : 'bg-white text-slate-900'}
                                    >
                                        {name} {code ? `(${code})` : ''}
                                    </option>
                                );
                            })
                        )}
                    </select>
                </div>

                {/* Revert link if subject was previously modified */}
                {isSubjectModifiedFromOriginal && onRestoreOriginal && (
                    <button
                        type="button"
                        onClick={async () => {
                            await onRestoreOriginal(classItem);
                            onClose();
                        }}
                        className="self-start text-[11px] font-mono hover:underline transition-all"
                        style={{ color: t.accentLight }}
                    >
                        ↺ Revert back to original class ({originalSubjectName})
                    </button>
                )}

                {/* Scope Disclaimer */}
                <p 
                    className="text-[11px] leading-normal pt-3"
                    style={{
                        borderTop: `1px solid ${t.borderSubtle}`,
                        color: t.textMuted
                    }}
                >
                    This change affects <strong>only this class/date</strong>. It does not change your weekly timetable.
                </p>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
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
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50 shadow-sm"
                    >
                        {isSaving ? 'Saving...' : (isAttendanceMarked && !hasConfirmedAttendanceWarning && !isCurrentSubjectSelected ? 'Continue' : 'Save')}
                    </button>
                </div>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export default EditClassOccurrenceModal;
