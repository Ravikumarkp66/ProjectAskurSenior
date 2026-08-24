import React from 'react';
import { ShieldCheck, AlertTriangle, Sliders, FileText, CheckCircle2 } from 'lucide-react';
import { getAttendanceState } from '../SubjectProgressList';

const AttendanceSummaryView = ({
    progressList = [],
    overallMetrics = null,
    onOpenBaselineModal,
    readOnly
}) => {
    const threshold = overallMetrics?.threshold || 75;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            color: '#fff',
            width: '100%'
        }}>
            {/* Header Banner */}
            <div style={{
                background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                        Semester Attendance Summary
                    </h2>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                        Comprehensive breakdown of conducted, predicted future classes, and threshold compliance.
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        background: 'rgba(124, 58, 237, 0.08)',
                        border: '1px solid rgba(124, 58, 237, 0.2)',
                        borderRadius: '10px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#c4b5fd'
                    }}>
                        College Threshold: <strong>{threshold}%</strong>
                    </div>

                    {!readOnly && onOpenBaselineModal && (
                        <button
                            type="button"
                            onClick={onOpenBaselineModal}
                            style={{
                                background: '#7c3aed',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s'
                            }}
                        >
                            <Sliders size={13} />
                            Edit Mid-Semester Baseline
                        </button>
                    )}
                </div>
            </div>

            {/* Attendance Table */}
            <div style={{
                background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
                {progressList.length === 0 ? (
                    <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        No registered subjects found for this semester.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            textAlign: 'left',
                            fontSize: '13px'
                        }}>
                            <thead>
                                <tr style={{
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    color: '#94a3b8',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    <th style={{ padding: '14px 16px', width: '50px' }}>#</th>
                                    <th style={{ padding: '14px 16px' }}>Subject</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Credits</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', color: '#6ee7b7' }}>Present</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', color: '#fca5a5' }}>Absent</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Conducted</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', color: '#38bdf8' }}>To Be Conducted</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Predicted</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Attendance %</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center' }}>Status</th>
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
                                            <td style={{ padding: '16px', color: '#64748b', fontWeight: 600 }}>
                                                {String(idx + 1).padStart(2, '0')}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                                                    {item.name}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                                    {item.code ? `${item.code} · ` : ''}{item.category || 'Theory'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>
                                                {item.credits || 0}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', color: '#6ee7b7', fontWeight: 700 }}>
                                                {present}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', color: '#fca5a5', fontWeight: 700 }}>
                                                {absent}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', color: '#f8fafc', fontWeight: 700 }}>
                                                {conducted}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', color: '#38bdf8', fontWeight: 600 }}>
                                                {toBeConducted}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>
                                                {predictedTotal}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                {pct === null ? (
                                                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>
                                                        Not started
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        fontSize: '14px',
                                                        fontWeight: 800,
                                                        color: state.color
                                                    }}>
                                                        {pct.toFixed(1)}%
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <span style={{
                                                    background: `${state.color}18`,
                                                    border: `1px solid ${state.color}40`,
                                                    color: state.color,
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
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
                )}
            </div>
        </div>
    );
};

export default AttendanceSummaryView;
