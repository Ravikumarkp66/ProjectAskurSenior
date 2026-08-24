import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Check } from 'lucide-react';

const CalendarDateNavigator = ({
    selectedDate,
    onSelectDate,
    timetableConfig,
    groupedTimeline = [],
    selectedDayClasses = []
}) => {
    // Current viewed month date state
    const [viewDate, setViewDate] = useState(() => {
        const d = selectedDate ? new Date(selectedDate) : new Date();
        return isNaN(d.getTime()) ? new Date() : d;
    });

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth(); // 0-indexed

    // Format Date to YYYY-MM-DD
    const formatDateStr = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const todayStr = formatDateStr(new Date());

    // Timeline boundaries
    const startDateStr = timetableConfig?.semesterStartDate ? formatDateStr(new Date(timetableConfig.semesterStartDate)) : null;
    const endDateStr = timetableConfig?.lastWorkingDate ? formatDateStr(new Date(timetableConfig.lastWorkingDate)) : null;

    // Month Navigation
    const handlePrevMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleTodayClick = () => {
        const today = new Date();
        setViewDate(today);
        onSelectDate(todayStr);
    };

    // Build days matrix for the month (Mon - Sun)
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Get starting day index (0 for Monday, 6 for Sunday)
    let startDayIdx = firstDayOfMonth.getDay() - 1;
    if (startDayIdx === -1) startDayIdx = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    // Previous month padding days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const calendarDays = [];

    const isMarkedStatus = (status) => {
        if (!status) return false;
        const s = String(status).trim().toUpperCase();
        return s !== 'YET TO BE TAKEN' && s !== 'NOT_MARKED' && s !== 'PENDING' && s !== '' && s !== 'NULL' && s !== 'UNDEFINED';
    };

    // Map of date status: { hasClasses, allMarked }
    const dateStatusMap = new Map();
    for (const g of groupedTimeline) {
        if (!g.date) continue;
        const dateKey = String(g.date).split('T')[0];
        const slots = g.slots || g.classes || [];
        const hasClasses = slots.length > 0;
        const allMarked = hasClasses && slots.every(s => isMarkedStatus(s.status));
        dateStatusMap.set(dateKey, { hasClasses, allMarked });
    }

    // Overlay live state for the currently selected date only if dayClasses is active for selectedDate
    if (selectedDate && selectedDayClasses && selectedDayClasses.length > 0) {
        const dateKey = String(selectedDate).split('T')[0];
        const hasClasses = selectedDayClasses.length > 0;
        const allMarked = hasClasses && selectedDayClasses.every(s => isMarkedStatus(s.status));
        dateStatusMap.set(dateKey, { hasClasses, allMarked });
    }

    for (let i = startDayIdx - 1; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
        calendarDays.push({ date: d, dateStr: formatDateStr(d), isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(currentYear, currentMonth, day);
        calendarDays.push({ date: d, dateStr: formatDateStr(d), isCurrentMonth: true });
    }

    // Remaining slots to fill 35 or 42 grid slots
    const totalSlots = calendarDays.length > 35 ? 42 : 35;
    const remainingSlots = totalSlots - calendarDays.length;
    for (let day = 1; day <= remainingSlots; day++) {
        const d = new Date(currentYear, currentMonth + 1, day);
        calendarDays.push({ date: d, dateStr: formatDateStr(d), isCurrentMonth: false });
    }

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Hovered date state for date-number reveal
    const [hoveredDate, setHoveredDate] = useState(null);

    return (
        <div style={{
            background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '16px',
            padding: '16px',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            height: 'fit-content'
        }}>
            {/* Calendar Month Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                    {monthNames[currentMonth]} {currentYear}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        type="button"
                        onClick={handlePrevMonth}
                        title="Previous Month"
                        style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            color: '#94a3b8',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={handleNextMonth}
                        title="Next Month"
                        style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            color: '#94a3b8',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Days of Week Header */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 600,
                color: '#64748b'
            }}>
                {weekDayLabels.map(day => (
                    <div key={day} style={{ padding: '4px 0' }}>{day}</div>
                ))}
            </div>

            {/* Monthly Days Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px'
            }}>
                {calendarDays.map((item, idx) => {
                    const isSelected = item.dateStr === selectedDate;
                    const isToday = item.dateStr === todayStr;
                    const isHovered = hoveredDate === item.dateStr;
                    
                    const dateStatus = dateStatusMap.get(item.dateStr) || { hasClasses: false, allMarked: false };
                    const hasClasses = dateStatus.hasClasses;
                    const allMarked = dateStatus.allMarked;

                    // Check bounds if timetableConfig has semester bounds
                    const isOutOfTimeline = (startDateStr && item.dateStr < startDateStr) || (endDateStr && item.dateStr > endDateStr);

                    let bg = 'transparent';
                    let color = item.isCurrentMonth ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)';
                    let border = '1px solid transparent';
                    let boxShadow = 'none';

                    if (isSelected) {
                        bg = allMarked
                            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                            : '#7c3aed';
                        color = '#ffffff';
                        border = allMarked ? '1.5px solid #34d399' : '1px solid #a78bfa';
                        boxShadow = allMarked ? '0 0 12px rgba(16, 185, 129, 0.55)' : '0 0 12px rgba(124, 58, 237, 0.45)';
                    } else if (allMarked) {
                        bg = isHovered
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.32) 0%, rgba(5, 150, 105, 0.42) 100%)'
                            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.26) 100%)';
                        border = isHovered ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.45)';
                        color = '#6ee7b7';
                        boxShadow = '0 0 8px rgba(16, 185, 129, 0.25)';
                    } else if (isToday) {
                        bg = 'rgba(124, 58, 237, 0.15)';
                        color = '#c4b5fd';
                        border = '1px solid rgba(167, 139, 250, 0.4)';
                    }

                    if (isOutOfTimeline && !isSelected) {
                        color = 'rgba(255, 255, 255, 0.15)';
                    }

                    return (
                        <button
                            key={idx}
                            type="button"
                            disabled={isOutOfTimeline}
                            onClick={() => onSelectDate(item.dateStr)}
                            onMouseEnter={() => setHoveredDate(item.dateStr)}
                            onMouseLeave={() => setHoveredDate(null)}
                            style={{
                                background: bg,
                                border: border,
                                borderRadius: '8px',
                                color: color,
                                fontSize: '12px',
                                fontWeight: isSelected || isToday || allMarked ? 700 : 500,
                                height: '34px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: isOutOfTimeline ? 'not-allowed' : 'pointer',
                                position: 'relative',
                                transition: 'all 0.15s ease-in-out',
                                opacity: isOutOfTimeline ? 0.35 : 1,
                                boxShadow: boxShadow
                            }}
                        >
                            {allMarked ? (
                                isHovered ? (
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        color: isSelected ? '#ffffff' : '#6ee7b7'
                                    }}>
                                        {item.date.getDate()}
                                    </span>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        height: '100%'
                                    }}>
                                        <Check
                                            size={16}
                                            strokeWidth={3.5}
                                            color={isSelected ? '#ffffff' : '#34d399'}
                                            style={{
                                                filter: isSelected ? 'drop-shadow(0 0 3px rgba(255,255,255,0.8))' : 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.6))'
                                            }}
                                        />
                                    </div>
                                )
                            ) : (
                                <>
                                    <span style={{ lineHeight: 1 }}>{item.date.getDate()}</span>
                                    {hasClasses && !isSelected && (
                                        <span style={{
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            background: isToday ? '#a78bfa' : '#38bdf8',
                                            marginTop: '3px'
                                        }} />
                                    )}
                                </>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Today Shortcut Button */}
            <button
                type="button"
                onClick={handleTodayClick}
                style={{
                    background: 'rgba(124, 58, 237, 0.08)',
                    border: '1px solid rgba(124, 58, 237, 0.2)',
                    color: '#c4b5fd',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '4px',
                    transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124, 58, 237, 0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)'; }}
            >
                <Clock size={13} />
                Jump to Today
            </button>
        </div>
    );
};

export default CalendarDateNavigator;
