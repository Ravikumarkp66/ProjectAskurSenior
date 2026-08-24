import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiV2 } from '../../../services/authService';

import AttendanceHeader from './components/attendance/AttendanceHeader';
import CalendarDateNavigator from './components/attendance/CalendarDateNavigator';
import DailyAttendanceWorkspace from './components/attendance/DailyAttendanceWorkspace';
import AttendanceRightPanel from './components/attendance/AttendanceRightPanel';
import AttendanceSummaryView from './components/attendance/AttendanceSummaryView';
import SubjectSummaryTab from './components/attendance/SubjectSummaryTab';
import BaselineSetupModal from './components/attendance/BaselineSetupModal';
import SubjectSwapModal from './components/attendance/SubjectSwapModal';
import WeeklyTimetableGrid from './components/WeeklyTimetableGrid';
import TimetableSettings from './TimetableSettings';

const normalizeTabName = (tab) => {
    if (!tab) return 'today';
    const t = String(tab).toLowerCase();
    if (t === 'schedule' || t === 'timetable') return 'schedule';
    if (t === 'today' || t === 'daily') return 'today';
    if (t === 'subjects' || t === 'subject-summary') return 'subjects';
    if (t === 'overview' || t === 'summary') return 'overview';
    return 'today';
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

    // Date state (YYYY-MM-DD)
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

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
            const res = await apiV2.getStudentProfile();
            if (res.data?.success) {
                const student = res.data.student || res.data.data;
                setUserProfile(student);
                const sem = Number(student?.semester) || 1;
                setCurrentStudentSemester(sem);
                const list = [];
                for (let i = 1; i <= Math.max(sem, 8); i++) {
                    list.push({ semester: i, isCurrent: i === sem, isPast: i < sem });
                }
                setSemestersList(list);
                return sem;
            }
        } catch (err) {
            console.error('Error fetching student profile:', err);
        }
        return 1;
    };

    // 2. Fetch semester metrics and config
    const fetchSemesterData = async (sem, showLoading = false) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            // Load dashboard metrics
            const dashboardRes = await apiV2.getAttendanceDashboard(sem);
            if (dashboardRes.data?.success) {
                const data = dashboardRes.data.data || {};
                setProgressList(data.subjects || []);
                setGroupedTimeline(data.groupedTimeline || []);
                setIsArchived(data.isArchived || false);
                setReadOnly(data.readOnly || false);
            }

            // Load overall analytics
            const analyticsRes = await apiV2.getAttendanceAnalytics(sem);
            if (analyticsRes.data?.success) {
                setOverallMetrics(analyticsRes.data.data?.overall || null);
            }

            // Load registered subjects
            const regRes = await apiV2.getRegisteredSubjects(sem);
            if (regRes.data?.success) {
                setRegisteredSubjectsList(regRes.data.data || []);
            }

            // Load timetable config & slots for timetable tab
            try {
                const configRes = await apiV2.getTimetableConfig();
                if (configRes.data?.success) {
                    setTimetableConfig(configRes.data.data);
                }

                const slotsRes = await apiV2.getTimetableSlots();
                if (slotsRes.data?.success) {
                    setTimetableSlots(slotsRes.data.data || []);
                }
            } catch (ttErr) {
                console.error('Error fetching timetable data:', ttErr);
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
            const res = await apiV2.getAttendanceDay(dateStr, sem);
            if (res.data?.success) {
                setDayClasses(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching day attendance:', err);
        } finally {
            if (showLoading) setIsDayLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        const init = async () => {
            const currentSem = await fetchStudentProfile();
            setSelectedSemester(currentSem);
            const today = new Date().toISOString().split('T')[0];
            setSelectedDate(today);
            await fetchSemesterData(currentSem, true);
            await fetchDayAttendance(today, currentSem, true);
        };
        init();
    }, []);

    // Change semester
    const handleSemesterChange = async (sem) => {
        setSelectedSemester(sem);
        await fetchSemesterData(sem, true);
        await fetchDayAttendance(selectedDate, sem, true);
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
        const today = new Date().toISOString().split('T')[0];
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
        const today = new Date().toISOString().split('T')[0];

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

    const activeSubjectData = useMemo(() => {
        if (!selectedSubject) return null;
        return progressList.find(p => p.subjectId === selectedSubject.subjectId && p.category === selectedSubject.category) || selectedSubject;
    }, [progressList, selectedSubject]);

    return (
        <div style={{
            padding: '24px',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxSizing: 'border-box',
            maxWidth: '1440px',
            margin: '0 auto',
            width: '100%'
        }}>
            {/* Attendance Header Controls & Tabs */}
            <AttendanceHeader
                activeTab={activeTab}
                onTabChange={setActiveTab}
                selectedSemester={selectedSemester}
                onSemesterChange={handleSemesterChange}
                semestersList={semestersList}
                currentStudentSemester={currentStudentSemester}
                readOnly={readOnly}
                loading={loading}
                onOpenSettings={() => setActiveTab('timetable')}
                onPromoteSemester={handlePromoteSemester}
                onRecalculate={handleRecalculate}
                onExport={handleExport}
                isExportDropdownOpen={isExportDropdownOpen}
                setIsExportDropdownOpen={setIsExportDropdownOpen}
            />

            {/* ERROR BANNER */}
            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    color: '#fca5a5',
                    fontSize: '13px'
                }}>
                    {error}
                </div>
            )}

            {/* TAB CONTENT 1: SCHEDULE (WEEKLY TIMETABLE) */}
            {(activeTab === 'schedule' || activeTab === 'timetable') && (
                <div style={{ width: '100%' }}>
                    <TimetableSettings isEmbedded={true} />
                </div>
            )}

            {/* TAB CONTENT 2: TODAY / DAILY ATTENDANCE (DESKTOP 3-COLUMN LAYOUT 16% / 64% / 20%) */}
            {(activeTab === 'today' || activeTab === 'daily') && (
                <div className="attendance-daily-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(200px, 16%) minmax(300px, 64%) minmax(220px, 20%)',
                    gap: '20px',
                    alignItems: 'start',
                    width: '100%'
                }}>
                    {/* LEFT COLUMN: Date Navigator */}
                    <div>
                        <CalendarDateNavigator
                            selectedDate={selectedDate}
                            onSelectDate={handleSelectDate}
                            timetableConfig={timetableConfig}
                            groupedTimeline={groupedTimeline}
                            selectedDayClasses={dayClasses}
                        />
                    </div>

                    {/* CENTER COLUMN: Selected Day Workspace */}
                    <div>
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

                    {/* RIGHT COLUMN: Attendance Context */}
                    <div>
                        <AttendanceRightPanel
                            selectedDate={selectedDate}
                            dayClasses={dayClasses}
                            overallMetrics={overallMetrics}
                            progressList={progressList}
                        />
                    </div>
                </div>
            )}

            {/* TAB CONTENT 3: SUBJECTS (ANALYTICAL BREAKDOWN & STREAKS) */}
            {(activeTab === 'subjects' || activeTab === 'subject-summary') && (
                <div style={{ width: '100%' }}>
                    <SubjectSummaryTab
                        overallMetrics={overallMetrics}
                        progressList={progressList}
                        onEditSubjectHistory={handleEditSubjectHistory}
                        onUpdateTarget={handleUpdateAttendanceTarget}
                    />
                </div>
            )}

            {/* TAB CONTENT 4: OVERVIEW (SEMESTER SUMMARY VIEW) */}
            {(activeTab === 'overview' || activeTab === 'summary') && (
                <div style={{ width: '100%' }}>
                    <AttendanceSummaryView
                        progressList={progressList}
                        overallMetrics={overallMetrics}
                        onOpenBaselineModal={() => setIsBaselineModalOpen(true)}
                        readOnly={readOnly}
                    />
                </div>
            )}

            {/* Mid-Semester Baseline Setup Modal */}
            <BaselineSetupModal
                isOpen={isBaselineModalOpen}
                onClose={() => setIsBaselineModalOpen(false)}
                semester={selectedSemester}
                registeredSubjects={registeredSubjectsList}
                onBaselineSaved={() => {
                    fetchSemesterData(selectedSemester);
                    fetchDayAttendance(selectedDate, selectedSemester);
                }}
            />

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

            {/* CSS Media Queries for Mobile Responsiveness */}
            <style>{`
                @media (max-width: 1024px) {
                    .attendance-daily-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AttendanceSettings;
