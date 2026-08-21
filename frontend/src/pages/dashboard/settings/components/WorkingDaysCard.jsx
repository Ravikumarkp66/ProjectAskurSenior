import React from 'react';
import { CalendarRange } from 'lucide-react';

const WorkingDaysCard = ({ workingDays, onChange }) => {
    
    const daysList = [
        { key: '1', name: 'Monday' },
        { key: '2', name: 'Tuesday' },
        { key: '3', name: 'Wednesday' },
        { key: '4', name: 'Thursday' },
        { key: '5', name: 'Friday' },
        { key: '6', name: 'Saturday' },
        { key: '7', name: 'Sunday' }
    ];

    const handleDayStatusChange = (dayKey, status) => {
        const updated = { ...workingDays, [dayKey]: status };
        onChange('workingDays', updated);
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxSizing: 'border-box'
        }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarRange size={16} style={{ color: '#a78bfa' }} />
                Working Days Configuration
            </h3>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {daysList.map((day) => {
                    const currentStatus = workingDays[day.key] || 'Holiday';
                    return (
                        <div 
                            key={day.key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(255, 255, 255, 0.01)',
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                gap: '16px'
                            }}
                            className="working-day-row"
                        >
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                                {day.name}
                            </span>

                            <div style={{ display: 'flex', gap: '6px' }}>
                                {['Full Day', 'Half Day', 'Holiday'].map((opt) => {
                                    const isSelected = currentStatus === opt;
                                    const colorMap = {
                                        'Full Day': '#10b981',
                                        'Half Day': '#fbbf24',
                                        'Holiday': '#ef4444'
                                    };
                                    const themeColor = colorMap[opt];

                                    return (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => handleDayStatusChange(day.key, opt)}
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                background: isSelected ? `${themeColor}20` : 'rgba(255,255,255,0.02)',
                                                border: isSelected ? `1px solid ${themeColor}50` : '1px solid rgba(255,255,255,0.06)',
                                                color: isSelected ? themeColor : 'rgba(148, 163, 184, 0.65)',
                                                transition: 'all 0.15s'
                                            }}
                                            onMouseEnter={e => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                    e.currentTarget.style.color = '#fff';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                                    e.currentTarget.style.color = 'rgba(148, 163, 184, 0.65)';
                                                }
                                            }}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 576px) {
                    .working-day-row {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 10px !important;
                    }
                }
            `}} />
        </div>
    );
};

export default WorkingDaysCard;
