import React from 'react';
import { CheckCircle2, XCircle, PauseCircle, Clock, ShieldCheck, AlertTriangle, Target } from 'lucide-react';

const AttendanceRightPanel = ({
    selectedDate,
    dayClasses = [],
    overallMetrics = null,
    progressList = []
}) => {
    // Calculate Day Summary numbers
    const totalDayClasses = dayClasses.length;
    const presentCount = dayClasses.filter(c => c.status === 'Present' || c.status === 'On Duty').length;
    const absentCount = dayClasses.filter(c => c.status === 'Absent').length;
    const suspendedCount = dayClasses.filter(c => c.status === 'Suspended').length;
    const remainingCount = dayClasses.filter(c => !c.status || c.status === 'Yet To Be Taken' || c.status === 'NOT_MARKED').length;

    // Overall metrics threshold and health counts
    const threshold = overallMetrics?.threshold || 75;
    const overallPct = overallMetrics?.attendance ?? 0;

    let safeSubjectsCount = 0;
    let warningSubjectsCount = 0;

    progressList.forEach(s => {
        if (s.attendancePercentage >= threshold) {
            safeSubjectsCount++;
        } else {
            warningSubjectsCount++;
        }
    });

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
            color: '#fff',
            height: 'fit-content'
        }}>
            {/* DAY SUMMARY Card */}
            <div style={{
                background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.05em' }}>
                        {formatDateLabel(selectedDate)}
                    </div>
                    <span style={{
                        fontSize: '11px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        color: '#cbd5e1',
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
                        background: 'rgba(16, 185, 129, 0.06)',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#6ee7b7' }}>{presentCount}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>Present</div>
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <XCircle size={16} style={{ color: '#ef4444' }} />
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fca5a5' }}>{absentCount}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>Absent</div>
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(245, 158, 11, 0.06)',
                        border: '1px solid rgba(245, 158, 11, 0.15)',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <PauseCircle size={16} style={{ color: '#f59e0b' }} />
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fcd34d' }}>{suspendedCount}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>Suspended</div>
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Clock size={16} style={{ color: '#94a3b8' }} />
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>{remainingCount}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>Remaining</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ATTENDANCE OVERVIEW Card */}
            <div style={{
                background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
                        ATTENDANCE OVERVIEW
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#a78bfa', fontWeight: 600 }}>
                        <Target size={11} />
                        Min {threshold}%
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{
                        fontSize: '32px',
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        color: overallPct >= threshold ? '#10b981' : '#ef4444'
                    }}>
                        {overallPct}%
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>overall</span>
                </div>

                {/* Progress bar */}
                <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <div style={{
                        width: `${Math.min(100, Math.max(0, overallPct))}%`,
                        height: '100%',
                        background: overallPct >= threshold
                            ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                            : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>

                {/* Subject status counts */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    paddingTop: '4px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6ee7b7' }}>
                        <ShieldCheck size={12} />
                        <span>{safeSubjectsCount} Safe</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: warningSubjectsCount > 0 ? '#fca5a5' : '#94a3b8' }}>
                        <AlertTriangle size={12} />
                        <span>{warningSubjectsCount} Needs Attention</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceRightPanel;
