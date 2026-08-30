import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';

const AcademicCalendar = ({ events = [], onDateClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get calendar details
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon, ...
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Previous month details
    const prevTotalDays = new Date(year, month, 0).getDate();

    // Predefined event types to colors
    const typeColors = {
        'CIE / Test': '#f97316',
        'Quiz': '#a855f7',
        'Exam': '#ef4444',
        'Vacation': '#14b8a6',
        'Semester End': '#f43f5e',
        'Government Holiday': '#eab308',
        'College Fest': '#3b82f6',
        'Custom': '#22c55e'
    };

    const formatDateStr = (y, m, d) => {
        const mm = String(m + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return `${y}-${mm}-${dd}`;
    };

    const getDayEvents = (d) => {
        const targetStr = formatDateStr(year, month, d);
        return events.filter(e => {
            const start = e.startDate.substring(0, 10);
            const end = e.endDate.substring(0, 10);
            return start <= targetStr && targetStr <= end;
        });
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate days grid
    const daysGrid = [];
    
    // Fill previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        daysGrid.push({
            day: prevTotalDays - i,
            isCurrentMonth: false,
            dateStr: formatDateStr(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, prevTotalDays - i)
        });
    }

    // Fill current month days
    for (let i = 1; i <= totalDays; i++) {
        daysGrid.push({
            day: i,
            isCurrentMonth: true,
            dateStr: formatDateStr(year, month, i)
        });
    }

    // Fill next month leading days to complete grid rows
    const remainingSlots = 42 - daysGrid.length;
    for (let i = 1; i <= remainingSlots; i++) {
        daysGrid.push({
            day: i,
            isCurrentMonth: false,
            dateStr: formatDateStr(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, i)
        });
    }

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        }}>
            {/* Header controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>
                        {monthNames[month]} {year}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>Click a date block to register an event</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={handlePrevMonth} style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        padding: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex'
                    }}>
                        <ChevronLeft size={16} />
                    </button>
                    <button onClick={handleNextMonth} style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        padding: '6px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex'
                    }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Grid weekdays header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
                {weekdays.map(day => (
                    <span key={day} style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.4)', paddingBottom: '4px' }}>
                        {day}
                    </span>
                ))}
            </div>

            {/* Grid body */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {daysGrid.map((item, index) => {
                    const isToday = item.isCurrentMonth && new Date().toISOString().substring(0, 10) === item.dateStr;
                    const dayEvents = events.filter(e => {
                        const start = e.startDate.substring(0, 10);
                        const end = e.endDate.substring(0, 10);
                        return start <= item.dateStr && item.dateStr <= end;
                    });

                    // Determine background or border based on primary event type
                    let cellHighlightColor = 'transparent';
                    let borderHighlight = '1px solid rgba(255, 255, 255, 0.03)';
                    let textColor = item.isCurrentMonth ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.25)';

                    if (dayEvents.length > 0) {
                        // Prioritize Exam > Holiday > Fest > Custom
                        const prio = ['Exam', 'Government Holiday', 'College Fest', 'Custom'];
                        const sortedEvents = [...dayEvents].sort((a, b) => prio.indexOf(a.eventType) - prio.indexOf(b.eventType));
                        const primaryEvent = sortedEvents[0];
                        const color = typeColors[primaryEvent.eventType] || '#22c55e';
                        cellHighlightColor = `${color}18`;
                        borderHighlight = `1px solid ${color}33`;
                    }

                    return (
                        <div
                            key={index}
                            onClick={() => onDateClick(item.dateStr, dayEvents[0] || null)}
                            style={{
                                background: isToday ? 'rgba(255, 255, 255, 0.07)' : cellHighlightColor,
                                border: isToday ? '1px solid rgba(255, 255, 255, 0.25)' : borderHighlight,
                                borderRadius: '8px',
                                minHeight: '42px',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.15s ease'
                            }}
                            className="hover:scale-[1.03] hover:bg-[rgba(255,255,255,0.04)]"
                        >
                            <span style={{ fontSize: '11px', fontWeight: 600, color: textColor }}>
                                {item.day}
                            </span>
                            
                            {/* Dot Indicators */}
                            {dayEvents.length > 0 && (
                                <div style={{ display: 'flex', gap: '2px', overflowX: 'hidden', height: '4px', marginTop: '2px' }}>
                                    {dayEvents.slice(0, 3).map(e => (
                                        <div key={e._id} style={{
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            backgroundColor: typeColors[e.eventType] || '#22c55e'
                                        }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Calendar Legend */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '12px',
                borderTop: '1px solid rgba(255, 255, 255, 0.04)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    <span>Exam</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308' }} />
                    <span>Holiday</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                    <span>College Fest</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
                    <span>Custom Event</span>
                </div>
            </div>
        </div>
    );
};

export default AcademicCalendar;
