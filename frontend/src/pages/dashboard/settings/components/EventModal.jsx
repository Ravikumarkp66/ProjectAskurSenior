import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BookOpen, AlertCircle } from 'lucide-react';
import { apiV2 } from '../../../../services/authService';

function timeStringToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':');
    return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function minutesToTimeString(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

const EventModal = ({ isOpen, onClose, onSave, event = null, initialDate = null }) => {
    const [title, setTitle] = useState('');
    const [eventType, setEventType] = useState('Custom');
    const [scope, setScope] = useState('personal');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isAllDay, setIsAllDay] = useState(true);
    const [classesSuspended, setClassesSuspended] = useState(false);
    const [suspensionType, setSuspensionType] = useState('none');
    const [startTime, setStartTime] = useState('10:30');
    const [endTime, setEndTime] = useState('12:30');
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [description, setDescription] = useState('');
    const [repeat, setRepeat] = useState('none');

    const [subjectsList, setSubjectsList] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSubjects();
            if (event) {
                setTitle(event.title || '');
                setEventType(event.eventType || 'Custom');
                setScope(event.scope || 'personal');
                setStartDate(event.startDate ? event.startDate.substring(0, 10) : '');
                setEndDate(event.endDate ? event.endDate.substring(0, 10) : '');
                setIsAllDay(event.isAllDay ?? true);
                setClassesSuspended(event.classesSuspended ?? false);
                setSuspensionType(event.suspensionType || 'none');
                setStartTime(event.suspensionStartMinute ? minutesToTimeString(event.suspensionStartMinute) : '10:30');
                setEndTime(event.suspensionEndMinute ? minutesToTimeString(event.suspensionEndMinute) : '12:30');
                setSelectedSubjects(event.affectedSubjects || []);
                setDescription(event.description || '');
                setRepeat(event.repeat || 'none');
            } else {
                setTitle('');
                setEventType('Custom');
                setScope('personal');
                const defaultDate = initialDate || new Date().toISOString().substring(0, 10);
                setStartDate(defaultDate);
                setEndDate(defaultDate);
                setIsAllDay(true);
                setClassesSuspended(false);
                setSuspensionType('none');
                setStartTime('10:30');
                setEndTime('12:30');
                setSelectedSubjects([]);
                setDescription('');
                setRepeat('none');
            }
        }
    }, [isOpen, event, initialDate]);

    const fetchSubjects = async () => {
        try {
            setLoadingSubjects(true);
            const res = await apiV2.getRegisteredSubjects();
            if (res.data?.success) {
                setSubjectsList(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching subjects for event modal:', err);
        } finally {
            setLoadingSubjects(false);
        }
    };

    const handleEventTypeChange = (type) => {
        setEventType(type);
        if (type === 'Government Holiday') {
            setClassesSuspended(true);
            setSuspensionType('full_day');
            setScope('college');
        } else if (type === 'Exam') {
            setClassesSuspended(true);
            setSuspensionType('full_day');
            setScope('personal');
        }
    };

    const handleSuspendedChange = (suspended) => {
        setClassesSuspended(suspended);
        if (suspended) {
            setSuspensionType(suspensionType === 'none' ? 'full_day' : suspensionType);
        } else {
            setSuspensionType('none');
        }
    };

    const toggleSubject = (subjectId) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !startDate || !endDate) return;

        const payload = {
            title: title.trim(),
            eventType,
            scope,
            startDate,
            endDate,
            isAllDay,
            classesSuspended,
            suspensionType: classesSuspended ? suspensionType : 'none',
            suspensionStartMinute: classesSuspended && suspensionType === 'time_range' ? timeStringToMinutes(startTime) : 0,
            suspensionEndMinute: classesSuspended && suspensionType === 'time_range' ? timeStringToMinutes(endTime) : 0,
            affectedSubjects: selectedSubjects,
            description: description.trim(),
            repeat
        };

        onSave(payload);
    };

    if (!isOpen) return null;

    const eventColors = {
        'Exam': { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
        'Government Holiday': { text: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.2)' },
        'College Fest': { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
        'Custom': { text: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)' }
    };

    const activeColor = eventColors[eventType] || eventColors['Custom'];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        }}>
            <form onSubmit={handleSubmit} style={{
                background: '#0D0B14',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '480px',
                maxHeight: '90vh',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: activeColor.text
                        }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
                            {event ? 'Edit Academic Event' : 'Create Academic Event'}
                        </h3>
                    </div>
                    <button type="button" onClick={onClose} style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer'
                    }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Event Type */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)' }}>Event Type</label>
                        <select
                            value={eventType}
                            onChange={(e) => handleEventTypeChange(e.target.value)}
                            style={{
                                background: '#161420',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: '#fff',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        >
                            <option value="Exam">Examination / CIE / SEE</option>
                            <option value="Government Holiday">Government Holiday</option>
                            <option value="College Fest">College Fest / Workshop / Farewell</option>
                            <option value="Custom">Custom Event</option>
                        </select>
                    </div>

                    {/* Title */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)' }}>Title</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. CIE 1 Mathematics, Independence Day"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                background: '#161420',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: '#fff',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Scope & Recurrence */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)' }}>Scope</label>
                            <select
                                value={scope}
                                onChange={(e) => setScope(e.target.value)}
                                style={{
                                    background: '#161420',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    outline: 'none'
                                }}
                            >
                                <option value="personal">Only Me (Personal)</option>
                                <option value="college">Whole College</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)' }}>Recurrence</label>
                            <select
                                value={repeat}
                                onChange={(e) => setRepeat(e.target.value)}
                                style={{
                                    background: '#161420',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    outline: 'none'
                                }}
                            >
                                <option value="none">Does not repeat</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        </div>
                    </div>

                    {/* Start & End Dates */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)' }}>Start Date</label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    if (!endDate || endDate < e.target.value) {
                                        setEndDate(e.target.value);
                                    }
                                }}
                                style={{
                                    background: '#161420',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)' }}>End Date</label>
                            <input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{
                                    background: '#161420',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Classes Suspended Toggle */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Classes Suspended?</span>
                            <div style={{ display: 'flex', gap: '4px', background: '#161420', padding: '2px', borderRadius: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => handleSuspendedChange(true)}
                                    style={{
                                        border: 'none',
                                        background: classesSuspended ? 'rgba(255,255,255,0.08)' : 'transparent',
                                        color: classesSuspended ? '#fff' : 'rgba(255,255,255,0.4)',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSuspendedChange(false)}
                                    style={{
                                        border: 'none',
                                        background: !classesSuspended ? 'rgba(255,255,255,0.08)' : 'transparent',
                                        color: !classesSuspended ? '#fff' : 'rgba(255,255,255,0.4)',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '4px 10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    No
                                </button>
                            </div>
                        </div>

                        {classesSuspended && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                {/* Suspension Type */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Suspension Type</label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#fff' }}>
                                            <input
                                                type="radio"
                                                name="suspensionType"
                                                value="full_day"
                                                checked={suspensionType === 'full_day'}
                                                onChange={(e) => setSuspensionType(e.target.value)}
                                            />
                                            Entire Day
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#fff' }}>
                                            <input
                                                type="radio"
                                                name="suspensionType"
                                                value="time_range"
                                                checked={suspensionType === 'time_range'}
                                                onChange={(e) => setSuspensionType(e.target.value)}
                                            />
                                            Specific Time Range
                                        </label>
                                    </div>
                                </div>

                                {/* Time Inputs (for Time Range) */}
                                {suspensionType === 'time_range' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>From</span>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                style={{
                                                    background: '#161420',
                                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                                    borderRadius: '6px',
                                                    padding: '6px 10px',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>To</span>
                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                style={{
                                                    background: '#161420',
                                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                                    borderRadius: '6px',
                                                    padding: '6px 10px',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Affected Subjects */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.4)' }}>
                                        Affected Subjects <span style={{ fontSize: '10px', fontWeight: 'normal', color: 'rgba(255,255,255,0.3)' }}>(Optional - leave empty for all)</span>
                                    </label>
                                    <div style={{
                                        maxHeight: '100px',
                                        overflowY: 'auto',
                                        background: '#161420',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '8px',
                                        padding: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }}>
                                        {loadingSubjects ? (
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Loading subjects...</span>
                                        ) : subjectsList.length === 0 ? (
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>No registered subjects found</span>
                                        ) : (
                                            subjectsList.map(s => {
                                                const sId = s.subject?._id || s.subject;
                                                const isChecked = selectedSubjects.includes(sId);
                                                return (
                                                    <label key={sId} style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        fontSize: '12px',
                                                        color: '#fff',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        borderRadius: '4px',
                                                        background: isChecked ? 'rgba(255,255,255,0.02)' : 'transparent'
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleSubject(sId)}
                                                        />
                                                        <span>{s.customName || s.subject?.name || 'Unknown Subject'}</span>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)' }}>Description</label>
                        <textarea
                            placeholder="Add details, room location, notes..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            style={{
                                background: '#161420',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                color: '#fff',
                                fontSize: '13px',
                                outline: 'none',
                                resize: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600,
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        style={{
                            background: activeColor.text,
                            border: 'none',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Save Event
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EventModal;
