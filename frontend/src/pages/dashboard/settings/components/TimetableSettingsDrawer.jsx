import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { apiV2 } from '../../../../services/authService';
import toast from 'react-hot-toast';
import { 
    X, 
    ChevronDown, 
    ChevronUp, 
    Calendar, 
    Clock, 
    Coffee, 
    CalendarRange, 
    AlertTriangle, 
    Plus, 
    Trash2, 
    Loader2,
    CheckSquare,
    PlusCircle,
    Info,
    Lock
} from 'lucide-react';

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
    // Accordion active section state
    const [activeSection, setActiveSection] = useState('registered-subjects');
    const [resetting, setResetting] = useState(false);

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

    // Local draft state for registered subjects
    const [draftRegistered, setDraftRegistered] = useState([]);
    
    // Selected curriculum subject ID from the dropdown
    const [selectedSubjectId, setSelectedSubjectId] = useState('');

    const daysList = [
        { key: '1', name: 'Monday' },
        { key: '2', name: 'Tuesday' },
        { key: '3', name: 'Wednesday' },
        { key: '4', name: 'Thursday' },
        { key: '5', name: 'Friday' },
        { key: '6', name: 'Saturday' },
        { key: '7', name: 'Sunday' }
    ];

    // Format a date value (ISO string or Date) to YYYY-MM-DD for <input type="date">
    const formatDateForInput = (dateVal) => {
        if (!dateVal) return '';
        const dateStr = String(dateVal);
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
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

    // Escape key listener to close drawer
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Check if draft registered subjects differs from saved state
    const isRegisteredSubjectsChanged = useMemo(() => {
        if (!registeredSubjects) return false;
        
        const initialMapped = registeredSubjects.map(r => ({
            _id: r._id?.toString(),
            subjectId: r.subject?._id?.toString() || r.subject?.toString() || null,
            customName: r.customName || r.subject?.name || '',
            customCode: r.customCode || r.subject?.code || '',
            credits: r.registeredCredits ?? r.subject?.credits ?? 3,
            category: r.category || 'Theory',
            weeklyPlan: {
                theory: { required: r.weeklyPlan?.theory?.required ?? 0 },
                lab: { required: r.weeklyPlan?.lab?.required ?? 0 }
            }
        }));

        if (draftRegistered.length !== initialMapped.length) return true;

        return draftRegistered.some(d => {
            let found = null;
            if (d.subjectId) {
                found = initialMapped.find(i => i.subjectId === d.subjectId.toString());
            } else if (d._id) {
                found = initialMapped.find(i => i._id === d._id.toString());
            }

            if (!found) return true;
            if (found.credits !== d.credits) return true;
            if (found.category !== d.category) return true;
            if (found.customName !== d.customName) return true;
            if (found.customCode !== d.customCode) return true;
            if (found.weeklyPlan.theory.required !== d.weeklyPlan.theory.required) return true;
            if (found.weeklyPlan.lab.required !== d.weeklyPlan.lab.required) return true;
            return false;
        });
    }, [draftRegistered, registeredSubjects]);

    if (!isOpen) return null;

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

    const toggleSection = (sectionName) => {
        setActiveSection(prev => prev === sectionName ? null : sectionName);
    };

    // Summary Card Calculations
    const summarySubjectsCount = draftRegistered.length;
    const summaryCreditsTotal = draftRegistered.reduce((sum, item) => sum + (item.credits || 0), 0);
    const summaryTheoryClassesTotal = draftRegistered.reduce((sum, item) => sum + (item.weeklyPlan?.theory?.required || 0), 0);
    const summaryLabSessionsTotal = draftRegistered.reduce((sum, item) => sum + (item.weeklyPlan?.lab?.required || 0), 0);
    const summaryEstimatedHoursTotal = summaryTheoryClassesTotal + (summaryLabSessionsTotal * 2);

    // Add new Custom Subject item to local draft list
    const handleAddCustomSubject = () => {
        const tempId = `custom-${Date.now()}`;
        setDraftRegistered(prev => [...prev, {
            _id: tempId,
            subjectId: null,
            customName: 'Custom Course',
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
        // Date range validation: start must be strictly before end
        if (config.semesterStartDate && config.lastWorkingDate) {
            if (config.lastWorkingDate <= config.semesterStartDate) {
                // Scroll / expand the semester section so user sees the error
                setActiveSection('semester');
                return;
            }
        }
        onSave(draftRegistered);
    };

    // Derived academic details
    const branchName = user?.branch?.name || user?.branchName || 'Not Set';
    const semester = user?.semester || 'Not Set';
    const schemeName = user?.scheme?.name || user?.schemeName || 'Not Set';
    
    // Derive academic year from semester
    const getAcademicYearLabel = (sem) => {
        const semNum = parseInt(sem, 10);
        if (isNaN(semNum)) return 'Not Set';
        if (semNum === 1 || semNum === 2) return '1st Year';
        if (semNum === 3 || semNum === 4) return '2nd Year';
        if (semNum === 5 || semNum === 6) return '3rd Year';
        if (semNum === 7 || semNum === 8) return '4th Year';
        return `${Math.ceil(semNum / 2)}th Year`;
    };
    const acadYear = getAcademicYearLabel(semester);

    return ReactDOM.createPortal(
        <>
            {/* Overlay Background */}
            <div 
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99998,
                    background: 'rgba(0, 0, 0, 0.65)',
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
                    background: '#110f17',
                    borderLeft: 'none',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 0 40px rgba(0, 0, 0, 0.7)',
                    animation: 'drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxSizing: 'border-box'
                }}
            >
                {/* Header */}
                <div style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    background: '#13111A'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 24px',
                        maxWidth: '900px',
                        width: '100%',
                        margin: '0 auto',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
                                Timetable Settings
                            </h3>
                            <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.5)' }}>
                                Configure your academic preferences and schedule options
                            </span>
                        </div>
                        <button 
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: 'rgba(255, 255, 255, 0.7)',
                                cursor: 'pointer',
                                padding: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '6px',
                                transition: 'all 0.15s'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxSizing: 'border-box',
                    maxWidth: '900px',
                    width: '100%',
                    margin: '0 auto'
                }}>
                    
                    {/* Accordion List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        
                        {/* Accordion Section: Registered Subjects */}
                        <div style={{
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.01)',
                            overflow: 'hidden'
                        }}>
                            <div 
                                onClick={() => toggleSection('registered-subjects')}
                                style={{
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    background: activeSection === 'registered-subjects' ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                    <CheckSquare size={14} style={{ color: '#a78bfa' }} />
                                    Registered Subjects
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#c4b5fd', background: 'rgba(167,139,250,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                        {summaryCreditsTotal} Credits
                                    </span>
                                    {activeSection === 'registered-subjects' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </div>
                            </div>

                            {activeSection === 'registered-subjects' && (
                                <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    
                                    {/* Semester Summary Card */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(99, 102, 241, 0.02) 100%)',
                                        border: '1px solid rgba(124, 58, 237, 0.15)',
                                        borderRadius: '10px',
                                        padding: '12px 14px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px'
                                    }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                            Semester Summary
                                        </span>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.55)' }}>Registered Subjects</span>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{summarySubjectsCount} Courses</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.55)' }}>Registered Credits</span>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{summaryCreditsTotal} Credits</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.55)' }}>Theory Classes / Week</span>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{summaryTheoryClassesTotal} Classes</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.55)' }}>Labs / Week</span>
                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{summaryLabSessionsTotal} Sessions</span>
                                            </div>
                                        </div>
                                        <div style={{ borderTop: '1px solid rgba(124, 58, 237, 0.1)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.5)' }}>Est. Workload Hours:</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa' }}>{summaryEstimatedHoursTotal} Hours / Week</span>
                                        </div>
                                    </div>

                                    {/* Read-Only Info Note */}
                                    <div style={{
                                        background: 'rgba(124, 58, 237, 0.05)',
                                        border: '1px solid rgba(124, 58, 237, 0.15)',
                                        borderRadius: '8px',
                                        padding: '10px 14px',
                                        fontSize: '12px',
                                        color: '#c4b5fd',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <Lock size={15} style={{ flexShrink: 0, color: '#a78bfa' }} />
                                        <span>
                                            Registered subjects are read-only (synced from Subject Registration). Set your theory classes and lab sessions per week, then click <strong>Save Changes</strong>.
                                        </span>
                                    </div>

                                    {/* Subjects Table */}
                                    {draftRegistered.length === 0 ? (
                                        <div style={{ padding: '24px', textAlign: 'center', fontSize: '12px', color: 'rgba(148,163,184,0.5)' }}>
                                            No registered subjects found for this semester. Go to Subject Registration to select subjects.
                                        </div>
                                    ) : (
                                        <div style={{
                                            overflowX: 'auto',
                                            width: '100%',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            background: 'rgba(10, 6, 22, 0.6)'
                                        }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '540px' }}>
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
                                                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>Sl No</th>
                                                        <th style={{ padding: '10px 12px' }}>Subject Code</th>
                                                        <th style={{ padding: '10px 12px' }}>Subject Name</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Credits</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Theory Classes / Week</th>
                                                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Lab Sessions / Week</th>
                                                    </tr>
                                                </thead>
                                                <tbody style={{ fontSize: '12px', color: '#fff' }}>
                                                    {draftRegistered.map((regItem, idx) => {
                                                        const subjId = regItem.subjectId || regItem._id;
                                                        const code = regItem.customCode || regItem.subject?.code || 'N/A';
                                                        const name = regItem.customName || regItem.subject?.name || 'Registered Subject';
                                                        const credits = regItem.credits ?? regItem.subject?.credits ?? 0;
                                                        const theoryVal = regItem.weeklyPlan?.theory?.required ?? 3;
                                                        const labVal = regItem.weeklyPlan?.lab?.required ?? 0;

                                                        const updatePlanRequiredHours = (type, val) => {
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

                                                        return (
                                                            <tr 
                                                                key={subjId || idx}
                                                                style={{
                                                                    borderBottom: idx === draftRegistered.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
                                                                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
                                                                }}
                                                            >
                                                                {/* Sl No */}
                                                                <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: 'rgba(148, 163, 184, 0.5)' }}>
                                                                    {idx + 1}
                                                                </td>

                                                                {/* Subject Code */}
                                                                <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                                                                    <span style={{
                                                                        fontFamily: 'monospace',
                                                                        fontSize: '11px',
                                                                        background: 'rgba(167, 139, 250, 0.12)',
                                                                        color: '#c4b5fd',
                                                                        border: '1px solid rgba(167, 139, 250, 0.2)',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '4px'
                                                                    }}>
                                                                        {code}
                                                                    </span>
                                                                </td>

                                                                {/* Subject Name */}
                                                                <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                                                                    {name}
                                                                </td>

                                                                {/* Credits */}
                                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        fontSize: '10px',
                                                                        fontWeight: 700,
                                                                        background: 'rgba(255, 255, 255, 0.06)',
                                                                        color: '#e2e8f0',
                                                                        padding: '2px 8px',
                                                                        borderRadius: '10px'
                                                                    }}>
                                                                        {credits} Credits
                                                                    </span>
                                                                </td>

                                                                {/* Theory Classes / Week */}
                                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updatePlanRequiredHours('theory', theoryVal - 1)}
                                                                            style={{
                                                                                width: '26px',
                                                                                height: '26px',
                                                                                borderRadius: '6px',
                                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                                background: 'rgba(255,255,255,0.06)',
                                                                                color: '#fff',
                                                                                fontWeight: 700,
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="15"
                                                                            value={theoryVal}
                                                                            onChange={(e) => updatePlanRequiredHours('theory', e.target.value)}
                                                                            style={{
                                                                                width: '42px',
                                                                                height: '26px',
                                                                                textAlign: 'center',
                                                                                borderRadius: '6px',
                                                                                border: '1px solid rgba(167, 139, 250, 0.3)',
                                                                                background: '#0d091f',
                                                                                color: '#c4b5fd',
                                                                                fontWeight: 700,
                                                                                fontSize: '12px',
                                                                                outline: 'none'
                                                                            }}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updatePlanRequiredHours('theory', theoryVal + 1)}
                                                                            style={{
                                                                                width: '26px',
                                                                                height: '26px',
                                                                                borderRadius: '6px',
                                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                                background: 'rgba(255,255,255,0.06)',
                                                                                color: '#fff',
                                                                                fontWeight: 700,
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                </td>

                                                                {/* Lab Sessions / Week */}
                                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updatePlanRequiredHours('lab', labVal - 1)}
                                                                            style={{
                                                                                width: '26px',
                                                                                height: '26px',
                                                                                borderRadius: '6px',
                                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                                background: 'rgba(255,255,255,0.06)',
                                                                                color: '#fff',
                                                                                fontWeight: 700,
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="10"
                                                                            value={labVal}
                                                                            onChange={(e) => updatePlanRequiredHours('lab', e.target.value)}
                                                                            style={{
                                                                                width: '42px',
                                                                                height: '26px',
                                                                                textAlign: 'center',
                                                                                borderRadius: '6px',
                                                                                border: '1px solid rgba(167, 139, 250, 0.3)',
                                                                                background: '#0d091f',
                                                                                color: '#c4b5fd',
                                                                                fontWeight: 700,
                                                                                fontSize: '12px',
                                                                                outline: 'none'
                                                                            }}
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updatePlanRequiredHours('lab', labVal + 1)}
                                                                            style={{
                                                                                width: '26px',
                                                                                height: '26px',
                                                                                borderRadius: '6px',
                                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                                background: 'rgba(255,255,255,0.06)',
                                                                                color: '#fff',
                                                                                fontWeight: 700,
                                                                                cursor: 'pointer'
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
                        </div>

                        {/* Accordion Section: Semester Duration */}
                        <div style={{
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.01)',
                            overflow: 'hidden'
                        }}>
                            <div 
                                onClick={() => toggleSection('semester')}
                                style={{
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    background: activeSection === 'semester' ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                    <Calendar size={14} style={{ color: '#a78bfa' }} />
                                    Semester Duration
                                </div>
                                {activeSection === 'semester' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>

                            {activeSection === 'semester' && (
                                <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Date validation error */}
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
                                            Last Working Day must be after Semester Start Date.
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>Semester Start Date</label>
                                        <input
                                            type="date"
                                            value={formatDateForInput(config.semesterStartDate)}
                                            max={formatDateForInput(config.lastWorkingDate) || undefined}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                onChange('semesterStartDate', val);
                                            }}
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: '4px',
                                                border: config.semesterStartDate && config.lastWorkingDate && config.semesterStartDate >= config.lastWorkingDate
                                                    ? '1px solid rgba(239, 68, 68, 0.5)'
                                                    : '1px solid rgba(255,255,255,0.08)',
                                                background: 'rgba(255,255,255,0.02)',
                                                color: '#fff',
                                                fontSize: '12.5px',
                                                outline: 'none',
                                                width: '100%',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>Last Working Day</label>
                                        <input
                                            type="date"
                                            value={formatDateForInput(config.lastWorkingDate)}
                                            min={formatDateForInput(config.semesterStartDate) || undefined}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                onChange('lastWorkingDate', val);
                                            }}
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: '4px',
                                                border: config.semesterStartDate && config.lastWorkingDate && config.lastWorkingDate <= config.semesterStartDate
                                                    ? '1px solid rgba(239, 68, 68, 0.5)'
                                                    : '1px solid rgba(255,255,255,0.08)',
                                                background: 'rgba(255,255,255,0.02)',
                                                color: '#fff',
                                                fontSize: '12.5px',
                                                outline: 'none',
                                                width: '100%',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Accordion Section: College Schedule */}
                        <div style={{
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.01)',
                            overflow: 'hidden'
                        }}>
                            <div 
                                onClick={() => toggleSection('schedule')}
                                style={{
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    background: activeSection === 'schedule' ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                    <Clock size={14} style={{ color: '#a78bfa' }} />
                                    College Schedule
                                </div>
                                {activeSection === 'schedule' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>

                            {activeSection === 'schedule' && (
                                <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>Starts At</label>
                                            <input
                                                type="time"
                                                value={minutesToTimeString(config.collegeStartMinute)}
                                                onChange={(e) => onChange('collegeStartMinute', timeStringToMinutes(e.target.value))}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    color: '#fff',
                                                    fontSize: '12.5px',
                                                    outline: 'none',
                                                    width: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>Ends At</label>
                                            <input
                                                type="time"
                                                value={minutesToTimeString(config.collegeEndMinute)}
                                                onChange={(e) => onChange('collegeEndMinute', timeStringToMinutes(e.target.value))}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    color: '#fff',
                                                    fontSize: '12.5px',
                                                    outline: 'none',
                                                    width: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>Class Period Duration</label>
                                        <select
                                            value={config.classDuration}
                                            onChange={(e) => onChange('classDuration', parseInt(e.target.value, 10))}
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: '4px',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                background: '#13111A',
                                                color: '#fff',
                                                fontSize: '12.5px',
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
                            )}
                        </div>

                        {/* Accordion Section: Break Configuration */}
                        <div style={{
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.01)',
                            overflow: 'hidden'
                        }}>
                            <div 
                                onClick={() => toggleSection('breaks')}
                                style={{
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    background: activeSection === 'breaks' ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                    <Coffee size={14} style={{ color: '#a78bfa' }} />
                                    Break Configuration
                                </div>
                                {activeSection === 'breaks' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>

                            {activeSection === 'breaks' && (
                                <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                                        <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.4)', textAlign: 'center', padding: '6px 0' }}>
                                            No breaks configured.
                                        </span>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {config.breaks.map((item, idx) => (
                                                <div 
                                                    key={idx}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        background: 'rgba(255, 255, 255, 0.01)',
                                                        border: '1px solid rgba(255, 255, 255, 0.04)',
                                                        borderRadius: '6px',
                                                        padding: '6px 10px'
                                                    }}
                                                >
                                                    <input
                                                        type="text"
                                                        value={item.name}
                                                        onChange={(e) => handleBreakFieldChange(idx, 'name', e.target.value)}
                                                        style={{
                                                            flex: 2,
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            color: '#fff',
                                                            fontSize: '12px',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                    <input
                                                        type="time"
                                                        value={minutesToTimeString(item.startMinute)}
                                                        onChange={(e) => handleBreakFieldChange(idx, 'startMinute', timeStringToMinutes(e.target.value))}
                                                        style={{
                                                            flex: 1.5,
                                                            padding: '4px 6px',
                                                            borderRadius: '4px',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            color: '#fff',
                                                            fontSize: '12px',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                    <select
                                                        value={item.duration}
                                                        onChange={(e) => handleBreakFieldChange(idx, 'duration', parseInt(e.target.value, 10))}
                                                        style={{
                                                            flex: 1.5,
                                                            padding: '4px 6px',
                                                            borderRadius: '4px',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            background: '#13111A',
                                                            color: '#fff',
                                                            fontSize: '12px',
                                                            outline: 'none',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value="10">10m</option>
                                                        <option value="15">15m</option>
                                                        <option value="20">20m</option>
                                                        <option value="30">30m</option>
                                                        <option value="45">45m</option>
                                                        <option value="60">60m</option>
                                                        <option value="90">90m</option>
                                                    </select>
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
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Accordion Section: Working Days */}
                        <div style={{
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.01)',
                            overflow: 'hidden'
                        }}>
                            <div 
                                onClick={() => toggleSection('days')}
                                style={{
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    background: activeSection === 'days' ? 'rgba(255, 255, 255, 0.02)' : 'transparent'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                    <CalendarRange size={14} style={{ color: '#a78bfa' }} />
                                    Working Days Configuration
                                </div>
                                {activeSection === 'days' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>

                            {activeSection === 'days' && (
                                <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                                                    borderRadius: '6px',
                                                    padding: '6px 12px',
                                                    gap: '12px'
                                                }}
                                            >
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                                                    {day.name}
                                                </span>

                                                <div style={{ display: 'flex', gap: '3px' }}>
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
                                                                    borderRadius: '4px',
                                                                    padding: '4px 8px',
                                                                    fontSize: '10px',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    background: isSelected ? `${themeColor}20` : 'rgba(255,255,255,0.02)',
                                                                    border: isSelected ? `1px solid ${themeColor}40` : '1px solid rgba(255,255,255,0.05)',
                                                                    color: isSelected ? themeColor : 'rgba(148, 163, 184, 0.6)',
                                                                    transition: 'all 0.15s'
                                                                }}
                                                            >
                                                                {opt.replace(' Day', '')}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                    </div>

                </div>

                {/* Sticky Bottom Save Bar */}
                <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    background: '#14121b'
                }}>
                    <div style={{
                        padding: '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        maxWidth: '900px',
                        width: '100%',
                        margin: '0 auto',
                        boxSizing: 'border-box'
                    }}>
                        {/* Regeneration Warning Info */}
                    {isConfigChanged && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            background: 'rgba(251, 191, 36, 0.04)',
                            border: '1px solid rgba(251, 191, 36, 0.12)',
                            borderRadius: '6px',
                            padding: '10px 12px'
                        }}>
                            <AlertTriangle size={14} style={{ color: '#fbbf24', marginTop: '1px', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: 'rgba(251, 191, 36, 0.85)', lineHeight: '1.4' }}>
                                Changing class duration or break timings will regenerate your timetable. 
                                Existing subject assignments will be preserved whenever possible.
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                        {/* Reset Setup Button (Left aligned) */}
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={resetting}
                            style={{
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                background: 'rgba(239, 68, 68, 0.05)',
                                color: '#f87171',
                                cursor: resetting ? 'not-allowed' : 'pointer',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                padding: '6px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                outline: 'none',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => {
                                if (!resetting) {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                    e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.5)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (!resetting) {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                                    e.currentTarget.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                                }
                            }}
                        >
                            {resetting && <Loader2 size={12} className="animate-spin" />}
                            Reset Setup
                        </button>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    padding: '6px 14px'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveTrigger}
                                disabled={(!isConfigChanged && !isRegisteredSubjectsChanged) || saving}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: (!isConfigChanged && !isRegisteredSubjectsChanged)
                                        ? 'rgba(255,255,255,0.03)' 
                                        : 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                    color: (!isConfigChanged && !isRegisteredSubjectsChanged) ? 'rgba(255,255,255,0.25)' : '#fff',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    borderRadius: '6px',
                                    padding: '6px 18px',
                                    cursor: (!isConfigChanged && !isRegisteredSubjectsChanged) || saving ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {saving && <Loader2 size={12} className="animate-spin" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

            {/* Keyframe Animations */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes drawerBackdropFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes drawerSlideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}} />
        </>
    , document.body);
};

export default TimetableSettingsDrawer;
