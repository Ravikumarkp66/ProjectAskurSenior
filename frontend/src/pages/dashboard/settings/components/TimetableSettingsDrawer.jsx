import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { apiV2 } from '../../../../services/authService';
import toast from 'react-hot-toast';
import { 
    X, 
    Calendar, 
    Clock, 
    Coffee, 
    CalendarRange, 
    AlertTriangle, 
    Plus, 
    Trash2, 
    Loader2,
    BookOpen,
    Bell,
    CheckCircle2,
    Lock,
    Edit3,
    CalendarDays,
    Sliders,
    Sparkles
} from 'lucide-react';
import EventModal from './EventModal';

const TimetableSettingsDrawer = ({ 
    isOpen, 
    onClose, 
    config, 
    onChange, 
    onSave, 
    saving, 
    isConfigChanged, 
    user,
    subjects = [],
    registeredSubjects = [],
    onReset
}) => {
    // Primary Tab state: 'timetable' | 'academic' | 'events'
    const [activeTab, setActiveTab] = useState('timetable');
    const [resetting, setResetting] = useState(false);

    // Local draft state for registered subjects
    const [draftRegistered, setDraftRegistered] = useState([]);

    // Events state
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const daysList = [
        { key: '1', name: 'Monday' },
        { key: '2', name: 'Tuesday' },
        { key: '3', name: 'Wednesday' },
        { key: '4', name: 'Thursday' },
        { key: '5', name: 'Friday' },
        { key: '6', name: 'Saturday' },
        { key: '7', name: 'Sunday' }
    ];

    // Format a date value to YYYY-MM-DD for <input type="date">
    const formatDateForInput = (dateVal) => {
        if (!dateVal) return '';
        const dateStr = String(dateVal);
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    };

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

    // Populate draft registered subjects when opened or changed
    useEffect(() => {
        if (isOpen && registeredSubjects) {
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
    }, [isOpen, registeredSubjects]);

    // Fetch academic events when drawer is opened or tab changes
    const fetchEvents = async () => {
        try {
            setLoadingEvents(true);
            const res = await apiV2.getAcademicEvents();
            if (res.data?.success) {
                setEvents(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching academic events:', err);
        } finally {
            setLoadingEvents(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchEvents();
        }
    }, [isOpen]);

    // Escape key listener to close drawer
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !isEventModalOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, isEventModalOpen]);

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
            startMinute: 600,
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

    // Summary Card Calculations for Academic Settings Tab
    const summarySubjectsCount = draftRegistered.length;
    const summaryCreditsTotal = draftRegistered.reduce((sum, item) => sum + (item.credits || 0), 0);
    const summaryTheoryClassesTotal = draftRegistered.reduce((sum, item) => sum + (item.weeklyPlan?.theory?.required || 0), 0);
    const summaryLabSessionsTotal = draftRegistered.reduce((sum, item) => sum + (item.weeklyPlan?.lab?.required || 0), 0);
    const summaryEstimatedHoursTotal = summaryTheoryClassesTotal + (summaryLabSessionsTotal * 2);

    // Add new Custom Subject item
    const handleAddCustomSubject = () => {
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

    const handleSaveTrigger = () => {
        if (config.semesterStartDate && config.lastWorkingDate) {
            if (config.lastWorkingDate <= config.semesterStartDate) {
                setActiveTab('timetable');
                toast.error('Last Working Day must be after Semester Start Date.');
                return;
            }
        }
        onSave(draftRegistered);
    };

    // Event Actions
    const handleSaveEvent = async (payload) => {
        try {
            if (selectedEvent) {
                const res = await apiV2.updateAcademicEvent(selectedEvent._id, payload);
                if (res.data?.success) {
                    toast.success('Event updated successfully.');
                    setIsEventModalOpen(false);
                    fetchEvents();
                }
            } else {
                const res = await apiV2.createAcademicEvent(payload);
                if (res.data?.success) {
                    toast.success('Event created successfully.');
                    setIsEventModalOpen(false);
                    fetchEvents();
                }
            }
        } catch (err) {
            console.error('Error saving academic event:', err);
            toast.error(err.response?.data?.message || 'Failed to save event.');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event? This will restore any suspended timetable slots.')) {
            return;
        }
        try {
            const res = await apiV2.deleteAcademicEvent(id);
            if (res.data?.success) {
                toast.success('Event deleted successfully.');
                fetchEvents();
            }
        } catch (err) {
            console.error('Error deleting academic event:', err);
            toast.error('Failed to delete event.');
        }
    };

    const handleReset = async () => {
        if (!window.confirm("Are you sure you want to reset your timetable setup? This will clear all configurations, slots, expected classes, and attendance logs. This action can be undone within 24 hours.")) {
            return;
        }
        setResetting(true);
        try {
            const res = await apiV2.resetTimetable();
            if (res.data?.success) {
                toast.success('Timetable setup reset to starting state! You can undo this within 24 hours.');
                if (onReset) onReset();
                onClose();
            } else {
                toast.error(res.data?.message || 'Failed to reset timetable');
            }
        } catch (err) {
            console.error('Reset error:', err);
            toast.error('An error occurred during reset.');
        } finally {
            setResetting(false);
        }
    };

    if (!isOpen) return null;

    const eventBadgeColor = (type) => {
        switch (type) {
            case 'CIE / Test': return { text: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.3)' };
            case 'Quiz': return { text: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' };
            case 'Exam': return { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' };
            case 'Vacation': return { text: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)', border: 'rgba(20, 184, 166, 0.3)' };
            case 'Semester End': return { text: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' };
            case 'Government Holiday': return { text: '#eab308', bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.3)' };
            case 'College Fest': return { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' };
            default: return { text: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)' };
        }
    };

    return ReactDOM.createPortal(
        <>
            {/* Overlay Background */}
            <div 
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99998,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(8px)',
                    animation: 'drawerBackdropFadeIn 0.25s ease-out'
                }}
            />

            {/* Sliding Panel */}
            <div 
                style={{
                    position: 'fixed',
                    right: 0,
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '100%',
                    background: '#0e0b16',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 0 40px rgba(0, 0, 0, 0.8)',
                    animation: 'drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxSizing: 'border-box'
                }}
            >
                {/* Header with Title & Main Tabs */}
                <div style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    background: '#120e1d'
                }}>
                    <div style={{
                        maxWidth: '920px',
                        width: '100%',
                        margin: '0 auto',
                        padding: '16px 20px 0 20px',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                    }}>
                        {/* Title & Close */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(99, 102, 241, 0.2))',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#c4b5fd'
                                }}>
                                    <Sliders size={18} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
                                        Timetable & Academic Workspace Settings
                                    </h3>
                                    <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.6)' }}>
                                        Configure schedule parameters, subject weekly hours, and semester milestones
                                    </span>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={onClose}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '8px',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* 3 Main Column Tabs */}
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            borderBottom: 'none',
                            overflowX: 'auto',
                            paddingBottom: '2px'
                        }}>
                            {/* Tab 1: Timetable Settings */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('timetable')}
                                style={{
                                    padding: '10px 18px',
                                    borderTopLeftRadius: '8px',
                                    borderTopRightRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: activeTab === 'timetable' ? 700 : 500,
                                    color: activeTab === 'timetable' ? '#fff' : 'rgba(148, 163, 184, 0.7)',
                                    background: activeTab === 'timetable'
                                        ? 'linear-gradient(180deg, rgba(124, 58, 237, 0.25) 0%, rgba(124, 58, 237, 0.1) 100%)'
                                        : 'transparent',
                                    borderBottom: activeTab === 'timetable' ? '2px solid #a78bfa' : '2px solid transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <Clock size={15} style={{ color: activeTab === 'timetable' ? '#a78bfa' : 'inherit' }} />
                                <span>1. Timetable Settings</span>
                            </button>

                            {/* Tab 2: Academic Settings */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('academic')}
                                style={{
                                    padding: '10px 18px',
                                    borderTopLeftRadius: '8px',
                                    borderTopRightRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: activeTab === 'academic' ? 700 : 500,
                                    color: activeTab === 'academic' ? '#fff' : 'rgba(148, 163, 184, 0.7)',
                                    background: activeTab === 'academic'
                                        ? 'linear-gradient(180deg, rgba(124, 58, 237, 0.25) 0%, rgba(124, 58, 237, 0.1) 100%)'
                                        : 'transparent',
                                    borderBottom: activeTab === 'academic' ? '2px solid #a78bfa' : '2px solid transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <BookOpen size={15} style={{ color: activeTab === 'academic' ? '#a78bfa' : 'inherit' }} />
                                <span>2. Academic Settings</span>
                                <span style={{
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    background: 'rgba(167, 139, 250, 0.2)',
                                    color: '#c4b5fd',
                                    fontWeight: 700
                                }}>
                                    {draftRegistered.length} Subj
                                </span>
                            </button>

                            {/* Tab 3: Events */}
                            <button
                                type="button"
                                onClick={() => setActiveTab('events')}
                                style={{
                                    padding: '10px 18px',
                                    borderTopLeftRadius: '8px',
                                    borderTopRightRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: activeTab === 'events' ? 700 : 500,
                                    color: activeTab === 'events' ? '#fff' : 'rgba(148, 163, 184, 0.7)',
                                    background: activeTab === 'events'
                                        ? 'linear-gradient(180deg, rgba(124, 58, 237, 0.25) 0%, rgba(124, 58, 237, 0.1) 100%)'
                                        : 'transparent',
                                    borderBottom: activeTab === 'events' ? '2px solid #a78bfa' : '2px solid transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <Bell size={15} style={{ color: activeTab === 'events' ? '#a78bfa' : 'inherit' }} />
                                <span>3. Events</span>
                                <span style={{
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    background: 'rgba(244, 63, 94, 0.15)',
                                    color: '#fda4af',
                                    fontWeight: 700
                                }}>
                                    {events.length}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Body Content according to activeTab */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    boxSizing: 'border-box',
                    maxWidth: '920px',
                    width: '100%',
                    margin: '0 auto'
                }}>
                    
                    {/* ============================================================ */}
                    {/* TAB 1: TIMETABLE SETTINGS                                     */}
                    {/* ============================================================ */}
                    {activeTab === 'timetable' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            
                            {/* Intro Note */}
                            <div style={{
                                background: 'rgba(124, 58, 237, 0.05)',
                                border: '1px solid rgba(124, 58, 237, 0.15)',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <Clock size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', color: '#e2e8f0' }}>
                                    Configure your day start/end time, Monday–Saturday schedule, break intervals, and class & lab durations to generate timetable slots.
                                </span>
                            </div>

                            {/* Section 1: Semester Duration */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '12px',
                                padding: '18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={15} style={{ color: '#a78bfa' }} />
                                    1. Semester Dates
                                </h4>

                                {config.semesterStartDate && config.lastWorkingDate && config.lastWorkingDate <= config.semesterStartDate && (
                                    <div style={{
                                        background: 'rgba(239, 68, 68, 0.08)',
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                        borderRadius: '6px',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        color: '#fca5a5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                                        Last Working Day must be strictly after Semester Start Date.
                                    </div>
                                )}

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)', fontWeight: 600 }}>
                                            Semester Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formatDateForInput(config.semesterStartDate)}
                                            onChange={(e) => onChange('semesterStartDate', e.target.value)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                background: '#161420',
                                                color: '#fff',
                                                fontSize: '13px',
                                                outline: 'none',
                                                width: '100%',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)', fontWeight: 600 }}>
                                            Last Working Day / Exam Prep
                                        </label>
                                        <input
                                            type="date"
                                            value={formatDateForInput(config.lastWorkingDate)}
                                            onChange={(e) => onChange('lastWorkingDate', e.target.value)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                background: '#161420',
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

                            {/* Section 2: College Schedule & Durations */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '12px',
                                padding: '18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={15} style={{ color: '#a78bfa' }} />
                                    2. Day Timings & Class / Lab Durations
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                                    {/* College Starts At */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)', fontWeight: 600 }}>
                                            Day Starts At
                                        </label>
                                        <input
                                            type="time"
                                            value={minutesToTimeString(config.collegeStartMinute)}
                                            onChange={(e) => onChange('collegeStartMinute', timeStringToMinutes(e.target.value))}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                background: '#161420',
                                                color: '#fff',
                                                fontSize: '13px',
                                                outline: 'none',
                                                width: '100%',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>

                                    {/* College Ends At */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)', fontWeight: 600 }}>
                                            Day Ends At
                                        </label>
                                        <input
                                            type="time"
                                            value={minutesToTimeString(config.collegeEndMinute)}
                                            onChange={(e) => onChange('collegeEndMinute', timeStringToMinutes(e.target.value))}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                background: '#161420',
                                                color: '#fff',
                                                fontSize: '13px',
                                                outline: 'none',
                                                width: '100%',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>

                                    {/* Normal Class Duration */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)', fontWeight: 600 }}>
                                            Normal Class Duration
                                        </label>
                                        <select
                                            value={config.classDuration || 50}
                                            onChange={(e) => onChange('classDuration', parseInt(e.target.value, 10))}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                background: '#161420',
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
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                                                background: '#161420',
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

                            {/* Section 3: Monday to Saturday (and Sunday) Working Days */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '12px',
                                padding: '18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CalendarRange size={15} style={{ color: '#a78bfa' }} />
                                    3. Weekly Working Days (Mon–Sat)
                                </h4>

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

                            {/* Section 4: Breaks Configuration */}
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
                                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Coffee size={15} style={{ color: '#a78bfa' }} />
                                        4. Break Timings & Durations (N Breaks)
                                    </h4>
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
                                    <div style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.45)', textAlign: 'center', padding: '12px 0' }}>
                                        No breaks configured. Click "Add Break" to insert intervals (e.g. Morning Tea Break, Lunch Break, Snack Break).
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {config.breaks.map((item, idx) => (
                                            <div 
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    background: 'rgba(255, 255, 255, 0.01)',
                                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px'
                                                }}
                                            >
                                                {/* Break Name */}
                                                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <label style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.5)' }}>Break Name</label>
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        placeholder="Tea / Lunch Break"
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

                                                {/* Starts At */}
                                                <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <label style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.5)' }}>Starts At</label>
                                                    <input
                                                        type="time"
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

                                                {/* Duration (mins) */}
                                                <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <label style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.5)' }}>Duration</label>
                                                    <select
                                                        value={item.duration}
                                                        onChange={(e) => handleBreakFieldChange(idx, 'duration', parseInt(e.target.value, 10))}
                                                        style={{
                                                            padding: '6px 10px',
                                                            borderRadius: '4px',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            background: '#161420',
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
                                                        padding: '6px',
                                                        marginTop: '12px'
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {/* ============================================================ */}
                    {/* TAB 2: ACADEMIC SETTINGS (SUBJECT-WISE WEEKLY CLASSES & LABS) */}
                    {/* ============================================================ */}
                    {activeTab === 'academic' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            
                            {/* Semester Summary Card */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)',
                                border: '1px solid rgba(124, 58, 237, 0.18)',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                        Semester Academic Workload Summary
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleAddCustomSubject}
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

                            {/* Info Guide */}
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                fontSize: '12px',
                                color: 'rgba(148, 163, 184, 0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Sparkles size={14} style={{ color: '#a78bfa', flexShrink: 0 }} />
                                <span>
                                    Set the number of <strong>theory classes</strong> and <strong>lab sessions</strong> per week for each subject. If a subject is both <strong>Theory + Lab</strong>, configure both independently.
                                </span>
                            </div>

                            {/* Subjects Table */}
                            {draftRegistered.length === 0 ? (
                                <div style={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: 'rgba(148,163,184,0.5)', background: 'rgba(255,255,255,0.01)', borderRadius: '8px' }}>
                                    No registered subjects found for this semester. Click "Add Custom Subject" above or visit Subject Registration.
                                </div>
                            ) : (
                                <div style={{
                                    overflowX: 'auto',
                                    width: '100%',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    background: 'rgba(10, 6, 22, 0.7)'
                                }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                                        <thead>
                                            <tr style={{
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: 'rgba(148, 163, 184, 0.7)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.04em'
                                            }}>
                                                <th style={{ padding: '10px 12px', width: '40px', textAlign: 'center' }}>#</th>
                                                <th style={{ padding: '10px 12px', width: '110px' }}>Code</th>
                                                <th style={{ padding: '10px 12px' }}>Subject Name</th>
                                                <th style={{ padding: '10px 12px', width: '130px' }}>Category</th>
                                                <th style={{ padding: '10px 12px', textAlign: 'center', width: '120px' }}>Theory / Wk</th>
                                                <th style={{ padding: '10px 12px', textAlign: 'center', width: '120px' }}>Lab / Wk</th>
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

                                                const updatePlanValue = (type, val) => {
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

                                                const updateCategory = (newCat) => {
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

                                                return (
                                                    <tr 
                                                        key={subjId || idx}
                                                        style={{
                                                            borderBottom: idx === draftRegistered.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
                                                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                                                        }}
                                                    >
                                                        {/* Sl No */}
                                                        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'rgba(148, 163, 184, 0.4)', fontWeight: 600 }}>
                                                            {idx + 1}
                                                        </td>

                                                        {/* Code */}
                                                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                                                            <span style={{
                                                                fontFamily: 'monospace',
                                                                fontSize: '11px',
                                                                background: 'rgba(167, 139, 250, 0.12)',
                                                                color: '#c4b5fd',
                                                                border: '1px solid rgba(167, 139, 250, 0.2)',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px'
                                                            }}>
                                                                {code}
                                                            </span>
                                                        </td>

                                                        {/* Name */}
                                                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                                                            {name}
                                                        </td>

                                                        {/* Category */}
                                                        <td style={{ padding: '10px 12px' }}>
                                                            <select
                                                                value={category}
                                                                onChange={(e) => updateCategory(e.target.value)}
                                                                style={{
                                                                    background: '#161420',
                                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                    borderRadius: '6px',
                                                                    padding: '4px 8px',
                                                                    color: category === 'Theory + Lab' ? '#c4b5fd' : category === 'Lab Only' ? '#6ee7b7' : '#93c5fd',
                                                                    fontSize: '11px',
                                                                    fontWeight: 600,
                                                                    outline: 'none',
                                                                    cursor: 'pointer'
                                                                }}
                                                            >
                                                                <option value="Theory">Theory</option>
                                                                <option value="Theory + Lab">Theory + Lab</option>
                                                                <option value="Lab Only">Lab Only</option>
                                                            </select>
                                                        </td>

                                                        {/* Theory Classes / Week */}
                                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                <button
                                                                    type="button"
                                                                    disabled={category === 'Lab Only'}
                                                                    onClick={() => updatePlanValue('theory', theoryVal - 1)}
                                                                    style={{
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                        background: 'rgba(255,255,255,0.04)',
                                                                        color: '#fff',
                                                                        fontWeight: 700,
                                                                        cursor: category === 'Lab Only' ? 'not-allowed' : 'pointer',
                                                                        opacity: category === 'Lab Only' ? 0.3 : 1
                                                                    }}
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="15"
                                                                    disabled={category === 'Lab Only'}
                                                                    value={category === 'Lab Only' ? 0 : theoryVal}
                                                                    onChange={(e) => updatePlanValue('theory', e.target.value)}
                                                                    style={{
                                                                        width: '36px',
                                                                        height: '24px',
                                                                        textAlign: 'center',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid rgba(96, 165, 250, 0.3)',
                                                                        background: '#0d091f',
                                                                        color: '#93c5fd',
                                                                        fontWeight: 700,
                                                                        fontSize: '12px',
                                                                        outline: 'none',
                                                                        opacity: category === 'Lab Only' ? 0.3 : 1
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    disabled={category === 'Lab Only'}
                                                                    onClick={() => updatePlanValue('theory', theoryVal + 1)}
                                                                    style={{
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                        background: 'rgba(255,255,255,0.04)',
                                                                        color: '#fff',
                                                                        fontWeight: 700,
                                                                        cursor: category === 'Lab Only' ? 'not-allowed' : 'pointer',
                                                                        opacity: category === 'Lab Only' ? 0.3 : 1
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* Lab Sessions / Week */}
                                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                <button
                                                                    type="button"
                                                                    disabled={category === 'Theory'}
                                                                    onClick={() => updatePlanValue('lab', labVal - 1)}
                                                                    style={{
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                        background: 'rgba(255,255,255,0.04)',
                                                                        color: '#fff',
                                                                        fontWeight: 700,
                                                                        cursor: category === 'Theory' ? 'not-allowed' : 'pointer',
                                                                        opacity: category === 'Theory' ? 0.3 : 1
                                                                    }}
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="10"
                                                                    disabled={category === 'Theory'}
                                                                    value={category === 'Theory' ? 0 : labVal}
                                                                    onChange={(e) => updatePlanValue('lab', e.target.value)}
                                                                    style={{
                                                                        width: '36px',
                                                                        height: '24px',
                                                                        textAlign: 'center',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid rgba(52, 211, 153, 0.3)',
                                                                        background: '#0d091f',
                                                                        color: '#6ee7b7',
                                                                        fontWeight: 700,
                                                                        fontSize: '12px',
                                                                        outline: 'none',
                                                                        opacity: category === 'Theory' ? 0.3 : 1
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    disabled={category === 'Theory'}
                                                                    onClick={() => updatePlanValue('lab', labVal + 1)}
                                                                    style={{
                                                                        width: '24px',
                                                                        height: '24px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                                        background: 'rgba(255,255,255,0.04)',
                                                                        color: '#fff',
                                                                        fontWeight: 700,
                                                                        cursor: category === 'Theory' ? 'not-allowed' : 'pointer',
                                                                        opacity: category === 'Theory' ? 0.3 : 1
                                                                    }}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
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

                    {/* ============================================================ */}
                    {/* TAB 3: EVENTS SETTINGS (CIE, TESTS, QUIZZES, VACATIONS, SEE) */}
                    {/* ============================================================ */}
                    {activeTab === 'events' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            
                            {/* Header row with Add Event */}
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
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CalendarDays size={16} style={{ color: '#c4b5fd' }} />
                                        Semester Academic Events & Milestones
                                    </h4>
                                    <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)' }}>
                                        Add CIE 1/2/3, unit tests, quizzes, vacations (from–to), SEE exam dates, and fests
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedEvent(null);
                                        setIsEventModalOpen(true);
                                    }}
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
                                        gap: '6px',
                                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                                    }}
                                >
                                    <Plus size={14} />
                                    Add Semester Event
                                </button>
                            </div>

                            {/* Events List */}
                            {loadingEvents ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '8px', color: '#c4b5fd' }}>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span style={{ fontSize: '12px' }}>Loading semester events...</span>
                                </div>
                            ) : events.length === 0 ? (
                                <div style={{
                                    padding: '36px 20px',
                                    textAlign: 'center',
                                    background: 'rgba(255, 255, 255, 0.01)',
                                    borderRadius: '12px',
                                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}>
                                    <CalendarDays size={28} style={{ color: 'rgba(167, 139, 250, 0.4)' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>No semester events added yet</span>
                                    <p style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.55)', margin: 0, maxWidth: '380px' }}>
                                        Add CIE tests, quizzes, semester end dates, or vacations so timetable slots automatically adjust.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {events.map((ev) => {
                                        const badge = eventBadgeColor(ev.eventType);
                                        const startFormatted = ev.startDate ? new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                                        const endFormatted = ev.endDate ? new Date(ev.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                                        const isMultiDay = startFormatted !== endFormatted;

                                        return (
                                            <div
                                                key={ev._id}
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.02)',
                                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                                    borderRadius: '10px',
                                                    padding: '12px 16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: '14px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                    <div style={{
                                                        width: '4px',
                                                        height: '36px',
                                                        borderRadius: '2px',
                                                        backgroundColor: badge.text
                                                    }} />
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                                                                {ev.title}
                                                            </span>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                fontWeight: 700,
                                                                color: badge.text,
                                                                background: badge.bg,
                                                                border: `1px solid ${badge.border}`,
                                                                padding: '2px 8px',
                                                                borderRadius: '12px'
                                                            }}>
                                                                {ev.eventType}
                                                            </span>
                                                            {ev.classesSuspended && (
                                                                <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                                    Classes Suspended
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Calendar size={12} />
                                                            <span>
                                                                {isMultiDay ? `${startFormatted} → ${endFormatted}` : startFormatted}
                                                            </span>
                                                            {ev.description && (
                                                                <span>· {ev.description}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedEvent(ev);
                                                            setIsEventModalOpen(true);
                                                        }}
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.04)',
                                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                                            borderRadius: '6px',
                                                            padding: '6px',
                                                            color: 'rgba(255, 255, 255, 0.7)',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <Edit3 size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteEvent(ev._id)}
                                                        style={{
                                                            background: 'rgba(239, 68, 68, 0.08)',
                                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                                            borderRadius: '6px',
                                                            padding: '6px',
                                                            color: '#f87171',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                        </div>
                    )}

                </div>

                {/* Footer Save / Reset Actions */}
                <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    background: '#120e1d',
                    padding: '14px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={resetting}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            color: '#f87171',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: resetting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {resetting && <Loader2 size={12} className="animate-spin" />}
                        Reset Setup
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveTrigger}
                            disabled={saving}
                            style={{
                                background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 20px',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: 700,
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
                            }}
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            Save All Changes
                        </button>
                    </div>
                </div>
            </div>

            {/* Event Form Modal */}
            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => {
                    setIsEventModalOpen(false);
                    setSelectedEvent(null);
                }}
                onSave={handleSaveEvent}
                event={selectedEvent}
            />

            {/* Keyframe Animations */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes drawerBackdropFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes drawerSlideIn {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}} />
        </>,
        document.body
    );
};

export default TimetableSettingsDrawer;
