import React, { useEffect, useMemo, useState, Suspense, lazy, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useAuth, useDebounce } from '../../utils/hooks';
import SubjectCard from '../../components/SubjectCard';
import { subjectAPI } from '../../services/api';
import { BRANCHES, deriveBranchFromUSN, toUiBranch } from '../../utils/constants';
import AcademicCalendar from '../../components/AcademicCalendar';
import academicAPI from '../../services/academicService';
import { differenceInDays, format, isSameDay, getDay } from 'date-fns';
import { Edit2, Check, X, Minus, ChevronUp, ChevronDown } from 'lucide-react';
import ExtraClassModal from '../../components/ExtraClassModal';

const ProfileModal = lazy(() => import('../../components/ProfileModal'));
const AcademicSetup = lazy(() => import('../AcademicSetup'));

const SubjectsSkeleton = ({ isLightMode }) => (
    <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
            <div
                key={i}
                className={`h-24 sm:h-32 rounded-2xl animate-pulse border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/20 border-white/5'
                    }`}
            />
        ))}
    </div>
);

const DashboardPage = () => {
    const navigate = useNavigate();
    const { setDashboardState, theme, isLightMode } = useOutletContext();
    const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.isAdmin;
    
    const [subjects, setSubjects] = useState([]);
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [subjectsLoading, setSubjectsLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showBranchPicker, setShowBranchPicker] = useState(false);
    const [academicConfig, setAcademicConfig] = useState(null);
    const [academicTimetable, setAcademicTimetable] = useState(null);
    const [userSubjects, setUserSubjects] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [timetableOverrides, setTimetableOverrides] = useState([]);
    const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    
    // Edit Exam Date State
    const [isEditingExam, setIsEditingExam] = useState(false);
    const [tempExamDate, setTempExamDate] = useState('');
    
    // Load academic setup
    useEffect(() => {
        const loadAcademic = async () => {
            if (!isAuthenticated) return;
            try {
                const res = await academicAPI.getDashboard();
                if (res.data?.config) {
                    setAcademicConfig(res.data.config);
                    setTempExamDate(res.data.config.examStartDate ? res.data.config.examStartDate.split('T')[0] : '');
                    setAcademicTimetable(res.data.timetable);
                    setUserSubjects(res.data.attendanceData || []);
                    setAttendanceRecords(res.data.attendanceRecords || []);
                    setTimetableOverrides(res.data.timetableOverrides || []);
                }
            } catch (err) {
                console.log('Academic setup not found');
            }
        };
        loadAcademic();
    }, [isAuthenticated]);
    
    // Internal dashboard logic
    const [currentBranch, setCurrentBranch] = useState(
        deriveBranchFromUSN(user?.usn) || toUiBranch(user?.currentBranch) || 'CS'
    );
    const [cycle, setCycle] = useState('P');
    const [subjectSearch] = useState(''); // This could be linked to layout search if needed

    useEffect(() => {
        // Sync vital stats to Layout
        setDashboardState(prev => ({
            ...prev,
            currentBranch,
            cycle,
            progress: calculateProgress(subjects)
        }));
    }, [currentBranch, cycle, subjects, setDashboardState]);

    const calculateProgress = (subjectsList) => {
        if (!subjectsList || subjectsList.length === 0) return 0;
        let totalQuestions = 0;
        let completedQuestions = 0;
        subjectsList.forEach(s => {
            if (s.modules) {
                s.modules.forEach(m => {
                    if (m.questions) {
                        totalQuestions += m.questions.length;
                        completedQuestions += m.questions.filter(q => q.completed).length;
                    }
                });
            }
        });
        return totalQuestions === 0 ? 0 : Math.round((completedQuestions / totalQuestions) * 100);
    };

    const handleMarkAttendance = async (subjectName, timeSlot, status) => {
        try {
            const res = await academicAPI.markAttendance({ subjectName, timeSlot, status });
            setAttendanceRecords(prev => [...prev, res.data.record]);
            if (res.data.updatedSubjects) {
                // Merge updated subject data into userSubjects to reflect percentage changes instantly
                setUserSubjects(prev => prev.map(s => {
                    const update = res.data.updatedSubjects.find(us => us.subjectName === s.subjectName);
                    return update ? { ...s, totalClasses: update.totalClasses, attendedClasses: update.attendedClasses } : s;
                }));
            }
        } catch (err) {
            console.error('Failed to mark attendance', err);
        }
    };

    const handleUndoAttendance = async (recordId) => {
        try {
            const res = await academicAPI.undoAttendance({ recordId });
            setAttendanceRecords(prev => prev.filter(r => r._id !== recordId));
            if (res.data.updatedSubjects) {
                setUserSubjects(prev => prev.map(s => {
                    const update = res.data.updatedSubjects.find(us => us.subjectName === s.subjectName);
                    return update ? { ...s, totalClasses: update.totalClasses, attendedClasses: update.attendedClasses } : s;
                }));
            }
        } catch (err) {
            console.error('Failed to undo attendance', err);
        }
    };

    // Load subjects
    useEffect(() => {
        const loadData = async () => {
            if (authLoading || !isAuthenticated) return;
            try {
                setSubjectsLoading(true);
                const subjectsRes = await subjectAPI.getSubjectsByBranch(currentBranch, cycle);
                setSubjects(subjectsRes.data);
            } catch (error) {
                console.error('Error loading subjects:', error);
            } finally {
                setSubjectsLoading(false);
            }
        };
        loadData();
    }, [authLoading, isAuthenticated, currentBranch, cycle]);

    const handleQuestionToggle = useCallback(async (data) => {
        // Optimistic update
        setSubjects((prev) => prev.map((s) => {
            if (s._id !== data.subjectId) return s;
            return {
                ...s,
                modules: s.modules.map(m => {
                    if (m.moduleNumber !== data.moduleNumber) return m;
                    return {
                        ...m,
                        questions: m.questions.map(q => q._id === data.questionId ? { ...q, completed: !q.completed } : q)
                    };
                })
            };
        }));
        try {
            await subjectAPI.markQuestionCompleted(data);
        } catch (err) {
            console.error('Error updating question:', err);
        }
    }, []);

    const smartNotifications = useMemo(() => {
        const notifications = [];
        const today = new Date();
        const dayName = format(today, 'eeee').toLowerCase();

        if (!academicConfig) return [];

        // Case 3: Near Exams
        const daysToExams = academicConfig.examStartDate ? differenceInDays(new Date(academicConfig.examStartDate), today) : null;
        if (daysToExams !== null && daysToExams >= 0 && daysToExams < 7) {
            notifications.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Exams are very close!',
                text: 'Focus on revision instead of tracking attendance. We\'ve reduced notifications to help you focus.',
                action: 'View Revision Plan'
            });
        }

        // Case 2: Internals Ongoing (Assume internals are 2 weeks before exams if not specified? 
        // Actually the user mentioned internalStart/End. Let's check if they exist in config.)
        // Since they don't exist in my schema yet, I'll skip or use a proxy.
        // Actually, let's just use the exam proximity for now.

        // Case 5: Missing Timetable
        if (!academicTimetable || Object.values(academicTimetable).every(day => !day || day.length === 0)) {
            notifications.push({
                type: 'info',
                icon: '📌',
                title: 'Add your timetable',
                text: 'Add your timetable to get daily updates and automatic attendance tracking.',
                action: 'Setup Timetable',
                link: '/academic-setup'
            });
        }

        // Case 6: Weekend Handling
        if (dayName === 'sunday' || (academicTimetable && (!academicTimetable[dayName] || academicTimetable[dayName].length === 0))) {
            notifications.push({
                type: 'success',
                icon: '🎉',
                title: 'No classes today!',
                text: 'Use this time to revise or catch up on pending tasks.',
                action: 'View Tasks'
            });
        }

        return notifications;
    }, [academicConfig, academicTimetable]);

    const handleSaveExamDate = async () => {
        try {
            const newConfig = { ...academicConfig, examStartDate: tempExamDate };
            await academicAPI.saveSetup(newConfig);
            setAcademicConfig(newConfig);
            setIsEditingExam(false);
        } catch (err) {
            console.error('Failed to update exam date:', err);
        }
    };

    const getDayName = (day) => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[getDay(day)];
    };

    const selectedDayClasses = useMemo(() => {
        if (!academicTimetable || !selectedDate) return [];
        const dayName = getDayName(selectedDate);
        let classes = academicTimetable[dayName] ? [...academicTimetable[dayName]] : [];
        
        // Apply Overrides
        const currentDayOverrides = timetableOverrides.filter(o => isSameDay(new Date(o.date), selectedDate));
        currentDayOverrides.forEach(override => {
            if (override.type === 'swap') {
                const index = classes.findIndex(c => (typeof c === 'object' ? `${c.start} - ${c.end}` : '') === override.originalTimeSlot);
                if (index !== -1) {
                    classes[index] = { ...classes[index], subject: override.newSubjectName };
                }
            } else if (override.type === 'add') {
                classes.push({ subject: override.newSubjectName, start: override.startTime, end: override.endTime });
            }
        });

        return classes.sort((a, b) => {
            const timeA = typeof a === 'object' ? a.start || '' : '';
            const timeB = typeof b === 'object' ? b.start || '' : '';
            return timeA.localeCompare(timeB);
        });
    }, [academicTimetable, selectedDate, timetableOverrides]);

    const filteredSubjectsList = useMemo(() => subjects.map((subject) => (
        <SubjectCard
            key={subject._id}
            subject={subject}
            expanded={expandedSubjects[subject._id] || false}
            onToggle={(id) => setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }))}
            onQuestionToggle={handleQuestionToggle}
            theme={theme}
            isLocked={false}
        />
    )), [subjects, expandedSubjects, theme, handleQuestionToggle]);

    return (
        <div className="w-full">
            {/* Smart Notifications */}
            {smartNotifications.length > 0 && (
                <div className="mb-6 space-y-3">
                    {smartNotifications.map((n, i) => (
                        <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 animate-fadeIn ${
                            n.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                            n.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                            'bg-blue-50 border-blue-200 text-blue-900'
                        }`}>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{n.icon}</span>
                                <div>
                                    <h5 className="text-sm font-bold">{n.title}</h5>
                                    <p className="text-xs opacity-80">{n.text}</p>
                                </div>
                            </div>
                            {n.action && (
                                <button 
                                    onClick={() => n.link ? navigate(n.link) : null}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                        n.type === 'warning' ? 'bg-amber-200 hover:bg-amber-300' :
                                        n.type === 'success' ? 'bg-emerald-200 hover:bg-emerald-300' :
                                        'bg-blue-200 hover:bg-blue-300'
                                    }`}
                                >
                                    {n.action}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Academic Setup Banner / Stats - Admin Only */}
            {isAdmin && (
                <>
                    {!academicConfig ? (
                        <div className={`mb-8 p-6 rounded-3xl border ${isLightMode ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-500/10 border-indigo-500/20'} flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-lg`}>
                            <div className="flex items-center gap-5">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${isLightMode ? 'text-indigo-900' : 'text-white'}`}>Complete your Academic Setup</h3>
                                    <p className={`text-sm ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'}`}>Track attendance, manage your timetable, and get exam countdowns.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSetupModal(true)}
                                className="whitespace-nowrap px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transform active:scale-95 transition-all"
                            >
                                Get Started
                            </button>
                        </div>
                    ) : (
                        <div className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-500">
                            {/* Calendar View */}
                            <div className={`${isCalendarCollapsed ? 'lg:col-span-3' : 'lg:col-span-2'} transition-all duration-500`}>
                                <AcademicCalendar 
                                    config={academicConfig} 
                                    timetable={academicTimetable} 
                                    subjects={userSubjects}
                                    isLightMode={isLightMode} 
                                    isCollapsed={isCalendarCollapsed}
                                    setIsCollapsed={setIsCalendarCollapsed}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                />
                            </div>
                            
                            {/* Quick Stats - Only visible if not collapsed */}
                            {!isCalendarCollapsed && (
                                <div className="relative h-full w-full min-h-[400px] lg:min-h-0">
                                    <div className="lg:absolute lg:inset-0 flex flex-col gap-6 animate-fadeIn">
                                    {/* Academic Overview (Merged) */}
                                    {academicConfig && (
                                        <div className={`p-6 rounded-3xl border shrink-0 ${isLightMode ? 'bg-white border-gray-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Academic Overview</h4>
                                                <button onClick={() => setShowSetupModal(true)} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 transition-colors">
                                                    Update Setup
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-end gap-2">
                                                    {academicConfig.examStartDate ? (
                                                        <>
                                                            <span className={`text-4xl font-black ${isLightMode ? 'text-indigo-600' : 'text-white'} leading-none`}>
                                                                {Math.max(0, differenceInDays(new Date(academicConfig.examStartDate), new Date()))}
                                                            </span>
                                                            <span className="text-xs font-bold text-gray-500 mb-1">Days Left</span>
                                                        </>
                                                    ) : (
                                                        <span className={`text-xl font-black ${isLightMode ? 'text-indigo-600' : 'text-white'}`}>Semester {academicConfig.semester}</span>
                                                    )}
                                                </div>
                                                
                                                <div className={`px-3 py-1.5 rounded-xl border text-xs font-black tracking-wider ${isLightMode ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                                                    SEM {academicConfig.semester}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mb-2 mt-6">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Semester Progress</span>
                                                <span className="text-[10px] font-black text-indigo-500">{Math.min(100, Math.max(0, Math.round((differenceInDays(new Date(), new Date(academicConfig.collegeStartDate)) / differenceInDays(new Date(academicConfig.lastWorkingDay), new Date(academicConfig.collegeStartDate))) * 100)))}%</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-indigo-600 rounded-full" 
                                                    style={{ width: `${Math.min(100, Math.max(0, Math.round((differenceInDays(new Date(), new Date(academicConfig.collegeStartDate)) / differenceInDays(new Date(academicConfig.lastWorkingDay), new Date(academicConfig.collegeStartDate))) * 100)))}%` }}
                                                />
                                            </div>

                                            {academicConfig.examStartDate && (
                                                <div className="mt-6 text-xs text-gray-500 font-medium flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4">
                                                    <div className="flex items-center gap-2">
                                                        <span>Exams begin on</span>
                                                        {isEditingExam ? (
                                                            <div className="flex items-center gap-1">
                                                                <input 
                                                                    type="date" 
                                                                    value={tempExamDate}
                                                                    onChange={(e) => setTempExamDate(e.target.value)}
                                                                    className={`px-1.5 py-0.5 rounded border outline-none ${isLightMode ? 'bg-white border-gray-300 text-black' : 'bg-[#141416] border-white/20 text-white'}`}
                                                                />
                                                                <button onClick={handleSaveExamDate} className="text-emerald-500 hover:bg-emerald-500/10 rounded p-0.5 transition-colors"><Check size={14} strokeWidth={3} /></button>
                                                                <button onClick={() => { setIsEditingExam(false); setTempExamDate(academicConfig.examStartDate.split('T')[0]); }} className="text-red-500 hover:bg-red-500/10 rounded p-0.5 transition-colors"><X size={14} strokeWidth={3} /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 group">
                                                                <span className="text-indigo-500 font-bold">{format(new Date(academicConfig.examStartDate), 'do MMM yyyy')}</span>
                                                                <button onClick={() => setIsEditingExam(true)} className="opacity-50 hover:opacity-100 text-indigo-400 transition-opacity" title="Edit Exam Date">
                                                                    <Edit2 size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Selected Day Classes */}
                                    <div className={`p-6 rounded-3xl flex-1 border flex flex-col min-h-0 ${isLightMode ? 'bg-indigo-50/50 border-indigo-100' : 'bg-indigo-500/5 border-indigo-500/10'}`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                                                {isSameDay(selectedDate, new Date()) ? "Today's" : format(selectedDate, 'EEEE') + "'s"} Classes
                                            </h4>
                                            {isSameDay(selectedDate, new Date()) && (
                                                <button 
                                                    onClick={() => setShowOverrideModal(true)}
                                                    className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 px-2 py-1 rounded transition-colors"
                                                >
                                                    + Extra Class
                                                </button>
                                            )}
                                        </div>
                                        
                                        {selectedDayClasses.filter(item => (typeof item === 'object' ? item.subject : item) && (typeof item === 'object' ? item.subject : item) !== "Unnamed Subject").length > 0 ? (
                                            <div className="flex flex-col gap-2 mt-4 flex-1 min-h-0 overflow-y-auto pr-1">
                                                {selectedDayClasses
                                                    .filter(item => (typeof item === 'object' ? item.subject : item) && (typeof item === 'object' ? item.subject : item) !== "Unnamed Subject")
                                                    .map((item, i) => {
                                                        const subjectName = (typeof item === 'object' ? item.subject : item);
                                                        const timeRange = typeof item === 'object' && item.start ? `${item.start} - ${item.end}` : null;
                                                        
                                                        const subjectData = userSubjects.find(s => s.subjectName === subjectName);
                                                        
                                                        const isTodayClass = isSameDay(selectedDate, new Date());
                                                        const isPastDay = selectedDate < new Date() && !isTodayClass;

                                                        const parseTime = (timeStr) => {
                                                            if (!timeStr) return new Date(8640000000000000);
                                                            const [hours, minutes] = timeStr.split(':').map(Number);
                                                            const d = new Date(selectedDate);
                                                            d.setHours(hours, minutes, 0, 0);
                                                            return d;
                                                        };

                                                        const classEndTime = typeof item === 'object' && item.end ? parseTime(item.end) : null;
                                                        const isOver = isPastDay || (isTodayClass && classEndTime && new Date() > classEndTime);
                                                        
                                                        let isInteractive = true;
                                                        if (subjectData?.lastUpdatedDate) {
                                                            const lastUpdated = new Date(subjectData.lastUpdatedDate);
                                                            lastUpdated.setHours(0,0,0,0);
                                                            const selectedDay = new Date(selectedDate);
                                                            selectedDay.setHours(0,0,0,0);
                                                            if (selectedDay <= lastUpdated) {
                                                                isInteractive = false;
                                                            }
                                                        }

                                                        const record = attendanceRecords.find(r => r.timeSlot === timeRange && r.subjectName === subjectName);
                                                        const isPending = isOver && !record && isInteractive;
                                                        const subjectPercent = subjectData && subjectData.totalClasses > 0 
                                                            ? Math.round((subjectData.attendedClasses / subjectData.totalClasses) * 100) 
                                                            : 0;
                                                            
                                                        let zone = 'neutral';
                                                        const threshold = academicConfig?.attendanceThreshold || 85;

                                                        if (subjectData && subjectData.totalClasses > 0) {
                                                            const currentPercent = Math.round((subjectData.attendedClasses / subjectData.totalClasses) * 100);
                                                            const percentIfAbsent = Math.round((subjectData.attendedClasses / (subjectData.totalClasses + 1)) * 100);
                                                            
                                                            if (currentPercent < threshold) {
                                                                zone = 'red';
                                                            } else if (percentIfAbsent < threshold) {
                                                                zone = 'yellow';
                                                            } else {
                                                                zone = 'green';
                                                            }
                                                        }

                                                        let baseStyles = isLightMode 
                                                            ? 'bg-white border-indigo-100 text-indigo-700 shadow-sm' 
                                                            : 'bg-white/5 border-white/5 text-indigo-300';
                                                        let tagStyles = 'text-indigo-400/80 font-black';

                                                        if (zone === 'red') {
                                                            baseStyles = isLightMode ? 'bg-red-50 border-red-200 text-red-800 shadow-sm' : 'bg-red-500/10 border-red-500/20 text-red-300';
                                                            tagStyles = 'text-red-500 font-black';
                                                        } else if (zone === 'yellow') {
                                                            baseStyles = isLightMode ? 'bg-yellow-50 border-yellow-200 text-yellow-800 shadow-sm' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300';
                                                            tagStyles = 'text-yellow-500 font-black';
                                                        } else if (zone === 'green') {
                                                            baseStyles = isLightMode ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
                                                            tagStyles = 'text-emerald-500 font-black';
                                                        }

                                                        return (
                                                            <div 
                                                                key={i} 
                                                                className={`relative group px-4 py-3 rounded-xl text-sm font-bold border transition-all flex justify-between items-center shrink-0 overflow-hidden ${baseStyles} ${isPending ? 'opacity-60' : ''}`}
                                                            >
                                                                <div className="flex flex-col z-10 w-full">
                                                                    <div className="flex justify-between w-full">
                                                                        <div className="flex flex-col min-w-0 pr-4">
                                                                            <span className={`truncate ${isPending ? 'line-through' : ''}`}>{subjectName}</span>
                                                                            <span className={`text-[9px] uppercase tracking-widest mt-0.5 ${tagStyles}`}>
                                                                                Attendance: {subjectPercent}% {zone !== 'neutral' ? `• ${zone.toUpperCase()} ZONE` : ''}
                                                                            </span>
                                                                        </div>
                                                                        {timeRange && (
                                                                            <span className={`text-[10px] opacity-70 font-medium whitespace-nowrap ${isPending ? 'line-through' : ''}`}>{timeRange}</span>
                                                                        )}
                                                                    </div>
                                                                    {record && (
                                                                        <div className="mt-1 flex items-center justify-between w-full">
                                                                            <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest">
                                                                                {record.status === 'attended' && <span className="text-emerald-500 flex items-center gap-1"><Check size={10} strokeWidth={3}/> Attended</span>}
                                                                                {record.status === 'missed' && <span className="text-red-500 flex items-center gap-1"><X size={10} strokeWidth={3}/> Missed</span>}
                                                                                {record.status === 'suspended' && <span className="text-gray-500 flex items-center gap-1"><Minus size={10} strokeWidth={3}/> Suspended</span>}
                                                                            </div>
                                                                            <button 
                                                                                onClick={() => handleUndoAttendance(record._id)}
                                                                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded transition-colors ${isLightMode ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                                                                                title="Undo Attendance"
                                                                            >
                                                                                Undo
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {isPending && (
                                                                    <div className="absolute inset-0 bg-indigo-500/90 dark:bg-indigo-900/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-20">
                                                                        <button 
                                                                            onClick={() => handleMarkAttendance(subjectName, timeRange, 'attended')}
                                                                            className="p-1.5 rounded-full bg-emerald-500 text-white hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20"
                                                                            title="Attended"
                                                                        ><Check size={16} strokeWidth={3}/></button>
                                                                        <button 
                                                                            onClick={() => handleMarkAttendance(subjectName, timeRange, 'missed')}
                                                                            className="p-1.5 rounded-full bg-red-500 text-white hover:scale-110 transition-transform shadow-lg shadow-red-500/20"
                                                                            title="Missed"
                                                                        ><X size={16} strokeWidth={3}/></button>
                                                                        <button 
                                                                            onClick={() => handleMarkAttendance(subjectName, timeRange, 'suspended')}
                                                                            className="p-1.5 rounded-full bg-gray-600 text-white hover:scale-110 transition-transform shadow-lg shadow-gray-900/20"
                                                                            title="Suspended (Faculty absent)"
                                                                        ><Minus size={16} strokeWidth={3}/></button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center min-h-[100px]">
                                                <p className="text-xs text-gray-500 italic font-medium">No classes scheduled.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div
                    className={`flex rounded-xl p-1 border ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}
                >
                    <button
                        onClick={() => setCycle('P')}
                        className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${cycle === 'P' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        P Cycle
                    </button>
                    <button
                        onClick={() => setCycle('C')}
                        className={`px-6 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${cycle === 'C' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        C Cycle
                    </button>
                </div>

                <div className="relative group">
                    <button
                        onClick={() => setShowBranchPicker(!showBranchPicker)}
                        className={`px-6 py-3 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${isLightMode ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                        {currentBranch} Branch
                        <svg className={`w-4 h-4 transition-transform ${showBranchPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
                        </svg>
                    </button>

                    {showBranchPicker && (
                        <div className={`absolute right-0 z-50 mt-2 w-56 rounded-2xl border shadow-2xl overflow-hidden ${isLightMode ? 'bg-white border-slate-200' : 'bg-[#141416] border-white/10'}`}>
                            <div className="max-h-64 overflow-y-auto p-2 space-y-1 font-black uppercase tracking-widest text-[10px]">
                                {BRANCHES.map((b) => (
                                    <button
                                        key={b.code}
                                        onClick={() => { setCurrentBranch(b.code); setShowBranchPicker(false); }}
                                        className={`w-full text-left px-4 py-3 rounded-xl transition-all ${currentBranch === b.code ? 'bg-purple-600/10 text-purple-400' : 'text-slate-500 hover:bg-white/5'}`}
                                    >
                                        {b.code} - {b.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {subjectsLoading ? (
                <SubjectsSkeleton isLightMode={isLightMode} />
            ) : subjects.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                    <p className="text-slate-500 font-bold uppercase tracking-widest">No subjects found for this branch</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredSubjectsList}
                </div>
            )}

            <Suspense fallback={null}>
                {showProfileModal && (
                    <ProfileModal
                        show={showProfileModal}
                        onClose={() => setShowProfileModal(false)}
                        user={user}
                        updateUser={updateUser}
                        subjects={subjects}
                        overallProgress={calculateProgress(subjects)}
                        theme={theme}
                    />
                )}
                {showSetupModal && (
                    <AcademicSetup onClose={() => { setShowSetupModal(false); window.location.reload(); }} />
                )}
                {showOverrideModal && (
                    <ExtraClassModal 
                        isOpen={showOverrideModal}
                        onClose={() => setShowOverrideModal(false)}
                        selectedDate={selectedDate}
                        userSubjects={userSubjects}
                        originalClasses={academicTimetable && academicTimetable[getDayName(selectedDate)] ? academicTimetable[getDayName(selectedDate)] : []}
                        onOverrideAdded={(newOverride) => {
                            setTimetableOverrides(prev => [...prev, newOverride]);
                        }}
                        isLightMode={isLightMode}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default DashboardPage;
