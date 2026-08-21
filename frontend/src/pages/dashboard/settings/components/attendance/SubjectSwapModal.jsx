import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SubjectSwapModal = ({
    isOpen,
    onClose,
    classItem,
    registeredSubjects = [],
    onSwapConfirmed
}) => {
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
            console.error('Error swapping subject:', err);
            toast.error('Failed to change subject. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: 'linear-gradient(145deg, #181524 0%, #120F1D 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '460px',
                padding: '24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'rgba(124, 58, 237, 0.15)',
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#c4b5fd'
                        }}>
                            <ArrowRightLeft size={18} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                                Change Class Subject
                            </h3>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                Single-occurrence swap for {classItem.timeSlot} ({currentLectureType})
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Information Callout */}
                <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontSize: '12px',
                    color: '#93c5fd',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                }}>
                    <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                        Swapping is restricted to matching session types ({isLabOccurrence ? 'Lab ↔ Lab' : 'Theory ↔ Theory'}). Your recurring timetable remains unchanged.
                    </div>
                </div>

                {/* Scheduled Subject Info */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>
                        Originally Scheduled Subject
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
                        {currentScheduledSubjectName} ({currentLectureType})
                    </span>
                </div>

                {/* Target Subject Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
                        Actual Subject Taught ({isLabOccurrence ? 'Lab Sessions Only' : 'Theory Sessions Only'})
                    </label>
                    <select
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        style={{
                            width: '100%',
                            background: '#0f0d18',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {availableSwapSubjects.length === 0 ? (
                            <option value="" disabled>No matching registered {isLabOccurrence ? 'Lab' : 'Theory'} subjects found</option>
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
                                    <option key={sId?.toString()} value={sId?.toString()}>
                                        {name}{codeStr}{categoryStr}
                                    </option>
                                );
                            })
                        )}
                    </select>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            padding: '10px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#94a3b8',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmSwap}
                        disabled={isSaving}
                        style={{
                            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '10px 20px',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: isSaving ? 0.7 : 1
                        }}
                    >
                        <Check size={16} />
                        {isSaving ? 'Saving...' : 'Apply Subject Change'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubjectSwapModal;
