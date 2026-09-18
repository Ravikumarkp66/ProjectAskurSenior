import React, { useState, useEffect } from 'react';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiV2 } from '../../../services/authService';
import { useTheme } from '../../../context/ThemeContext';

// ─── Empty State ──────────────────────────────────────────────────────────────
const AttendanceEmptyState = ({ isDark }) => (
    <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        border: isDark ? '1px dashed rgba(99, 179, 237, 0.2)' : '1px dashed rgba(37, 99, 235, 0.25)',
        borderRadius: '10px',
        background: isDark ? 'rgba(99, 179, 237, 0.03)' : 'rgba(37, 99, 235, 0.02)'
    }}>
        <ClipboardList size={22} color={isDark ? 'rgba(99, 179, 237, 0.45)' : 'rgba(37, 99, 235, 0.5)'} />
        <p style={{
            margin: 0,
            fontSize: '12.5px',
            fontWeight: 600,
            color: isDark ? '#94a3b8' : '#334155',
            textAlign: 'center'
        }}>
            No attendance records yet
        </p>
        <p style={{
            margin: 0,
            fontSize: '11px',
            color: isDark ? '#64748b' : '#64748b',
            textAlign: 'center',
            maxWidth: '200px',
            lineHeight: 1.45
        }}>
            Track your subject-wise attendance to monitor your academic progress
        </p>
    </div>
);

// ─── Main Card ────────────────────────────────────────────────────────────────
const AttendanceOverviewCard = () => {
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const cacheKeyAtt = 'aus_attendance_overview';
    const [subjects, setSubjects] = useState(() => {
        try {
            const raw = sessionStorage.getItem(cacheKeyAtt);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    });
    const [loading, setLoading] = useState(() => subjects.length === 0);

    const fetchAttendance = async () => {
        try {
            if (subjects.length === 0) setLoading(true);
            const res = await apiV2.getAttendanceDashboard();
            if (res.data?.success) {
                const newSubs = res.data.data?.subjects || [];
                setSubjects(newSubs);
                try {
                    sessionStorage.setItem(cacheKeyAtt, JSON.stringify(newSubs));
                } catch (e) {}
            }
        } catch (err) {
            console.error('[AttendanceOverviewCard] Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();

        const handleUpdate = () => {
            fetchAttendance();
        };
        window.addEventListener('attendance-updated', handleUpdate);
        return () => window.removeEventListener('attendance-updated', handleUpdate);
    }, []);

    const hasData = subjects.length > 0;
    const dividerColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)';

    return (
        <div style={{
            background: isDark ? 'rgba(13, 17, 28, 0.85)' : '#FFFFFF',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            height: '300px',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '28px',
                flexShrink: 0,
                marginBottom: '10px'
            }}>
                <h2 style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    margin: 0,
                    letterSpacing: '-0.01em'
                }}>
                    Attendance Overview
                </h2>
                <button
                    onClick={() => navigate('/profile/edit/attendance')}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isDark ? 'rgba(148, 163, 184, 0.7)' : '#64748B',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = isDark ? '#93c5fd' : '#2563eb'}
                    onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(148, 163, 184, 0.7)' : '#64748B'}
                >
                    View Details <ArrowRight size={11} />
                </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: dividerColor, flexShrink: 0, marginBottom: '12px' }} />

            {/* Body */}
            {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.4)' }}>
                    Loading...
                </div>
            ) : !hasData ? (
                <AttendanceEmptyState isDark={isDark} />
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                    {/* Scrollable top subjects progress */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        overflowY: 'auto',
                        paddingRight: '4px'
                    }}>
                        {subjects.map(s => {
                            const semPct = s.attendancePercentage;
                            let subColor = isDark ? '#34d399' : '#059669';
                            if (semPct < 75) subColor = isDark ? '#f87171' : '#dc2626';
                            else if (semPct < 85) subColor = isDark ? '#fbbf24' : '#d97706';

                            return (
                                <div key={`${s.subjectId}_${s.category}`} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '11.5px',
                                            fontWeight: 600,
                                            color: isDark ? '#e2e8f0' : '#0f172a',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '160px'
                                        }} title={s.name}>
                                            {s.code || s.name}
                                        </span>
                                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: subColor }}>
                                            {s.analytics?.present ?? 0}/{s.analytics?.conducted ?? 0} ({semPct}%)
                                        </span>
                                    </div>
                                    <div style={{ width: '100%', height: '5px', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${semPct}%`, height: '100%', background: subColor, borderRadius: '3px' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceOverviewCard;
