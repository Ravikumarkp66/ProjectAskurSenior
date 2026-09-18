import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { apiV2 } from '../../../services/authService';
import { 
    CalendarDays, CalendarRange, BookOpen, BarChart2, Settings, 
    ArrowLeft, ChevronRight, ChevronLeft, ChevronDown, CheckCircle2, 
    AlertCircle, Loader2, Sparkles, Lock, Edit3, Eye, Check, RotateCcw
} from 'lucide-react';

import CalendarDateNavigator from './components/attendance/CalendarDateNavigator';
import DailyAttendanceWorkspace from './components/attendance/DailyAttendanceWorkspace';
import WeeklyTimetableGrid from './components/WeeklyTimetableGrid';
import AttendanceRightPanel from './components/attendance/AttendanceRightPanel';
import AttendanceSummaryView from './components/attendance/AttendanceSummaryView';
import BaselineSetupModal from './components/attendance/BaselineSetupModal';
import SubjectSwapModal from './components/attendance/SubjectSwapModal';
import TimetableSlotCustomizeModal from './components/attendance/TimetableSlotCustomizeModal';
import PastWeekChangeWarningModal from './components/attendance/PastWeekChangeWarningModal';
import OfficialTimetableModal from './components/attendance/OfficialTimetableModal';

const NAV_GROUPS = [
    {
        title: 'DAILY',
        items: [
            { id: 'today', label: "Today's Classes", path: 'today', icon: CalendarDays }
        ]
    },
    {
        title: 'TIMETABLE',
        items: [
            { id: 'timetable', label: 'My Timetable', path: 'timetable', icon: CalendarRange }
        ]
    },
    {
        title: 'ANALYTICS',
        items: [
            { id: 'overview', label: 'Semester Overview', path: 'overview', icon: BarChart2 }
        ]
    }
];

const ALL_NAV_TABS = NAV_GROUPS.flatMap(g => g.items);

const normalizeTabName = (tab) => {
    if (!tab) return 'today';
    const t = String(tab).toLowerCase();
    if (t === 'today' || t === 'daily' || t === 'schedule') return 'today';
    if (t === 'timetable' || t === 'my-timetable' || t === 'weekly') return 'timetable';
    if (t === 'subjects' || t === 'subject-summary') return 'subjects';
    if (t === 'overview' || t === 'summary') return 'overview';
    return 'today';
};

