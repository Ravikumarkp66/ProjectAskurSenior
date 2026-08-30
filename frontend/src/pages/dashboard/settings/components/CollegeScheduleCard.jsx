import React from 'react';
import { Clock } from 'lucide-react';

const CollegeScheduleCard = ({ startMinute, endMinute, classDuration, labDuration = 100, onChange }) => {
    
    // Convert minutes from midnight (480) to HH:MM time string ("08:00")
    const minutesToTimeString = (mins) => {
        if (mins === undefined || mins === null) return '08:00';
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    // Convert HH:MM time string ("08:00") to minutes from midnight (480)
    const timeStringToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return (hours * 60) + minutes;
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
                <Clock size={16} style={{ color: '#a78bfa' }} />
                College Schedule & Durations
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '16px'
            }} className="schedule-grid">
                
                {/* College Starts At */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                        College Starts At
                    </label>
                    <input
                        type="time"
                        value={minutesToTimeString(startMinute)}
                        onChange={(e) => onChange('collegeStartMinute', timeStringToMinutes(e.target.value))}
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

                {/* College Ends At */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                        College Ends At
                    </label>
                    <input
                        type="time"
                        value={minutesToTimeString(endMinute)}
                        onChange={(e) => onChange('collegeEndMinute', timeStringToMinutes(e.target.value))}
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

                {/* Normal Class Duration */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                        Normal Class Duration
                    </label>
                    <select
                        value={classDuration}
                        onChange={(e) => onChange('classDuration', parseInt(e.target.value, 10))}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: '#13111A',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="40">40 Minutes</option>
                        <option value="45">45 Minutes</option>
                        <option value="50">50 Minutes</option>
                        <option value="55">55 Minutes</option>
                        <option value="60">60 Minutes</option>
                        <option value="75">75 Minutes</option>
                    </select>
                </div>

                {/* Lab Duration */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                        Lab Duration
                    </label>
                    <select
                        value={labDuration}
                        onChange={(e) => onChange('labDuration', parseInt(e.target.value, 10))}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: '#13111A',
                            color: '#c4b5fd',
                            fontSize: '13px',
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        <option value="80">80 Minutes</option>
                        <option value="90">90 Minutes</option>
                        <option value="100">100 Minutes (2 Periods)</option>
                        <option value="110">110 Minutes</option>
                        <option value="120">120 Minutes (2 Hours)</option>
                        <option value="150">150 Minutes</option>
                        <option value="180">180 Minutes (3 Hours)</option>
                    </select>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 768px) {
                    .schedule-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}} />
        </div>
    );
};

export default CollegeScheduleCard;
