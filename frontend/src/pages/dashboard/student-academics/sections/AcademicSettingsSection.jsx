import React, { useState, useEffect } from 'react';
import { 
    Calendar, Clock, ShieldCheck, Lock, CheckCircle2, 
    Save, AlertTriangle, Coffee, Plus, Trash2, Edit3,
    BookOpen, Bell, CalendarDays, Sparkles, Sliders, Loader2
} from 'lucide-react';
import { useStudentAcademics } from '../../../../contexts/StudentAcademicsContext';
import { apiV2 } from '../../../../services/authService';
import EventModal from '../../settings/components/EventModal';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK = [
    { key: '1', name: 'Monday' },
    { key: '2', name: 'Tuesday' },
    { key: '3', name: 'Wednesday' },
    { key: '4', name: 'Thursday' },
    { key: '5', name: 'Friday' },
    { key: '6', name: 'Saturday' },
    { key: '7', name: 'Sunday' }
];

const AcademicSettingsSection = () => {
    const { 
        selectedSemester, 
        isFinalized, 
        timetableConfig, 
        semestersData, 
        saveConfig, 
        registeredSubjects,
        saveSubjects,
        saving 
    } = useStudentAcademics();

    // Active Tab: 'timetable' | 'academic' | 'events'
    const [activeTab, setActiveTab] = useState('timetable');

    // Timetable Config form state
    const [formConfig, setFormConfig] = useState({
        semesterStartDate: '',
        lastWorkingDate: '',
        collegeStartMinute: 480,
        collegeEndMinute: 1020,
        classDuration: 50,
        labDuration: 100,
        workingDays: {
            '1': 'Full Day',
            '2': 'Full Day',
            '3': 'Full Day',
            '4': 'Full Day',
            '5': 'Full Day',
            '6': 'Half Day',
            '7': 'Holiday'
        },
        breaks: [
            { name: 'Tea Break', startMinute: 660, duration: 15 },
            { name: 'Lunch Break', startMinute: 780, duration: 45 }
        ],
        collegeAttendanceThreshold: 85,
        personalAttendanceTarget: 90
    });

    const [validationError, setValidationError] = useState('');
    const [isConfigChanged, setIsConfigChanged] = useState(false);
    const [isEditingTimetable, setIsEditingTimetable] = useState(false);

    // Academic Subjects state
    const [draftRegistered, setDraftRegistered] = useState([]);
    const [isSubjectsChanged, setIsSubjectsChanged] = useState(false);
    const [isEditingAcademic, setIsEditingAcademic] = useState(false);
    const [savingSubjects, setSavingSubjects] = useState(false);

    // Events state
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Format Date helper
    const formatDate = (d) => {
        if (!d) return '';
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return '';
        return dt.toISOString().split('T')[0];
    };

    // Initialize config form
    useEffect(() => {
        if (timetableConfig) {
            setFormConfig({
                semesterStartDate: formatDate(timetableConfig.semesterStartDate) || '2026-08-01',
                lastWorkingDate: formatDate(timetableConfig.lastWorkingDate) || '2026-11-30',
                collegeStartMinute: timetableConfig.collegeStartMinute ?? 480,
                collegeEndMinute: timetableConfig.collegeEndMinute ?? 1020,
                classDuration: timetableConfig.classDuration ?? 50,
                labDuration: timetableConfig.labDuration ?? 100,
                workingDays: timetableConfig.workingDays || {
                    '1': 'Full Day', '2': 'Full Day', '3': 'Full Day', '4': 'Full Day', '5': 'Full Day', '6': 'Half Day', '7': 'Holiday'
                },
                breaks: timetableConfig.breaks?.length ? timetableConfig.breaks : [
                    { name: 'Tea Break', startMinute: 660, duration: 15 },
                    { name: 'Lunch Break', startMinute: 780, duration: 45 }
                ],
                collegeAttendanceThreshold: 85,
                personalAttendanceTarget: Math.max(85, timetableConfig.personalAttendanceTarget || 90)
            });
            setIsConfigChanged(false);
            setValidationError('');
        }
    }, [timetableConfig]);

    // Initialize draft registered subjects
    useEffect(() => {
        if (registeredSubjects) {
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
            setIsSubjectsChanged(false);
        }
    }, [registeredSubjects]);

    // Fetch Academic Events
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
        fetchEvents();
    }, [selectedSemester]);

    const handleDateChange = (field, value) => {
        setFormConfig(prev => {
            const next = { ...prev, [field]: value };
            validateDates(next.semesterStartDate, next.lastWorkingDate);
            return next;
        });
        setIsConfigChanged(true);
    };

    const validateDates = (startStr, endStr) => {
        setValidationError('');
        if (!startStr || !endStr) return true;

        const start = new Date(startStr);
        const end = new Date(endStr);

        if (start >= end) {
            setValidationError('Semester start date must precede last working date.');
            return false;
        }
        return true;
    };

    const handleWorkingDayToggle = (dayKey, status) => {
        setFormConfig(prev => ({
            ...prev,
            workingDays: {
                ...prev.workingDays,
                [dayKey]: status
            }
        }));
        setIsConfigChanged(true);
    };

    const handleAddBreak = () => {
        const currentCount = formConfig.breaks?.length || 0;
        let defaultName = 'Tea Break';
        if (currentCount === 1) defaultName = 'Lunch Break';
        else if (currentCount > 1) defaultName = `Break ${currentCount + 1}`;

        setFormConfig(prev => ({
            ...prev,
            breaks: [...prev.breaks, { name: defaultName, startMinute: 660, duration: 15 }]
        }));
        setIsConfigChanged(true);
    };

    const handleRemoveBreak = (idx) => {
        setFormConfig(prev => ({
            ...prev,
            breaks: prev.breaks.filter((_, i) => i !== idx)
        }));
        setIsConfigChanged(true);
    };

    const handleBreakChange = (idx, field, val) => {
        setFormConfig(prev => {
            const newBreaks = [...prev.breaks];
            if (field === 'endMinute') {
                const startM = newBreaks[idx]?.startMinute ?? 660;
                const endM = val;
                const dur = Math.max(5, endM - startM);
                newBreaks[idx] = { ...newBreaks[idx], duration: dur };
            } else if (field === 'startMinute') {
                const oldStart = newBreaks[idx]?.startMinute ?? 660;
                const oldDur = newBreaks[idx]?.duration ?? 15;
                const oldEnd = oldStart + oldDur;
                const newStart = val;
                const newDur = Math.max(5, oldEnd - newStart);
                newBreaks[idx] = { ...newBreaks[idx], startMinute: newStart, duration: newDur };
            } else {
                newBreaks[idx] = { ...newBreaks[idx], [field]: val };
            }
            return { ...prev, breaks: newBreaks };
        });
        setIsConfigChanged(true);
    };

    const handleSaveConfig = async (e) => {
        if (e) e.preventDefault();
        
        const collegeThreshold = formConfig.collegeAttendanceThreshold || 85;
        let targetAtt = Number(formConfig.personalAttendanceTarget) || collegeThreshold;
        if (targetAtt < collegeThreshold) targetAtt = collegeThreshold;
        if (targetAtt > 100) targetAtt = 100;

        const payload = {
            ...formConfig,
            personalAttendanceTarget: targetAtt
        };

        const success = await saveConfig(payload);
        if (success) {
            setFormConfig(prev => ({ ...prev, personalAttendanceTarget: targetAtt }));
            setIsConfigChanged(false);
        }
    };

    const minutesToTime = (min) => {
        if (min === undefined || min === null) return '08:00';
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const timeToMinutes = (timeStr) => {
        if (!timeStr) return 480;
        const [h, m] = timeStr.split(':').map(Number);
        return (h * 60) + (m || 0);
    };

    // Subject Plan Stepper Handlers
    const updateSubjectPlan = (subjId, type, val) => {
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
        setIsSubjectsChanged(true);
    };

    const updateSubjectCategory = (subjId, newCat) => {
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
        setIsSubjectsChanged(true);
    };

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
        setIsSubjectsChanged(true);
    };

    const handleSaveSubjects = async () => {
        try {
            setSavingSubjects(true);
            const payload = {
                subjects: draftRegistered.map(d => ({
                    _id: d._id?.startsWith('custom-') ? null : d._id,
                    subjectId: d.subjectId,
                    customName: d.customName,
                    customCode: d.customCode,
                    credits: d.credits,
                    category: d.category,
                    weeklyPlan: d.weeklyPlan
                }))
            };
            const res = await apiV2.saveRegisteredSubjects(payload);
            if (res.data?.success) {
                toast.success('Subject weekly plan saved successfully!');
                setIsSubjectsChanged(false);
            }
        } catch (err) {
            console.error('Error saving subjects:', err);
            toast.error(err.response?.data?.message || 'Failed to save subjects');
        } finally {
            setSavingSubjects(false);
        }
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

    // Summary calculations
    const summarySubjectsCount = draftRegistered.length;
    const summaryCreditsTotal = draftRegistered.reduce((sum, item) => sum + (item.credits || 0), 0);
    const summaryTheoryClassesTotal = draftRegistered.reduce((sum, item) => sum + (item.weeklyPlan?.theory?.required || 0), 0);
    const summaryLabSessionsTotal = draftRegistered.reduce((sum, item) => sum + (item.weeklyPlan?.lab?.required || 0), 0);
    const summaryEstimatedHoursTotal = summaryTheoryClassesTotal + (summaryLabSessionsTotal * 2);

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

    // Shared input style matching dark theme aesthetics
    const inputStyle = {
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid rgba(167, 139, 250, 0.3)',
        background: '#0d071e',
        color: '#ffffff',
        colorScheme: 'dark',
        fontSize: '13px',
        fontWeight: 500,
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box'
    };

    const labelStyle = {
        fontSize: '12px',
        fontWeight: 600,
        color: 'rgba(148, 163, 184, 0.8)'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            
            {/* Top Navigation Switcher */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingBottom: '4px'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('timetable')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: activeTab === 'timetable' ? 'rgba(124, 58, 237, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                            border: activeTab === 'timetable' ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: activeTab === 'timetable' ? '#fff' : 'rgba(148, 163, 184, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.15s'
                        }}
                    >
                        <Clock size={15} style={{ color: activeTab === 'timetable' ? '#a78bfa' : 'inherit' }} />
                        <span>1. Timetable Settings</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('academic')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: activeTab === 'academic' ? 'rgba(124, 58, 237, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                            border: activeTab === 'academic' ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: activeTab === 'academic' ? '#fff' : 'rgba(148, 163, 184, 0.7)',
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

                    <button
                        type="button"
                        onClick={() => setActiveTab('events')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: activeTab === 'events' ? 'rgba(124, 58, 237, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                            border: activeTab === 'events' ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                            color: activeTab === 'events' ? '#fff' : 'rgba(148, 163, 184, 0.7)',
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

                {/* Top Right Action: Edit Button / Save & Cancel */}
                {activeTab === 'timetable' && !isFinalized && (
                    !isEditingTimetable ? (
                        <button
                            type="button"
                            onClick={() => setIsEditingTimetable(true)}
                            style={{
                                background: 'rgba(124, 58, 237, 0.15)',
                                border: '1px solid rgba(139, 92, 246, 0.4)',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                color: '#c4b5fd',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s'
                            }}
                        >
                            <Edit3 size={13} className="text-purple-300" />
                            Edit Settings
                        </button>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isConfigChanged && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    color: '#f59e0b',
                                    background: 'rgba(245, 158, 11, 0.12)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    padding: '4px 10px',
                                    borderRadius: '6px'
                                }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                                    You have unsaved changes
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    if (timetableConfig) {
                                        setFormConfig({
                                            semesterStartDate: formatDate(timetableConfig.semesterStartDate) || '2026-08-01',
                                            lastWorkingDate: formatDate(timetableConfig.lastWorkingDate) || '2026-11-30',
                                            collegeStartMinute: timetableConfig.collegeStartMinute ?? 480,
                                            collegeEndMinute: timetableConfig.collegeEndMinute ?? 1020,
                                            classDuration: timetableConfig.classDuration ?? 50,
                                            labDuration: timetableConfig.labDuration ?? 100,
                                            workingDays: timetableConfig.workingDays || {
                                                '1': 'Full Day', '2': 'Full Day', '3': 'Full Day', '4': 'Full Day', '5': 'Full Day', '6': 'Half Day', '7': 'Holiday'
                                            },
                                            breaks: timetableConfig.breaks?.length ? timetableConfig.breaks : [
                                                { name: 'Tea Break', startMinute: 660, duration: 15 },
                                                { name: 'Lunch Break', startMinute: 780, duration: 45 }
                                            ],
                                            collegeAttendanceThreshold: 85,
                                            personalAttendanceTarget: Math.max(85, timetableConfig.personalAttendanceTarget || 90)
                                        });
                                    }
                                    setIsEditingTimetable(false);
                                    setIsConfigChanged(false);
                                }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    padding: '8px 14px',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '12.5px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={async (e) => {
                                    await handleSaveConfig(e);
                                    setIsEditingTimetable(false);
                                }}
                                disabled={saving}
                                style={{
                                    background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 18px',
                                    color: '#fff',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)'
                                }}
                            >
                                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                Save Changes
                            </button>
                        </div>
                    )
                )}

                {activeTab === 'academic' && !isFinalized && (
                    !isEditingAcademic ? (
                        <button
                            type="button"
                            onClick={() => setIsEditingAcademic(true)}
                            style={{
                                background: 'rgba(124, 58, 237, 0.15)',
                                border: '1px solid rgba(139, 92, 246, 0.4)',
                                borderRadius: '8px',
                                padding: '8px 16px',
                                color: '#c4b5fd',
                                fontSize: '12.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s'
                            }}
                        >
                            <Edit3 size={13} className="text-purple-300" />
                            Edit Academic Plan
                        </button>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isSubjectsChanged && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11.5px',
                                    fontWeight: 600,
                                    color: '#f59e0b',
                                    background: 'rgba(245, 158, 11, 0.12)',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                    padding: '4px 10px',
                                    borderRadius: '6px'
                                }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                                    You have unsaved changes
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    if (registeredSubjects) {
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
                                    setIsEditingAcademic(false);
                                    setIsSubjectsChanged(false);
                                }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    padding: '8px 14px',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '12.5px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    await handleSaveSubjects();
                                    setIsEditingAcademic(false);
                                }}
                                disabled={savingSubjects}
                                style={{
                                    background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 18px',
                                    color: '#fff',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)'
                                }}
                            >
                                {savingSubjects ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                Save Changes
                            </button>
                        </div>
                    )
                )}
            </div>

            {/* Date Validation Alert */}
            {validationError && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <AlertTriangle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
                    <span>{validationError}</span>
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 1: TIMETABLE SETTINGS (COHESIVE SINGLE-PAGE SECTIONS)     */}
            {/* ============================================================ */}
            {activeTab === 'timetable' && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    boxSizing: 'border-box'
                }}>
                    
                    {/* Section 1: Timetable Basic Schedule & Durations */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                            1. Daily Timings & Durations
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '16px'
                        }} className="academic-grid-2">
                            {/* Day Starts At */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={labelStyle}>Day Starts At *</label>
                                <input
                                    type="time"
                                    value={minutesToTime(formConfig.collegeStartMinute)}
                                    onChange={(e) => {
                                        setFormConfig(prev => ({ ...prev, collegeStartMinute: timeToMinutes(e.target.value) }));
                                        setIsConfigChanged(true);
                                    }}
                                    disabled={isFinalized || !isEditingTimetable}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Day Ends At */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={labelStyle}>Day Ends At *</label>
                                <input
                                    type="time"
                                    value={minutesToTime(formConfig.collegeEndMinute)}
                                    onChange={(e) => {
                                        setFormConfig(prev => ({ ...prev, collegeEndMinute: timeToMinutes(e.target.value) }));
                                        setIsConfigChanged(true);
                                    }}
                                    disabled={isFinalized || !isEditingTimetable}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Normal Class Duration */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={labelStyle}>Normal Class Duration *</label>
                                <select
                                    value={formConfig.classDuration}
                                    onChange={(e) => {
                                        setFormConfig(prev => ({ ...prev, classDuration: Number(e.target.value) }));
                                        setIsConfigChanged(true);
                                    }}
                                    disabled={isFinalized || !isEditingTimetable}
                                    style={inputStyle}
                                >
                                    <option value={10} style={{ background: '#0d071e', color: '#fff' }}>10 Minutes</option>
                                    <option value={15} style={{ background: '#0d071e', color: '#fff' }}>15 Minutes</option>
                                    <option value={20} style={{ background: '#0d071e', color: '#fff' }}>20 Minutes</option>
                                    <option value={25} style={{ background: '#0d071e', color: '#fff' }}>25 Minutes</option>
                                    <option value={30} style={{ background: '#0d071e', color: '#fff' }}>30 Minutes</option>
                                    <option value={35} style={{ background: '#0d071e', color: '#fff' }}>35 Minutes</option>
                                    <option value={40} style={{ background: '#0d071e', color: '#fff' }}>40 Minutes</option>
                                    <option value={45} style={{ background: '#0d071e', color: '#fff' }}>45 Minutes</option>
                                    <option value={50} style={{ background: '#0d071e', color: '#fff' }}>50 Minutes</option>
                                    <option value={55} style={{ background: '#0d071e', color: '#fff' }}>55 Minutes</option>
                                    <option value={60} style={{ background: '#0d071e', color: '#fff' }}>60 Minutes (1 Hour)</option>
                                    <option value={70} style={{ background: '#0d071e', color: '#fff' }}>70 Minutes</option>
                                    <option value={75} style={{ background: '#0d071e', color: '#fff' }}>75 Minutes</option>
                                    <option value={80} style={{ background: '#0d071e', color: '#fff' }}>80 Minutes</option>
                                    <option value={90} style={{ background: '#0d071e', color: '#fff' }}>90 Minutes (1.5 Hours)</option>
                                    <option value={100} style={{ background: '#0d071e', color: '#fff' }}>100 Minutes</option>
                                    <option value={110} style={{ background: '#0d071e', color: '#fff' }}>110 Minutes</option>
                                    <option value={120} style={{ background: '#0d071e', color: '#fff' }}>120 Minutes (2 Hours)</option>
                                </select>
                            </div>

                            {/* Lab Session Duration */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={labelStyle}>Lab Session Duration *</label>
                                <select
                                    value={formConfig.labDuration}
                                    onChange={(e) => {
                                        setFormConfig(prev => ({ ...prev, labDuration: Number(e.target.value) }));
                                        setIsConfigChanged(true);
                                    }}
                                    disabled={isFinalized || !isEditingTimetable}
                                    style={inputStyle}
                                >
                                    <option value={30} style={{ background: '#0d071e', color: '#fff' }}>30 Minutes</option>
                                    <option value={45} style={{ background: '#0d071e', color: '#fff' }}>45 Minutes</option>
                                    <option value={50} style={{ background: '#0d071e', color: '#fff' }}>50 Minutes</option>
                                    <option value={60} style={{ background: '#0d071e', color: '#fff' }}>60 Minutes (1 Hour)</option>
                                    <option value={75} style={{ background: '#0d071e', color: '#fff' }}>75 Minutes</option>
                                    <option value={80} style={{ background: '#0d071e', color: '#fff' }}>80 Minutes</option>
                                    <option value={90} style={{ background: '#0d071e', color: '#fff' }}>90 Minutes (1.5 Hours)</option>
                                    <option value={100} style={{ background: '#0d071e', color: '#fff' }}>100 Minutes</option>
                                    <option value={110} style={{ background: '#0d071e', color: '#fff' }}>110 Minutes</option>
                                    <option value={120} style={{ background: '#0d071e', color: '#fff' }}>120 Minutes (2 Hours)</option>
                                    <option value={150} style={{ background: '#0d071e', color: '#fff' }}>150 Minutes (2.5 Hours)</option>
                                    <option value={180} style={{ background: '#0d071e', color: '#fff' }}>180 Minutes (3 Hours)</option>
                                    <option value={240} style={{ background: '#0d071e', color: '#fff' }}>240 Minutes (4 Hours)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

                    {/* Section 2: Break Timings (Any N Breaks with Start & End time) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                                2. Break Timings & Intervals
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddBreak}
                                disabled={isFinalized || !isEditingTimetable}
                                style={{
                                    background: isEditingTimetable ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                    border: isEditingTimetable ? '1px solid rgba(124, 58, 237, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '6px',
                                    padding: '5px 12px',
                                    color: isEditingTimetable ? '#c4b5fd' : 'rgba(148, 163, 184, 0.5)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: isEditingTimetable ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                <Plus size={13} />
                                Add Break
                            </button>
                        </div>

                        {formConfig.breaks.length === 0 ? (
                            <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'rgba(148,163,184,0.6)', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                                No breaks configured. Click "Add Break" to include lunch, snacks, or interval pauses.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {formConfig.breaks.map((brk, idx) => (
                                    <div key={idx} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1.3fr 1.3fr auto',
                                        gap: '12px',
                                        alignItems: 'center',
                                        padding: '10px 14px',
                                        background: 'rgba(255, 255, 255, 0.01)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: '6px'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.7)' }}>Break Name</label>
                                            <input
                                                type="text"
                                                value={brk.name}
                                                onChange={(e) => handleBreakChange(idx, 'name', e.target.value)}
                                                placeholder="Break Name (e.g. Lunch)"
                                                disabled={isFinalized || !isEditingTimetable}
                                                style={inputStyle}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.7)' }}>Starts At</label>
                                            <input
                                                type="time"
                                                value={minutesToTime(brk.startMinute)}
                                                onChange={(e) => handleBreakChange(idx, 'startMinute', timeToMinutes(e.target.value))}
                                                disabled={isFinalized || !isEditingTimetable}
                                                style={inputStyle}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.7)' }}>
                                                Ends At <span style={{ color: '#c4b5fd', fontWeight: 600 }}>({brk.duration || 15} min)</span>
                                            </label>
                                            <input
                                                type="time"
                                                value={minutesToTime((brk.startMinute || 0) + (brk.duration || 15))}
                                                onChange={(e) => handleBreakChange(idx, 'endMinute', timeToMinutes(e.target.value))}
                                                disabled={isFinalized || !isEditingTimetable}
                                                style={inputStyle}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveBreak(idx)}
                                            disabled={isFinalized || !isEditingTimetable}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '8px',
                                                color: '#f87171',
                                                cursor: (isFinalized || !isEditingTimetable) ? 'not-allowed' : 'pointer',
                                                marginTop: '16px',
                                                opacity: (isFinalized || !isEditingTimetable) ? 0.4 : 1
                                            }}
                                            title="Delete break"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

                    {/* Section 3: Attendance Thresholds */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                            3. Attendance Thresholds
                        </h3>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '16px'
                        }} className="academic-grid-2">
                            {/* College Minimum Eligibility */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={labelStyle}>College Minimum Eligibility</label>
                                <div style={{
                                    ...inputStyle,
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{ fontWeight: 600, color: '#c4b5fd' }}>{formConfig.collegeAttendanceThreshold || 85}%</span>
                                    <span style={{ fontSize: '10px', color: '#a78bfa', background: 'rgba(167, 139, 250, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                        SIT College Policy (85%)
                                    </span>
                                </div>
                            </div>

                            {/* Target Attendance */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <label style={labelStyle}>My Target Attendance (%)</label>
                                    <span style={{ fontSize: '10.5px', color: 'rgba(148, 163, 184, 0.7)' }}>
                                        Min {formConfig.collegeAttendanceThreshold || 85}% — Max 100%
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    min={formConfig.collegeAttendanceThreshold || 85}
                                    max={100}
                                    value={formConfig.personalAttendanceTarget}
                                    onChange={(e) => {
                                        const rawVal = e.target.value;
                                        setFormConfig(prev => ({
                                            ...prev,
                                            personalAttendanceTarget: rawVal === '' ? '' : Number(rawVal)
                                        }));
                                        setIsConfigChanged(true);
                                    }}
                                    onBlur={(e) => {
                                        const collegeThreshold = formConfig.collegeAttendanceThreshold || 85;
                                        const val = Number(e.target.value);
                                        if (!val || val < collegeThreshold) {
                                            toast.error(`Target attendance cannot be lower than SIT college policy (${collegeThreshold}%). Resetting to ${collegeThreshold}%.`);
                                            setFormConfig(prev => ({ ...prev, personalAttendanceTarget: collegeThreshold }));
                                        } else if (val > 100) {
                                            toast.error('Target attendance cannot exceed 100%. Clamping to 100%.');
                                            setFormConfig(prev => ({ ...prev, personalAttendanceTarget: 100 }));
                                        }
                                        setIsConfigChanged(true);
                                    }}
                                    disabled={isFinalized || !isEditingTimetable}
                                    style={{ ...inputStyle, color: '#34d399', fontWeight: 700, fontSize: '14px' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: ACADEMIC SETTINGS (SUBJECT-WISE WEEKLY CLASSES & LABS) */}
            {/* ============================================================ */}
            {activeTab === 'academic' && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    boxSizing: 'border-box'
                }}>
                    
                    {/* Header with Title & Add Subject button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                                1. Subject Weekly Sessions & Plan
                            </h3>
                            <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)' }}>
                                Configure weekly theory classes and lab sessions per subject. For Theory + Lab courses, set both independently.
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddCustomSubject}
                            disabled={isFinalized || !isEditingAcademic}
                            style={{
                                background: isEditingAcademic ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                border: isEditingAcademic ? '1px solid rgba(124, 58, 237, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                color: isEditingAcademic ? '#c4b5fd' : 'rgba(148, 163, 184, 0.5)',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: isEditingAcademic ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <Plus size={13} />
                            Add Custom Subject
                        </button>
                    </div>

                    {/* Subjects Table */}
                    {draftRegistered.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', fontSize: '12.5px', color: 'rgba(148,163,184,0.5)' }}>
                            No registered subjects found for this semester. Click "Add Custom Subject" above.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto', width: '100%' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                        color: 'rgba(148, 163, 184, 0.8)',
                                        fontWeight: 600,
                                        fontSize: '11.5px'
                                    }}>
                                        <th style={{ padding: '10px 8px', width: '36px', textAlign: 'center' }}>#</th>
                                        <th style={{ padding: '10px 12px', width: '110px' }}>Code</th>
                                        <th style={{ padding: '10px 12px' }}>Subject Name</th>
                                        <th style={{ padding: '10px 12px', width: '130px' }}>Category</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '130px' }}>Theory / Wk</th>
                                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '130px' }}>Lab / Wk</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {draftRegistered.map((regItem, idx) => {
                                        const subjId = regItem.subjectId || regItem._id;
                                        const code = regItem.customCode || regItem.subject?.code || 'N/A';
                                        const name = regItem.customName || regItem.subject?.name || 'Subject';
                                        const category = regItem.category || 'Theory';
                                        const theoryVal = regItem.weeklyPlan?.theory?.required ?? 4;
                                        const labVal = regItem.weeklyPlan?.lab?.required ?? 0;

                                        return (
                                            <tr key={subjId || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                                <td style={{ padding: '10px 8px', textAlign: 'center', color: 'rgba(148, 163, 184, 0.5)' }}>{idx + 1}</td>
                                                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#c4b5fd', fontFamily: 'monospace' }}>{code}</td>
                                                <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 500 }}>{name}</td>
                                                <td style={{ padding: '10px 12px' }}>
                                                    <select
                                                        value={category}
                                                        onChange={(e) => updateSubjectCategory(subjId, e.target.value)}
                                                        disabled={isFinalized || !isEditingAcademic}
                                                        style={{
                                                            padding: '5px 8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid rgba(255,255,255,0.08)',
                                                            background: '#13111A',
                                                            color: category === 'Theory + Lab' ? '#c4b5fd' : category === 'Lab Only' ? '#6ee7b7' : '#93c5fd',
                                                            fontSize: '11.5px',
                                                            fontWeight: 600,
                                                            outline: 'none',
                                                            cursor: (isFinalized || !isEditingAcademic) ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        <option value="Theory" style={{ background: '#0d071e', color: '#fff' }}>Theory</option>
                                                        <option value="Theory + Lab" style={{ background: '#0d071e', color: '#fff' }}>Theory + Lab</option>
                                                        <option value="Lab Only" style={{ background: '#0d071e', color: '#fff' }}>Lab Only</option>
                                                    </select>
                                                </td>

                                                {/* Theory / Week */}
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <button
                                                            type="button"
                                                            disabled={isFinalized || !isEditingAcademic || category === 'Lab Only'}
                                                            onClick={() => updateSubjectPlan(subjId, 'theory', theoryVal - 1)}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '4px',
                                                                border: '1px solid rgba(255,255,255,0.08)',
                                                                background: 'rgba(255,255,255,0.02)',
                                                                color: '#fff',
                                                                fontWeight: 700,
                                                                cursor: (isFinalized || !isEditingAcademic || category === 'Lab Only') ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="15"
                                                            disabled={isFinalized || !isEditingAcademic || category === 'Lab Only'}
                                                            value={category === 'Lab Only' ? 0 : theoryVal}
                                                            onChange={(e) => updateSubjectPlan(subjId, 'theory', e.target.value)}
                                                            style={{
                                                                width: '36px',
                                                                height: '24px',
                                                                textAlign: 'center',
                                                                borderRadius: '4px',
                                                                border: '1px solid rgba(96, 165, 250, 0.3)',
                                                                background: '#13111A',
                                                                color: '#93c5fd',
                                                                fontWeight: 700,
                                                                fontSize: '12px',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            disabled={isFinalized || !isEditingAcademic || category === 'Lab Only'}
                                                            onClick={() => updateSubjectPlan(subjId, 'theory', theoryVal + 1)}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '4px',
                                                                border: '1px solid rgba(255,255,255,0.08)',
                                                                background: 'rgba(255,255,255,0.02)',
                                                                color: '#fff',
                                                                fontWeight: 700,
                                                                cursor: (isFinalized || !isEditingAcademic || category === 'Lab Only') ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>

                                                {/* Lab / Week */}
                                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <button
                                                            type="button"
                                                            disabled={isFinalized || !isEditingAcademic || category === 'Theory'}
                                                            onClick={() => updateSubjectPlan(subjId, 'lab', labVal - 1)}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '4px',
                                                                border: '1px solid rgba(255,255,255,0.08)',
                                                                background: 'rgba(255,255,255,0.02)',
                                                                color: '#fff',
                                                                fontWeight: 700,
                                                                cursor: (isFinalized || !isEditingAcademic || category === 'Theory') ? 'not-allowed' : 'pointer'
                                                            }}
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="10"
                                                            disabled={isFinalized || !isEditingAcademic || category === 'Theory'}
                                                            value={category === 'Theory' ? 0 : labVal}
                                                            onChange={(e) => updateSubjectPlan(subjId, 'lab', e.target.value)}
                                                            style={{
                                                                width: '36px',
                                                                height: '24px',
                                                                textAlign: 'center',
                                                                borderRadius: '4px',
                                                                border: '1px solid rgba(52, 211, 153, 0.3)',
                                                                background: '#13111A',
                                                                color: '#6ee7b7',
                                                                fontWeight: 700,
                                                                fontSize: '12px',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            disabled={isFinalized || !isEditingAcademic || category === 'Theory'}
                                                            onClick={() => updateSubjectPlan(subjId, 'lab', labVal + 1)}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '4px',
                                                                border: '1px solid rgba(255,255,255,0.08)',
                                                                background: 'rgba(255,255,255,0.02)',
                                                                color: '#fff',
                                                                fontWeight: 700,
                                                                cursor: (isFinalized || !isEditingAcademic || category === 'Theory') ? 'not-allowed' : 'pointer'
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

                    {/* Bottom Save Bar */}
                    {isSubjectsChanged && !isFinalized && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setIsSubjectsChanged(false)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '6px',
                                    padding: '8px 16px',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '12.5px',
                                    fontWeight: 500,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveSubjects}
                                disabled={savingSubjects}
                                style={{
                                    background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '8px 20px',
                                    color: '#fff',
                                    fontSize: '12.5px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {savingSubjects ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                                Save Academic Settings
                            </button>
                        </div>
                    )}

                </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: EVENTS (SEMESTER MILESTONES & DATES)                  */}
            {/* ============================================================ */}
            {activeTab === 'events' && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                                1. Semester Academic Events & Milestones
                            </h3>
                            <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)' }}>
                                Add CIE 1/2/3, unit tests, quizzes, vacations (from–to), SEE exams, and fests
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setSelectedEvent(null);
                                setIsEventModalOpen(true);
                            }}
                            disabled={isFinalized}
                            style={{
                                background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '7px 16px',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <Plus size={13} />
                            Add Semester Event
                        </button>
                    </div>

                    {/* Events List */}
                    {loadingEvents ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 0', gap: '8px', color: '#c4b5fd' }}>
                            <Loader2 size={16} className="animate-spin" />
                            <span style={{ fontSize: '12px' }}>Loading semester events...</span>
                        </div>
                    ) : events.length === 0 ? (
                        <div style={{ padding: '30px', textAlign: 'center', fontSize: '12.5px', color: 'rgba(148,163,184,0.5)' }}>
                            No semester events added yet. Click "Add Semester Event" above to record tests, quizzes, and vacations.
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
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '12px',
                                            padding: '12px 14px',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.01)',
                                            border: '1px solid rgba(255, 255, 255, 0.05)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '4px', height: '32px', borderRadius: '2px', backgroundColor: badge.text }} />
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{ev.title}</span>
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
                                                    <Calendar size={11} />
                                                    <span>{isMultiDay ? `${startFormatted} → ${endFormatted}` : startFormatted}</span>
                                                    {ev.description && <span>· {ev.description}</span>}
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
                                                disabled={isFinalized}
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
                                                disabled={isFinalized}
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

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 640px) {
                    .academic-grid-2 {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}} />
        </div>
    );
};

export default AcademicSettingsSection;
