import React, { useState, useEffect } from 'react';
import { CalendarDays, ArrowRight, MapPin, Edit2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiV2 } from '../../../services/authService';
import { useTheme } from '../../../context/ThemeContext';
import {
    useProfileEntitlements,
    PROFILE_FEATURES
} from '../../../features/profile/utils/profileEntitlements';
import { DEMO_TODAY_CLASSES } from '../../../features/profile/config/profileDemoData';
import { ProfileLockBadge } from '../../../features/profile/components/ProfileLockedPreview';

function getOffsetDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

const TimetableEmptyState = ({ label, message, isDark }) => (
    <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        border: isDark ? '1px dashed #292E37' : '1px dashed #E5E7EB',
        borderRadius: '6px',
        background: isDark ? '#15181D' : '#F8FAFC'
    }}>
        <CalendarDays size={20} color={isDark ? '#71717A' : '#9CA3AF'} />
        <p style={{
            margin: 0,
            fontSize: '12px',
            fontWeight: 600,
            color: isDark ? '#F3F4F6' : '#111827',
            textAlign: 'center'
        }}>
            {message || `No classes scheduled for ${label}`}
        </p>
    </div>
);

const TodayClassesCard = ({ selectedDate, setSelectedDate }) => {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const { isPlus, isFree, isAnonymous } = useProfileEntitlements();

    const cacheKeyClasses = `aus_classes_${getOffsetDateString(selectedDate || new Date())}`;
    const cacheKeyConfig = 'aus_timetable_config';

    const [slots, setSlots] = useState(() => {
        if (!isPlus) return DEMO_TODAY_CLASSES;
        try {
            const raw = sessionStorage.getItem(cacheKeyClasses);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    });

    const [loading, setLoading] = useState(() => {
        if (!isPlus) return false;
        return slots.length === 0;
    });

    const [editingSlots, setEditingSlots] = useState({});
    const [suspensionInfo, setSuspensionInfo] = useState(null);
    const [timetableConfig, setTimetableConfig] = useState(() => {
        if (!isPlus) return null;
        try {
            const raw = sessionStorage.getItem(cacheKeyConfig);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    });

    // Current time in minutes since midnight
    const [currentMinutes, setCurrentMinutes] = useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    // Fetch config for Plus users only
    useEffect(() => {
        if (!isPlus) return;

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
    }, [isPlus]);

    const fetchTodayAttendance = async () => {
        if (!isPlus) return;

        try {
            const targetDate = selectedDate || new Date();
            const targetDateStr = getOffsetDateString(targetDate);
            const res = await apiV2.getAttendanceToday(targetDateStr);
            if (res.data?.success) {
                const newSlots = res.data.data || [];
                setSlots(newSlots);
                setSuspensionInfo(res.data.classesSuspended ? {
                    classesSuspended: true,
                    title: res.data.activeEvent?.title || res.data.message || 'Classes Suspended',
                    eventType: res.data.activeEvent?.eventType || 'Event'
                } : null);
                try {
                    sessionStorage.setItem(cacheKeyClasses, JSON.stringify(newSlots));
                } catch (e) {}
            }
        } catch (err) {
            console.error('[TodayClassesCard] Error fetching today attendance:', err);
        }
    };

    useEffect(() => {
        if (!isPlus) {
            setSlots(DEMO_TODAY_CLASSES);
            setLoading(false);
            return;
        }

        const initFetch = async () => {
            if (slots.length === 0) setLoading(true);
            await fetchTodayAttendance();
            setLoading(false);
        };
        initFetch();
    }, [selectedDate, isPlus]);

    useEffect(() => {
        if (!isPlus) return;

        const handleUpdate = () => {
            fetchTodayAttendance();
        };
        window.addEventListener('attendance-updated', handleUpdate);
        return () => window.removeEventListener('attendance-updated', handleUpdate);
    }, [selectedDate, isPlus]);

    // Attendance marking (Only available for Plus users)
    const markAttendance = async (slot, status) => {
        if (!isPlus) return;

        const prevSlots = [...slots];
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

            window.dispatchEvent(new CustomEvent('attendance-updated'));
        } catch (err) {
            console.error('[TodayClassesCard] Attendance update failed:', err);
            setSlots(prevSlots);
        }
    };

    const handleAction = () => {
        if (isAnonymous) {
            navigate('/login', { state: { from: '/profile' } });
        } else if (isFree) {
            navigate('/pricing');
        } else {
            navigate('/profile/edit/timetable');
        }
    };

    const hasData = slots.length > 0;
    const targetDate = selectedDate || new Date();
    const isToday = targetDate.toDateString() === new Date().toDateString();
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTarget = new Date(targetDate);
    startOfTarget.setHours(0, 0, 0, 0);
    const isFuture = startOfTarget > startOfToday;
    const isPast = startOfTarget < startOfToday;

    let isOutsideSemesterRange = false;
    if (timetableConfig?.semesterStartDate && timetableConfig?.lastWorkingDate) {
        const start = new Date(timetableConfig.semesterStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(timetableConfig.lastWorkingDate);
        end.setHours(23, 59, 59, 999);
        const current = new Date(targetDate);
        current.setHours(12, 0, 0, 0);
        isOutsideSemesterRange = current < start || current > end;
    }

    const formattedDateStr = targetDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const headerTitle = isToday ? "Today's Classes" : `Classes on ${formattedDateStr}`;

    const cardBg = isDark ? '#0F1115' : '#FFFFFF';
    const cardBorder = isDark ? '#292E37' : '#E5E7EB';
    const dividerColor = isDark ? '#292E37' : '#E5E7EB';
    const titleColor = isDark ? '#F3F4F6' : '#111827';
    const labelColor = isDark ? '#A1A1AA' : '#6B7280';

    return (
        <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            height: '300px',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            position: 'relative'
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
                        fontSize: '14px',
                        fontWeight: 600,
                        color: titleColor,
                        margin: 0,
                        letterSpacing: '-0.01em'
                    }}>
                        {headerTitle}
                    </h2>
                    {!isPlus && <ProfileLockBadge isAnonymous={isAnonymous} />}
                    {!isToday && isPlus && (
                        <button
                            onClick={() => setSelectedDate(null)}
                            style={{
                                background: isDark ? '#15181D' : '#F1F5F9',
                                border: isDark ? '1px solid #292E37' : '1px solid #E2E8F0',
                                borderRadius: '4px',
                                color: labelColor,
                                fontSize: '9px',
                                padding: '1px 5px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                outline: 'none'
                            }}
                        >
                            Reset
                        </button>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleAction}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isDark ? '#93C5FD' : '#2563EB',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'opacity 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    {!isPlus && <Lock size={10} />}
                    <span>{isPlus ? 'Timetable' : (isAnonymous ? 'Sign in' : 'Unlock')}</span>
                    <ArrowRight size={11} />
                </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: dividerColor, flexShrink: 0, marginBottom: '12px' }} />

            {/* Body */}
            {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: labelColor }}>
                    Loading…
                </div>
            ) : suspensionInfo ? (
                <TimetableEmptyState message={`${suspensionInfo.title} · Classes Suspended`} isDark={isDark} />
            ) : isOutsideSemesterRange ? (
                <TimetableEmptyState message="No classes allotted" isDark={isDark} />
            ) : !hasData ? (
                <TimetableEmptyState label={isToday ? 'today' : formattedDateStr} isDark={isDark} />
            ) : (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
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
                        } else if (!isPlus) {
                            // Free / Anonymous users preview timetable details without active mutation
                            showActions = false;
                            showStatusBadge = false;
                            displayLabel = slot.lectureType || 'Theory';
                        } else if (isFuture) {
                            showActions = false;
                            showStatusBadge = false;
                        } else if (isPast) {
                            showActions = !isMarked || isEditing;
                            showStatusBadge = isMarked && !isEditing;
                        } else {
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

                        let textDec = 'none';
                        let decColor = 'transparent';
                        let itemOpacity = 1;
                        let statusColor = labelColor;

                        if (isPlus && isMarked && !isEditing && !isBreak && !isFuture) {
                            textDec = 'line-through';
                            itemOpacity = isDark ? 0.4 : 0.5;
                            if (slot.status === 'Present') {
                                decColor = isDark ? '#22C55E' : '#16A34A';
                                statusColor = isDark ? '#22C55E' : '#16A34A';
                            } else if (slot.status === 'Absent') {
                                decColor = isDark ? '#EF4444' : '#DC2626';
                                statusColor = isDark ? '#EF4444' : '#DC2626';
                            } else {
                                decColor = labelColor;
                                statusColor = labelColor;
                            }
                        }

                        const timeParts = slot.timeSlot.split('-');
                        const timeStartStr = timeParts[0] || '';
                        const timeEndStr = timeParts[1] || '';

                        const itemBg = isDark ? '#15181D' : '#F8FAFC';
                        const itemBorder = isDark ? '1px solid #292E37' : '1px solid #E5E7EB';

                        return (
                            <div
                                key={slot._id || index}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '64px 1fr auto',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: itemBg,
                                    border: itemBorder,
                                    borderRadius: '6px',
                                    padding: '6px 10px',
                                    opacity: isBreak ? 0.6 : 1,
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {/* Left: Time */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10.5px',
                                    fontWeight: 600,
                                    color: labelColor,
                                    borderRight: isDark ? '1px solid #292E37' : '1px solid #E5E7EB',
                                    paddingRight: '8px',
                                    textAlign: 'center',
                                    lineHeight: 1.2
                                }}>
                                    <span>{timeStartStr}</span>
                                    <span>{timeEndStr}</span>
                                </div>

                                {/* Middle: Subject & Room */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1px',
                                    opacity: itemOpacity,
                                    textDecoration: textDec,
                                    textDecorationColor: decColor,
                                    textDecorationThickness: '1.5px',
                                    overflow: 'hidden'
                                }}>
                                    <span style={{
                                        fontSize: '11.5px',
                                        fontWeight: 600,
                                        color: isBreak ? labelColor : titleColor,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {isBreak ? (slot.subjectName || 'Break') : (slot.subjectCode || slot.subjectName)}
                                    </span>
                                    {slot.room && !isBreak && (
                                        <span style={{
                                            fontSize: '10px',
                                            color: labelColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px'
                                        }}>
                                            <MapPin size={9} />
                                            {slot.room}
                                        </span>
                                    )}
                                </div>

                                {/* Right: Action buttons or status badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {isBreak ? (
                                        <span style={{ fontSize: '9.5px', fontWeight: 600, color: labelColor, textTransform: 'uppercase' }}>
                                            Break
                                        </span>
                                    ) : showActions ? (
                                        <div style={{ display: 'flex', gap: '3px' }}>
                                            <button
                                                onClick={() => markAttendance(slot, 'Present')}
                                                style={{
                                                    background: isDark ? 'rgba(22, 163, 74, 0.15)' : '#DCFCE7',
                                                    border: isDark ? '1px solid rgba(22, 163, 74, 0.3)' : '1px solid #86EFAC',
                                                    color: isDark ? '#86EFAC' : '#16A34A',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '9px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                P
                                            </button>
                                            <button
                                                onClick={() => markAttendance(slot, 'Absent')}
                                                style={{
                                                    background: isDark ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2',
                                                    border: isDark ? '1px solid rgba(220, 38, 38, 0.3)' : '1px solid #FCA5A5',
                                                    color: isDark ? '#FCA5A5' : '#DC2626',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '9px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                A
                                            </button>
                                            <button
                                                onClick={() => markAttendance(slot, 'Cancelled')}
                                                style={{
                                                    background: isDark ? 'rgba(113, 113, 122, 0.15)' : '#F4F4F5',
                                                    border: isDark ? '1px solid #3F3F46' : '1px solid #E4E4E7',
                                                    color: labelColor,
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '9px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                S
                                            </button>
                                        </div>
                                    ) : showStatusBadge ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span style={{
                                                fontSize: '9.5px',
                                                fontWeight: 700,
                                                color: statusColor,
                                                textTransform: 'uppercase'
                                            }}>
                                                {slot.status === 'Cancelled' ? 'Suspended' : slot.status}
                                            </span>
                                            <button
                                                onClick={() => setEditingSlots(prev => ({ ...prev, [slot._id]: true }))}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    color: labelColor
                                                }}
                                            >
                                                <Edit2 size={10} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{
                                            fontSize: '9.5px',
                                            fontWeight: 600,
                                            color: displayLabel.startsWith('Ends in')
                                                ? (isDark ? '#93C5FD' : '#2563EB')
                                                : labelColor,
                                            background: displayLabel.startsWith('Ends in')
                                                ? (isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF')
                                                : 'transparent',
                                            padding: displayLabel.startsWith('Ends in') ? '2px 6px' : '0',
                                            borderRadius: '4px',
                                            border: displayLabel.startsWith('Ends in')
                                                ? (isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #DBEAFE')
                                                : 'none'
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
