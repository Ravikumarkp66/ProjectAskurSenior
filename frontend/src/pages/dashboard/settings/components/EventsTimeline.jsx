import React from 'react';
import { Trash2, Edit2, Calendar, Clock, AlertTriangle, ToggleLeft } from 'lucide-react';

const EventsTimeline = ({ events = [], onEditEvent, onDeleteEvent }) => {
    // Normalize date to YYYY-MM-DD local string
    const getLocalYYYYMMDD = (dObj) => {
        const d = new Date(dObj);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const todayStr = getLocalYYYYMMDD(new Date());

    const typeColors = {
        'CIE / Test': { text: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.2)' },
        'Quiz': { text: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.2)' },
        'Exam': { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
        'Vacation': { text: '#14b8a6', bg: 'rgba(20, 184, 166, 0.1)', border: 'rgba(20, 184, 166, 0.2)' },
        'Semester End': { text: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.2)' },
        'Government Holiday': { text: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.2)' },
        'College Fest': { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
        'Custom': { text: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)' }
    };

    // Calculate dates boundaries
    const todayDate = new Date(todayStr);
    const nextWeekDate = new Date(todayDate);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);

    // Grouping bins
    const bins = {
        today: [],
        thisWeek: [],
        upcoming: [],
        past: []
    };

    events.forEach(e => {
        const startStr = e.startDate.substring(0, 10);
        const endStr = e.endDate.substring(0, 10);
        
        const start = new Date(startStr);
        const end = new Date(endStr);

        if (startStr <= todayStr && todayStr <= endStr) {
            bins.today.push(e);
        } else if (end < todayDate) {
            bins.past.push(e);
        } else if (start > todayDate && start <= nextWeekDate) {
            bins.thisWeek.push(e);
        } else {
            bins.upcoming.push(e);
        }
    });

    // Sort helper: ascending for future, descending for past
    bins.today.sort((a, b) => a.startDate.localeCompare(b.startDate));
    bins.thisWeek.sort((a, b) => a.startDate.localeCompare(b.startDate));
    bins.upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
    bins.past.sort((a, b) => b.startDate.localeCompare(a.startDate));

    const renderEventList = (list) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {list.map(e => {
                    const colorScheme = typeColors[e.eventType] || typeColors['Custom'];
                    const startStr = new Date(e.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    const endStr = new Date(e.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    const dateDisplay = startStr === endStr ? startStr : `${startStr} - ${endStr}`;

                    return (
                        <div
                            key={e._id}
                            style={{
                                background: '#13111A',
                                border: `1px solid ${colorScheme.border}`,
                                borderRadius: '12px',
                                padding: '12px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '16px'
                            }}
                        >
                            {/* Left details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        color: colorScheme.text,
                                        background: colorScheme.bg,
                                        border: `1px solid ${colorScheme.border}`
                                    }}>
                                        {e.eventType}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Calendar size={11} />
                                        {dateDisplay}
                                    </span>
                                    {e.classesSuspended && (
                                        <span style={{
                                            fontSize: '9px',
                                            fontWeight: 600,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            color: '#fb7185',
                                            background: 'rgba(251, 113, 133, 0.08)',
                                            border: '1px solid rgba(251, 113, 133, 0.15)'
                                        }}>
                                            {e.suspensionType === 'full_day' ? 'Classes Suspended' : 'Partial Suspension'}
                                        </span>
                                    )}
                                </div>

                                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: '4px 0 0 0' }}>
                                    {e.title}
                                </h4>

                                {e.description && (
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                                        {e.description}
                                    </p>
                                )}
                            </div>

                            {/* Right Actions */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    onClick={() => onEditEvent(e)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'rgba(255,255,255,0.3)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        display: 'flex'
                                    }}
                                    className="hover:text-white"
                                >
                                    <Edit2 size={13} />
                                </button>
                                <button
                                    onClick={() => onDeleteEvent(e._id)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'rgba(239,68,68,0.5)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px',
                                        display: 'flex'
                                    }}
                                    className="hover:text-[#ef4444]"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Today Section */}
            {bins.today.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        Active Today
                    </h5>
                    {renderEventList(bins.today)}
                </div>
            )}

            {/* This Week Section */}
            {bins.thisWeek.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 700, color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        This Week
                    </h5>
                    {renderEventList(bins.thisWeek)}
                </div>
            )}

            {/* Upcoming Section */}
            {bins.upcoming.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        Upcoming
                    </h5>
                    {renderEventList(bins.upcoming)}
                </div>
            )}

            {/* Past Section */}
            {bins.past.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                        Past Events
                    </h5>
                    {renderEventList(bins.past)}
                </div>
            )}

            {events.length === 0 && (
                <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    border: '1px dashed rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: '12px'
                }}>
                    No academic events registered. Use the calendar or button below to add one.
                </div>
            )}
        </div>
    );
};

export default EventsTimeline;
