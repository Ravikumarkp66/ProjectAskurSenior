import React from 'react';
import { CheckCircle2, XCircle, PauseCircle, Clock, ShieldCheck, AlertTriangle, AlertCircle, Lock, Target } from 'lucide-react';
import { useTheme } from '../../../../../context/ThemeContext';
import { getAttendanceState } from '../SubjectProgressList';

const AttendanceRightPanel = ({
    selectedDate,
    dayClasses = [],
    overallMetrics = null,
    progressList = []
}) => {
    const { isDark = true } = useTheme?.() || { isDark: true };

    // Calculate Day Summary numbers
    const totalDayClasses = dayClasses.length;
    const norm = (s) => (s ? String(s).trim().toUpperCase() : '');
    const presentCount = dayClasses.filter(c => ['PRESENT', 'ON DUTY', 'ON_DUTY'].includes(norm(c.status))).length;
    const absentCount = dayClasses.filter(c => ['ABSENT', 'MEDICAL LEAVE', 'MEDICAL_LEAVE'].includes(norm(c.status))).length;
    const suspendedCount = dayClasses.filter(c => ['SUSPENDED', 'CANCELLED'].includes(norm(c.status))).length;
    const remainingCount = dayClasses.filter(c => {
        const s = norm(c.status);
        return !s || s === 'YET TO BE TAKEN' || s === 'NOT_MARKED' || s === 'PENDING';
    }).length;

    // Overall metrics threshold and health counts
    const collegeThreshold = overallMetrics?.collegeThreshold || 85;
    const userThreshold = overallMetrics?.userThreshold || overallMetrics?.threshold || collegeThreshold;
    const overallPct = overallMetrics?.attendance ?? 0;

    let safeSubjectsCount = 0;
    let attentionSubjectsCount = 0;
    let criticalSubjectsCount = 0;

    progressList.forEach(s => {
        const pct = s.attendancePercentage ?? 100;
        const state = getAttendanceState(pct, collegeThreshold, userThreshold);
        if (state.stateKey === 'SAFE') {
            safeSubjectsCount++;
        } else if (state.stateKey === 'ATTENTION') {
            attentionSubjectsCount++;
        } else {
            criticalSubjectsCount++;
        }
    });

    const overallState = getAttendanceState(overallPct, collegeThreshold, userThreshold);

    const formatDateLabel = (dateStr) => {
        if (!dateStr) return 'SELECTED DAY';
        const d = new Date(dateStr);
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateStr === todayStr) return 'TODAY';
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            color: isDark ? '#fff' : '#0f172a',
            height: 'fit-content'
        }}>
            {/* DAY SUMMARY Card */}
            <div style={{
                background: isDark ? 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 1px 3px rgba(15, 23, 42, 0.06)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#a78bfa' : '#6d28d9', letterSpacing: '0.05em' }}>
                        {formatDateLabel(selectedDate)}
                    </div>
                    <span style={{
                        fontSize: '11px',
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        color: isDark ? '#cbd5e1' : '#475569',
                        fontWeight: 600
                    }}>
                        {totalDayClasses} {totalDayClasses === 1 ? 'Class' : 'Classes'}
                    </span>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                }}>
                    <div style={{
                        background: isDark ? 'rgba(16, 185, 129, 0.06)' : '#ECFDF5',
                        border: isDark ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid #A7F3D0',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#6ee7b7' : '#047857' }}>{presentCount}</div>
                            <div style={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#065F46', fontWeight: 500 }}>Present</div>
                        </div>
                    </div>

                    <div style={{
                        background: isDark ? 'rgba(239, 68, 68, 0.06)' : '#FFF1F2',
                        border: isDark ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid #FECDD3',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <XCircle size={16} style={{ color: '#ef4444' }} />
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#fca5a5' : '#BE123C' }}>{absentCount}</div>
                            <div style={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#9F1239', fontWeight: 500 }}>Absent</div>
                        </div>
                    </div>

                    <div style={{
                        background: isDark ? 'rgba(245, 158, 11, 0.06)' : '#FFFBEB',
                        border: isDark ? '1px solid rgba(245, 158, 11, 0.15)' : '1px solid #FDE68A',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <PauseCircle size={16} style={{ color: '#f59e0b' }} />
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#fcd34d' : '#B45309' }}>{suspendedCount}</div>
                            <div style={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#92400E', fontWeight: 500 }}>Suspended</div>
                        </div>
                    </div>

                    <div style={{
                        background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Clock size={16} style={{ color: isDark ? '#94a3b8' : '#64748B' }} />
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#e2e8f0' : '#0F172A' }}>{remainingCount}</div>
                            <div style={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#64748B', fontWeight: 500 }}>Remaining</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ATTENDANCE OVERVIEW Card */}
            <div style={{
                background: isDark ? 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 1px 3px rgba(15, 23, 42, 0.06)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#94a3b8' : '#475569', letterSpacing: '0.05em' }}>
                        ATTENDANCE OVERVIEW
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
                        <span style={{ color: isDark ? '#cbd5e1' : '#334155', display: 'flex', alignItems: 'center', gap: '3px' }} title="College Minimum">
                            <Lock size={10} style={{ color: isDark ? '#94a3b8' : '#64748B' }} />
                            {collegeThreshold}%
                        </span>
                        {userThreshold !== collegeThreshold && (
                            <span style={{ color: isDark ? '#c4b5fd' : '#6D28D9', display: 'flex', alignItems: 'center', gap: '3px' }} title="My Personal Target">
                                <Target size={10} style={{ color: isDark ? '#a78bfa' : '#7C3AED' }} />
                                {userThreshold}%
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            color: overallState.color
                        }}>
                            {overallPct}%
                        </span>
                        <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748B' }}>overall</span>
                    </div>

                    <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: overallState.text,
                        background: overallState.bg,
                        border: `1px solid ${overallState.border}`,
                        padding: '2px 8px',
                        borderRadius: '6px'
                    }}>
                        {overallState.badge}
                    </span>
                </div>

                {/* Progress bar with dual markers */}
                <div style={{
                    width: '100%',
                    height: '8px',
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
                    borderRadius: '4px',
                    overflow: 'visible',
                    position: 'relative'
                }}>
                    <div style={{
                        width: `${Math.min(100, Math.max(0, overallPct))}%`,
                        height: '100%',
                        background: overallState.color,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease, background-color 0.3s ease',
                        boxShadow: `0 0 8px ${overallState.color}40`
                    }} />

                    {/* College threshold line marker */}
                    <div
                        title={`College Minimum: ${collegeThreshold}%`}
                        style={{
                            position: 'absolute',
                            left: `${collegeThreshold}%`,
                            top: '-2px',
                            bottom: '-2px',
                            width: '2px',
                            background: isDark ? '#94a3b8' : '#64748B',
                            zIndex: 2,
                            borderRadius: '1px'
                        }}
                    />

                    {/* Personal target line marker */}
                    {userThreshold !== collegeThreshold && (
                        <div
                            title={`My Target: ${userThreshold}%`}
                            style={{
                                position: 'absolute',
                                left: `${userThreshold}%`,
                                top: '-2px',
                                bottom: '-2px',
                                width: '2px',
                                background: isDark ? '#a78bfa' : '#7C3AED',
                                zIndex: 3,
                                borderRadius: '1px'
                            }}
                        />
                    )}
                </div>

                {/* Subject status counts (3-State Safe / Attention / Critical) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    paddingTop: '6px',
                    borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #E2E8F0',
                    fontSize: '11px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isDark ? '#6ee7b7' : '#047857' }}>
                            <ShieldCheck size={12} />
                            <span>Safe (Target Met)</span>
                        </div>
                        <span style={{ fontWeight: 700, color: isDark ? '#6ee7b7' : '#047857' }}>{safeSubjectsCount}</span>
                    </div>

                    {userThreshold !== collegeThreshold && attentionSubjectsCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isDark ? '#fcd34d' : '#B45309' }}>
                                <AlertTriangle size={12} />
                                <span>Attention (Below Target)</span>
                            </div>
                            <span style={{ fontWeight: 700, color: isDark ? '#fcd34d' : '#B45309' }}>{attentionSubjectsCount}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: criticalSubjectsCount > 0 ? (isDark ? '#fca5a5' : '#BE123C') : (isDark ? '#94a3b8' : '#64748B') }}>
                            <AlertCircle size={12} />
                            <span>Critical (Below College)</span>
                        </div>
                        <span style={{ fontWeight: 700, color: criticalSubjectsCount > 0 ? (isDark ? '#fca5a5' : '#BE123C') : (isDark ? '#94a3b8' : '#64748B') }}>{criticalSubjectsCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceRightPanel;
