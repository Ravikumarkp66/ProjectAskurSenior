import React, { useMemo } from 'react';
import { Settings, Calendar, Clock, Coffee, Sparkles } from 'lucide-react';

const ConfigurationSummary = ({ config, onEditClick }) => {
    // Format minutes from midnight to 12-hour format: 480 -> 08:00 AM
    const formatTime = (mins) => {
        if (mins === undefined || mins === null) return '';
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    // Format dates to readable format: "2026-07-16" -> "Jul 16"
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const semesterStr = useMemo(() => {
        const start = formatDate(config.semesterStartDate);
        const end = formatDate(config.lastWorkingDate);
        if (!start && !end) return 'Not Configured';
        return `${start} – ${end}`;
    }, [config.semesterStartDate, config.lastWorkingDate]);

    const workingDaysSummary = useMemo(() => {
        const workingDaysMap = config.workingDays || {};
        const days = [
            { key: '1', nameKey: 'mon', label: 'Mon' },
            { key: '2', nameKey: 'tue', label: 'Tue' },
            { key: '3', nameKey: 'wed', label: 'Wed' },
            { key: '4', nameKey: 'thu', label: 'Thu' },
            { key: '5', nameKey: 'fri', label: 'Fri' },
            { key: '6', nameKey: 'sat', label: 'Sat' },
            { key: '7', nameKey: 'sun', label: 'Sun' }
        ];
        
        const full = [];
        const half = [];
        
        days.forEach(d => {
            const status = workingDaysMap[d.key] || workingDaysMap[d.nameKey] || 'Holiday';
            if (status === 'Full Day') full.push(d.label);
            else if (status === 'Half Day') half.push(d.label);
        });

        const parts = [];
        if (full.length > 0) {
            if (full.length === 5 && full[0] === 'Mon' && full[4] === 'Fri') {
                parts.push('Mon–Fri');
            } else {
                parts.push(full.join(','));
            }
        }
        if (half.length > 0) {
            parts.push(`${half.join(',')} Half`);
        }
        
        return parts.join(' • ') || 'No Working Days';
    }, [config.workingDays]);

    const numBreaks = config.breaks?.length || 0;

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '8px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxSizing: 'border-box',
            width: '100%',
            minHeight: '44px'
        }}>
            {/* Left strip metrics */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: '8px',
                fontSize: '11.5px',
                color: 'rgba(148, 163, 184, 0.8)',
                fontWeight: 500
            }}>
                {/* Semester */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />
                    <span style={{ color: '#fff', fontWeight: 600 }}>Semester</span>
                    <span>{semesterStr}</span>
                </div>

                <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>

                {/* College Hours */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />
                    <span style={{ color: '#fff', fontWeight: 600 }}>College</span>
                    <span>{formatTime(config.collegeStartMinute)} – {formatTime(config.collegeEndMinute)}</span>
                </div>

                <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>

                {/* Class duration */}
                <span>{config.classDuration} min/class</span>

                <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>

                {/* Breaks count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Coffee size={12} style={{ color: '#a78bfa', flexShrink: 0 }} />
                    <span>{numBreaks} {numBreaks === 1 ? 'Break' : 'Breaks'}</span>
                </div>

                <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>•</span>

                {/* Working Days */}
                <span>{workingDaysSummary}</span>
            </div>

            {/* Right Action Trigger */}
            <button
                type="button"
                onClick={onEditClick}
                style={{
                    background: 'rgba(167, 139, 250, 0.08)',
                    border: '1px solid rgba(167, 139, 250, 0.25)',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    color: '#c4b5fd',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(167, 139, 250, 0.15)';
                    e.currentTarget.style.border = '1px solid rgba(167, 139, 250, 0.4)';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(167, 139, 250, 0.08)';
                    e.currentTarget.style.border = '1px solid rgba(167, 139, 250, 0.25)';
                    e.currentTarget.style.color = '#c4b5fd';
                }}
            >
                <Settings size={11} />
                Modify Registration & Setup
            </button>
        </div>
    );
};

export default ConfigurationSummary;
