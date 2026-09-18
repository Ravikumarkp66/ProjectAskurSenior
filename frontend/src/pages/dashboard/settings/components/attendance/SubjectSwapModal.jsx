import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../../../../context/ThemeContext';

const SubjectSwapModal = ({
    isOpen,
    onClose,
    classItem,
    registeredSubjects = [],
    onSwapConfirmed
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

    const currentScheduledSubjectName = classItem?.scheduledSubjectName || classItem?.subjectName || '';
    const currentLectureType = classItem?.lectureType || 'Theory';
    const isLabOccurrence = currentLectureType === 'Lab';

    // Helper: Check if a registered subject has a Lab component
    const hasLabComponent = (reg) => {
        const subjObj = reg.subject && typeof reg.subject === 'object' ? reg.subject : (reg.subjectId && typeof reg.subjectId === 'object' ? reg.subjectId : null);
        const nameStr = reg.customName || subjObj?.name || reg.name || '';
        const catStr = String(reg.category || '').toLowerCase();
        const typeStr = String(subjObj?.type || subjObj?.lectureType || '').toLowerCase();
        const labReq = reg.weeklyPlan?.lab?.required || 0;

        return (
            catStr.includes('lab') ||
            typeStr.includes('lab') ||
            labReq > 0 ||
            /lab|\(l\)/i.test(nameStr)
        );
    };

    // Helper: Check if a registered subject has a Theory component
    const hasTheoryComponent = (reg) => {
        const subjObj = reg.subject && typeof reg.subject === 'object' ? reg.subject : (reg.subjectId && typeof reg.subjectId === 'object' ? reg.subjectId : null);
        const nameStr = reg.customName || subjObj?.name || reg.name || '';
        const catStr = String(reg.category || '').toLowerCase();
        const typeStr = String(subjObj?.type || subjObj?.lectureType || '').toLowerCase();
        const theoryReq = reg.weeklyPlan?.theory?.required || 0;

        if (catStr === 'lab only' || (catStr.includes('lab') && !catStr.includes('theory') && !catStr.includes('+'))) {
            return false;
        }

        return (
            catStr.includes('theory') ||
            catStr.includes('elective') ||
            catStr.includes('project') ||
            catStr.includes('seminar') ||
            typeStr.includes('theory') ||
            theoryReq > 0 ||
            !/lab only/i.test(catStr)
        );
    };

    // Filter available subjects based on occurrence session type
    const availableSwapSubjects = (registeredSubjects || []).filter(reg => {
        return isLabOccurrence ? hasLabComponent(reg) : hasTheoryComponent(reg);
    });

    useEffect(() => {
        if (classItem && availableSwapSubjects.length > 0) {
            const matchingCurrent = availableSwapSubjects.find(s => {
                const sId = s.subject?._id || s.subjectId?._id || s.subject || s.subjectId || s._id;
                return sId?.toString() === classItem.subjectId?.toString();
            });
            if (matchingCurrent) {
                setSelectedSubjectId(classItem.subjectId?.toString() || '');
            } else {
                const firstSubj = availableSwapSubjects[0];
                const firstId = firstSubj.subject?._id || firstSubj.subjectId?._id || firstSubj.subject || firstSubj.subjectId || firstSubj._id;
                setSelectedSubjectId(firstId?.toString() || '');
            }
        }
    }, [classItem, registeredSubjects]);

    if (!isOpen || !classItem) return null;

    const handleConfirmSwap = async () => {
        if (!selectedSubjectId) {
            toast.error('Please select a target subject.');
            return;
        }

        if (selectedSubjectId === classItem.subjectId?.toString() && !classItem.isSubjectChanged) {
            onClose();
            return;
        }

        setIsSaving(true);
        try {
            const chosenSubject = availableSwapSubjects.find(s => {
                const sId = s.subject?._id || s.subjectId?._id || s.subject || s.subjectId || s._id;
                return sId?.toString() === selectedSubjectId;
            });

            const newSubjectId = chosenSubject?.subject?._id || chosenSubject?.subjectId?._id || chosenSubject?.subject || chosenSubject?.subjectId || selectedSubjectId;

            await onSwapConfirmed({
                classItem,
                scheduledSubjectId: classItem.scheduledSubjectId || classItem.subjectId,
                newSubjectId,
                status: classItem.status === 'Yet To Be Taken' ? 'Present' : classItem.status
            });
            onClose();
        } catch (err) {
            console.error('Error in handleConfirmSwap:', err);
            toast.error('Failed to change subject. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-[460px] rounded-2xl shadow-2xl p-6 flex flex-col gap-5 font-sans transition-colors"
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
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{
                                backgroundColor: isDark ? 'rgba(109, 40, 217, 0.2)' : '#EDE9FE',
                                color: isDark ? '#DDD6FE' : '#6D28D9',
                                border: `1px solid ${isDark ? 'rgba(109, 40, 217, 0.3)' : '#DDD6FE'}`
                            }}
                        >
                            <ArrowRightLeft size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold leading-tight" style={{ color: t.text }}>
                                Change Class Subject
                            </h3>
                            <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                                Single-occurrence swap for {classItem.timeSlot} ({currentLectureType})
                            </div>
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
                        <X size={18} />
                    </button>
                </div>

                {/* Information Callout */}
                <div 
                    className="p-3 rounded-xl text-xs flex items-start gap-2.5"
                    style={{
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#EFF6FF',
                        border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : '#BFDBFE'}`,
                        color: isDark ? '#93C5FD' : '#1E40AF'
                    }}
                >
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <div>
                        Swapping is restricted to matching session types ({isLabOccurrence ? 'Lab ↔ Lab' : 'Theory ↔ Theory'}). Your recurring timetable remains unchanged.
                    </div>
                </div>

                {/* Scheduled Subject Info */}
                <div 
                    className="p-3.5 rounded-xl flex flex-col gap-1"
                    style={{
                        backgroundColor: t.surfaceSubtle,
                        border: `1px solid ${t.borderSubtle}`
                    }}
                >
                    <span className="text-[10.5px] uppercase font-mono tracking-wider font-semibold" style={{ color: t.textMuted }}>
                        Originally Scheduled Subject
                    </span>
                    <span className="text-sm font-semibold" style={{ color: t.text }}>
                        {currentScheduledSubjectName} ({currentLectureType})
                    </span>
                </div>

                {/* Target Subject Selector */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold" style={{ color: t.text }}>
                        Actual Subject Taught ({isLabOccurrence ? 'Lab Sessions Only' : 'Theory Sessions Only'})
                    </label>
                    <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono focus:border-violet-500 focus:outline-none cursor-pointer"
                        style={{
                            backgroundColor: t.inputBg,
                            border: `1px solid ${t.borderSubtle}`,
                            color: t.text
                        }}
                    >
                        {availableSwapSubjects.length === 0 ? (
                            <option value="" disabled className={isDark ? 'bg-[#141724] text-zinc-400' : 'bg-white text-slate-400'}>
                                No matching registered {isLabOccurrence ? 'Lab' : 'Theory'} subjects found
                            </option>
                        ) : (
                            availableSwapSubjects.map((reg) => {
                                const subjObj = reg.subject && typeof reg.subject === 'object' ? reg.subject : (reg.subjectId && typeof reg.subjectId === 'object' ? reg.subjectId : null);
                                const sId = subjObj?._id || reg.subject || reg.subjectId || reg._id;
                                let name = reg.customName || subjObj?.name || reg.name || 'Subject';
                                if (isLabOccurrence && !/lab|\(l\)/i.test(name)) {
                                    name += ' (Lab)';
                                }
                                const codeStr = subjObj?.code || reg.code ? ` (${subjObj?.code || reg.code})` : '';
                                const categoryStr = isLabOccurrence ? ' [Lab]' : ' [Theory]';
                                return (
                                    <option 
                                        key={sId?.toString()} 
                                        value={sId?.toString()}
                                        className={isDark ? 'bg-[#141724] text-white' : 'bg-white text-slate-900'}
                                    >
                                        {name}{codeStr}{categoryStr}
                                    </option>
                                );
                            })
                        )}
                    </select>
                </div>

                {/* Actions */}
                <div 
                    className="flex items-center justify-end gap-2.5 pt-2"
                    style={{ borderTop: `1px solid ${t.borderSubtle}` }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-xs font-medium rounded-xl transition-all"
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
                        onClick={handleConfirmSwap}
                        disabled={isSaving}
                        className="px-5 py-2 text-xs font-semibold rounded-xl text-white bg-violet-600 hover:bg-violet-500 transition-all flex items-center gap-1.5 shadow-sm shadow-violet-600/30 disabled:opacity-50"
                    >
                        <Check size={16} />
                        <span>{isSaving ? 'Saving...' : 'Apply Subject Change'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubjectSwapModal;
