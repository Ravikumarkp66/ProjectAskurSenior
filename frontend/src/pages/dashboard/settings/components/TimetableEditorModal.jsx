import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, MapPin, User, Info, Trash2, FlaskConical } from 'lucide-react';

const TimetableEditorModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    onClear, 
    slot, 
    registeredSubjects = [], 
    slots = [], 
    isLabDisabled 
}) => {
    
    const [subject, setSubject] = useState('');
    const [room, setRoom] = useState('');
    const [faculty, setFaculty] = useState('');
    const [lectureType, setLectureType] = useState('Lecture');

    // Populate when slot changes
    useEffect(() => {
        if (slot) {
            setSubject(slot.subject?._id || slot.subject || '');
            setRoom(slot.room || '');
            setFaculty(slot.faculty || '');
            
            const type = slot.lectureType || 'Lecture';
            const cleanType = type === 'Break' ? 'Lecture' : type;
            setLectureType(cleanType);
        }
    }, [slot]);

    // Compute dynamically filtered option lists with workload metrics
    const visibleOptions = useMemo(() => {
        if (!slot) return [];

        return registeredSubjects.map(reg => {
            const subjId = (reg.subject?._id || reg.subject || '').toString();
            const name = reg.customName || reg.subject?.name || 'Unknown';
            const code = reg.customCode || reg.subject?.code || '';

            // Count Theory slots assigned to this subject (excluding the current slot and its linked lab block slot)
            const theorySlotsCount = slots.filter(s => {
                const isSameSlot = s.dayOfWeek === slot.dayOfWeek && s.startMinute === slot.startMinute;
                const isLinkedLabSlot = slot.sessionGroupId && s.sessionGroupId === slot.sessionGroupId;
                if (isSameSlot || isLinkedLabSlot) return false;

                const slotSubjId = (s.subject?._id || s.subject || '').toString();
                return slotSubjId === subjId && s.lectureType !== 'Lab' && s.lectureType !== 'Break';
            }).length;

            // Count Lab slots assigned to this subject (excluding the current slot and its linked lab block slot)
            const labSlotsCount = slots.filter(s => {
                const isSameSlot = s.dayOfWeek === slot.dayOfWeek && s.startMinute === slot.startMinute;
                const isLinkedLabSlot = slot.sessionGroupId && s.sessionGroupId === slot.sessionGroupId;
                if (isSameSlot || isLinkedLabSlot) return false;

                const slotSubjId = (s.subject?._id || s.subject || '').toString();
                return slotSubjId === subjId && s.lectureType === 'Lab';
            }).length;

            const labSessionsCount = Math.floor(labSlotsCount / 2);

            const isCurrentSubj = (slot.subject?._id || slot.subject || '').toString() === subjId;

            return {
                _id: subjId,
                name,
                code,
                category: reg.category,
                theoryRequired: reg.weeklyPlan?.theory?.required ?? 0,
                theoryAssigned: theorySlotsCount,
                labRequired: reg.weeklyPlan?.lab?.required ?? 0,
                labAssigned: labSessionsCount,
                isCurrentSubj
            };
        }).filter(opt => {
            if (lectureType === 'Lab') {
                if (opt.labRequired <= 0) return false;
                if (opt.isCurrentSubj && slot.lectureType === 'Lab') return true;
                return opt.labAssigned < opt.labRequired;
            } else {
                if (opt.theoryRequired <= 0) return false;
                if (opt.isCurrentSubj && slot.lectureType !== 'Lab') return true;
                return opt.theoryAssigned < opt.theoryRequired;
            }
        });
    }, [registeredSubjects, slots, slot, lectureType]);

    if (!isOpen || !slot) return null;

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        onSave({
            subject,
            room: room.trim(),
            faculty: faculty.trim(),
            lectureType
        });
    };

    const daysNameMap = {
        1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday'
    };

    // Format minutes to AM/PM string helper
    const formatTime = (mins) => {
        if (mins === undefined || mins === null) return '';
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const handleClearTrigger = () => {
        onClear();
        onClose();
    };

    const modalContent = (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box'
        }} onClick={onClose}>
            
            <div style={{
                background: '#13111A',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '420px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
                animation: 'modalFadeIn 0.2s ease-out',
                boxSizing: 'border-box'
            }} onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
                            {slot.subject ? 'Edit Class Slot' : 'Add Class Details'}
                        </h3>
                        <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)', fontWeight: 500 }}>
                            {daysNameMap[slot.dayOfWeek]} • {formatTime(slot.startMinute)} – {formatTime(slot.endMinute)}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                    
                    {/* Session Type Segmented Toggle Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                            Session Type
                        </label>
                        <div style={{
                            display: 'flex',
                            gap: '6px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '8px',
                            padding: '4px',
                            boxSizing: 'border-box',
                            width: '100%'
                        }}>
                            <button
                                type="button"
                                onClick={() => { setLectureType('Lecture'); setSubject(''); }}
                                style={{
                                    flex: 1,
                                    outline: 'none',
                                    borderRadius: '6px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    background: lectureType !== 'Lab' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                                    color: lectureType !== 'Lab' ? '#c4b5fd' : 'rgba(148, 163, 184, 0.6)',
                                    border: lectureType !== 'Lab' ? '1px solid rgba(167, 139, 250, 0.3)' : '1px solid transparent',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <BookOpen size={14} />
                                Theory Class
                            </button>
                            <button
                                type="button"
                                disabled={isLabDisabled}
                                onClick={() => { setLectureType('Lab'); setSubject(''); }}
                                style={{
                                    flex: 1,
                                    outline: 'none',
                                    borderRadius: '6px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: isLabDisabled ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    background: lectureType === 'Lab' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                    color: lectureType === 'Lab' ? '#818cf8' : 'rgba(148, 163, 184, 0.6)',
                                    border: lectureType === 'Lab' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                                    opacity: isLabDisabled ? 0.45 : 1,
                                    transition: 'all 0.15s'
                                }}
                            >
                                <FlaskConical size={14} />
                                Laboratory
                            </button>
                        </div>

                        {/* Lab lock warning */}
                        {isLabDisabled && (
                            <div style={{ display: 'flex', alignItems: 'start', gap: '6px', color: '#fbbf24', fontSize: '11px', lineHeight: '1.3', marginTop: '2px' }}>
                                <Info size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
                                <span>Lab requires a consecutive class period. Selection is disabled for final period before breaks, closing, or Half Day schedules.</span>
                            </div>
                        )}
                    </div>

                    {/* Subject */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <BookOpen size={13} style={{ color: '#a78bfa' }} />
                            Subject
                        </label>
                        <select
                            required
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: '#13111A',
                                color: '#fff',
                                fontSize: '13px',
                                outline: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="">-- Select Subject --</option>
                            {visibleOptions.map(opt => {
                                const remaining = lectureType === 'Lab' 
                                    ? opt.labRequired - opt.labAssigned 
                                    : opt.theoryRequired - opt.theoryAssigned;
                                    
                                return (
                                    <option key={opt._id} value={opt._id}>
                                        {opt.name} ({opt.code}) [{lectureType === 'Lab' ? 'Lab' : 'Theory'}: {remaining}/{lectureType === 'Lab' ? opt.labRequired : opt.theoryRequired} left]
                                    </option>
                                );
                            })}
                        </select>
                        {visibleOptions.length === 0 && (
                            <span style={{ fontSize: '11px', color: '#ef4444' }}>
                                No remaining subject plans found for this session type.
                            </span>
                        )}
                    </div>

                    {/* Room */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={13} style={{ color: '#a78bfa' }} />
                            {lectureType === 'Lab' ? 'Lab Name / Classroom (Optional)' : 'Classroom (Optional)'}
                        </label>
                        <input
                            type="text"
                            placeholder={lectureType === 'Lab' ? 'e.g. Network Lab / LHC-302' : 'e.g. LHC-204'}
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: 'rgba(255,255,255,0.02)',
                                color: '#fff',
                                fontSize: '13px',
                                outline: 'none',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Faculty */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <User size={13} style={{ color: '#a78bfa' }} />
                            Faculty Name (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Dr. Ramesh Kumar"
                            value={faculty}
                            onChange={(e) => setFaculty(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: 'rgba(255,255,255,0.02)',
                                color: '#fff',
                                fontSize: '13px',
                                outline: 'none',
                                width: '100%',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        {slot.subject && (
                            <button
                                type="button"
                                onClick={handleClearTrigger}
                                style={{
                                    flex: 1,
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    color: '#f87171',
                                    borderRadius: '6px',
                                    padding: '8px 16px',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Trash2 size={14} />
                                Clear Slot
                            </button>
                        )}
                        <button
                            type="submit"
                            style={{
                                flex: 2,
                                border: 'none',
                                outline: 'none',
                                background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                color: '#fff',
                                borderRadius: '6px',
                                padding: '8px 16px',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textAlign: 'center'
                            }}
                        >
                            {slot.subject ? 'Save Changes' : 'Allot Slot'}
                        </button>
                    </div>
                </form>

            </div>

            {/* Modal Animations */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}} />
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default TimetableEditorModal;
