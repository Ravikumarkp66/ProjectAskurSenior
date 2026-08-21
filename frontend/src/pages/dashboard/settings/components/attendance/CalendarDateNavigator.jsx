import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

const CalendarDateNavigator = ({
    selectedDate,
    onSelectDate,
    timetableConfig,
    groupedTimeline = []
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

    // Map of dates that have classes
    const classDatesSet = new Set(groupedTimeline.map(g => g.date));

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
                    const hasClasses = classDatesSet.has(item.dateStr);

                    // Check bounds if timetableConfig has semester bounds
                    const isOutOfTimeline = (startDateStr && item.dateStr < startDateStr) || (endDateStr && item.dateStr > endDateStr);

                    let bg = 'transparent';
                    let color = item.isCurrentMonth ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)';
                    let border = '1px solid transparent';

                    if (isSelected) {
                        bg = '#7c3aed';
                        color = '#ffffff';
                        border = '1px solid #a78bfa';
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
                            style={{
                                background: bg,
                                border: border,
                                borderRadius: '8px',
                                color: color,
                                fontSize: '12px',
                                fontWeight: isSelected || isToday ? 700 : 500,
                                height: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: isOutOfTimeline ? 'not-allowed' : 'pointer',
                                position: 'relative',
                                transition: 'all 0.15s',
                                opacity: isOutOfTimeline ? 0.4 : 1
                            }}
                            onMouseEnter={e => {
                                if (!isSelected && !isOutOfTimeline) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isSelected && !isOutOfTimeline) {
                                    e.currentTarget.style.background = bg;
                                }
                            }}
                        >
                            <span>{item.date.getDate()}</span>
                            {/* Classes dot indicator */}
                            {hasClasses && !isSelected && (
                                <span style={{
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    background: isToday ? '#a78bfa' : '#38bdf8',
                                    position: 'absolute',
                                    bottom: '3px'
                                }} />
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