const getLocalDateString = (d = new Date()) => {
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const AttendanceSettings = () => {
    const location = useLocation();
    const queryTab = new URLSearchParams(location.search).get('tab');

    const [loading, setLoading] = useState(true);
    const [isDayLoading, setIsDayLoading] = useState(false);
    const [error, setError] = useState(null);

    // Active View Tab: 'schedule' | 'today' | 'subjects' | 'overview'
    const [activeTab, setActiveTabState] = useState(() => normalizeTabName(queryTab));

    const setActiveTab = (tab) => {
        const normalized = normalizeTabName(tab);
        setActiveTabState(normalized);
        const url = new URL(window.location);
        url.searchParams.set('tab', normalized);
        window.history.replaceState({}, '', url);
    };

    // Date state (YYYY-MM-DD in user's local timezone)
    const [selectedDate, setSelectedDate] = useState(() => getLocalDateString(new Date()));

    const { user } = useAuth();
    const { isDark } = useTheme();

    const t = useMemo(() => ({
        bgPage: isDark ? '#0A0D16' : '#F8FAFC',
        surface: isDark ? '#0D111C' : '#FFFFFF',
        surfaceMuted: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F1F5F9',
        border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
        borderSubtle: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)',
        divider: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)',
        text: isDark ? '#F8FAFC' : '#0F172A',
        textMuted: isDark ? '#94A3B8' : '#64748B',
        textFaint: isDark ? '#64748B' : '#94A3B8',
        accentText: isDark ? '#C4B5FD' : '#6D28D9',
        accentBg: isDark ? 'rgba(124, 58, 237, 0.16)' : '#F5F3FF',
        accentBorder: isDark ? 'rgba(139, 92, 246, 0.28)' : 'rgba(124, 58, 237, 0.25)',
        cardShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(15, 23, 42, 0.06)',
        selectBg: isDark ? '#0F0A1E' : '#FFFFFF',
        selectText: isDark ? '#F8FAFC' : '#0F172A',
    }), [isDark]);

    const initialSemester = Number(user?.semester) || 1;

    // Student & Semester state
    const [currentStudentSemester, setCurrentStudentSemester] = useState(initialSemester);
    const [selectedSemester, setSelectedSemester] = useState(initialSemester);
    const [semestersList, setSemestersList] = useState([]);
    const [userProfile, setUserProfile] = useState(user || null);

    const isSuperAdmin = useMemo(() => {
        const email = (user?.email || userProfile?.email || '').toLowerCase().trim();
        const role = user?.role || userProfile?.role;
        return email === 'mreducator4566@gmail.com' ||
            role === 'SUPER_ADMIN' ||
            Boolean(user?.isSuperAdmin || userProfile?.isSuperAdmin || user?.canEditAnytime || userProfile?.canEditAnytime);
    }, [user, userProfile]);

    // Analytics & Subject states
    const [overallMetrics, setOverallMetrics] = useState(null);
    const [progressList, setProgressList] = useState([]);
    const [groupedTimeline, setGroupedTimeline] = useState([]);
    const [registeredSubjectsList, setRegisteredSubjectsList] = useState([]);

    // Timetable states
    const [timetableConfig, setTimetableConfig] = useState(null);
    const [timetableSlots, setTimetableSlots] = useState([]);
    const [initialTimetableSlots, setInitialTimetableSlots] = useState([]);
    const [allottedTimetable, setAllottedTimetable] = useState(null);
    const [isTimetableLoading, setIsTimetableLoading] = useState(false);
    const [officialTimetableSlots, setOfficialTimetableSlots] = useState([]);
    const [isCustomizingTimetable, setIsCustomizingTimetable] = useState(false);
    const [isViewingOfficial, setIsViewingOfficial] = useState(false);
    const [editingTimetableSlot, setEditingTimetableSlot] = useState(null);
    const [pendingPastChange, setPendingPastChange] = useState(null);
    const [isSavingTimetable, setIsSavingTimetable] = useState(false);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isResettingTimetable, setIsResettingTimetable] = useState(false);

    // Day classes state
    const [dayClasses, setDayClasses] = useState([]);
    const [eventsList, setEventsList] = useState([]);
    const [dayEventInfo, setDayEventInfo] = useState({
        classesSuspended: false,
        dayEvents: [],
        activeEvent: null,
        message: ''
    });

    // Archive / Lock state
    const [isArchived, setIsArchived] = useState(false);
    const [readOnly, setReadOnly] = useState(false);
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const [isBaselineModalOpen, setIsBaselineModalOpen] = useState(false);

    // Subject Swap state
    const [selectedSwapClass, setSelectedSwapClass] = useState(null);
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);

    // History Drawer state
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [subjectForecast, setSubjectForecast] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // 1. Fetch student profile
    const fetchStudentProfile = async () => {
        try {
            const [meRes, semRes] = await Promise.all([
                apiV2.getMe().catch(() => null),
                apiV2.getSemesters().catch(() => null)
            ]);

            let sem = 1;
            if (meRes?.data?.success) {
                const student = meRes.data.user || meRes.data.student || meRes.data.data;
                setUserProfile(student);
                sem = Number(student?.semester) || 1;
                setCurrentStudentSemester(sem);
            }

            if (semRes?.data?.success && Array.isArray(semRes.data.data)) {
                setSemestersList(semRes.data.data);
            } else {
                const list = [];
                for (let i = 1; i <= Math.max(sem, 8); i++) {
                    list.push({ semester: i, isCurrent: i === sem, isPast: i < sem });
                }
                setSemestersList(list);
            }
            return sem;
        } catch (err) {
            console.error('Error fetching student profile:', err);
        }
        return 1;
    };

    // 2. Fetch semester metrics and config (Optimized single dashboard call)
    const fetchSemesterData = async (sem, showLoading = false) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const dashboardRes = await apiV2.getAttendanceDashboard(sem).catch(err => {
                console.error('getAttendanceDashboard error:', err);
                return { data: { success: false, data: {} } };
            });

            if (dashboardRes?.data?.success) {
                const data = dashboardRes.data.data || {};
                setProgressList(data.subjects || []);
                setOverallMetrics(data.overall || null);
                setGroupedTimeline(data.groupedTimeline || []);
                setIsArchived(data.isArchived || false);
                setReadOnly(data.readOnly || false);
                if (data.events && Array.isArray(data.events)) {
                    setEventsList(data.events);
                }
                if (data.commencementDate || data.lastWorkingDayDate) {
                    setTimetableConfig(prev => ({
                        ...prev,
                        commencementDate: data.commencementDate,
                        lastWorkingDayDate: data.lastWorkingDayDate,
                        semesterStartDate: data.commencementDate || prev?.semesterStartDate,
                        lastWorkingDate: data.lastWorkingDayDate || prev?.lastWorkingDate
                    }));
                }
            }
        } catch (err) {
            console.error('Error fetching attendance metrics:', err);
            setError(err.response?.data?.message || 'An error occurred while loading attendance metrics.');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // Fetch full timetable slots and configuration when timetable tab is opened or semester changes
    const fetchTimetableData = async (sem) => {
        setIsTimetableLoading(true);
        try {
            const [slotsRes, configRes] = await Promise.allSettled([
                apiV2.getTimetableSlots(sem),
                apiV2.getTimetableConfig(sem)
            ]);

            if (slotsRes.status === 'fulfilled' && slotsRes.value?.data?.success) {
                const raw = slotsRes.value.data;
                const slots = Array.isArray(raw.data) ? raw.data : (raw.data?.slots || []);
                setTimetableSlots(slots);
                setInitialTimetableSlots(slots);
                setOfficialTimetableSlots(prev => prev.length === 0 ? slots : prev);
                if (raw.allottedTimetable) {
                    setAllottedTimetable(raw.allottedTimetable);
                } else if (raw.data?.allottedTimetable) {
                    setAllottedTimetable(raw.data.allottedTimetable);
                }
            }

            if (configRes.status === 'fulfilled' && configRes.value?.data?.success) {
                const cfg = configRes.value.data.data?.config || configRes.value.data.data || {};
                const defaultWorkingDays = {
                    '1': 'Full Day',
                    '2': 'Full Day',
                    '3': 'Full Day',
                    '4': 'Full Day',
                    '5': 'Full Day',
                    '6': 'Half Day',
                    '7': 'Holiday'
                };
                const workingDays = (cfg.workingDays && Object.keys(cfg.workingDays).length > 0)
                    ? cfg.workingDays
                    : defaultWorkingDays;

                setTimetableConfig(prev => ({
                    ...prev,
                    ...cfg,
                    workingDays,
                    collegeStartMinute: cfg.collegeStartMinute ?? 480,
                    collegeEndMinute: cfg.collegeEndMinute ?? 1020,
                    classDuration: cfg.classDuration ?? 50,
                    labDuration: cfg.labDuration ?? 100,
                    semesterStartDate: cfg.semesterStartDate || prev?.semesterStartDate,
                    lastWorkingDate: cfg.lastWorkingDate || prev?.lastWorkingDate
                }));

                if (configRes.value.data.allottedTimetable) {
                    setAllottedTimetable(prev => prev || configRes.value.data.allottedTimetable);
                }
            }
        } catch (err) {
            console.error('Error fetching timetable data:', err);
        } finally {
            setIsTimetableLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'timetable' || activeTab === 'my-timetable') {
            fetchTimetableData(selectedSemester);
        }
    }, [activeTab, selectedSemester]);

    // Lazy load registered subjects in background for baseline setup and class overrides
    useEffect(() => {
        if (registeredSubjectsList.length === 0) {
            apiV2.getRegisteredSubjects(selectedSemester).then(res => {
                if (res?.data?.success) {
                    setRegisteredSubjectsList(res.data.data || []);
                }
            }).catch(() => {});
        }
    }, [selectedSemester, registeredSubjectsList.length]);

    // 3. Fetch day classes for selected date
    const fetchDayAttendance = async (dateStr, sem, showLoading = false) => {
        if (showLoading) setIsDayLoading(true);
        try {
            const res = await apiV2.getAttendanceDay(dateStr, sem).catch(() => ({ data: { success: false, data: [] } }));
            if (res?.data?.success) {
                setDayClasses(res.data.data || []);
                setDayEventInfo({
                    classesSuspended: Boolean(res.data.classesSuspended),
                    suspensionType: res.data.suspensionType || (res.data.classesSuspended ? 'full_day' : 'none'),
                    timeRangeSuspension: res.data.timeRangeSuspension || null,
                    dayEvents: res.data.dayEvents || [],
                    activeEvent: res.data.activeEvent || null,
                    message: res.data.message || ''
                });
            }
        } catch (err) {
            console.error('Error fetching day attendance:', err);
        } finally {
            if (showLoading) setIsDayLoading(false);
        }
    };

    // Initial load: Concurrently and non-blockingly loads today's classes and semester metrics
    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            try {
                const today = getLocalDateString(new Date());
                setSelectedDate(today);

                const currentSem = Number(user?.semester) || 1;
                setSelectedSemester(currentSem);

                // Fetch day attendance & student profile in parallel
                const dayPromise = fetchDayAttendance(today, currentSem, false);
                const profilePromise = fetchStudentProfile();

                // Release full-screen spinner as soon as today's classes are ready (usually < 300ms)
                dayPromise.then(() => {
                    if (isMounted) setLoading(false);
                }).catch(() => {
                    if (isMounted) setLoading(false);
                });

                // Load semester metrics in parallel in the background
                const semPromise = fetchSemesterData(currentSem, false);

                await Promise.all([dayPromise, profilePromise, semPromise]);
            } catch (err) {
                console.error('Error initializing attendance:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        init();
        return () => { isMounted = false; };
    }, []);

    // Change semester
    const handleSemesterChange = async (sem) => {
        setSelectedSemester(sem);
        setTimetableSlots([]);
        await Promise.all([
            fetchSemesterData(sem, false),
            fetchDayAttendance(selectedDate, sem, true)
        ]);
    };

    // Change date
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const handleSelectDate = async (dateStr) => {
        if (dateStr === selectedDate) return;
        setSelectedDate(dateStr);
        setDayClasses([]); // Clear stale dayClasses to prevent flash of previous date
        await fetchDayAttendance(dateStr, selectedSemester, true);
    };

    const handlePrevDay = () => {
        const d = new Date(selectedDate + 'T12:00:00');
        d.setDate(d.getDate() - 1);
        handleSelectDate(getLocalDateString(d));
    };

    const handleNextDay = () => {
        const d = new Date(selectedDate + 'T12:00:00');
        d.setDate(d.getDate() + 1);
        handleSelectDate(getLocalDateString(d));
    };

    const handleTodayClick = () => {
        handleSelectDate(getLocalDateString(new Date()));
    };

    // Mark / Edit attendance for a specific class slot
    const handleMarkAttendance = async (classItem, status) => {
        if (readOnly && !isSuperAdmin) {
            toast.error('Attendance is read-only for archived semesters.');
            return;
        }

        const slotId = classItem._id || `${classItem.subjectId}_${classItem.timeSlot}`;
        const previousDayClasses = [...dayClasses];
        const previousGroupedTimeline = [...groupedTimeline];

        const constituentSlots = classItem.subSlots && classItem.subSlots.length > 0
            ? classItem.subSlots.map(s => s.timeSlot)
            : [classItem.timeSlot];

        // Optimistic update of dayClasses
        setDayClasses(prev => prev.map(c => {
            const cId = c._id || `${c.subjectId}_${c.timeSlot}`;
            if (cId === slotId) {
                return { ...c, status };
            }
            return c;
        }));

        // Optimistic update of groupedTimeline so calendar right mark (✓) appears immediately
        const dateKey = String(selectedDate).split('T')[0];
        setGroupedTimeline(prev => {
            return prev.map(g => {
                if (String(g.date).split('T')[0] === dateKey) {
                    const currentSlots = g.slots || g.classes || [];
                    const updatedSlots = currentSlots.map(s => {
                        const isMatch = s.timeSlot === classItem.timeSlot || constituentSlots.includes(s.timeSlot);
                        if (isMatch) {
                            return { ...s, status };
                        }
                        return s;
                    });
                    return { ...g, slots: updatedSlots, classes: updatedSlots };
                }
                return g;
            });
        });

        try {
            const res = await apiV2.updateAttendanceHistoryV2({
                subjectId: classItem.subjectId,
                scheduledSubjectId: classItem.scheduledSubjectId || classItem.subjectId,
                date: selectedDate,
                timeSlot: classItem.timeSlot,
                constituentSlots,
                status,
                allowFutureOverride: isSuperAdmin
            });

            if (res.data?.success) {
                // Refresh overall metrics in background silently (NO re-fetching dayClasses to prevent flicker / overwrites)
                fetchSemesterData(selectedSemester, false);
                window.dispatchEvent(new Event('attendance-updated'));
            } else {
                setDayClasses(previousDayClasses);
                setGroupedTimeline(previousGroupedTimeline);
                toast.error(res.data?.message || 'Failed to update attendance');
            }
        } catch (err) {
            console.error('Error marking attendance:', err);
            setDayClasses(previousDayClasses);
            setGroupedTimeline(previousGroupedTimeline);
            toast.error('Failed to update attendance. Please try again.');
        }
    };

    // Recalculate / Sync
    const handleRecalculate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiV2.recalculateAttendance();
            if (res.data?.success) {
                await fetchSemesterData(selectedSemester, true);
                await fetchDayAttendance(selectedDate, selectedSemester, true);
                toast.success('Attendance synced and recalculated successfully!');
            } else {
                setError(res.data?.message || 'Failed to recalculate attendance');
            }
        } catch (err) {
            console.error('Error recalculating attendance:', err);
            setError(err.response?.data?.message || 'An error occurred while recalculating.');
        } finally {
            setLoading(false);
        }
    };

    // One-Tap Mark All Present Today
    const handleMarkAllPresentToday = async () => {
        if (readOnly && !isSuperAdmin) {
            toast.error('Attendance is read-only for archived semesters.');
            return;
        }
        const unrecorded = dayClasses.filter(c => !c.status || c.status === 'Yet To Be Taken' || c.status === 'NOT_MARKED');
        if (unrecorded.length === 0) {
            toast('All classes for today are already recorded.', { icon: 'ℹ️' });
            return;
        }

        // Optimistic update
        setDayClasses(prev => prev.map(c => ({ ...c, status: 'Present' })));
        
        const dateKey = String(selectedDate).split('T')[0];
        setGroupedTimeline(prev => {
            return prev.map(g => {
                if (String(g.date).split('T')[0] === dateKey) {
                    const currentSlots = g.slots || g.classes || [];
                    const updatedSlots = currentSlots.map(s => ({ ...s, status: 'Present' }));
                    return { ...g, slots: updatedSlots, classes: updatedSlots };
                }
                return g;
            });
        });

        try {
            for (const item of unrecorded) {
                const constituentSlots = item.subSlots && item.subSlots.length > 0
                    ? item.subSlots.map(s => s.timeSlot)
                    : [item.timeSlot];

                await apiV2.updateAttendanceHistoryV2({
                    subjectId: item.subjectId,
                    scheduledSubjectId: item.scheduledSubjectId || item.subjectId,
                    date: selectedDate,
                    timeSlot: item.timeSlot,
                    constituentSlots,
                    status: 'Present',
                    allowFutureOverride: isSuperAdmin
                });
            }
            toast.success(`Marked all ${unrecorded.length} classes as Present!`);
            fetchSemesterData(selectedSemester, false);
            window.dispatchEvent(new Event('attendance-updated'));
        } catch (err) {
            console.error('Error marking all present:', err);
            toast.error('Failed to mark all classes. Please try again.');
            await fetchDayAttendance(selectedDate, selectedSemester, false);
        }
    };

    // Helper to check if a class slot has recorded attendance
    const isMarkedStatus = (status) => {
        if (!status) return false;
        const s = String(status).trim().toUpperCase();
        return s !== 'YET TO BE TAKEN' && s !== 'NOT_MARKED' && s !== 'PENDING' && s !== '' && s !== 'NULL' && s !== 'UNDEFINED';
    };

    // Calculate unconfirmed past classes count
    const unconfirmedPastCount = useMemo(() => {
        const today = getLocalDateString(new Date());
        let count = 0;
        (groupedTimeline || []).forEach(dayGroup => {
            if (!dayGroup.date) return;
            const dateStr = String(dayGroup.date).split('T')[0];
            if (dateStr < today) {
                const daySlots = dayGroup.slots || dayGroup.classes || [];
                daySlots.forEach(c => {
                    if (!isMarkedStatus(c.status)) {
                        count++;
                    }
                });
            }
        });
        return count;
    }, [groupedTimeline]);

    // Quick-Mark all past unconfirmed classes as Present (Instant 0ms Optimistic Update + Single Bulk API)
    const handleQuickMarkPastAsPresent = async () => {
        if (readOnly) return;
        const today = getLocalDateString(new Date());

        // 1. Instantly update groupedTimeline optimistically so banner disappears and calendar turns green immediately
        setGroupedTimeline(prev => {
            return prev.map(dayGroup => {
                if (!dayGroup.date) return dayGroup;
                const dateStr = String(dayGroup.date).split('T')[0];
                if (dateStr < today) {
                    const daySlots = dayGroup.slots || dayGroup.classes || [];
                    const updatedSlots = daySlots.map(s => ({ ...s, status: 'Present' }));
                    return { ...dayGroup, slots: updatedSlots, classes: updatedSlots };
                }
                return dayGroup;
            });
        });

        // 2. If viewing a past date, immediately mark active day classes as Present
        if (selectedDate < today) {
            setDayClasses(prev => prev.map(c => ({ ...c, status: 'Present' })));
        }

        toast.success('All past classes marked as Present!');

        // 3. Single bulk background operation to backend
        try {
            await apiV2.updateAttendanceHistoryV2({ markAllPast: true });
            fetchSemesterData(selectedSemester, false);
            window.dispatchEvent(new Event('attendance-updated'));
        } catch (err) {
            console.error('Error quick marking past classes:', err);
            fetchSemesterData(selectedSemester, false);
            fetchDayAttendance(selectedDate, selectedSemester, false);
        }
    };

    // Reset Day Attendance to Original Timetable State
    const handleResetDayAttendance = async () => {
        if (readOnly && !isSuperAdmin) {
            toast.error('Attendance is read-only for archived semesters.');
            return;
        }
        const markedCount = dayClasses.filter(c => c.status && c.status !== 'Yet To Be Taken' && c.status !== 'NOT_MARKED').length;
        if (markedCount === 0) {
            toast('No recorded classes to reset for this date.', { icon: 'ℹ️' });
            return;
        }

        // Optimistically clear statuses to Yet To Be Taken and restore original scheduled subjects
        setDayClasses(prev => prev.map(c => ({
            ...c,
            status: 'Yet To Be Taken',
            subjectId: c.scheduledSubjectId || c.subjectId,
            subjectName: c.scheduledSubjectName || c.subjectName,
            subjectCode: c.scheduledSubjectCode || c.subjectCode,
            isSubjectChanged: false
        })));

        const dateKey = String(selectedDate).split('T')[0];
        setGroupedTimeline(prev => {
            return prev.map(g => {
                if (String(g.date).split('T')[0] === dateKey) {
                    const currentSlots = g.slots || g.classes || [];
                    const updatedSlots = currentSlots.map(s => ({
                        ...s,
                        status: 'Yet To Be Taken',
                        subject: s.scheduledSubject || s.subject,
                        isSubjectChanged: false
                    }));
                    return { ...g, slots: updatedSlots, classes: updatedSlots };
                }
                return g;
            });
        });

        try {
            await apiV2.updateAttendanceHistoryV2({
                date: selectedDate,
                resetDay: true
            });
            toast.success('Restored to original timetable classes!');
            await fetchSemesterData(selectedSemester, false);
            await fetchDayAttendance(selectedDate, selectedSemester, false);
            window.dispatchEvent(new Event('attendance-updated'));
        } catch (err) {
            console.error('Error resetting day attendance:', err);
            toast.error('Failed to reset attendance.');
            await fetchDayAttendance(selectedDate, selectedSemester, false);
        }
    };

    // Promote Semester
    const handlePromoteSemester = async () => {
        const confirmText = `Are you sure you want to Finish Semester ${currentStudentSemester}?\n\nThis will freeze your configurations and attendance records for Semester ${currentStudentSemester} into a Read-Only snapshot.`;
        if (window.confirm(confirmText)) {
            setLoading(true);
            try {
                const res = await apiV2.promoteSemester();
                if (res.data?.success) {
                    const newSem = await fetchStudentProfile();
                    setSelectedSemester(newSem);
                    await fetchSemesterData(newSem);
                    await fetchDayAttendance(selectedDate, newSem);
                    toast.success(`Promoted to Semester ${newSem}!`);
                } else {
                    setError(res.data?.message || 'Failed to promote semester');
                }
            } catch (err) {
                console.error('Error promoting semester:', err);
                setError(err.response?.data?.message || 'An error occurred during promotion.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleOpenSwapModal = (classItem) => {
        setSelectedSwapClass(classItem);
        setIsSwapModalOpen(true);
    };

    const handleConfirmSubjectSwap = async ({ classItem, scheduledSubjectId, newSubjectId, status }) => {
        try {
            const res = await apiV2.updateAttendanceHistoryV2({
                scheduledSubjectId,
                subjectId: newSubjectId,
                date: selectedDate,
                timeSlot: classItem.timeSlot,
                status: status || 'Present',
                allowFutureOverride: isSuperAdmin
            });

            if (res.data?.success) {
                toast.success('Subject changed successfully for this occurrence!');
                await fetchSemesterData(selectedSemester);
                await fetchDayAttendance(selectedDate, selectedSemester);
                window.dispatchEvent(new Event('attendance-updated'));
            } else {
                toast.error(res.data?.message || 'Failed to change subject');
            }
        } catch (err) {
            console.error('Error swapping subject:', err);
            toast.error('Failed to change subject.');
        }
    };

    // Export Reports
    const handleExport = (format) => {
        setIsExportDropdownOpen(false);
        const url = apiV2.getReportExportUrl(selectedSemester, format);
        window.open(url, '_blank');
    };

    // Update Student Personal Attendance Target
    const handleUpdateAttendanceTarget = async (newTarget) => {
        try {
            const res = await apiV2.updateAttendanceTarget({
                semester: selectedSemester,
                targetPercentage: newTarget
            });
            if (res.data?.success) {
                toast.success(`Attendance target updated to ${newTarget}%`);
                await fetchSemesterData(selectedSemester);
            } else {
                toast.error(res.data?.message || 'Failed to update attendance target');
            }
        } catch (err) {
            console.error('Error updating target:', err);
            toast.error(err.response?.data?.message || 'Failed to update attendance target');
        }
    };

    // Open Drawer for Subject Timeline History
    const handleEditSubjectHistory = async (subj) => {
        try {
            setSelectedSubject(subj);
            setIsDrawerOpen(true);

            const detailRes = await apiV2.getSubjectAttendanceDetail(subj.subjectId, selectedSemester, subj.category);
            if (detailRes.data?.success) {
                setAttendanceHistory(detailRes.data.data?.history || []);
                setSubjectForecast(detailRes.data.data?.forecast || null);
            }
        } catch (err) {
            console.error('Error loading subject history drawer:', err);
        }
    };

    // Drawer status update
    const handleUpdateDrawerStatus = async (item, status, remarks) => {
        if (!selectedSubject) return;
        const originalHistory = [...attendanceHistory];

        setAttendanceHistory(prev => prev.map(h => {
            if (h.date === item.date && h.timeSlot === item.timeSlot) {
                return { ...h, status, remarks };
            }
            return h;
        }));

        try {
            const res = await apiV2.updateAttendanceHistoryV2({
                subjectId: selectedSubject.subjectId,
                date: item.date,
                timeSlot: item.timeSlot,
                status,
                remarks,
                allowFutureOverride: isSuperAdmin
            });
            if (res.data?.success) {
                await fetchSemesterData(selectedSemester);
                await fetchDayAttendance(selectedDate, selectedSemester);
                const detailRes = await apiV2.getSubjectAttendanceDetail(selectedSubject.subjectId, selectedSemester, selectedSubject.category);
                if (detailRes.data?.success) {
                    setAttendanceHistory(detailRes.data.data?.history || []);
                    setSubjectForecast(detailRes.data.data?.forecast || null);
                }
                window.dispatchEvent(new Event('attendance-updated'));
            } else {
                setAttendanceHistory(originalHistory);
                toast.error('Failed to update status.');
            }
        } catch (err) {
            console.error('Error updating attendance drawer:', err);
            setAttendanceHistory(originalHistory);
            toast.error('Failed to update status.');
        }
    };

    const handleAddExtraClass = async (data) => {
        if (!selectedSubject) return;
        try {
            const res = await apiV2.addExtraClassV2({
                subjectId: selectedSubject.subjectId,
                date: data.date,
                time: data.time,
                status: data.status,
                remarks: data.remarks,
                lectureType: data.lectureType || 'Lecture'
            });

            if (res.data?.success) {
                await fetchSemesterData(selectedSemester);
                await fetchDayAttendance(selectedDate, selectedSemester);
                const detailRes = await apiV2.getSubjectAttendanceDetail(selectedSubject.subjectId, selectedSemester, selectedSubject.category);
                if (detailRes.data?.success) {
                    setAttendanceHistory(detailRes.data.data?.history || []);
                    setSubjectForecast(detailRes.data.data?.forecast || null);
                }
                window.dispatchEvent(new Event('attendance-updated'));
            }
        } catch (err) {
            console.error('Error adding extra class:', err);
        }
    };

    const handleDeleteExtraClass = async (historyId) => {
        try {
            const res = await apiV2.deleteExtraClassV2(historyId);
            if (res.data?.success) {
                await fetchSemesterData(selectedSemester);
                await fetchDayAttendance(selectedDate, selectedSemester);
                if (selectedSubject) {
                    const detailRes = await apiV2.getSubjectAttendanceDetail(selectedSubject.subjectId, selectedSemester, selectedSubject.category);
                    if (detailRes.data?.success) {
                        setAttendanceHistory(detailRes.data.data?.history || []);
                        setSubjectForecast(detailRes.data.data?.forecast || null);
                    }
                }
                window.dispatchEvent(new Event('attendance-updated'));
            }
        } catch (err) {
            console.error('Error deleting extra class:', err);
        }
    };

    // Compute number of personalized slot overrides against official baseline
    const personalChangesCount = useMemo(() => {
        if (!officialTimetableSlots || officialTimetableSlots.length === 0) return 0;
        return timetableSlots.filter(s => {
            if (s.isPersonalChange) return true;
            const off = officialTimetableSlots.find(os => 
                os.dayOfWeek === s.dayOfWeek && 
                Number(os.startMinute) === Number(s.startMinute)
            );
            if (!off) return false;
            const offSubj = String(off.subject?._id || off.subject || '');
            const curSubj = String(s.subject?._id || s.subject || '');
            return offSubj !== curSubj || (off.lectureType && off.lectureType !== s.lectureType);
        }).length;
    }, [timetableSlots, officialTimetableSlots]);

    // Track number of unsaved changes in current editing session
    const unsavedChangesCount = useMemo(() => {
        if (!initialTimetableSlots || initialTimetableSlots.length === 0) return 0;
        let count = 0;
        for (const cur of timetableSlots) {
            const init = initialTimetableSlots.find(s => 
                s.dayOfWeek === cur.dayOfWeek && 
                Number(s.startMinute) === Number(cur.startMinute)
            );
            if (!init) {
                count++;
                continue;
            }
            const initSubj = String(init.subject?._id || init.subject || '');
            const curSubj = String(cur.subject?._id || cur.subject || '');
            if (
                initSubj !== curSubj || 
                init.lectureType !== cur.lectureType || 
                init.sessionGroupId !== cur.sessionGroupId ||
                Boolean(init.isPersonalChange) !== Boolean(cur.isPersonalChange)
            ) {
                count++;
            }
        }
        return count;
    }, [timetableSlots, initialTimetableSlots]);

    // Handle slot click from grid when in customization mode
    const handleSlotClick = (slot) => {
        if (!isCustomizingTimetable) return;
        setEditingTimetableSlot(slot);
    };

    // Apply slot customization with scope & atomic multi-period lab handling
    const handleApplySlotCustomization = ({
        slot,
        linkedSlot,
        isMultiPeriod,
        isConvertingToTheory,
        isConvertingToLab,
        isClearSlot,
        newSubject,
        newSubjectId,
        lectureType,
        scopeType,
        effectiveDate,
        appliesToPast
    }) => {
        if (appliesToPast) {
            setPendingPastChange({
                slot,
                linkedSlot,
                isMultiPeriod,
                isConvertingToTheory,
                isClearSlot,
                newSubject,
                newSubjectId,
                lectureType,
                effectiveDate
            });
            setEditingTimetableSlot(null);
            return;
        }

        // Resolve subject with both _id and id so UI components can display it immediately
        const resolvedSubject = newSubject
            ? {
                ...newSubject,
                _id: newSubject._id || newSubject.id || newSubjectId,
                id: newSubject.id || newSubject._id || newSubjectId
              }
            : (newSubjectId || null);

        setTimetableSlots(prevSlots => {
            const next = [...prevSlots];

            // Case A: Clear slot (or both consecutive slots if multi-period lab)
            if (isClearSlot) {
                return next.map(s => {
                    const isTarget = s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(slot.startMinute);
                    const isLinked = linkedSlot && s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(linkedSlot.startMinute);
                    if (isTarget || isLinked) {
                        return {
                            ...s,
                            subject: null,
                            lectureType: 'Free Period',
                            sessionGroupId: null,
                            effectiveDate,
                            isPersonalChange: true
                        };
                    }
                    return s;
                });
            }

            // Case B: Converting 2-period lab to 1-period theory
            if (isConvertingToTheory) {
                return next.map(s => {
                    const isTarget = s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(slot.startMinute);
                    const isLinked = linkedSlot && s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(linkedSlot.startMinute);
                    if (isTarget) {
                        return {
                            ...s,
                            subject: resolvedSubject,
                            lectureType: 'Lecture',
                            sessionGroupId: null,
                            effectiveDate,
                            isPersonalChange: true
                        };
                    }
                    if (isLinked) {
                        return {
                            ...s,
                            subject: null,
                            lectureType: 'Free Period',
                            sessionGroupId: null,
                            effectiveDate,
                            isPersonalChange: true
                        };
                    }
                    return s;
                });
            }

            // Case C: Multi-period Lab (either converted to lab or editing existing 2-period lab)
            if (isMultiPeriod && linkedSlot) {
                const groupId = slot.sessionGroupId || linkedSlot.sessionGroupId || `lab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                return next.map(s => {
                    const isTarget = s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(slot.startMinute);
                    const isLinked = s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(linkedSlot.startMinute);
                    if (isTarget || isLinked) {
                        return {
                            ...s,
                            subject: resolvedSubject,
                            lectureType: 'Lab',
                            sessionGroupId: groupId,
                            effectiveDate,
                            isPersonalChange: true
                        };
                    }
                    return s;
                });
            }

            // Case D: Single period class (Theory/Lecture)
            return next.map(s => {
                const isTarget = s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(slot.startMinute);
                if (!isTarget) return s;
                return {
                    ...s,
                    subject: resolvedSubject,
                    lectureType: lectureType || s.lectureType || 'Lecture',
                    sessionGroupId: null,
                    effectiveDate,
                    isPersonalChange: true
                };
            });
        });

        setEditingTimetableSlot(null);
    };

    // Reset an individual slot back to official baseline
    const handleResetSlotToOfficial = (slot) => {
        if (!slot) return;
        const offPrimary = officialTimetableSlots.find(os =>
            os.dayOfWeek === slot.dayOfWeek &&
            Number(os.startMinute) === Number(slot.startMinute)
        );

        const offLinked = slot.linkedSlot ? officialTimetableSlots.find(os =>
            os.dayOfWeek === slot.dayOfWeek &&
            Number(os.startMinute) === Number(slot.linkedSlot.startMinute)
        ) : null;

        setTimetableSlots(prevSlots => {
            return prevSlots.map(s => {
                if (s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(slot.startMinute)) {
                    return offPrimary ? { ...offPrimary, isPersonalChange: false } : s;
                }
                if (slot.linkedSlot && s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(slot.linkedSlot.startMinute)) {
                    return offLinked ? { ...offLinked, isPersonalChange: false } : s;
                }
                return s;
            });
        });

        setEditingTimetableSlot(null);
        toast.success('Reset slot to official college baseline');
    };

    // Discard unsaved changes in current editing session
    const handleDiscardTimetableChanges = () => {
        setTimetableSlots(initialTimetableSlots);
        toast('Changes discarded.', { icon: '↩️' });
    };

    // Save personal timetable overrides to backend
    const handleSavePersonalTimetable = async () => {
        setIsSavingTimetable(true);
        try {
            // Filter out breaks before submitting (breaks are immutable) and normalize subject to string ID
            const payloadSlots = timetableSlots
                .filter(s => s.lectureType !== 'Break')
                .map(s => {
                    const rawSubj = s.subject?._id || s.subject?.id || s.subject;
                    const subjectId = (rawSubj && typeof rawSubj === 'object')
                        ? (rawSubj._id || rawSubj.id || null)
                        : (rawSubj || null);
                    return {
                        ...s,
                        subject: subjectId
                    };
                });
            const res = await apiV2.updateTimetableSlots({
                semester: selectedSemester,
                slots: payloadSlots
            });

            if (res.data?.success) {
                toast.success('Personal timetable saved successfully!');
                const updated = Array.isArray(res.data.data) 
                    ? res.data.data 
                    : (res.data.data?.slots || res.data.slots || timetableSlots);
                setTimetableSlots(updated);
                setInitialTimetableSlots(updated);
                await fetchSemesterData(selectedSemester, false);
                await fetchDayAttendance(selectedDate, selectedSemester, false);
                window.dispatchEvent(new Event('attendance-updated'));
            } else {
                toast.error(res.data?.message || 'Failed to save timetable changes.');
            }
        } catch (err) {
            console.error('Error saving timetable changes:', err);
            toast.error(err.response?.data?.message || 'Failed to save timetable changes.');
        } finally {
            setIsSavingTimetable(false);
        }
    };

    // Confirm full reset of personal timetable back to official baseline
    const handleConfirmResetToOfficial = async () => {
        setIsResettingTimetable(true);
        try {
            const res = await apiV2.resetTimetable({ preserveAttendance: true });
            if (res.data?.success) {
                toast.success('Restored official college timetable. Past attendance preserved.');
                setIsResetConfirmOpen(false);
                setIsCustomizingTimetable(false);
                await fetchTimetableData(selectedSemester);
                await fetchSemesterData(selectedSemester, false);
                await fetchDayAttendance(selectedDate, selectedSemester, false);
                window.dispatchEvent(new Event('attendance-updated'));
            } else {
                toast.error(res.data?.message || 'Failed to reset timetable');
            }
        } catch (err) {
            console.error('Error resetting timetable:', err);
            toast.error(err.response?.data?.message || 'Failed to reset timetable');
        } finally {
            setIsResettingTimetable(false);
        }
    };

    const handleConfirmKeepPast = () => {
        if (!pendingPastChange) return;
        const { slot, linkedSlot, isMultiPeriod, isConvertingToTheory, isClearSlot, newSubject, newSubjectId, lectureType } = pendingPastChange;
        const effectiveDate = new Date().toISOString().slice(0, 10);
        handleApplySlotCustomization({
            slot,
            linkedSlot,
            isMultiPeriod,
            isConvertingToTheory,
            isClearSlot,
            newSubject,
            newSubjectId,
            lectureType,
            effectiveDate,
            appliesToPast: false
        });
        setPendingPastChange(null);
    };

    const handleConfirmApplyPast = () => {
        if (!pendingPastChange) return;
        const { slot, linkedSlot, isMultiPeriod, isConvertingToTheory, isClearSlot, newSubject, newSubjectId, lectureType } = pendingPastChange;
        setTimetableSlots(prevSlots => {
            const next = [...prevSlots];
            if (isClearSlot) {
                return next.map(s => {
                    const isTarget = s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(slot.startMinute);
                    const isLinked = linkedSlot && s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(linkedSlot.startMinute);
                    if (isTarget || isLinked) {
                        return { ...s, subject: null, lectureType: 'Free Period', sessionGroupId: null, appliesToPast: true, isPersonalChange: true };
                    }
                    return s;
                });
            }
            if (isConvertingToTheory) {
                return next.map(s => {
                    const isTarget = s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(slot.startMinute);
                    const isLinked = linkedSlot && s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(linkedSlot.startMinute);
                    if (isTarget) return { ...s, subject: newSubject || newSubjectId, lectureType: 'Lecture', sessionGroupId: null, appliesToPast: true, isPersonalChange: true };
                    if (isLinked) return { ...s, subject: null, lectureType: 'Free Period', sessionGroupId: null, appliesToPast: true, isPersonalChange: true };
                    return s;
                });
            }
            if (isMultiPeriod && linkedSlot) {
                const groupId = slot.sessionGroupId || linkedSlot.sessionGroupId || `lab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                return next.map(s => {
                    const isTarget = s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(slot.startMinute);
                    const isLinked = s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(linkedSlot.startMinute);
                    if (isTarget || isLinked) {
                        return { ...s, subject: newSubject || newSubjectId, lectureType: 'Lab', sessionGroupId: groupId, appliesToPast: true, isPersonalChange: true };
                    }
                    return s;
                });
            }
            return next.map(s => {
                const isTarget = s.dayOfWeek === slot.dayOfWeek && Number(s.startMinute) === Number(slot.startMinute);
                if (!isTarget) return s;
                return { ...s, subject: newSubject || newSubjectId, lectureType: lectureType || s.lectureType || 'Lecture', appliesToPast: true, isPersonalChange: true };
            });
        });
        setPendingPastChange(null);
    };

    const activeTabObj = ALL_NAV_TABS.find(t => t.id === activeTab) || ALL_NAV_TABS[0];

    const renderActiveSection = () => {
        switch (activeTab) {
            case 'timetable':
            case 'my-timetable':
                return (
                    <div className="flex flex-col gap-4 w-full">
                        {/* Personal Timetable Top Header (CSES + Modern SaaS style) */}
                        <div 
                            style={{
                                background: isDark 
                                    ? 'linear-gradient(to right, rgba(24, 24, 27, 0.9), #131722, rgba(24, 24, 27, 0.9))'
                                    : '#FFFFFF',
                                border: `1px solid ${t.border}`,
                                borderRadius: '12px',
                                padding: '18px 20px',
                                boxShadow: t.cardShadow,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {isDark && (
                                <div className="absolute top-0 right-0 w-72 h-32 bg-violet-600/10 blur-3xl pointer-events-none" />
                            )}
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: t.accentText, fontFamily: 'monospace', textTransform: 'uppercase' }}>
                                            MY TIMETABLE
                                        </span>
                                        <span style={{ color: t.divider }}>·</span>
                                        <span style={{ fontSize: '11px', color: t.textMuted, fontFamily: 'monospace' }}>
                                            Semester {selectedSemester}
                                        </span>
                                        {personalChangesCount > 0 && (
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '9999px',
                                                fontSize: '10px',
                                                fontFamily: 'monospace',
                                                fontWeight: 600,
                                                background: t.accentBg,
                                                color: t.accentText,
                                                border: `1px solid ${t.accentBorder}`
                                            }}>
                                                {personalChangesCount} personal {personalChangesCount === 1 ? 'change' : 'changes'}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap items-baseline gap-2.5">
                                        <h2 style={{ fontSize: '19px', fontWeight: 700, color: t.text, letterSpacing: '-0.01em', margin: 0 }}>
                                            Your personal timetable
                                        </h2>
                                        <span style={{ fontSize: '12px', color: t.textMuted, fontFamily: 'monospace' }}>
                                            Section {allottedTimetable?.sectionName || userProfile?.section || 'K'} · Batch {allottedTimetable?.labBatch || userProfile?.labBatch || 'B1'}
                                            {allottedTimetable?.branchName ? ` · ${allottedTimetable.branchName}` : ''}
                                        </span>
                                    </div>

                                    <p style={{ fontSize: '12px', color: t.textMuted, margin: 0, maxWidth: '600px', lineHeight: 1.5 }}>
                                        Based on your official college timetable. You can customize your personal schedule.
                                    </p>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={() => setIsViewingOfficial(true)}
                                        style={{
                                            padding: '7px 14px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontFamily: 'monospace',
                                            fontWeight: 600,
                                            color: t.text,
                                            background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                                            border: `1px solid ${t.border}`,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <Lock size={12} style={{ color: '#10B981' }} />
                                        <span>View Official</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsResetConfirmOpen(true)}
                                        title="Restore official college schedule for future dates"
                                        style={{
                                            padding: '7px 14px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontFamily: 'monospace',
                                            fontWeight: 600,
                                            color: isDark ? '#94A3B8' : '#64748B',
                                            background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                                            border: `1px solid ${t.border}`,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <RotateCcw size={12} />
                                        <span className="hidden sm:inline">Reset to Official</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isCustomizingTimetable && unsavedChangesCount > 0) {
                                                if (window.confirm('You have unsaved timetable changes. Discard them before exiting?')) {
                                                    handleDiscardTimetableChanges();
                                                    setIsCustomizingTimetable(false);
                                                }
                                            } else {
                                                setIsCustomizingTimetable(prev => !prev);
                                            }
                                        }}
                                        style={{
                                            padding: '7px 14px',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            fontFamily: 'monospace',
                                            fontWeight: 600,
                                            color: '#FFFFFF',
                                            background: isCustomizingTimetable 
                                                ? '#059669' 
                                                : (isDark ? 'rgba(124, 58, 237, 0.3)' : '#7C3AED'),
                                            border: isCustomizingTimetable
                                                ? '1px solid #059669'
                                                : `1px solid ${isDark ? 'rgba(139, 92, 246, 0.4)' : '#7C3AED'}`,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                            boxShadow: isCustomizingTimetable 
                                                ? '0 2px 8px rgba(5, 150, 105, 0.25)' 
                                                : '0 2px 8px rgba(124, 58, 237, 0.25)',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {isCustomizingTimetable ? (
                                            <>
                                                <Check size={13} strokeWidth={2.5} />
                                                <span>Done Editing</span>
                                            </>
                                        ) : (
                                            <>
                                                <Edit3 size={13} />
                                                <span>Customize Timetable</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {isTimetableLoading ? (
                            <div className="p-12 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                                <span>Loading timetable schedule...</span>
                            </div>
                        ) : (
                            <WeeklyTimetableGrid
                                slots={timetableSlots}
                                config={timetableConfig}
                                subjects={registeredSubjectsList}
                                registeredSubjects={registeredSubjectsList}
                                user={userProfile}
                                allottedTimetable={allottedTimetable}
                                officialSlots={officialTimetableSlots}
                                isCustomizing={isCustomizingTimetable}
                                onCellClick={handleSlotClick}
                            />
                        )}

                        {/* Floating Unsaved Changes Bar */}
                        {isCustomizingTimetable && unsavedChangesCount > 0 && (
                            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-md animate-fadeIn ${
                                isDark 
                                    ? 'bg-[#12141D]/95 border-violet-500/40 text-white' 
                                    : 'bg-white/95 border-violet-500/30 text-slate-900 shadow-xl'
                            }`}>
                                <div className="flex items-center gap-2 font-mono text-xs text-violet-400 font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                                    <span>{unsavedChangesCount} unsaved timetable {unsavedChangesCount === 1 ? 'change' : 'changes'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleDiscardTimetableChanges}
                                        disabled={isSavingTimetable}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors disabled:opacity-50 ${
                                            isDark
                                                ? 'text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
                                                : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                                        }`}
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSavePersonalTimetable}
                                        disabled={isSavingTimetable}
                                        className="px-4 py-1.5 rounded-lg text-xs font-mono font-semibold text-white bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-600/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    >
                                        {isSavingTimetable ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'overview':
            case 'summary':
                return (
                    <AttendanceSummaryView
                        progressList={progressList}
                        overallMetrics={overallMetrics}
                        onOpenBaselineModal={() => setIsBaselineModalOpen(true)}
                        readOnly={readOnly}
                        selectedSemester={selectedSemester}
                        onTargetUpdated={() => fetchSemesterData(selectedSemester)}
                    />
                );
            case 'today':
            case 'daily':
            default: {
                return (
                    <div className="w-full">
                        <DailyAttendanceWorkspace
                            selectedDate={selectedDate}
                            onSelectDate={handleSelectDate}
                            onPrevDay={handlePrevDay}
                            onNextDay={handleNextDay}
                            onTodayClick={handleTodayClick}
                            dayClasses={dayClasses}
                            isLoading={isDayLoading}
                            onMarkAttendance={handleMarkAttendance}
                            onMarkAllPresent={handleMarkAllPresentToday}
                            onResetDayAttendance={handleResetDayAttendance}
                            unconfirmedPastCount={unconfirmedPastCount}
                            onQuickMarkPast={handleQuickMarkPastAsPresent}
                            readOnly={readOnly && !isSuperAdmin}
                            timetableConfig={timetableConfig}
                            groupedTimeline={groupedTimeline}
                            events={eventsList}
                            dayEventInfo={dayEventInfo}
                            canEditAnytime={isSuperAdmin}
                            registeredSubjects={registeredSubjectsList}
                            onConfirmSubjectSwap={handleConfirmSubjectSwap}
                            onRestoreOriginalClass={async (classItem) => {
                                await handleConfirmSubjectSwap({
                                    classItem,
                                    scheduledSubjectId: classItem.scheduledSubjectId || classItem.subjectId,
                                    newSubjectId: classItem.scheduledSubjectId || classItem.subjectId,
                                    status: classItem.status || 'Present'
                                });
                            }}
                        />
                    </div>
                );
            }
        }
    };

    if (loading) {
        return (
            <div style={{
                height: 'calc(100vh - 32px)',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: '#a78bfa',
                fontSize: '13px'
            }}>
                <Loader2 size={20} className="animate-spin" />
                <span>Loading attendance workspace...</span>
            </div>
        );
    }

    return (
        <div style={{
            width: '100%',
            minHeight: '100%',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* ══════════════════════════════════════════════════════════════
                1. DESKTOP VIEW (≥ 1200px) — 2-Column Sidebar + Workspace
            ══════════════════════════════════════════════════════════════ */}
            <div className="attendance-desktop-container">
                {/* ── Left Navigation Sidebar (Desktop ≥ 1200px) ─────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        background: t.surface,
                        border: `1px solid ${t.border}`,
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: t.cardShadow,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        height: '100%',
                        boxSizing: 'border-box',
                        minWidth: 0
                    }}
                >
                    {/* Back to Home link */}
                    <Link
                        to="/home"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            color: t.textMuted,
                            fontSize: '11px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'color 0.15s',
                            cursor: 'pointer',
                            alignSelf: 'flex-start'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = t.text}
                        onMouseLeave={e => e.currentTarget.style.color = t.textMuted}
                    >
                        <ArrowLeft size={12} />
                        <span>Back to Home</span>
                    </Link>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <h2 style={{ fontSize: '17px', fontWeight: 700, color: t.text, margin: 0, letterSpacing: '-0.01em' }}>
                            Attendance
                        </h2>
                        <span style={{ fontSize: '11px', color: t.textMuted, fontWeight: 500 }}>
                            Your personal attendance workspace
                        </span>
                    </div>

                    <div style={{ height: '1px', background: t.divider, margin: '4px 0' }} />

                    {/* Grouped Navigation list */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                        {NAV_GROUPS.map((group) => (
                            <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{
                                    paddingLeft: '6px',
                                    fontSize: '10px',
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    color: t.textFaint,
                                    textTransform: 'uppercase'
                                }}>
                                    {group.title}
                                </div>
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setActiveTab(item.path)}
                                            style={{
                                                padding: '8px 10px',
                                                borderRadius: '8px',
                                                color: isActive ? (isDark ? '#c4b5fd' : '#6d28d9') : t.textMuted,
                                                background: isActive
                                                    ? (isDark 
                                                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(99, 102, 241, 0.14))' 
                                                        : '#F5F3FF')
                                                    : 'transparent',
                                                border: isActive
                                                    ? (isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(124, 58, 237, 0.25)')
                                                    : '1px solid transparent',
                                                boxShadow: isActive 
                                                    ? (isDark ? '0 4px 12px rgba(124, 58, 237, 0.12)' : '0 1px 3px rgba(124, 58, 237, 0.08)') 
                                                    : 'none',
                                                fontSize: '12px',
                                                fontWeight: isActive ? 700 : 500,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                textDecoration: 'none',
                                                transition: 'all 0.18s',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                width: '100%'
                                            }}
                                            onMouseEnter={e => {
                                                if (!isActive) {
                                                    e.currentTarget.style.background = t.surfaceMuted;
                                                    e.currentTarget.style.color = t.text;
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!isActive) {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = t.textMuted;
                                                }
                                            }}
                                        >
                                            <Icon size={14} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>

                    {/* Bottom Section & Lab Batch Context Footer */}
                    <div style={{
                        marginTop: 'auto',
                        paddingTop: '12px',
                        borderTop: `1px solid ${t.divider}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        fontSize: '11px',
                        color: t.textMuted
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: t.text, fontWeight: 600 }}>
                                Sec {typeof userProfile?.academicSection === 'object' && userProfile?.academicSection?.name ? userProfile.academicSection.name : (userProfile?.section || 'P')}{userProfile?.labBatch ? ` · ${userProfile.labBatch}` : ''}
                            </span>
                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: t.accentText, fontWeight: 700 }}>
                                Sem {selectedSemester}
                            </span>
                        </div>
                        <span style={{ fontSize: '10px', color: t.textFaint }}>
                            {readOnly ? 'Snapshot Archive 🔒' : 'Active Attendance Workspace'}
                        </span>
                    </div>
                </motion.div>

                {/* ── Right Content Column (Desktop ≥ 1200px) ───────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    style={{
                        background: t.surface,
                        border: `1px solid ${t.border}`,
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: t.cardShadow,
                        minWidth: 0,
                        height: '100%',
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Compact Workspace Header Bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                        paddingBottom: '12px',
                        borderBottom: `1px solid ${t.divider}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: t.textMuted }}>
                            <span style={{ color: t.text, fontWeight: 600 }}>Attendance</span>
                            <ChevronRight size={12} style={{ color: t.textFaint }} />
                            <span style={{ color: t.accentText, fontWeight: 600 }}>{activeTabObj.label}</span>
                        </div>

                        {/* Top Right Controls: Section & Lab Batch Context + Semester Switcher */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {userProfile?.section && (
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 12px',
                                    borderRadius: '8px',
                                    background: t.accentBg,
                                    border: `1px solid ${t.accentBorder}`,
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: t.accentText
                                }}>
                                    <span>Section {typeof userProfile.academicSection === 'object' && userProfile.academicSection?.name ? userProfile.academicSection.name : userProfile.section}</span>
                                    <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 400 }}>
                                        {userProfile.labBatch ? `· Batch ${userProfile.labBatch}` : '· Batch: All'}
                                    </span>
                                </div>
                            )}
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 12px',
                                    borderRadius: '8px',
                                    background: isDark ? 'rgba(19, 18, 26, 0.7)' : '#F8FAFC',
                                    border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : t.border}`,
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: t.text,
                                    cursor: 'pointer'
                                }}>
                                    <span style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: readOnly ? (isDark ? '#a78bfa' : '#7c3aed') : '#10B981'
                                    }} />
                                    <span>Semester {selectedSemester}</span>
                                    <span style={{ fontSize: '10px', color: t.textMuted, fontWeight: 400 }}>
                                        {readOnly ? '· Finalized 🔒' : '· Active ●'}
                                    </span>
                                    <ChevronDown size={12} color={isDark ? '#a78bfa' : '#7c3aed'} />
                                    <select
                                        value={selectedSemester}
                                        onChange={(e) => handleSemesterChange(Number(e.target.value))}
                                        style={{
                                            position: 'absolute',
                                            inset: 0,
                                            opacity: 0,
                                            cursor: 'pointer',
                                            width: '100%',
                                            height: '100%'
                                        }}
                                    >
                                        {semestersList.map(s => (
                                             <option key={s.semester} value={s.semester} style={{ background: t.selectBg, color: t.selectText }}>
                                                Semester {s.semester} {s.semester === currentStudentSemester ? '(Current Active)' : s.isPast ? '(Past Semester)' : '(Upcoming)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ERROR BANNER */}
                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            color: '#fca5a5',
                            fontSize: '13px',
                            marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Section Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                        >
                            {renderActiveSection()}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                2. TABLET VIEW (768px – 1199px) — Compact Top Navigation
            ══════════════════════════════════════════════════════════════ */}
            <div className="attendance-tablet-container">
                <div
                    style={{
                        background: t.surface,
                        border: `1px solid ${t.border}`,
                        borderRadius: '12px',
                        padding: '16px 20px',
                        boxShadow: t.cardShadow,
                        boxSizing: 'border-box',
                        width: '100%',
                        minWidth: 0
                    }}
                >
                    {/* Tablet Header: Title + Semester Switcher */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        marginBottom: '14px',
                        paddingBottom: '12px',
                        borderBottom: `1px solid ${t.divider}`
                    }}>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: t.text, margin: 0 }}>
                                Attendance Tracker
                            </h2>
                            <span style={{ fontSize: '11px', color: t.textMuted }}>
                                Daily class logging & threshold tracking
                            </span>
                        </div>

                        {/* Top Right Controls: Section & Lab Batch Context + Semester Switcher */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {userProfile?.section && (
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    background: t.accentBg,
                                    border: `1px solid ${t.accentBorder}`,
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: t.accentText
                                }}>
                                    <span>Sec {typeof userProfile.academicSection === 'object' && userProfile.academicSection?.name ? userProfile.academicSection.name : userProfile.section}</span>
                                    <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 400 }}>
                                        {userProfile.labBatch ? `· ${userProfile.labBatch}` : '· All'}
                                    </span>
                                </div>
                            )}
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                background: isDark ? 'rgba(19, 18, 26, 0.7)' : '#F8FAFC',
                                border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : t.border}`,
                                fontSize: '12px',
                                fontWeight: 600,
                                color: t.text,
                                cursor: 'pointer'
                            }}>
                                <span style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: readOnly ? (isDark ? '#a78bfa' : '#7c3aed') : '#10B981'
                                }} />
                                <span>Semester {selectedSemester}</span>
                                <span style={{ fontSize: '10px', color: t.textMuted, fontWeight: 400 }}>
                                    {readOnly ? '· Finalized 🔒' : '· Active ●'}
                                </span>
                                <ChevronDown size={12} color={isDark ? '#a78bfa' : '#7c3aed'} />
                                <select
                                    value={selectedSemester}
                                    onChange={(e) => handleSemesterChange(Number(e.target.value))}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0,
                                        cursor: 'pointer',
                                        width: '100%',
                                        height: '100%'
                                    }}
                                >
                                    {semestersList.map(s => (
                                        <option key={s.semester} value={s.semester} style={{ background: t.selectBg, color: t.selectText }}>
                                            Semester {s.semester} {s.semester === currentStudentSemester ? '(Current Active)' : s.isPast ? '(Past Semester)' : '(Upcoming)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                    {/* Tablet Horizontal Tab Navigation */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {ALL_NAV_TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.path)}
                                    style={{
                                        padding: '7px 14px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        background: isActive
                                            ? (isDark 
                                                ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(99, 102, 241, 0.2))' 
                                                : '#F5F3FF')
                                            : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC'),
                                        border: isActive
                                            ? (isDark ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(124, 58, 237, 0.3)')
                                            : `1px solid ${t.border}`,
                                        color: isActive ? (isDark ? '#c4b5fd' : '#6d28d9') : t.textMuted,
                                        boxShadow: isActive ? (isDark ? 'none' : '0 1px 3px rgba(124, 58, 237, 0.08)') : 'none',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <Icon size={13} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tablet Main Content */}
                <div
                    style={{
                        background: t.surface,
                        border: `1px solid ${t.border}`,
                        borderRadius: '12px',
                        padding: '18px',
                        boxShadow: t.cardShadow,
                        flex: 1,
                        overflowY: 'auto',
                        boxSizing: 'border-box',
                        minWidth: 0
                    }}
                >
                    {renderActiveSection()}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                3. MOBILE VIEW (< 768px) — Touch Optimized Single Column
            ══════════════════════════════════════════════════════════════ */}
            <div className="attendance-mobile-container">
                {/* Mobile Header: Title + Semester Switcher */}
                <div style={{
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    boxShadow: t.cardShadow,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    width: '100%',
                    boxSizing: 'border-box',
                    minWidth: 0
                }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: t.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Attendance Tracker
                        </h2>
                        <span style={{ fontSize: '10.5px', color: t.textMuted }}>
                            Daily class logging & threshold
                        </span>
                    </div>

                    {/* Mobile Semester Switcher */}
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: isDark ? 'rgba(19, 18, 26, 0.8)' : '#F8FAFC',
                            border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : t.border}`,
                            fontSize: '11px',
                            fontWeight: 600,
                            color: t.text,
                            cursor: 'pointer',
                            minHeight: '34px'
                        }}>
                            <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: readOnly ? (isDark ? '#a78bfa' : '#7c3aed') : '#10B981'
                            }} />
                            <span>Sem {selectedSemester}</span>
                            <ChevronDown size={11} color={isDark ? '#a78bfa' : '#7c3aed'} />
                            <select
                                value={selectedSemester}
                                onChange={(e) => handleSemesterChange(Number(e.target.value))}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    opacity: 0,
                                    cursor: 'pointer',
                                    width: '100%',
                                    height: '100%'
                                }}
                            >
                                {semestersList.map(s => (
                                    <option key={s.semester} value={s.semester} style={{ background: t.selectBg, color: t.selectText }}>
                                        Semester {s.semester} {s.semester === currentStudentSemester ? '(Current Active)' : s.isPast ? '(Past Semester)' : '(Upcoming)'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Mobile Horizontal Scrollable Tab Bar with Touch Targets (min 44px) */}
                <div 
                    className="attendance-mobile-tabs"
                    style={{
                        display: 'flex',
                        width: '100%',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch',
                        gap: '8px',
                        padding: '2px 4px 6px 2px',
                        boxSizing: 'border-box'
                    }}
                >
                    {ALL_NAV_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.path)}
                                style={{
                                    flexShrink: 0,
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    minHeight: '44px',
                                    background: isActive
                                        ? (isDark 
                                            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.28), rgba(99, 102, 241, 0.22))' 
                                            : '#F5F3FF')
                                        : (isDark ? 'rgba(19, 18, 26, 0.65)' : '#FFFFFF'),
                                    border: isActive
                                        ? (isDark ? '1.5px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(124, 58, 237, 0.3)')
                                        : `1px solid ${t.border}`,
                                    color: isActive ? (isDark ? '#c4b5fd' : '#6d28d9') : t.textMuted,
                                    boxShadow: isActive ? (isDark ? '0 2px 12px rgba(124, 58, 237, 0.18)' : '0 1px 4px rgba(124, 58, 237, 0.12)') : 'none',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <Icon size={14} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Mobile Main Content */}
                <div
                    style={{
                        background: t.surface,
                        border: `1px solid ${t.border}`,
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: t.cardShadow,
                        width: '100%',
                        boxSizing: 'border-box',
                        minWidth: 0
                    }}
                >
                    {renderActiveSection()}
                </div>
            </div>

            {/* Subject Swap / Class Change Modal */}
            <SubjectSwapModal
                isOpen={isSwapModalOpen}
                onClose={() => {
                    setIsSwapModalOpen(false);
                    setSelectedSwapClass(null);
                }}
                classItem={selectedSwapClass}
                registeredSubjects={registeredSubjectsList}
                onSwapConfirmed={handleConfirmSubjectSwap}
            />

            {/* Timetable Slot Customization Modal */}
            {editingTimetableSlot && (
                <TimetableSlotCustomizeModal
                    isOpen={Boolean(editingTimetableSlot)}
                    onClose={() => setEditingTimetableSlot(null)}
                    slot={editingTimetableSlot}
                    allSlots={timetableSlots}
                    registeredSubjects={registeredSubjectsList}
                    subjects={registeredSubjectsList}
                    onApplyChange={handleApplySlotCustomization}
                    onResetSlotToOfficial={handleResetSlotToOfficial}
                />
            )}

            {/* Past Week Change Warning Modal */}
            {pendingPastChange && (
                <PastWeekChangeWarningModal
                    isOpen={Boolean(pendingPastChange)}
                    onClose={() => setPendingPastChange(null)}
                    slot={pendingPastChange.slot}
                    oldSubjectName={pendingPastChange.slot?.subject?.name || 'Current Subject'}
                    newSubjectName={pendingPastChange.newSubject?.name || 'New Subject'}
                    affectedCount={4}
                    onConfirmKeepPast={handleConfirmKeepPast}
                    onConfirmApplyPast={handleConfirmApplyPast}
                />
            )}

            {/* Official Allotted Timetable Read-Only View Modal */}
            {isViewingOfficial && (
                <OfficialTimetableModal
                    isOpen={isViewingOfficial}
                    onClose={() => setIsViewingOfficial(false)}
                    slots={officialTimetableSlots.length > 0 ? officialTimetableSlots : timetableSlots}
                    config={timetableConfig}
                    subjects={registeredSubjectsList}
                    registeredSubjects={registeredSubjectsList}
                    userProfile={userProfile}
                    allottedTimetable={allottedTimetable}
                />
            )}

            {/* Reset to Official Timetable Confirmation Modal */}
            {isResetConfirmOpen && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn ${
                    isDark ? 'bg-black/80' : 'bg-slate-900/40'
                }`}>
                    <div className={`w-full max-w-md rounded-xl p-5 shadow-2xl space-y-4 border ${
                        isDark 
                            ? 'bg-[#13111b] border-white/10 text-white' 
                            : 'bg-white border-slate-200 text-slate-900'
                    }`}>
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                                <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Reset to Official College Timetable?
                                </h3>
                                <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                                    This will remove all personal timetable overrides and restore the official college schedule for all future dates.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-300/90 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>Past attendance records are strictly protected and will remain unchanged.</span>
                        </div>

                        <div className={`flex items-center justify-end gap-2.5 pt-2 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                            <button
                                type="button"
                                onClick={() => setIsResetConfirmOpen(false)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors border ${
                                    isDark 
                                        ? 'text-zinc-300 hover:bg-white/5 border-white/10' 
                                        : 'text-slate-700 hover:bg-slate-100 border-slate-200'
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isResettingTimetable}
                                onClick={handleConfirmResetToOfficial}
                                className="px-4 py-1.5 rounded-lg text-xs font-mono font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                                {isResettingTimetable ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Resetting...</span>
                                    </>
                                ) : (
                                    <span>Reset Schedule</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Media Queries for Dynamic Deterministic Responsiveness */}
            <style>{`
                .attendance-desktop-container {
                    display: none !important;
                }
                .attendance-tablet-container {
                    display: none !important;
                }
                .attendance-mobile-container {
                    display: flex !important;
                    flex-direction: column;
                    gap: 10px;
                    width: 100%;
                    min-width: 0;
                    box-sizing: border-box;
                }

                .attendance-mobile-tabs::-webkit-scrollbar {
                    display: none !important;
                }

                @media (min-width: 768px) and (max-width: 1199px) {
                    .attendance-desktop-container {
                        display: none !important;
                    }
                    .attendance-tablet-container {
                        display: flex !important;
                        flex-direction: column;
                        gap: 12px;
                        width: 100%;
                        height: 100%;
                        box-sizing: border-box;
                    }
                    .attendance-mobile-container {
                        display: none !important;
                    }
                }

                @media (min-width: 1200px) {
                    .attendance-desktop-container {
                        display: grid !important;
                        grid-template-columns: 260px minmax(0, 1fr);
                        gap: 16px;
                        width: 100%;
                        height: calc(100vh - 32px);
                    }
                    .attendance-tablet-container {
                        display: none !important;
                    }
                    .attendance-mobile-container {
                        display: none !important;
                    }
                }

                @media (max-width: 1199px) {
                    .attendance-daily-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AttendanceSettings;
