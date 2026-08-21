import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../utils/hooks';
import { apiV2 } from '../../../services/authService';
import toast from 'react-hot-toast';
import { 
    BookOpen, 
    Calendar, 
    Clock, 
    Coffee, 
    CalendarRange, 
    Lock, 
    Save, 
    Sparkles, 
    Plus, 
    Trash2, 
    RefreshCw, 
    ArrowRight,
    AlertCircle
} from 'lucide-react';

const AcademicRegisterPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'weekly'
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [isSavingBasic, setIsSavingBasic] = useState(false);
    const [isSavingPlan, setIsSavingPlan] = useState(false);

    const [registeredSubjectsList, setRegisteredSubjectsList] = useState([]);
    const [editedWeeklyPlan, setEditedWeeklyPlan] = useState({});

    // Smart default date helper
    const getSmartDefaultDates = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        if (currentMonth >= 4 && currentMonth <= 9) {
            return { start: `${currentYear}-08-01`, end: `${currentYear}-11-30` };
        } else {
            const yearForEvenSem = (currentMonth === 10 || currentMonth === 11) ? currentYear + 1 : currentYear;
            return { start: `${yearForEvenSem}-02-01`, end: `${yearForEvenSem}-05-31` };
        }
    };

    // Date formatting helper for HTML5 <input type="date">
    const formatDateForInput = (dateVal) => {
        if (!dateVal) return '';
        if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
            return dateVal;
        }
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // Configuration state
    const [config, setConfig] = useState(() => {
        const defaults = getSmartDefaultDates();
        return {
            semesterStartDate: defaults.start,
            lastWorkingDate: defaults.end,
            collegeStartMinute: 480, // 08:00 AM
            collegeEndMinute: 1020,  // 05:00 PM
            classDuration: 50,
            workingDays: {
                mon: 'Full Day', '1': 'Full Day',
                tue: 'Full Day', '2': 'Full Day',
                wed: 'Full Day', '3': 'Full Day',
                thu: 'Full Day', '4': 'Full Day',
                fri: 'Full Day', '5': 'Full Day',
                sat: 'Half Day', '6': 'Half Day'
            },
            breaks: [
                { name: 'Tea Break', startMinute: 660, duration: 15 },
                { name: 'Lunch Break', startMinute: 780, duration: 45 }
            ]
        };
    });

    // Helper conversions for time string <-> minutes
    const timeStringToMinutes = (timeStr) => {
        if (!timeStr) return 480;
        const [h, m] = timeStr.split(':').map(Number);
        return (h * 60) + (m || 0);
    };

    const minutesToTimeString = (mins) => {
        if (mins === undefined || mins === null) return '08:00';
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    // Days config definition
    const daysList = [
        { key: 'mon', numKey: '1', name: 'Monday' },
        { key: 'tue', numKey: '2', name: 'Tuesday' },
        { key: 'wed', numKey: '3', name: 'Wednesday' },
        { key: 'thu', numKey: '4', name: 'Thursday' },
        { key: 'fri', numKey: '5', name: 'Friday' },
        { key: 'sat', numKey: '6', name: 'Saturday' }
    ];

    // Helper to resolve working day status safely
    const getWorkingDayStatus = (workingDaysObj, day) => {
        if (!workingDaysObj) return 'Full Day';
        return workingDaysObj[day.key] || workingDaysObj[day.numKey] || 'Full Day';
    };

    // Initial data fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Timetable Config
                const configRes = await apiV2.getTimetableConfig();
                if (configRes.data?.success && configRes.data?.data) {
                    const dbConfig = configRes.data.data;
                    const defaults = getSmartDefaultDates();
                    setConfig({
                        semesterStartDate: formatDateForInput(dbConfig.semesterStartDate) || defaults.start,
                        lastWorkingDate: formatDateForInput(dbConfig.lastWorkingDate) || defaults.end,
                        collegeStartMinute: dbConfig.collegeStartMinute ?? 480,
                        collegeEndMinute: dbConfig.collegeEndMinute ?? 1020,
                        classDuration: dbConfig.classDuration ?? 50,
                        workingDays: dbConfig.workingDays || {
                            mon: 'Full Day', '1': 'Full Day',
                            tue: 'Full Day', '2': 'Full Day',
                            wed: 'Full Day', '3': 'Full Day',
                            thu: 'Full Day', '4': 'Full Day',
                            fri: 'Full Day', '5': 'Full Day',
                            sat: 'Half Day', '6': 'Half Day'
                        },
                        breaks: dbConfig.breaks || [
                            { name: 'Tea Break', startMinute: 660, duration: 15 },
                            { name: 'Lunch Break', startMinute: 780, duration: 45 }
                        ]
                    });
                }

                // 2. Fetch Registered Subjects
                const regRes = await apiV2.getRegisteredSubjects();
                if (regRes.data?.success && Array.isArray(regRes.data?.data)) {
                    const list = regRes.data.data;
                    setRegisteredSubjectsList(list);

                    // Pre-fill edited plan map
                    const planMap = {};
                    list.forEach(item => {
                        planMap[item._id] = {
                            theory: item.weeklyPlan?.theory?.required ?? 3,
                            lab: item.weeklyPlan?.lab?.required ?? 0
                        };
                    });
                    setEditedWeeklyPlan(planMap);
                }
            } catch (err) {
                console.error('[AcademicRegisterPage] Error fetching data:', err);
                toast.error('Failed to load academic setup data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handlers for subject theory/lab counts
    const handleTheoryChange = (regId, value) => {
        const val = Math.max(0, parseInt(value, 10) || 0);
        setEditedWeeklyPlan(prev => ({
            ...prev,
            [regId]: {
                ...prev[regId],
                theory: val
            }
        }));
    };

    const handleLabChange = (regId, value) => {
        const val = Math.max(0, parseInt(value, 10) || 0);
        setEditedWeeklyPlan(prev => ({
            ...prev,
            [regId]: {
                ...prev[regId],
                lab: val
            }
        }));
    };

    // Break Handlers
    const handleAddBreak = () => {
        setConfig(prev => ({
            ...prev,
            breaks: [
                ...(prev.breaks || []),
                { name: 'Short Break', startMinute: 600, duration: 15 }
            ]
        }));
    };

    const handleRemoveBreak = (index) => {
        setConfig(prev => ({
            ...prev,
            breaks: (prev.breaks || []).filter((_, idx) => idx !== index)
        }));
    };

    const handleBreakFieldChange = (index, field, value) => {
        setConfig(prev => {
            const updatedBreaks = [...(prev.breaks || [])];
            updatedBreaks[index] = {
                ...updatedBreaks[index],
                [field]: value
            };
            return { ...prev, breaks: updatedBreaks };
        });
    };

    const handleDayStatusChange = (dayObj, status) => {
        setConfig(prev => ({
            ...prev,
            workingDays: {
                ...(prev.workingDays || {}),
                [dayObj.key]: status,
                [dayObj.numKey]: status
            }
        }));
    };

    // Calculate Semester Weeks
    const calculateWeeks = useMemo(() => {
        if (!config.semesterStartDate || !config.lastWorkingDate) return 0;
        const start = new Date(config.semesterStartDate);
        const end = new Date(config.lastWorkingDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 0;
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        return Math.max(1, Math.round(diffDays / 7));
    }, [config.semesterStartDate, config.lastWorkingDate]);

    // Save Basic Setup (Tab 1)
    const handleSaveBasicSetup = async () => {
        try {
            setIsSavingBasic(true);
            const payload = {
                ...config,
                semesterStartDate: formatDateForInput(config.semesterStartDate),
                lastWorkingDate: formatDateForInput(config.lastWorkingDate)
            };
            await apiV2.saveTimetableConfig(payload);
            toast.success('Basic setup saved successfully!');
        } catch (err) {
            console.error('[AcademicRegisterPage] Save basic setup error:', err);
            toast.error('Failed to save basic setup');
        } finally {
            setIsSavingBasic(false);
        }
    };

    // Save Weekly Plan (Tab 2)
    const handleSaveWeeklyPlan = async () => {
        try {
            setIsSavingPlan(true);
            const updatesArray = Object.keys(editedWeeklyPlan).map(regSubjectId => ({
                registeredSubjectId: regSubjectId,
                regSubjectId,
                theoryClassesPerWeek: editedWeeklyPlan[regSubjectId].theory,
                labSessionsPerWeek: editedWeeklyPlan[regSubjectId].lab,
                theoryRequired: editedWeeklyPlan[regSubjectId].theory,
                labRequired: editedWeeklyPlan[regSubjectId].lab
            }));
            if (updatesArray.length > 0) {
                await apiV2.updateWeeklyPlan({ plans: updatesArray, subjects: updatesArray });
            }
            toast.success('Weekly plan saved successfully!');
        } catch (err) {
            console.error('[AcademicRegisterPage] Save weekly plan error:', err);
            toast.error('Failed to save weekly plan');
        } finally {
            setIsSavingPlan(false);
        }
    };

    // Primary Action: Save & Generate Timetable
    const handleGenerateTimetable = async () => {
        try {
            setGenerating(true);

            // 1. Save Timetable Configuration
            const payload = {
                ...config,
                semesterStartDate: formatDateForInput(config.semesterStartDate),
                lastWorkingDate: formatDateForInput(config.lastWorkingDate)
            };
            await apiV2.saveTimetableConfig(payload);

            // 2. Save Weekly Subjects Plan
            const updatesArray = Object.keys(editedWeeklyPlan).map(regSubjectId => ({
                registeredSubjectId: regSubjectId,
                regSubjectId,
                theoryClassesPerWeek: editedWeeklyPlan[regSubjectId].theory,
                labSessionsPerWeek: editedWeeklyPlan[regSubjectId].lab,
                theoryRequired: editedWeeklyPlan[regSubjectId].theory,
                labRequired: editedWeeklyPlan[regSubjectId].lab
            }));
            if (updatesArray.length > 0) {
                await apiV2.updateWeeklyPlan({ plans: updatesArray, subjects: updatesArray });
            }

            // 3. Generate Timetable Grid
            try {
                const previewRes = await apiV2.generateTimetablePreview({ migrateExisting: true });
                if (previewRes.data?.success && Array.isArray(previewRes.data?.data)) {
                    await apiV2.updateTimetableSlots({ slots: previewRes.data.data });
                }
            } catch (genErr) {
                console.warn('[AcademicRegisterPage] Preview auto-generate fallback:', genErr);
            }

            toast.success('Academic setup saved & Timetable generated!');
            navigate('/home/timetable');
        } catch (err) {
            console.error('[AcademicRegisterPage] Generate error:', err);
            toast.error(err.response?.data?.message || 'Failed to generate timetable. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07050e] text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <RefreshCw size={24} className="animate-spin text-purple-400" />
                    <span className="text-sm text-slate-400 font-medium">Loading Academic Setup...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#07050e] text-white p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto flex flex-col gap-6">
            
            {/* TOP SEGMENTED TAB SWITCHER */}
            <div className="flex items-center justify-center w-full">
                <div className="inline-flex p-1.5 rounded-2xl bg-[#0f0b21] border border-purple-500/20 shadow-lg gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('basic')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
                            activeTab === 'basic'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30 scale-105'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Calendar size={15} />
                        <span>Basic Setup</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('weekly')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
                            activeTab === 'weekly'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/30 scale-105'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <BookOpen size={15} />
                        <span>Weekly Plan</span>
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: BASIC SETUP */}
            {activeTab === 'basic' && (
                <div className="p-6 rounded-2xl bg-[#0f0b21]/90 border border-purple-500/20 flex flex-col gap-6 shadow-xl text-left w-full">
                    
                    {/* Header & Save Button */}
                    <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
                        <div className="flex items-center gap-2">
                            <Calendar size={20} className="text-purple-400" />
                            <h2 className="text-lg font-black text-white">Basic Setup</h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleSaveBasicSetup}
                            disabled={isSavingBasic}
                            className="px-4 py-2.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2 cursor-pointer transition-all shadow-md disabled:opacity-50"
                        >
                            {isSavingBasic ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            <span>Save Basic Setup</span>
                        </button>
                    </div>

                    {/* 1. Semester Duration */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-purple-400" />
                            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">1. Semester Duration</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-slate-400 font-semibold">Semester Start Date</label>
                                <input
                                    type="date"
                                    value={formatDateForInput(config.semesterStartDate)}
                                    onChange={(e) => setConfig(prev => ({ ...prev, semesterStartDate: e.target.value }))}
                                    className="p-3 rounded-xl bg-[#0a0718] border border-purple-500/20 text-white font-bold outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-slate-400 font-semibold">Last Working / End Date</label>
                                <input
                                    type="date"
                                    value={formatDateForInput(config.lastWorkingDate)}
                                    onChange={(e) => setConfig(prev => ({ ...prev, lastWorkingDate: e.target.value }))}
                                    className="p-3 rounded-xl bg-[#0a0718] border border-purple-500/20 text-white font-bold outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-slate-300">
                            <span>Estimated Academic Duration:</span>
                            <span className="font-extrabold text-purple-300">{calculateWeeks} Weeks</span>
                        </div>
                    </div>

                    {/* 2. College Daily Timings */}
                    <div className="flex flex-col gap-3 border-t border-purple-500/10 pt-5">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-purple-400" />
                            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">2. College Daily Timings</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-slate-400 font-semibold">College Starts At</label>
                                <input
                                    type="time"
                                    value={minutesToTimeString(config.collegeStartMinute)}
                                    onChange={(e) => setConfig(prev => ({ ...prev, collegeStartMinute: timeStringToMinutes(e.target.value) }))}
                                    className="p-3 rounded-xl bg-[#0a0718] border border-purple-500/20 text-white font-bold outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-slate-400 font-semibold">College Ends At</label>
                                <input
                                    type="time"
                                    value={minutesToTimeString(config.collegeEndMinute)}
                                    onChange={(e) => setConfig(prev => ({ ...prev, collegeEndMinute: timeStringToMinutes(e.target.value) }))}
                                    className="p-3 rounded-xl bg-[#0a0718] border border-purple-500/20 text-white font-bold outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-slate-400 font-semibold">Class Period Duration</label>
                                <select
                                    value={config.classDuration}
                                    onChange={(e) => setConfig(prev => ({ ...prev, classDuration: parseInt(e.target.value, 10) }))}
                                    className="p-3 rounded-xl bg-[#0a0718] border border-purple-500/20 text-white font-bold outline-none focus:border-purple-500 cursor-pointer"
                                >
                                    <option value="45">45 Minutes</option>
                                    <option value="50">50 Minutes</option>
                                    <option value="55">55 Minutes</option>
                                    <option value="60">60 Minutes</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. Break Timings */}
                    <div className="flex flex-col gap-3 border-t border-purple-500/10 pt-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Coffee size={16} className="text-purple-400" />
                                <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">3. Break Timings</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddBreak}
                                className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                <Plus size={13} />
                                Add Break
                            </button>
                        </div>
                        {(!config.breaks || config.breaks.length === 0) ? (
                            <span className="text-xs text-slate-500 text-center py-3">No breaks configured.</span>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {config.breaks.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 rounded-xl bg-[#0a0718] border border-white/5 text-xs">
                                        <input
                                            type="text"
                                            placeholder="Break Name"
                                            value={item.name}
                                            onChange={(e) => handleBreakFieldChange(idx, 'name', e.target.value)}
                                            className="sm:col-span-5 p-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-bold outline-none"
                                        />
                                        <input
                                            type="time"
                                            value={minutesToTimeString(item.startMinute)}
                                            onChange={(e) => handleBreakFieldChange(idx, 'startMinute', timeStringToMinutes(e.target.value))}
                                            className="sm:col-span-3 p-2.5 rounded-lg bg-white/5 border border-white/10 text-white font-bold outline-none"
                                        />
                                        <div className="sm:col-span-3 flex items-center gap-1 bg-[#0f0b21] p-1.5 rounded-lg border border-white/10">
                                            <input
                                                type="number"
                                                min="1"
                                                max="240"
                                                placeholder="Mins"
                                                value={item.duration || ''}
                                                onChange={(e) => handleBreakFieldChange(idx, 'duration', Math.max(1, parseInt(e.target.value, 10) || 0))}
                                                className="w-full bg-transparent text-white font-bold outline-none text-xs text-center"
                                            />
                                            <span className="text-[11px] text-purple-300 font-extrabold pr-2 shrink-0">mins</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveBreak(idx)}
                                            className="sm:col-span-1 p-2 rounded-lg text-red-400 hover:bg-red-500/10 flex items-center justify-center cursor-pointer"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 4. Working Days */}
                    <div className="flex flex-col gap-3 border-t border-purple-500/10 pt-5">
                        <div className="flex items-center gap-2">
                            <CalendarRange size={16} className="text-purple-400" />
                            <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">4. Working Days</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {daysList.map((day) => {
                                const currentStatus = getWorkingDayStatus(config.workingDays, day);
                                return (
                                    <div key={day.key} className="flex items-center justify-between p-3 rounded-xl bg-[#0a0718] border border-white/5 text-xs">
                                        <span className="font-bold text-slate-200">{day.name}</span>
                                        <div className="flex gap-1">
                                            {['Full Day', 'Half Day', 'Holiday'].map((opt) => {
                                                const isSelected = currentStatus === opt;
                                                return (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onClick={() => handleDayStatusChange(day, opt)}
                                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                                                            isSelected
                                                                ? opt === 'Full Day' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                                  : opt === 'Half Day' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                                                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                                        }`}
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
                    </div>

                </div>
            )}

            {/* TAB CONTENT: WEEKLY PLAN */}
            {activeTab === 'weekly' && (
                <div className="p-6 rounded-2xl bg-[#0f0b21]/90 border border-purple-500/20 flex flex-col gap-5 shadow-xl text-left w-full">
                    
                    {/* Header & Save Button */}
                    <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
                        <div className="flex items-center gap-2">
                            <BookOpen size={20} className="text-purple-400" />
                            <h2 className="text-lg font-black text-white">Weekly Subject Schedule Plan</h2>
                        </div>
                        <button
                            type="button"
                            onClick={handleSaveWeeklyPlan}
                            disabled={isSavingPlan || registeredSubjectsList.length === 0}
                            className="px-4 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 cursor-pointer transition-all shadow-md disabled:opacity-50"
                        >
                            {isSavingPlan ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            <span>Save Weekly Plan</span>
                        </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/15 flex items-center gap-2.5 text-xs text-purple-300">
                        <Lock size={16} className="flex-shrink-0 text-purple-400" />
                        <span>
                            Subjects are read-only (synced from Subject Registration). Set your theory classes and lab sessions per week for each subject.
                        </span>
                    </div>

                    {/* Subjects Table */}
                    {registeredSubjectsList.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                            <AlertCircle size={24} className="text-purple-400/50" />
                            <span>No registered subjects found for this semester.</span>
                            <span className="text-[11px] text-slate-500">Go to Subject Registration to select and save your subjects.</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto w-full rounded-xl border border-purple-500/10 bg-[#090616]">
                            <table className="w-full text-left border-collapse min-w-[580px]">
                                <thead>
                                    <tr className="text-[11px] font-extrabold tracking-wider uppercase border-b border-white/10 text-slate-400 bg-white/[0.03]">
                                        <th className="py-3.5 px-4 text-center w-12">Sl No</th>
                                        <th className="py-3.5 px-4">Subject Code</th>
                                        <th className="py-3.5 px-4">Subject Name</th>
                                        <th className="py-3.5 px-4 text-center">Credits</th>
                                        <th className="py-3.5 px-4 text-center">Theory Classes / Week</th>
                                        <th className="py-3.5 px-4 text-center">Lab Sessions / Week</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs font-medium">
                                    {registeredSubjectsList.map((item, idx) => {
                                        const code = item.subject?.code || item.customCode || 'N/A';
                                        const name = item.subject?.name || item.customName || 'Registered Subject';
                                        const credits = item.registeredCredits || item.subject?.credits || 0;
                                        const theoryVal = editedWeeklyPlan[item._id]?.theory ?? item.weeklyPlan?.theory?.required ?? 3;
                                        const labVal = editedWeeklyPlan[item._id]?.lab ?? item.weeklyPlan?.lab?.required ?? 0;

                                        return (
                                            <tr key={item._id} className="hover:bg-white/[0.02]">
                                                <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                                                    {idx + 1}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-xs text-purple-300 font-extrabold">
                                                    <span className="px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/20">
                                                        {code}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 font-bold text-slate-200 text-sm">
                                                    {name}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                                                        {credits} Credits
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTheoryChange(item._id, theoryVal - 1)}
                                                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm cursor-pointer flex items-center justify-center"
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="15"
                                                            value={theoryVal}
                                                            onChange={(e) => handleTheoryChange(item._id, e.target.value)}
                                                            className="w-12 h-7 text-center rounded-lg bg-[#0d091f] border border-purple-500/30 text-purple-200 font-bold text-xs outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTheoryChange(item._id, theoryVal + 1)}
                                                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm cursor-pointer flex items-center justify-center"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLabChange(item._id, labVal - 1)}
                                                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm cursor-pointer flex items-center justify-center"
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="10"
                                                            value={labVal}
                                                            onChange={(e) => handleLabChange(item._id, e.target.value)}
                                                            className="w-12 h-7 text-center rounded-lg bg-[#0d091f] border border-purple-500/30 text-purple-200 font-bold text-xs outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLabChange(item._id, labVal + 1)}
                                                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm cursor-pointer flex items-center justify-center"
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

            {/* BOTTOM GENERATE TIMETABLE CTA */}
            <div className="flex flex-col items-center gap-3 pt-2 max-w-xl mx-auto w-full">
                <button
                    type="button"
                    onClick={handleGenerateTimetable}
                    disabled={generating || registeredSubjectsList.length === 0}
                    className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
                        generating || registeredSubjectsList.length === 0
                            ? 'bg-purple-950 text-slate-500 border border-purple-900/30 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white ring-2 ring-purple-400/50 shadow-purple-900/50 scale-[1.02]'
                    }`}
                >
                    {generating ? (
                        <RefreshCw size={18} className="animate-spin" />
                    ) : (
                        <Sparkles size={18} />
                    )}
                    <span>{generating ? 'Generating Timetable...' : 'Generate Timetable'}</span>
                    <ArrowRight size={18} />
                </button>
            </div>

        </div>
    );
};

export default AcademicRegisterPage;
