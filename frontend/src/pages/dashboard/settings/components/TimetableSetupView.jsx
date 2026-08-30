import React, { useState } from 'react';
import { 
    CalendarRange, 
    Calendar, 
    Clock, 
    Coffee, 
    Plus, 
    Trash2,
    Sparkles,
    Loader2,
    BookOpen,
    Bell,
    CheckCircle2,
    Sliders,
    CalendarDays
} from 'lucide-react';
import EventModal from './EventModal';

const TimetableSetupView = ({ 
    config, 
    onChange, 
    onCreate, 
    saving, 
    registeredSubjects = [],
    onSaveRegisteredSubjects,
    events = [],
    onSaveEvent,
    onDeleteEvent
}) => {
    const [selectedSetupTab, setSelectedSetupTab] = useState('timetable');
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [draftRegistered, setDraftRegistered] = useState(registeredSubjects || []);

    // Sync draftRegistered with registeredSubjects prop
    React.useEffect(() => {
        if (registeredSubjects && registeredSubjects.length > 0) {
            setDraftRegistered(registeredSubjects.map(r => ({
                _id: r._id?.toString(),
                subjectId: r.subject?._id?.toString() || r.subject?.toString() || null,
                customName: r.customName || r.subject?.name || '',
                customCode: r.customCode || r.subject?.code || '',
                credits: r.registeredCredits ?? r.subject?.credits ?? 3,
                category: r.category || 'Theory',
                weeklyPlan: {
                    theory: { required: r.weeklyPlan?.theory?.required ?? (r.category === 'Lab Only' ? 0 : 4) },
                    lab: { required: r.weeklyPlan?.lab?.required ?? (r.category === 'Theory + Lab' || r.category === 'Lab Only' ? 1 : 0) }
                }
            })));
        }
    }, [registeredSubjects]);

    // Format a date value to YYYY-MM-DD
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

    const handlePlanValueChange = (subjId, type, val) => {
        const num = Math.max(0, parseInt(val, 10) || 0);
        setDraftRegistered(prev => prev.map(d => {
            const dId = d.subjectId || d._id;
            if (dId === subjId) {
                return {
                    ...d,
                    weeklyPlan: {
                        ...d.weeklyPlan,
                        [type]: { required: num }
                    }
                };
            }
            return d;
        }));
    };

    const handleCategoryChange = (subjId, newCat) => {
        setDraftRegistered(prev => prev.map(d => {
            const dId = d.subjectId || d._id;
            if (dId === subjId) {
                return {
                    ...d,
                    category: newCat,
                    weeklyPlan: {
                        theory: { required: newCat === 'Lab Only' ? 0 : d.weeklyPlan?.theory?.required || 4 },
                        lab: { required: (newCat === 'Theory + Lab' || newCat === 'Lab Only') ? (d.weeklyPlan?.lab?.required || 1) : 0 }
                    }
                };
            }
            return d;
        }));
    };

    const handleAddCustomSubj = () => {
        const tempId = `custom-${Date.now()}`;
        setDraftRegistered(prev => [...prev, {
            _id: tempId,
            subjectId: null,
            customName: 'Custom Subject',
            customCode: `CUST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            credits: 3,
            category: 'Theory',
            weeklyPlan: {
                theory: { required: 4 },
                lab: { required: 0 }
            }
        }]);
    };

    const handleFinalCreate = async () => {
        if (onSaveRegisteredSubjects && draftRegistered.length > 0) {
            await onSaveRegisteredSubjects(draftRegistered);
        }
        onCreate();
    };

    // Summary calculations
    const summarySubjectsCount = draftRegistered.length;
    const summaryCreditsTotal = draftRegistered.reduce((sum, item) => sum + (item.credits || 0), 0);
    const summaryTheoryClassesTotal = draftRegistered.reduce((sum, item) => sum + (item.weeklyPlan?.theory?.required || 0), 0);
    const summaryLabSessionsTotal = draftRegistered.reduce((sum, item) => sum + (item.weeklyPlan?.lab?.required || 0), 0);
    const summaryEstimatedHoursTotal = summaryTheoryClassesTotal + (summaryLabSessionsTotal * 2);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '860px',
            margin: '0 auto',
            padding: '20px 0',
            boxSizing: 'border-box',
            width: '100%'
        }}>
            {/* Header intro card */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{
                    background: 'rgba(124, 58, 237, 0.2)',
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
                    Academic & Timetable Setup
                </h2>
                <p style={{ 
                    fontSize: '13px', 
                    color: 'rgba(148, 163, 184, 0.85)', 
                    margin: 0, 
                    maxWidth: '520px',
                    lineHeight: '1.5'
                }}>
                    Configure your timetable timings, subject weekly requirements, and semester milestones before generating your schedule grid.
                </p>

                {/* 3 Step Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                    <button
                        type="button"
                        onClick={() => setSelectedSetupTab('timetable')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: selectedSetupTab === 'timetable' ? '#7c3aed' : 'rgba(255,255,255,0.04)',
                            color: selectedSetupTab === 'timetable' ? '#fff' : 'rgba(148, 163, 184, 0.7)',
                            border: selectedSetupTab === 'timetable' ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s'
                        }}
                    >
                        <Clock size={13} />
                        1. Timetable Settings
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedSetupTab('academic')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: selectedSetupTab === 'academic' ? '#7c3aed' : 'rgba(255,255,255,0.04)',
                            color: selectedSetupTab === 'academic' ? '#fff' : 'rgba(148, 163, 184, 0.7)',
                            border: selectedSetupTab === 'academic' ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s'
                        }}
                    >
                        <BookOpen size={13} />
                        2. Academic Settings ({draftRegistered.length} Subj)
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedSetupTab('events')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: selectedSetupTab === 'events' ? '#7c3aed' : 'rgba(255,255,255,0.04)',
                            color: selectedSetupTab === 'events' ? '#fff' : 'rgba(148, 163, 184, 0.7)',
                            border: selectedSetupTab === 'events' ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s'
                        }}
                    >
                        <Bell size={13} />
                        3. Events ({events.length})
                    </button>
                </div>
            </div>

            {/* TAB 1: TIMETABLE BASIC SETTINGS */}
            {selectedSetupTab === 'timetable' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* 1. Semester Duration */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={16} style={{ color: '#a78bfa' }} />
                            1. Semester Duration Dates
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
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
                                <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                                    Last Working Day / Exam Prep
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

                    {/* 2. College Schedule & Durations */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} style={{ color: '#a78bfa' }} />
                            2. Day Timings, Class & Lab Durations
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
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
                                <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
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
                                <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                                    Normal Class Duration
                                </label>
                                <select
                                    value={config.classDuration || 50}
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '11px', color: '#c4b5fd', fontWeight: 600 }}>
                                    Lab Session Duration
                                </label>
                                <select
                                    value={config.labDuration || 100}
                                    onChange={(e) => onChange('labDuration', parseInt(e.target.value, 10))}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
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
                    </div>

                    {/* 3. Break Configuration */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Coffee size={16} style={{ color: '#a78bfa' }} />
                                3. Break Timings & Durations (N Breaks)
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddBreak}
                                style={{
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    border: '1px solid rgba(139, 92, 246, 0.25)',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    color: '#c4b5fd',
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
                            <div style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.45)', textAlign: 'center', padding: '10px 0' }}>
                                No breaks configured. Click "Add Break" to insert intervals (e.g. Tea Break, Lunch Break).
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {(config.breaks || []).map((item, idx) => (
                                    <div 
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            background: 'rgba(255, 255, 255, 0.01)',
                                            border: '1px solid rgba(255, 255, 255, 0.04)',
                                            borderRadius: '8px',
                                            padding: '8px 12px'
                                        }}
                                    >
                                        <div style={{ flex: 2 }}>
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
                                                    background: '#161420',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    outline: 'none',
                                                    width: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 1.5 }}>
                                            <input
                                                type="time"
                                                required
                                                value={minutesToTimeString(item.startMinute)}
                                                onChange={(e) => handleBreakFieldChange(idx, 'startMinute', timeStringToMinutes(e.target.value))}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    background: '#161420',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    outline: 'none',
                                                    width: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 1.5 }}>
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

                    {/* 4. Working Days (Mon–Sat) */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CalendarRange size={16} style={{ color: '#a78bfa' }} />
                            4. Working Days Configuration (Mon–Sat)
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                                            padding: '8px 12px',
                                            gap: '12px'
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
                                                            padding: '4px 10px',
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

                </div>
            )}

            {/* TAB 2: ACADEMIC SETTINGS (SUBJECT-WISE SESSIONS PER WEEK) */}
            {selectedSetupTab === 'academic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* Summary Workload Strip */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)',
                        border: '1px solid rgba(124, 58, 237, 0.2)',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Subject Weekly Workload
                            </span>
                            <button
                                type="button"
                                onClick={handleAddCustomSubj}
                                style={{
                                    background: 'rgba(124, 58, 237, 0.2)',
                                    border: '1px solid rgba(124, 58, 237, 0.4)',
                                    borderRadius: '6px',
                                    padding: '4px 10px',
                                    color: '#fff',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <Plus size={12} />
                                Add Custom Subject
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.6)' }}>Registered Subjects</span>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{summarySubjectsCount} Courses</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.6)' }}>Total Credits</span>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#c4b5fd' }}>{summaryCreditsTotal} Credits</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.6)' }}>Theory Classes / Wk</span>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#60a5fa' }}>{summaryTheoryClassesTotal} Classes</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.6)' }}>Lab Sessions / Wk</span>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#34d399' }}>{summaryLabSessionsTotal} Sessions</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.6)' }}>Est. Weekly Workload</span>
                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24' }}>{summaryEstimatedHoursTotal} Hours</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {draftRegistered.length === 0 ? (
                        <div style={{ padding: '28px', textAlign: 'center', fontSize: '12px', color: 'rgba(148,163,184,0.5)', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                            No subjects found. Click "Add Custom Subject" above to add your courses.
                        </div>
                    ) : (
                        <div style={{
                            overflowX: 'auto',
                            width: '100%',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            background: 'rgba(10, 6, 22, 0.7)'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '580px' }}>
                                <thead>
                                    <tr style={{
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        color: 'rgba(148, 163, 184, 0.7)',
                                        textTransform: 'uppercase'
                                    }}>
                                        <th style={{ padding: '10px 12px', width: '40px', textAlign: 'center' }}>#</th>
                                        <th style={{ padding: '10px 12px', width: '100px' }}>Code</th>
                                        <th style={{ padding: '10px 12px' }}>Subject Name</th>
                                        <th style={{ padding: '10px 12px', width: '120px' }}>Category</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '110px' }}>Theory / Wk</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '110px' }}>Lab / Wk</th>
                                    </tr>
                                </thead>
                                <tbody style={{ fontSize: '12px', color: '#fff' }}>
                                    {draftRegistered.map((regItem, idx) => {
                                        const subjId = regItem.subjectId || regItem._id;
                                        const code = regItem.customCode || regItem.subject?.code || 'N/A';
                                        const name = regItem.customName || regItem.subject?.name || 'Subject';
                                        const category = regItem.category || 'Theory';
                                        const theoryVal = regItem.weeklyPlan?.theory?.required ?? 4;
                                        const labVal = regItem.weeklyPlan?.lab?.required ?? 0;

                                        return (
                                            <tr key={subjId || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                                <td style={{ padding: '10px 12px', textAlign: 'center', color: 'rgba(148,163,184,0.4)' }}>{idx + 1}</td>
                                                <td style={{ padding: '10px 12px', fontWeight: 700, color: '#c4b5fd', fontFamily: 'monospace' }}>{code}</td>
                                                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{name}</td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <select
                                                        value={category}
                                                        onChange={(e) => handleCategoryChange(subjId, e.target.value)}
                                                        style={{
                                                            background: '#161420',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '6px',
                                                            padding: '4px 6px',
                                                            color: category === 'Theory + Lab' ? '#c4b5fd' : category === 'Lab Only' ? '#6ee7b7' : '#93c5fd',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            outline: 'none'
                                                        }}
                                                    >
                                                        <option value="Theory">Theory</option>
                                                        <option value="Theory + Lab">Theory + Lab</option>
                                                        <option value="Lab Only">Lab Only</option>
                                                    </select>
                                                </td>
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="15"
                                                        disabled={category === 'Lab Only'}
                                                        value={category === 'Lab Only' ? 0 : theoryVal}
                                                        onChange={(e) => handlePlanValueChange(subjId, 'theory', e.target.value)}
                                                        style={{
                                                            width: '40px',
                                                            textAlign: 'center',
                                                            borderRadius: '4px',
                                                            border: '1px solid rgba(96, 165, 250, 0.3)',
                                                            background: '#0d091f',
                                                            color: '#93c5fd',
                                                            fontWeight: 700,
                                                            fontSize: '12px',
                                                            padding: '3px 0',
                                                            outline: 'none',
                                                            opacity: category === 'Lab Only' ? 0.3 : 1
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        disabled={category === 'Theory'}
                                                        value={category === 'Theory' ? 0 : labVal}
                                                        onChange={(e) => handlePlanValueChange(subjId, 'lab', e.target.value)}
                                                        style={{
                                                            width: '40px',
                                                            textAlign: 'center',
                                                            borderRadius: '4px',
                                                            border: '1px solid rgba(52, 211, 153, 0.3)',
                                                            background: '#0d091f',
                                                            color: '#6ee7b7',
                                                            fontWeight: 700,
                                                            fontSize: '12px',
                                                            padding: '3px 0',
                                                            outline: 'none',
                                                            opacity: category === 'Theory' ? 0.3 : 1
                                                        }}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            )}

            {/* TAB 3: EVENTS (CIE, TESTS, QUIZZES, VACATIONS, SEE) */}
            {selectedSetupTab === 'events' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '14px 18px'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CalendarDays size={15} style={{ color: '#c4b5fd' }} />
                                Semester Milestones & Events
                            </h4>
                            <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)' }}>
                                Track CIE 1/2/3, tests, quizzes, vacations (from–to), SEE exam dates
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsEventModalOpen(true)}
                            style={{
                                background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 14px',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Plus size={14} />
                            Add Event
                        </button>
                    </div>

                    {events.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '12.5px', color: 'rgba(148, 163, 184, 0.7)' }}>No events added yet. You can add CIEs, tests, and vacations anytime.</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {events.map(ev => (
                                <div key={ev._id} style={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{ev.title}</span>
                                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(124, 58, 237, 0.2)', color: '#c4b5fd', fontWeight: 700 }}>
                                            {ev.eventType}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)' }}>
                                        {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Action Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.6)' }}>
                    All parameters can be tuned anytime from Timetable Settings.
                </span>

                <button
                    type="button"
                    onClick={handleFinalCreate}
                    disabled={saving}
                    style={{
                        padding: '12px 28px',
                        borderRadius: '10px',
                        border: 'none',
                        outline: 'none',
                        background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 18px rgba(124, 58, 237, 0.4)'
                    }}
                >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Create & Generate Timetable
                </button>
            </div>

            {/* Event Form Modal */}
            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSave={async (payload) => {
                    if (onSaveEvent) await onSaveEvent(payload);
                    setIsEventModalOpen(false);
                }}
            />
        </div>
    );
};

export default TimetableSetupView;
