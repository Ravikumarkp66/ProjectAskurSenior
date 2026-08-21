import React from 'react';
import { 
    CalendarRange, 
    Calendar, 
    Clock, 
    Coffee, 
    Plus, 
    Trash2,
    Sparkles,
    Loader2
} from 'lucide-react';

const TimetableSetupView = ({ config, onChange, onCreate, saving }) => {

    // Format a date value (ISO string or Date) to YYYY-MM-DD for <input type="date">
    const formatDateForInput = (dateVal) => {
        if (!dateVal) return '';
        const dateStr = String(dateVal);
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    };

    const daysList = [
        { key: '1', name: 'Monday' },
        { key: '2', name: 'Tuesday' },
        { key: '3', name: 'Wednesday' },
        { key: '4', name: 'Thursday' },
        { key: '5', name: 'Friday' },
        { key: '6', name: 'Saturday' },
        { key: '7', name: 'Sunday' }
    ];

    const minutesToTimeString = (mins) => {
        if (mins === undefined || mins === null) return '08:00';
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const timeStringToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return (hours * 60) + minutes;
    };

    const handleDayStatusChange = (dayKey, status) => {
        const updated = { ...config.workingDays, [dayKey]: status };
        onChange('workingDays', updated);
    };

    const handleAddBreak = () => {
        // Default to smart break names
        const currentCount = config.breaks?.length || 0;
        let defaultName = 'Tea Break';
        if (currentCount === 1) {
            defaultName = 'Lunch Break';
        } else if (currentCount > 1) {
            defaultName = `Break ${currentCount + 1}`;
        }
        
        const newBreak = {
            name: defaultName,
            startMinute: 600, // 10:00 AM
            duration: 15
        };
        onChange('breaks', [...(config.breaks || []), newBreak]);
    };

    const handleRemoveBreak = (idxToRemove) => {
        const filtered = (config.breaks || []).filter((_, idx) => idx !== idxToRemove);
        onChange('breaks', filtered);
    };

    const handleBreakFieldChange = (idxToUpdate, field, value) => {
        const updated = (config.breaks || []).map((item, idx) => {
            if (idx === idxToUpdate) {
                return { ...item, [field]: value };
            }
            return item;
        });
        onChange('breaks', updated);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '700px',
            margin: '0 auto',
            padding: '20px 0',
            boxSizing: 'border-box',
            width: '100%'
        }}>
            {/* Header intro card */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)',
                border: '1px solid rgba(124, 58, 237, 0.15)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
            }}>
                <div style={{
                    background: 'rgba(124, 58, 237, 0.15)',
                    borderRadius: '50%',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '4px'
                }}>
                    <Sparkles size={24} style={{ color: '#c4b5fd' }} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Set Up Your Academic Timetable
                </h2>
                <p style={{ 
                    fontSize: '13px', 
                    color: 'rgba(148, 163, 184, 0.8)', 
                    margin: 0, 
                    maxWidth: '480px',
                    lineHeight: '1.5'
                }}>
                    Set up your college schedule once to unlock real-time attendance tracking, 
                    today's classes, analytics, and custom dashboard widgets.
                </p>
                <span style={{ fontSize: '11px', color: 'rgba(167, 139, 250, 0.65)', fontWeight: 600 }}>
                    ⏱️ Estimated setup time: 2 minutes
                </span>
            </div>

            {/* Step 1: Semester Duration */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
            }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={16} style={{ color: '#a78bfa' }} />
                    1. Semester Duration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="setup-duration-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                            Semester Start Date
                        </label>
                        <input
                            type="date"
                            required
                            value={formatDateForInput(config.semesterStartDate)}
                            onChange={(e) => onChange('semesterStartDate', e.target.value)}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                            Last Working Day
                        </label>
                        <input
                            type="date"
                            required
                            value={formatDateForInput(config.lastWorkingDate)}
                            onChange={(e) => onChange('lastWorkingDate', e.target.value)}
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
                </div>
            </div>

            {/* Step 2: College Schedule */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
            }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} style={{ color: '#a78bfa' }} />
                    2. College Schedule
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }} className="setup-schedule-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                            College Starts At
                        </label>
                        <input
                            type="time"
                            required
                            value={minutesToTimeString(config.collegeStartMinute)}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                            College Ends At
                        </label>
                        <input
                            type="time"
                            required
                            value={minutesToTimeString(config.collegeEndMinute)}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                            Class Duration
                        </label>
                        <select
                            value={config.classDuration}
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
                            <option value="45">45 Minutes</option>
                            <option value="50">50 Minutes</option>
                            <option value="55">55 Minutes</option>
                            <option value="60">60 Minutes</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Step 3: Break Configuration */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Coffee size={16} style={{ color: '#a78bfa' }} />
                        3. Break Configuration
                    </h3>
                    <button
                        type="button"
                        onClick={handleAddBreak}
                        style={{
                            background: 'rgba(139, 92, 246, 0.1)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            color: '#a78bfa',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <Plus size={12} />
                        Add Break
                    </button>
                </div>

                {(!config.breaks || config.breaks.length === 0) ? (
                    <div style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.4)', textAlign: 'center', padding: '12px 0' }}>
                        No breaks configured. Click Add Break to insert (e.g. Tea Break, Lunch Break).
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(config.breaks || []).map((item, idx) => (
                            <div 
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    background: 'rgba(255, 255, 255, 0.01)',
                                    border: '1px solid rgba(255, 255, 255, 0.04)',
                                    borderRadius: '8px',
                                    padding: '8px 12px'
                                }}
                            >
                                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <input
                                        type="text"
                                        required
                                        value={item.name}
                                        placeholder="Break Name (e.g. Tea Break)"
                                        onChange={(e) => handleBreakFieldChange(idx, 'name', e.target.value)}
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            background: 'rgba(255,255,255,0.02)',
                                            color: '#fff',
                                            fontSize: '12px',
                                            outline: 'none',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <input
                                        type="time"
                                        required
                                        value={minutesToTimeString(item.startMinute)}
                                        onChange={(e) => handleBreakFieldChange(idx, 'startMinute', timeStringToMinutes(e.target.value))}
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            background: 'rgba(255,255,255,0.02)',
                                            color: '#fff',
                                            fontSize: '12px',
                                            outline: 'none',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <select
                                        value={item.duration}
                                        onChange={(e) => handleBreakFieldChange(idx, 'duration', parseInt(e.target.value, 10))}
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            background: '#13111A',
                                            color: '#fff',
                                            fontSize: '12px',
                                            outline: 'none',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="10">10 Mins</option>
                                        <option value="15">15 Mins</option>
                                        <option value="20">20 Mins</option>
                                        <option value="30">30 Mins</option>
                                        <option value="40">40 Mins</option>
                                        <option value="45">45 Mins</option>
                                        <option value="60">60 Mins</option>
                                        <option value="90">90 Mins</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveBreak(idx)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '4px'
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Step 4: Working Days */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
            }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarRange size={16} style={{ color: '#a78bfa' }} />
                    4. Working Days Configuration
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {daysList.map((day) => {
                        const currentStatus = config.workingDays[day.key] || 'Holiday';
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
                                    padding: '8px 14px',
                                    gap: '16px'
                                }}
                            >
                                <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#f8fafc' }}>
                                    {day.name}
                                </span>

                                <div style={{ display: 'flex', gap: '4px' }}>
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
                                                    outline: 'none',
                                                    borderRadius: '6px',
                                                    padding: '5px 10px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    background: isSelected ? `${themeColor}20` : 'rgba(255,255,255,0.02)',
                                                    border: isSelected ? `1px solid ${themeColor}40` : '1px solid rgba(255,255,255,0.05)',
                                                    color: isSelected ? themeColor : 'rgba(148, 163, 184, 0.6)',
                                                    transition: 'all 0.15s'
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
            </div>

            {/* Bottom Create Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                    type="button"
                    onClick={onCreate}
                    disabled={saving}
                    style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: 'none',
                        outline: 'none',
                        background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
                    }}
                >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Create Timetable
                </button>
            </div>

            {/* Mobile Responsive Rules */}
            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 600px) {
                    .setup-duration-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .setup-schedule-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}} />
        </div>
    );
};

export default TimetableSetupView;
