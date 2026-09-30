import React, { useState, useEffect } from 'react';
import { ClipboardList, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiV2 } from '../../../services/authService';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';
import {
    useProfileEntitlements,
    PROFILE_FEATURES
} from '../../../features/profile/utils/profileEntitlements';
import { DEMO_ATTENDANCE_SUBJECTS } from '../../../features/profile/config/profileDemoData';
import { ProfileLockBadge } from '../../../features/profile/components/ProfileLockedPreview';

// ─── Empty State ──────────────────────────────────────────────────────────────
const AttendanceEmptyState = ({ isDark }) => (
    <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        border: isDark ? '1px dashed #292E37' : '1px dashed #E5E7EB',
        borderRadius: '6px',
        background: isDark ? '#15181D' : '#F8FAFC'
    }}>
        <ClipboardList size={20} color={isDark ? '#71717A' : '#9CA3AF'} />
        <p style={{
            margin: 0,
            fontSize: '12px',
            fontWeight: 600,
            color: isDark ? '#F3F4F6' : '#111827',
            textAlign: 'center'
        }}>
            No attendance records yet
        </p>
        <p style={{
            margin: 0,
            fontSize: '11px',
            color: isDark ? '#71717A' : '#6B7280',
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
    const { isPlus, isFree, isAnonymous } = useProfileEntitlements();
    const cacheKeyAtt = 'aus_attendance_overview';

    const [subjects, setSubjects] = useState(() => {
        if (!isPlus) return DEMO_ATTENDANCE_SUBJECTS;
        try {
            const raw = sessionStorage.getItem(cacheKeyAtt);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    });

    const [loading, setLoading] = useState(() => {
        if (!isPlus) return false;
        return subjects.length === 0;
    });

    const handleAction = () => {
        if (isAnonymous) {
            navigate('/login', { state: { from: '/profile' } });
        } else if (isFree) {
            navigate('/pricing');
        } else {
            navigate('/profile/edit/attendance');
        }
    };

    const fetchAttendance = async () => {
        if (!isPlus) return;
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
        if (!isPlus) {
            setSubjects(DEMO_ATTENDANCE_SUBJECTS);
            setLoading(false);
            return;
        }

        fetchAttendance();

        const handleUpdate = () => {
            fetchAttendance();
        };
        window.addEventListener('attendance-updated', handleUpdate);
        return () => window.removeEventListener('attendance-updated', handleUpdate);
    }, [isPlus]);

    const hasData = subjects.length > 0;
    const cardBg = isDark ? '#0F1115' : '#FFFFFF';
    const cardBorder = isDark ? '#292E37' : '#E5E7EB';
    const dividerColor = isDark ? '#292E37' : '#E5E7EB';
    const titleColor = isDark ? '#F3F4F6' : '#111827';
    const labelColor = isDark ? '#A1A1AA' : '#6B7280';

    return (
        <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            height: '300px',
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            position: 'relative'
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: titleColor,
                        margin: 0,
                        letterSpacing: '-0.01em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span>Attendance Overview</span>
                    </h2>
                    {!isPlus && <ProfileLockBadge isAnonymous={isAnonymous} />}
                </div>

                <button
                    type="button"
                    onClick={handleAction}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isDark ? '#93C5FD' : '#2563EB',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'opacity 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                    {!isPlus && <Lock size={10} />}
                    <span>{isPlus ? 'View Details' : (isAnonymous ? 'Sign in' : 'Unlock')}</span>
                    <ArrowRight size={11} />
                </button>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: dividerColor, flexShrink: 0, marginBottom: '12px' }} />

            {/* Body */}
            {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: labelColor }}>
                    Loading…
                </div>
            ) : !hasData ? (
                <AttendanceEmptyState isDark={isDark} />
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                    {/* Scrollable subjects progress */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        overflowY: 'auto',
                        paddingRight: '4px'
                    }}>
                        {subjects.map(s => {
                            const semPct = s.attendancePercentage;
                            let subColor = isDark ? '#22C55E' : '#16A34A';
                            if (semPct < 75) subColor = isDark ? '#EF4444' : '#DC2626';
                            else if (semPct < 85) subColor = isDark ? '#F59E0B' : '#D97706';

                            return (
                                <div key={`${s.subjectId}_${s.code || s.name}`} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '11.5px',
                                            fontWeight: 600,
                                            color: titleColor,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '170px'
                                        }} title={s.name}>
                                            {s.code || s.name}
                                        </span>
                                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: subColor }}>
                                            {s.analytics?.present ?? 0}/{s.analytics?.conducted ?? 0} ({semPct}%)
                                        </span>
                                    </div>
                                    <div style={{ width: '100%', height: '4px', background: isDark ? '#1F242D' : '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${semPct}%`, height: '100%', background: subColor, borderRadius: '2px' }} />
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
