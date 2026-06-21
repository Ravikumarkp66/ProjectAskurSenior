import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../utils/hooks';
import AcademicCalendar from '../../components/AcademicCalendar';
import academicAPI from '../../services/academicService';

const AcademicCalendarPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [academicConfig,     setAcademicConfig]     = useState(null);
    const [academicTimetable,  setAcademicTimetable]  = useState(null);
    const [userSubjects,       setUserSubjects]        = useState([]);
    const [attendanceRecords,  setAttendanceRecords]   = useState([]);
    const [timetableOverrides, setTimetableOverrides]  = useState([]);
    const [selectedDate,       setSelectedDate]        = useState(new Date());
    const [isCalendarCollapsed,setIsCalendarCollapsed] = useState(false);
    const [loading,            setLoading]             = useState(true);
    const [error,              setError]               = useState(null);

    useEffect(() => {
        if (!isAuthenticated) return;
        const load = async () => {
            try {
                setLoading(true);
                const res = await academicAPI.getDashboard();
                if (res.data?.config) {
                    setAcademicConfig(res.data.config);
                    setAcademicTimetable(res.data.timetable);
                    setUserSubjects(res.data.attendanceData || []);
                    setAttendanceRecords(res.data.attendanceRecords || []);
                    setTimetableOverrides(res.data.timetableOverrides || []);
                } else {
                    setError('no-setup');
                }
            } catch {
                setError('no-setup');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isAuthenticated]);

    /* ── Loading ── */
    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    /* ── No setup ── */
    if (error === 'no-setup') return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-sm"
            >
                <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                    style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                    <svg className="w-8 h-8" style={{ color: '#8B5CF6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Academic Setup Required</h2>
                <p className="text-sm mb-6" style={{ color: 'rgba(148,163,184,0.6)' }}>
                    Complete your academic setup to unlock the calendar, attendance tracker, and exam countdown.
                </p>
                <button
                    onClick={() => navigate('/academic-setup')}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#8B5CF6,#6366F1)', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}
                >
                    Go to Academic Setup
                </button>
            </motion.div>
        </div>
    );

    /* ── Calendar ── */
    return (
        <div className="space-y-6 max-w-5xl">
            {/* Page title */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.22)' }}>
                        <svg className="w-4 h-4" style={{ color: '#8B5CF6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-white"
                        style={{ fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
                        Academic Calendar
                    </h1>
                </div>
                <p className="text-sm ml-11" style={{ color: 'rgba(148,163,184,0.5)' }}>
                    Track your semester schedule, attendance, and exam dates.
                </p>
            </motion.div>

            {/* Calendar component */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.28 }}>
                <AcademicCalendar
                    config={academicConfig}
                    timetable={academicTimetable}
                    subjects={userSubjects}
                    isLightMode={false}
                    isCollapsed={isCalendarCollapsed}
                    setIsCollapsed={setIsCalendarCollapsed}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                />
            </motion.div>
        </div>
    );
};

export default AcademicCalendarPage;
