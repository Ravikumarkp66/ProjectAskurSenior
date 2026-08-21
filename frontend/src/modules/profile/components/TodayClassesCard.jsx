import React, { useState, useEffect } from 'react';
import { CalendarDays, ArrowRight, Clock, MapPin, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiV2 } from '../../../services/authService';

function getOffsetDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

const TimetableEmptyState = ({ label, message }) => (
    <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        border: '1px dashed rgba(52, 211, 153, 0.15)',
        borderRadius: '8px',
        background: 'rgba(52, 211, 153, 0.02)'
    }}>
        <CalendarDays size={22} color="rgba(52, 211, 153, 0.35)" />
        <p style={{
            margin: 0,
            fontSize: '12px',
            fontWeight: 600,
            color: 'rgba(148, 163, 184, 0.5)',
            textAlign: 'center'
        }}>
            {message || `No classes scheduled for ${label}`}
        </p>
    </div>
);

const TodayClassesCard = ({ selectedDate, setSelectedDate }) => {
    const navigate = useNavigate();
    const cacheKeyClasses = `aus_classes_${getOffsetDateString(selectedDate || new Date())}`;
    const cacheKeyConfig = 'aus_timetable_config';

    const [slots, setSlots] = useState(() => {
        try {
            const raw = sessionStorage.getItem(cacheKeyClasses);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    });

    const [loading, setLoading] = useState(() => slots.length === 0);
    const [editingSlots, setEditingSlots] = useState({});
    const [timetableConfig, setTimetableConfig] = useState(() => {
        try {
            const raw = sessionStorage.getItem(cacheKeyConfig);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    });

    // Keep track of the current time in minutes since midnight
    const [currentMinutes, setCurrentMinutes] = useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
        }, 15000); // check every 15s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await apiV2.getTimetableConfig();
                if (res.data?.success && res.data.data) {
                    setTimetableConfig(res.data.data);
                    try {
                        sessionStorage.setItem(cacheKeyConfig, JSON.stringify(res.data.data));
                    } catch (e) {}
                }
            } catch (err) {
                console.error('[TodayClassesCard] Error fetching config:', err);
            }
        };
        fetchConfig();
    }, []);

    const fetchTodayAttendance = async () => {
        try {
            const targetDate = selectedDate || new Date();
            const targetDateStr = getOffsetDateString(targetDate);
            const res = await apiV2.getAttendanceToday(targetDateStr);
            if (res.data?.success) {
                const newSlots = res.data.data || [];
                setSlots(newSlots);
                try {
                    sessionStorage.setItem(cacheKeyClasses, JSON.stringify(newSlots));
                } catch (e) {}
            }
        } catch (err) {
            console.error('[TodayClassesCard] Error fetching today attendance:', err);
        }
    };

    useEffect(() => {
        const initFetch = async () => {
            if (slots.length === 0) setLoading(true);
            await fetchTodayAttendance();
            setLoading(false);
        };
        initFetch();
    }, [selectedDate]);

    useEffect(() => {
        const handleUpdate = () => {
            fetchTodayAttendance();
        };
        window.addEventListener('attendance-updated', handleUpdate);
        return () => window.removeEventListener('attendance-updated', handleUpdate);
    }, [selectedDate]);

    // Optimistic UI Mutation for instant click interaction (< 10ms)
    const markAttendance = async (slot, status) => {
        const prevSlots = [...slots];
        // 1. Instantly update UI locally
        setSlots(prev => prev.map(s => s._id === slot._id ? { ...s, status } : s));
        setEditingSlots(prev => ({ ...prev, [slot._id]: false }));

        try {
            const targetDate = selectedDate || new Date();
            const dateStr = getOffsetDateString(targetDate);

            const subSlotsList = (slot.subSlots || []).map(s => s.timeSlot);
            await apiV2.updateAttendanceHistoryV2({
                subjectId: slot.subjectId,
                date: dateStr,
                timeSlot: slot.timeSlot,
                constituentSlots: subSlotsList.length > 0 ? subSlotsList : [slot.timeSlot],
                status: status
            });

            // 2. Refresh background attendance
            window.dispatchEvent(new CustomEvent('attendance-updated'));
        } catch (err) {
            console.error('[TodayClassesCard] Attendance update failed, rolling back:', err);
            // Rollback on failure
            setSlots(prevSlots);
        }
    };

    const hasData = slots.length > 0;
    const targetDate = selectedDate || new Date();
    const isToday = targetDate.toDateString() === new Date().toDateString();
    
    // Check if targetDate is in the future
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTarget = new Date(targetDate);
    startOfTarget.setHours(0, 0, 0, 0);
    const isFuture = startOfTarget > startOfToday;
    const isPast = startOfTarget < startOfToday;

    // Check if targetDate is outside semester range
    let isOutsideSemesterRange = false;
    if (timetableConfig?.semesterStartDate && timetableConfig?.lastWorkingDate) {
        const start = new Date(timetableConfig.semesterStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(timetableConfig.lastWorkingDate);
        end.setHours(23, 59, 59, 999);
        const current = new Date(targetDate);
        current.setHours(12, 0, 0, 0); // avoid time zone shift
        isOutsideSemesterRange = current < start || current > end;
    }

    const formattedDateStr = targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const headerTitle = isToday ? "Today's Classes" : `Classes on ${formattedDateStr}`;

    return (
        <div style={{
            background: 'rgba(19,18,26,0.45)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '16px',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            height: '300px',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '28px',
                flexShrink: 0,
                marginBottom: '10px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#f8fafc',
                        margin: 0,
                        letterSpacing: '-0.01em'
                    }}>
                        {headerTitle}
                    </h2>
                    {!isToday && (
                        <button
                            onClick={() => setSelectedDate(null)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '4px',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '9px',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                outline: 'none'
                            }}
                        >
                            Reset
                        </button>
                    )}
                </div>
                <button
                    onClick={() => navigate('/profile/edit/timetable')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(148,163,184,0.4)',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#6ee7b7'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(148,163,184,0.4)'}
                >
                    View Timetable <ArrowRight size={11} />
                </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', flexShrink: 0, marginBottom: '12px' }} />

            {/* Body */}
            {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                    Loading...
                </div>
            ) : isOutsideSemesterRange ? (
                <TimetableEmptyState message="No classes allotted" />
            ) : !hasData ? (
                <TimetableEmptyState label={isToday ? 'today' : formattedDateStr} />
            ) : (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                    minHeight: 0
                }}>
                    {slots.map((slot, index) => {
                        const isBreak = slot.lectureType === 'Break';
                        const isMarked = slot.status !== 'Yet To Be Taken';
                        const isEditing = editingSlots[slot._id];
                        
                        let showActions = false;
                        let showStatusBadge = false;
                        let displayLabel = '';

                        if (isBreak) {
                            showActions = false;
                            showStatusBadge = false;
                            displayLabel = 'Break';
                        } else if (isFuture) {
                            // Tomorrow/Future: show details only, no actions
                            showActions = false;
                            showStatusBadge = false;
                        } else if (isPast) {
                            // Yesterday/Past: show actions for unmarked, badge for marked
                            showActions = !isMarked || isEditing;
                            showStatusBadge = isMarked && !isEditing;
                        } else {
                            // Today: check class timing bounds
                            const isOver = currentMinutes >= slot.endMinute;
                            if (isOver) {
                                showActions = !isMarked || isEditing;
                                showStatusBadge = isMarked && !isEditing;
                            } else {
                                showActions = false;
                                showStatusBadge = false;
                                const isCurrent = currentMinutes >= slot.startMinute && currentMinutes < slot.endMinute;
                                if (isCurrent) {
                                    const minsLeft = slot.endMinute - currentMinutes;
                                    displayLabel = `Ends in ${minsLeft}m`;
                                } else {
                                    displayLabel = 'Upcoming';
                                }
                            }
                        }

                        // Strike styling based on marked status (only when not break/future)
                        let textDec = 'none';
                        let decColor = 'transparent';
                        let itemOpacity = 1;
                        let statusColor = '#94a3b8';

                        if (isMarked && !isEditing && !isBreak && !isFuture) {
                            textDec = 'line-through';
                            itemOpacity = 0.35;
                            if (slot.status === 'Present') {
                                decColor = '#10b981';
                                statusColor = '#10b981';
                            } else if (slot.status === 'Absent') {
                                decColor = '#ef4444';
                                statusColor = '#ef4444';
                            } else { // Cancelled / Suspended
                                decColor = '#94a3b8';
                                statusColor = '#64748b';
                            }
                        }

                        // Time display
                        const timeParts = slot.timeSlot.split('-');
                        const timeStartStr = timeParts[0] || '';
                        const timeEndStr = timeParts[1] || '';

                        return (
                            <div
                                key={slot._id || index}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '70px 1fr auto',
                                    alignItems: 'center',
                                    gap: '12px',
                                    background: isBreak ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.015)',
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    opacity: isBreak ? 0.5 : 1,
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {/* Left: Time slot stacked */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: 'rgba(255,255,255,0.6)',
                                    borderRight: '1px solid rgba(255,255,255,0.04)',
                                    paddingRight: '10px',
                                    textAlign: 'center',
                                    lineHeight: 1.3
                                }}>
                                    <span>{timeStartStr}</span>
                                    <span style={{ fontSize: '9px', opacity: 0.4, margin: '1px 0' }}>-</span>
                                    <span>{timeEndStr}</span>
                                </div>

                                {/* Middle: Class Details */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px',
                                    opacity: itemOpacity,
                                    textDecoration: textDec,
                                    textDecorationColor: decColor,
                                    textDecorationThickness: '2px',
                                    transition: 'all 0.2s ease',
                                    overflow: 'hidden'
                                }}>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: isBreak ? '#94a3b8' : '#f1f5f9',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {isBreak ? (slot.subjectName || 'Break') : (slot.subjectCode || slot.subjectName)}
                                    </span>
                                    {slot.room && !isBreak && (
                                        <span style={{
                                            fontSize: '10px',
                                            color: 'rgba(255,255,255,0.4)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px'
                                        }}>
                                            <MapPin size={9} />
                                            {slot.room}
                                        </span>
                                    )}
                                </div>

                                {/* Right: Actions, Status or Type */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {isBreak ? (
                                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
                                            Break
                                        </span>
                                    ) : isFuture ? (
                                        <span style={{
                                            fontSize: '9px',
                                            fontWeight: 600,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: slot.lectureType === 'Lab' ? 'rgba(167, 139, 250, 0.1)' : 'rgba(255,255,255,0.03)',
                                            border: slot.lectureType === 'Lab' ? '1px solid rgba(167, 139, 250, 0.2)' : '1px solid rgba(255,255,255,0.06)',
                                            color: slot.lectureType === 'Lab' ? '#c4b5fd' : 'rgba(255,255,255,0.4)'
                                        }}>
                                            {slot.lectureType || 'Theory'}
                                        </span>
                                    ) : showActions ? (
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                onClick={() => markAttendance(slot, 'Present')}
                                                style={{
                                                    background: 'rgba(16, 185, 129, 0.05)',
                                                    border: '1px solid rgba(16, 185, 129, 0.25)',
                                                    color: '#10b981',
                                                    padding: '3px 7px',
                                                    borderRadius: '6px',
                                                    fontSize: '9.5px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    outline: 'none'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = '#10b981';
                                                    e.currentTarget.style.color = '#fff';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
                                                    e.currentTarget.style.color = '#10b981';
                                                }}
                                            >
                                                P
                                            </button>
                                            <button
                                                onClick={() => markAttendance(slot, 'Absent')}
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.05)',
                                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                                    color: '#ef4444',
                                                    padding: '3px 7px',
                                                    borderRadius: '6px',
                                                    fontSize: '9.5px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    outline: 'none'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = '#ef4444';
                                                    e.currentTarget.style.color = '#fff';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                                                    e.currentTarget.style.color = '#ef4444';
                                                }}
                                            >
                                                A
                                            </button>
                                            <button
                                                onClick={() => markAttendance(slot, 'Cancelled')}
                                                style={{
                                                    background: 'rgba(148, 163, 184, 0.05)',
                                                    border: '1px solid rgba(148, 163, 184, 0.25)',
                                                    color: '#94a3b8',
                                                    padding: '3px 7px',
                                                    borderRadius: '6px',
                                                    fontSize: '9.5px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    outline: 'none'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = '#94a3b8';
                                                    e.currentTarget.style.color = '#000';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)';
                                                    e.currentTarget.style.color = '#94a3b8';
                                                }}
                                            >
                                                S
                                            </button>
                                        </div>
                                    ) : showStatusBadge ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{
                                                fontSize: '10px',
                                                fontWeight: 800,
                                                color: statusColor,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em'
                                            }}>
                                                {slot.status === 'Cancelled' ? 'Suspended' : slot.status}
                                            </span>
                                            <button
                                                onClick={() => setEditingSlots(prev => ({ ...prev, [slot._id]: true }))}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    outline: 'none',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: 'rgba(255,255,255,0.4)',
                                                    transition: 'color 0.15s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                                            >
                                                <Edit2 size={11} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{
                                            fontSize: '9.5px',
                                            fontWeight: 700,
                                            color: displayLabel.startsWith('Ends in') ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                                            background: displayLabel.startsWith('Ends in') ? 'rgba(167, 139, 250, 0.08)' : 'transparent',
                                            padding: displayLabel.startsWith('Ends in') ? '3px 8px' : '0',
                                            borderRadius: '6px',
                                            border: displayLabel.startsWith('Ends in') ? '1px solid rgba(167, 139, 250, 0.2)' : 'none'
                                        }}>
                                            {displayLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TodayClassesCard;
