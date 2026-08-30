import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { apiV2 } from '../../../services/authService';
import { 
    CalendarDays, BookOpen, BarChart2, Settings, 
    ArrowLeft, ChevronRight, ChevronDown, CheckCircle2, 
    AlertCircle, Loader2, Sparkles
} from 'lucide-react';

import CalendarDateNavigator from './components/attendance/CalendarDateNavigator';
import DailyAttendanceWorkspace from './components/attendance/DailyAttendanceWorkspace';
import AttendanceRightPanel from './components/attendance/AttendanceRightPanel';
import AttendanceSummaryView from './components/attendance/AttendanceSummaryView';
import SubjectSummaryTab from './components/attendance/SubjectSummaryTab';
import BaselineSetupModal from './components/attendance/BaselineSetupModal';
import SubjectSwapModal from './components/attendance/SubjectSwapModal';

const NAV_TABS = [
    { id: 'today', label: '1. Today\'s Classes', path: 'today', icon: CalendarDays, emoji: '🗓' },
    { id: 'subjects', label: '2. Subject Breakdown', path: 'subjects', icon: BookOpen, emoji: '📖' },
    { id: 'overview', label: '3. Semester Overview', path: 'overview', icon: BarChart2, emoji: '📊' },
];

const normalizeTabName = (tab) => {
    if (!tab) return 'today';
    const t = String(tab).toLowerCase();
    if (t === 'today' || t === 'daily' || t === 'schedule' || t === 'timetable') return 'today';
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

    // Student & Semester state
    const [currentStudentSemester, setCurrentStudentSemester] = useState(1);
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [semestersList, setSemestersList] = useState([]);
    const [userProfile, setUserProfile] = useState(null);

    // Analytics & Subject states
    const [overallMetrics, setOverallMetrics] = useState(null);
    const [progressList, setProgressList] = useState([]);
    const [groupedTimeline, setGroupedTimeline] = useState([]);
    const [registeredSubjectsList, setRegisteredSubjectsList] = useState([]);

    // Timetable states
    const [timetableConfig, setTimetableConfig] = useState(null);
    const [timetableSlots, setTimetableSlots] = useState([]);

    // Day classes state
    const [dayClasses, setDayClasses] = useState([]);

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

    // 2. Fetch semester metrics and config (Optimized parallel fetching)
    const fetchSemesterData = async (sem, showLoading = false) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const [dashboardRes, regRes, configRes] = await Promise.all([
                apiV2.getAttendanceDashboard(sem).catch(err => {
                    console.error('getAttendanceDashboard error:', err);
                    return { data: { success: false, data: {} } };
                }),
                apiV2.getRegisteredSubjects(sem).catch(() => ({ data: { success: false, data: [] } })),
                apiV2.getTimetableConfig(sem).catch(() => ({ data: { success: false, data: null } }))
            ]);

            if (dashboardRes?.data?.success) {
                const data = dashboardRes.data.data || {};
                setProgressList(data.subjects || []);
                setOverallMetrics(data.overall || null);
                setGroupedTimeline(data.groupedTimeline || []);
                setIsArchived(data.isArchived || false);
                setReadOnly(data.readOnly || false);
            }

            if (regRes?.data?.success) {
                setRegisteredSubjectsList(regRes.data.data || []);
            }

            if (configRes?.data?.success) {
                setTimetableConfig(configRes.data.data);
            }
        } catch (err) {
            console.error('Error fetching attendance metrics:', err);
            setError(err.response?.data?.message || 'An error occurred while loading attendance metrics.');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    // 3. Fetch day classes for selected date
    const fetchDayAttendance = async (dateStr, sem, showLoading = false) => {
        if (showLoading) setIsDayLoading(true);
        try {
            const res = await apiV2.getAttendanceDay(dateStr, sem).catch(() => ({ data: { success: false, data: [] } }));
            if (res?.data?.success) {
                setDayClasses(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching day attendance:', err);
        } finally {
            if (showLoading) setIsDayLoading(false);
        }
    };

    // Initial load (Concurrently loads profile, semester metrics, and today's classes in < 200ms)
    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            try {
                const today = getLocalDateString(new Date());
                setSelectedDate(today);

                const currentSem = await fetchStudentProfile();
                if (!isMounted) return;
                setSelectedSemester(currentSem);

                await Promise.all([
                    fetchSemesterData(currentSem, true),
                    fetchDayAttendance(today, currentSem, false)
                ]);
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
        await Promise.all([
            fetchSemesterData(sem, true),
            fetchDayAttendance(selectedDate, sem, true)
        ]);
    };

    // Change date
    const handleSelectDate = async (dateStr) => {
        if (dateStr === selectedDate) return;
        setSelectedDate(dateStr);
        setDayClasses([]); // Clear stale dayClasses to prevent flash of previous date
        await fetchDayAttendance(dateStr, selectedSemester, true);
    };

    // Mark / Edit attendance for a specific class slot
    const handleMarkAttendance = async (classItem, status) => {
        if (readOnly) {
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
                status
            });

            if (res.data?.success) {
                toast.success(`Marked ${classItem.subjectName} as ${status}`);
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
        if (readOnly) {
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
                    status: 'Present'
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
        if (readOnly) {
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
                status: status || 'Present'
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
                remarks
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

    const activeTabObj = NAV_TABS.find(t => t.id === activeTab) || NAV_TABS[0];

    const renderActiveSection = () => {
        switch (activeTab) {
            case 'subjects':
            case 'subject-summary':
                return (
                    <SubjectSummaryTab
                        overallMetrics={overallMetrics}
                        progressList={progressList}
                        onEditSubjectHistory={handleEditSubjectHistory}
                        onUpdateTarget={handleUpdateAttendanceTarget}
                    />
                );
            case 'overview':
            case 'summary':
                return (
                    <AttendanceSummaryView
                        progressList={progressList}
                        overallMetrics={overallMetrics}
                        onOpenBaselineModal={() => setIsBaselineModalOpen(true)}
                        readOnly={readOnly}
                    />
                );
            case 'today':
            case 'daily':
            default:
                return (
                    <div className="attendance-daily-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: '20px',
                        alignItems: 'start',
                        width: '100%'
                    }}>
                        {/* LEFT COLUMN: Date Navigator (Equal Width 50%) */}
                        <div style={{ minWidth: 0, width: '100%' }}>
                            <CalendarDateNavigator
                                selectedDate={selectedDate}
                                onSelectDate={handleSelectDate}
                                timetableConfig={timetableConfig}
                                groupedTimeline={groupedTimeline}
                                selectedDayClasses={dayClasses}
                            />
                        </div>

                        {/* RIGHT COLUMN: Selected Day Workspace (Equal Width 50%) */}
                        <div style={{ minWidth: 0, width: '100%' }}>
                            <DailyAttendanceWorkspace
                                selectedDate={selectedDate}
                                dayClasses={dayClasses}
                                isLoading={isDayLoading}
                                onMarkAttendance={handleMarkAttendance}
                                onMarkAllPresent={handleMarkAllPresentToday}
                                onResetDayAttendance={handleResetDayAttendance}
                                unconfirmedPastCount={unconfirmedPastCount}
                                onQuickMarkPast={handleQuickMarkPastAsPresent}
                                readOnly={readOnly}
                                overallMetrics={overallMetrics}
                                progressList={progressList}
                                onEditSubjectHistory={handleEditSubjectHistory}
                                onOpenBaselineModal={() => setIsBaselineModalOpen(true)}
                                onOpenSwapModal={handleOpenSwapModal}
                            />
                        </div>
                    </div>
                );
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
                        background: 'rgba(19, 18, 26, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '16px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
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
                            color: 'rgba(148, 163, 184, 0.65)',
                            fontSize: '11px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'color 0.15s',
                            cursor: 'pointer',
                            alignSelf: 'flex-start'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(148, 163, 184, 0.65)'}
                    >
                        <ArrowLeft size={12} />
                        <span>Back to Home</span>
                    </Link>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
                            Attendance Tracker
                        </h2>
                        <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)', fontWeight: 500 }}>
                            Daily class logging & threshold tracking
                        </span>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '4px 0' }} />

                    {/* Navigation list */}
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        {NAV_TABS.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveTab(item.path)}
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        color: isActive ? '#a78bfa' : 'rgba(148, 163, 184, 0.65)',
                                        background: isActive
                                            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(99, 102, 241, 0.12))'
                                            : 'transparent',
                                        border: isActive
                                            ? '1px solid rgba(139, 92, 246, 0.25)'
                                            : '1px solid transparent',
                                        boxShadow: isActive ? '0 4px 12px rgba(124, 58, 237, 0.08)' : 'none',
                                        fontSize: '12.5px',
                                        fontWeight: isActive ? 600 : 500,
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
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                            e.currentTarget.style.color = 'rgba(148, 163, 184, 0.85)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'rgba(148, 163, 184, 0.65)';
                                        }
                                    }}
                                >
                                    <Icon size={14} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Bottom Status tag */}
                    <div style={{
                        marginTop: 'auto',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: 'rgba(148, 163, 184, 0.6)'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#c4b5fd' }}>
                            <CheckCircle2 size={11} color="#34d399" />
                            {overallMetrics ? `${overallMetrics.overallPercentage ?? 0}% Overall` : 'Attendance active'}
                        </span>
                        <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>Sem {selectedSemester}</span>
                    </div>
                </motion.div>

                {/* ── Right Content Column (Desktop ≥ 1200px) ───────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    style={{
                        background: 'rgba(19, 18, 26, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '20px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
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
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(148, 163, 184, 0.6)' }}>
                            <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600 }}>Attendance Tracker</span>
                            <ChevronRight size={12} />
                            <span style={{ color: '#a78bfa', fontWeight: 600 }}>{activeTabObj.label}</span>
                        </div>

                        {/* Top Right Controls: Semester Switcher */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(19, 18, 26, 0.7)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#e2e8f0',
                                    cursor: 'pointer'
                                }}>
                                    <span style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: readOnly ? '#a78bfa' : '#34d399'
                                    }} />
                                    <span>Semester {selectedSemester}</span>
                                    <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.6)', fontWeight: 400 }}>
                                        {readOnly ? '· Finalized 🔒' : '· Active ●'}
                                    </span>
                                    <ChevronDown size={12} color="#a78bfa" />
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
                                             <option key={s.semester} value={s.semester} style={{ background: '#0f0a1e', color: '#fff' }}>
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
                        background: 'rgba(19, 18, 26, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '16px 20px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
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
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: 0 }}>
                                Attendance Tracker
                            </h2>
                            <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.6)' }}>
                                Daily class logging & threshold tracking
                            </span>
                        </div>

                        {/* Semester Switcher */}
                        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                background: 'rgba(19, 18, 26, 0.7)',
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#e2e8f0',
                                cursor: 'pointer'
                            }}>
                                <span style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: readOnly ? '#a78bfa' : '#34d399'
                                }} />
                                <span>Semester {selectedSemester}</span>
                                <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.6)', fontWeight: 400 }}>
                                    {readOnly ? '· Finalized 🔒' : '· Active ●'}
                                </span>
                                <ChevronDown size={12} color="#a78bfa" />
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
                                        <option key={s.semester} value={s.semester} style={{ background: '#0f0a1e', color: '#fff' }}>
                                            Semester {s.semester} {s.semester === currentStudentSemester ? '(Current Active)' : s.isPast ? '(Past Semester)' : '(Upcoming)'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tablet Horizontal Tab Navigation */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {NAV_TABS.map((tab) => {
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
                                            ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(99, 102, 241, 0.2))'
                                            : 'rgba(255, 255, 255, 0.03)',
                                        border: isActive
                                            ? '1px solid rgba(139, 92, 246, 0.4)'
                                            : '1px solid rgba(255, 255, 255, 0.06)',
                                        color: isActive ? '#c4b5fd' : 'rgba(148, 163, 184, 0.7)',
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
                        background: 'rgba(19, 18, 26, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '12px',
                        padding: '18px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
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
                    background: 'rgba(19, 18, 26, 0.55)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    width: '100%',
                    boxSizing: 'border-box',
                    minWidth: 0
                }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Attendance Tracker
                        </h2>
                        <span style={{ fontSize: '10.5px', color: 'rgba(148, 163, 184, 0.6)' }}>
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
                            background: 'rgba(19, 18, 26, 0.8)',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#e2e8f0',
                            cursor: 'pointer',
                            minHeight: '34px'
                        }}>
                            <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: readOnly ? '#a78bfa' : '#34d399'
                            }} />
                            <span>Sem {selectedSemester}</span>
                            <ChevronDown size={11} color="#a78bfa" />
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
                                    <option key={s.semester} value={s.semester} style={{ background: '#0f0a1e', color: '#fff' }}>
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
                    {NAV_TABS.map((tab) => {
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
                                        ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.28), rgba(99, 102, 241, 0.22))'
                                        : 'rgba(19, 18, 26, 0.65)',
                                    border: isActive
                                        ? '1.5px solid rgba(139, 92, 246, 0.5)'
                                        : '1px solid rgba(255, 255, 255, 0.08)',
                                    color: isActive ? '#c4b5fd' : 'rgba(148, 163, 184, 0.75)',
                                    boxShadow: isActive ? '0 2px 12px rgba(124, 58, 237, 0.18)' : 'none',
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
                        background: 'rgba(19, 18, 26, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        padding: '12px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
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
