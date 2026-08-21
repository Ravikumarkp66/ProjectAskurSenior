import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../utils/hooks';
import { TrendingUp, Clock, BookOpen, ChevronRight, Award, Loader2 } from 'lucide-react';

const StatPill = ({ label, value, color = '#a78bfa' }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '10px',
        padding: '12px 16px',
        flex: 1,
        minWidth: 0
    }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color }}>{value}</span>
        <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.55)', fontWeight: 500, textAlign: 'center' }}>{label}</span>
    </div>
);

const ManageCard = ({ icon: Icon, title, subtitle, badgeColor, badgeText, badgeBg, onManage }) => (
    <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Icon size={16} color="#a78bfa" />
                </div>
                <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#fff' }}>{title}</div>
                    <div style={{ fontSize: '11.5px', color: 'rgba(148,163,184,0.55)', marginTop: '1px' }}>{subtitle}</div>
                </div>
            </div>
            {badgeText && (
                <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: badgeColor,
                    background: badgeBg,
                    border: `1px solid ${badgeColor}33`,
                    borderRadius: '6px',
                    padding: '3px 9px',
                    flexShrink: 0
                }}>{badgeText}</span>
            )}
        </div>

        {/* Manage button */}
        <button
            type="button"
            onClick={onManage}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.09))',
                border: '1px solid rgba(139,92,246,0.25)',
                borderRadius: '8px',
                padding: '8px 14px',
                color: '#c4b5fd',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                width: '100%'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(99,102,241,0.18))';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(99,102,241,0.09))';
            }}
        >
            Manage
            <ChevronRight size={13} />
        </button>
    </div>
);

const ProgressSettings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
                <Loader2 className="animate-spin" size={24} style={{ color: '#a78bfa' }} />
            </div>
        );
    }

    // Pull stats from user object if available
    const cgpa = user.cgpa || user.calculatedCgpa || null;
    const semester = user.semester || null;
    const branch = user.branch?.name || user.branch || '—';
    const attendancePct = user.overallAttendance?.attendance ?? null;
    const streak = user.overallAttendance?.streak?.current ?? null;

    // Format CGPA display
    const cgpaDisplay = cgpa ? Number(cgpa).toFixed(2) : '—';
    const attendanceDisplay = attendancePct !== null ? `${Math.round(attendancePct)}%` : '—';
    const streakDisplay = streak !== null ? `${streak}d` : '—';

    // Color logic
    const cgpaColor = !cgpa ? '#a78bfa'
        : cgpa >= 8.5 ? '#10b981'
        : cgpa >= 7 ? '#fbbf24'
        : '#ef4444';

    const attColor = attendancePct === null ? '#a78bfa'
        : attendancePct >= 90 ? '#10b981'
        : attendancePct >= 85 ? '#fbbf24'
        : '#ef4444';

    const attBadge = attendancePct === null ? null
        : attendancePct >= 90 ? { text: 'Good', color: '#10b981', bg: 'rgba(16,185,129,0.08)' }
        : attendancePct >= 85 ? { text: 'Low', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' }
        : { text: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Section header — desktop only */}
            <div className="edit-section-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                    Progress
                </h2>
                <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.55)' }}>
                    Your academic performance at a glance
                </span>
            </div>

            {/* Quick stats row */}
            <div style={{ display: 'flex', gap: '10px' }}>
                <StatPill label="CGPA" value={cgpaDisplay} color={cgpaColor} />
                <StatPill label="Attendance" value={attendanceDisplay} color={attColor} />
                <StatPill label="Streak" value={streakDisplay} color="#f97316" />
            </div>

            {/* CGPA Manage Card */}
            <ManageCard
                icon={TrendingUp}
                title="CGPA Progress"
                subtitle={`Semester ${semester || '—'} · ${branch}`}
                badgeText={cgpa ? `${cgpaDisplay} CGPA` : null}
                badgeColor="#a78bfa"
                badgeBg="rgba(139,92,246,0.1)"
                onManage={() => navigate('/profile/edit/cgpa')}
            />

            {/* Attendance Manage Card */}
            <ManageCard
                icon={Clock}
                title="Attendance Overview"
                subtitle="Classes attended across subjects"
                badgeText={attBadge?.text || null}
                badgeColor={attBadge?.color}
                badgeBg={attBadge?.bg}
                onManage={() => navigate('/profile/edit/attendance')}
            />

            {/* Timetable Manage Card */}
            <ManageCard
                icon={BookOpen}
                title="Academic Timetable"
                subtitle="Weekly schedule & subject config"
                badgeText={null}
                onManage={() => navigate('/profile/edit/timetable')}
            />

            {/* Achievements hint */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255,255,255,0.015)',
                border: '1px dashed rgba(255,255,255,0.07)',
                borderRadius: '12px',
                padding: '14px 16px'
            }}>
                <Award size={18} color="rgba(167,139,250,0.45)" />
                <span style={{ fontSize: '12.5px', color: 'rgba(148,163,184,0.45)', fontWeight: 500 }}>
                    Achievements coming soon
                </span>
            </div>
        </div>
    );
};

export default ProgressSettings;
