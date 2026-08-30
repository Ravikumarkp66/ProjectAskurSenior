import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { getAttendanceState } from '../SubjectProgressList';

const AttendanceSummaryView = ({
    progressList = [],
    overallMetrics = null,
    onOpenBaselineModal,
    readOnly
}) => {
    const threshold = overallMetrics?.threshold || 75;
    const [expandedSubjects, setExpandedSubjects] = useState({});

    const toggleExpand = (idx) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            color: '#fff',
            width: '100%',
            minWidth: 0
        }}>
            {/* Header Banner */}
            <div style={{
                background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
                <div style={{ minWidth: 0 }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                        Semester Attendance Summary
                    </h2>
                    <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '3px 0 0 0' }}>
                        Conducted, predicted classes, and threshold compliance.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        background: 'rgba(124, 58, 237, 0.08)',
                        border: '1px solid rgba(124, 58, 237, 0.2)',
                        borderRadius: '8px',
                        padding: '5px 12px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: '#c4b5fd'
                    }}>
                        College Threshold: <strong>{threshold}%</strong>
                    </div>
                </div>
            </div>

            {/* Attendance Container */}
            <div style={{
                background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                width: '100%',
                minWidth: 0
            }}>
                {progressList.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        No registered subjects found for this semester.
                    </div>
                ) : (
                    <>
                        {/* ── DESKTOP / TABLET VIEW (≥ 768px): FULL DATA TABLE ── */}
                        <div className="hidden md:block overflow-x-auto" style={{ width: '100%' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                textAlign: 'left',
                                fontSize: '12.5px'
                            }}>
                                <thead>
                                    <tr style={{
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        color: '#94a3b8',
                                        fontSize: '10.5px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        <th style={{ padding: '12px 14px', width: '45px' }}>#</th>
                                        <th style={{ padding: '12px 14px' }}>Subject</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>Credits</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'center', color: '#6ee7b7' }}>Present</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'center', color: '#fca5a5' }}>Absent</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>Conducted</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'center', color: '#38bdf8' }}>To Be</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>Predicted</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>Attendance %</th>
                                        <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {progressList.map((item, idx) => {
                                        const analytics = item.analytics || {};
                                        const present = analytics.present || 0;
                                        const absent = analytics.absent || 0;
                                        const conducted = analytics.conducted || 0;
                                        const expected = analytics.expected || 0;
                                        const toBeConducted = Math.max(0, expected - conducted);
                                        const predictedTotal = conducted + toBeConducted;
                                        const cThresh = item.collegeThreshold || threshold || 85;
                                        const uThresh = item.userThreshold || cThresh;
                                        const pct = item.attendancePercentage ?? null;
                                        const state = getAttendanceState(pct, cThresh, uThresh);

                                        return (
                                            <tr key={idx} style={{
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <td style={{ padding: '14px', color: '#64748b', fontWeight: 600 }}>
                                                    {String(idx + 1).padStart(2, '0')}
                                                </td>
                                                <td style={{ padding: '14px' }}>
                                                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                                                        {item.name}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                                        {item.code ? `${item.code} · ` : ''}{item.category || 'Theory'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '14px', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>
                                                    {item.credits || 0}
                                                </td>
                                                <td style={{ padding: '14px', textAlign: 'center', color: '#6ee7b7', fontWeight: 700 }}>
                                                    {present}
                                                </td>
                                                <td style={{ padding: '14px', textAlign: 'center', color: '#fca5a5', fontWeight: 700 }}>
                                                    {absent}
                                                </td>
                                                <td style={{ padding: '14px', textAlign: 'center', color: '#f8fafc', fontWeight: 700 }}>
                                                    {conducted}
                                                </td>
                                                <td style={{ padding: '14px', textAlign: 'center', color: '#38bdf8', fontWeight: 600 }}>
                                                    {toBeConducted}
                                                </td>
                                                <td style={{ padding: '14px', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>
                                                    {predictedTotal}
                                                </td>
                                                <td style={{ padding: '14px', textAlign: 'center' }}>
                                                    {pct === null ? (
                                                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
                                                            Not started
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            fontSize: '13.5px',
                                                            fontWeight: 800,
                                                            color: state.color
                                                        }}>
                                                            {pct.toFixed(1)}%
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '14px', textAlign: 'center' }}>
                                                    <span style={{
                                                        background: `${state.color}18`,
                                                        border: `1px solid ${state.color}40`,
                                                        color: state.color,
                                                        padding: '4px 10px',
                                                        borderRadius: '10px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        {state.stateKey === 'SAFE' && <ShieldCheck size={12} />}
                                                        {state.stateKey === 'ATTENTION' && <AlertTriangle size={12} />}
                                                        {state.stateKey === 'CRITICAL' && <AlertTriangle size={12} />}
                                                        {state.stateKey === 'SAFE' ? 'Safe' : state.stateKey === 'ATTENTION' ? 'Attention' : state.stateKey === 'CRITICAL' ? 'Critical' : 'Not started'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* ── MOBILE VIEW (< 768px): ACCORDION CARDS ── */}
                        <div className="flex flex-col gap-2.5 md:hidden" style={{ padding: '12px', width: '100%', boxSizing: 'border-box' }}>
                            {progressList.map((item, idx) => {
                                const analytics = item.analytics || {};
                                const present = analytics.present || 0;
                                const absent = analytics.absent || 0;
                                const conducted = analytics.conducted || 0;
                                const expected = analytics.expected || 0;
                                const toBeConducted = Math.max(0, expected - conducted);
                                const predictedTotal = conducted + toBeConducted;
                                const cThresh = item.collegeThreshold || threshold || 85;
                                const uThresh = item.userThreshold || cThresh;
                                const pct = item.attendancePercentage ?? null;
                                const state = getAttendanceState(pct, cThresh, uThresh);
                                const isExpanded = !!expandedSubjects[idx];

                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            border: `1px solid ${isExpanded ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            transition: 'all 0.2s ease',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        {/* Card Header (Always visible, tap to toggle) */}
                                        <button
                                            type="button"
                                            onClick={() => toggleExpand(idx)}
                                            style={{
                                                width: '100%',
                                                padding: '12px 14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '10px',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                color: '#fff',
                                                minHeight: '44px'
                                            }}
                                        >
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                                                        #{String(idx + 1).padStart(2, '0')}
                                                    </span>
                                                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                    {item.code && <span>{item.code}</span>}
                                                    <span>· {item.credits || 0} Credits</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{
                                                        fontSize: '14px',
                                                        fontWeight: 800,
                                                        color: state.color
                                                    }}>
                                                        {pct === null ? '—' : `${pct.toFixed(1)}%`}
                                                    </div>
                                                    <span style={{
                                                        fontSize: '9.5px',
                                                        fontWeight: 700,
                                                        color: state.color,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {state.stateKey === 'SAFE' ? 'Safe' : state.stateKey === 'ATTENTION' ? 'Attention' : state.stateKey === 'CRITICAL' ? 'Critical' : 'Not started'}
                                                    </span>
                                                </div>
                                                {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                                            </div>
                                        </button>

                                        {/* Expanded Details Grid */}
                                        {isExpanded && (
                                            <div style={{
                                                padding: '12px 14px',
                                                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                                background: 'rgba(0, 0, 0, 0.2)',
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(2, 1fr)',
                                                gap: '10px',
                                                fontSize: '11.5px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                                                    <span style={{ color: '#94a3b8' }}>Present</span>
                                                    <strong style={{ color: '#6ee7b7' }}>{present}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                                                    <span style={{ color: '#94a3b8' }}>Absent</span>
                                                    <strong style={{ color: '#fca5a5' }}>{absent}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                                                    <span style={{ color: '#94a3b8' }}>Conducted</span>
                                                    <strong style={{ color: '#f8fafc' }}>{conducted}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                                                    <span style={{ color: '#94a3b8' }}>To Be Conducted</span>
                                                    <strong style={{ color: '#38bdf8' }}>{toBeConducted}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                                                    <span style={{ color: '#94a3b8' }}>Predicted Total</span>
                                                    <strong style={{ color: '#cbd5e1' }}>{predictedTotal}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                                                    <span style={{ color: '#94a3b8' }}>Threshold</span>
                                                    <strong style={{ color: '#c4b5fd' }}>{cThresh}%</strong>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AttendanceSummaryView;
