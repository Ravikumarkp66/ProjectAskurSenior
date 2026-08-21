import React, { useState, useEffect, useMemo } from 'react';
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
import AttendanceHistoryDrawer from './components/AttendanceHistoryDrawer';
import WeeklyTimetableGrid from './components/WeeklyTimetableGrid';

const AttendanceSettings = () => {
    const [loading, setLoading] = useState(true);
    const [isDayLoading, setIsDayLoading] = useState(false);
    const [error, setError] = useState(null);

    // Active View Tab: 'daily' | 'timetable' | 'summary'
    const [activeTab, setActiveTab] = useState('daily');

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
            const res = await apiV2.getMe();
            if (res.data?.success) {
                const student = res.data.data.student || {};
                const studentSem = student.semester || 1;
                setCurrentStudentSemester(studentSem);
                setUserProfile(student);

                const sems = [];
                for (let i = 1; i <= studentSem; i++) {
                    sems.push(i);
                }
                setSemestersList(sems);
                return studentSem;
            }
        } catch (err) {
            console.error('Error fetching student profile:', err);
        }
        return 1;
    };

    // 2. Fetch semester metrics and config
    const fetchSemesterData = async (sem) => {
        setLoading(true);
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
            setLoading(false);
        }
    };

    // 3. Fetch day classes for selected date
    const fetchDayAttendance = async (dateStr, sem) => {
        setIsDayLoading(true);
        try {
            const res = await apiV2.getAttendanceDay(dateStr, sem);
            if (res.data?.success) {
                setDayClasses(res.data.data || []);
            }
        } catch (err) {
            console.error('Error fetching day attendance:', err);
        } finally {
            setIsDayLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        const init = async () => {
            const currentSem = await fetchStudentProfile();
            setSelectedSemester(currentSem);
            const today = new Date().toISOString().split('T')[0];
            setSelectedDate(today);
            await fetchSemesterData(currentSem);
            await fetchDayAttendance(today, currentSem);
        };
        init();
    }, []);

    // Change semester
    const handleSemesterChange = async (sem) => {
        setSelectedSemester(sem);
        await fetchSemesterData(sem);
        await fetchDayAttendance(selectedDate, sem);
    };

    // Change date
    const handleSelectDate = async (dateStr) => {
        setSelectedDate(dateStr);
        await fetchDayAttendance(dateStr, selectedSemester);
    };

    // Mark / Edit attendance for a specific class slot
    const handleMarkAttendance = async (classItem, status) => {
        if (readOnly) {
            toast.error('Attendance is read-only for archived semesters.');
            return;
        }

        const slotId = classItem._id || `${classItem.subjectId}_${classItem.timeSlot}`;
        const previousDayClasses = [...dayClasses];

        // Optimistic update
        setDayClasses(prev => prev.map(c => {
            const cId = c._id || `${c.subjectId}_${c.timeSlot}`;
            if (cId === slotId) {
                return { ...c, status };
            }
            return c;
        }));

        try {
            const res = await apiV2.updateAttendanceHistoryV2({
                subjectId: classItem.subjectId,
                date: selectedDate,
                timeSlot: classItem.timeSlot,
                status
            });

            if (res.data?.success) {
                toast.success(`Marked ${classItem.subjectName} as ${status}`);
                // Refresh metrics in background
                await fetchSemesterData(selectedSemester);
                await fetchDayAttendance(selectedDate, selectedSemester);
                window.dispatchEvent(new Event('attendance-updated'));
            } else {
                setDayClasses(previousDayClasses);
                toast.error(res.data?.message || 'Failed to update attendance');
            }
        } catch (err) {
            console.error('Error marking attendance:', err);
            setDayClasses(previousDayClasses);
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
                await fetchSemesterData(selectedSemester);
                await fetchDayAttendance(selectedDate, selectedSemester);
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

            {/* TAB CONTENT 1: DAILY ATTENDANCE (DESKTOP 3-COLUMN LAYOUT 16% / 64% / 20%) */}
            {activeTab === 'daily' && (
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
                        />
                    </div>

                    {/* CENTER COLUMN: Selected Day Workspace */}
                    <div>
                        <DailyAttendanceWorkspace
                            selectedDate={selectedDate}
                            dayClasses={dayClasses}
                            isLoading={isDayLoading}
                            onMarkAttendance={handleMarkAttendance}
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



            {/* TAB CONTENT 3: SUBJECT SUMMARY VIEW */}
            {activeTab === 'subject-summary' && (
                <div style={{ width: '100%' }}>
                    <SubjectSummaryTab
                        overallMetrics={overallMetrics}
                        progressList={progressList}
                        onEditSubjectHistory={handleEditSubjectHistory}
                    />
                </div>
            )}

            {/* TAB CONTENT 4: SEMESTER SUMMARY VIEW */}
            {activeTab === 'summary' && (
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
            <AttendanceHistoryDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                subject={activeSubjectData}
                history={attendanceHistory}
                forecast={subjectForecast}
                onUpdateStatus={handleUpdateDrawerStatus}
                onAddExtra={handleAddExtraClass}
                onDeleteExtra={handleDeleteExtraClass}
                readOnly={readOnly}
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
