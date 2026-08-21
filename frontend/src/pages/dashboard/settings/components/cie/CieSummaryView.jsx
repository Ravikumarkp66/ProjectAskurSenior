import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Clock, Circle, Eye } from 'lucide-react';
import CieDetailDrawer from './CieDetailDrawer';

const CieSummaryView = ({
    subjects = [],
    summaryStats = {},
    selectedSemester = 1
}) => {
    const [selectedDrawerSubject, setSelectedDrawerSubject] = useState(null);

    const {
        totalSubjects = subjects.length,
        completedCount = 0,
        eligibleCount = 0,
        needsAttentionCount = 0
    } = summaryStats;

    const renderStatusBadge = (status) => {
        if (status === 'ELIGIBLE') {
            return (
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: '11px',
                    fontWeight: 700
                }}>
                    <CheckCircle2 size={13} />
                    <span>✓ Eligible</span>
                </span>
            );
        }
        if (status === 'NOT_ELIGIBLE') {
            return (
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '11px',
                    fontWeight: 700
                }}>
                    <AlertTriangle size={13} />
                    <span>! Not Eligible</span>
                </span>
            );
        }
        if (status === 'PARTIAL') {
            return (
                <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontSize: '11px',
                    fontWeight: 700
                }}>
                    <Clock size={13} />
                    <span>◐ Partial</span>
                </span>
            );
        }
        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '11px',
                fontWeight: 600
            }}>
                <span>○ Not Started</span>
            </span>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Summary Top Stat Badges */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(30, 27, 46, 0.6) 0%, rgba(18, 15, 29, 0.7) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                        CIE Summary
                    </h2>
                    <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                        Semester {selectedSemester} Overview
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SUBJECTS</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>{totalSubjects}</div>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>COMPLETED</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#a78bfa' }}>{completedCount} / {totalSubjects}</div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 700 }}>ELIGIBLE</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>{eligibleCount}</div>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', padding: '8px 14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 700 }}>NEEDS ATTENTION</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#ef4444' }}>{needsAttentionCount}</div>
                    </div>
                </div>
            </div>

            {/* Desktop Summary Table */}
            <div className="hidden md:block" style={{
                background: 'rgba(18, 15, 29, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '14px 16px', width: '40px' }}>#</th>
                            <th style={{ padding: '14px 16px' }}>Code</th>
                            <th style={{ padding: '14px 16px' }}>Subject</th>
                            <th style={{ padding: '14px 16px' }}>Tests</th>
                            <th style={{ padding: '14px 16px' }}>Quizzes</th>
                            <th style={{ padding: '14px 16px' }}>Assignments</th>
                            <th style={{ padding: '14px 16px' }}>Labs</th>
                            <th style={{ padding: '14px 16px' }}>CIE Score</th>
                            <th style={{ padding: '14px 16px' }}>Status</th>
                            <th style={{ padding: '14px 16px', textAlign: 'right' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map((sub, idx) => {
                            const c = sub.contributions || {};
                            const hasLabs = sub.evaluationType === 'IPCC' || sub.evaluationType === 'LAB_ONLY';

                            return (
                                <tr
                                    key={sub.registeredSubjectId}
                                    onClick={() => setSelectedDrawerSubject(sub)}
                                    style={{
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s ease'
                                    }}
                                    className="hover:bg-white/[0.03]"
                                >
                                    <td style={{ padding: '14px 16px', color: '#64748b', fontWeight: 600 }}>
                                        {String(idx + 1).padStart(2, '0')}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#a78bfa' }}>
                                        {sub.subjectCode}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f8fafc' }}>
                                        {sub.subjectName}
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                                        {c.tests !== undefined && c.tests !== null ? `${c.tests.toFixed(2)} / 34` : '—'}
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                                        {c.quizzes !== undefined && c.quizzes !== null ? `${c.quizzes.toFixed(2)} / 8` : '—'}
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                                        {c.assignments !== undefined && c.assignments !== null ? `${c.assignments.toFixed(2)} / 8` : '—'}
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>
                                        {hasLabs ? (c.practicalTotal !== undefined ? `${c.practicalTotal.toFixed(2)} / 25` : '—') : '—'}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#fff' }}>
                                        {sub.totalEnteredCount === 0 ? '—' : `${sub.totalCie.toFixed(2)} / ${sub.maxCie}`}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        {renderStatusBadge(sub.status)}
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDrawerSubject(sub);
                                            }}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                padding: '4px 8px',
                                                color: '#94a3b8',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            View →
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Stacked Summary Cards */}
            <div className="block md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {subjects.map((sub, idx) => {
                    const c = sub.contributions || {};
                    const hasLabs = sub.evaluationType === 'IPCC' || sub.evaluationType === 'LAB_ONLY';

                    return (
                        <div
                            key={sub.registeredSubjectId}
                            onClick={() => setSelectedDrawerSubject(sub)}
                            style={{
                                background: 'rgba(18, 15, 29, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '14px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                                        {sub.subjectName}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                        {sub.subjectCode} · {sub.credits} Credits
                                    </div>
                                </div>

                                {renderStatusBadge(sub.status)}
                            </div>

                            <div style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '10px',
                                padding: '10px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                fontSize: '12px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                                    <span>Tests</span>
                                    <span style={{ fontWeight: 700 }}>{c.tests !== undefined ? `${c.tests.toFixed(2)} / 34` : '—'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                                    <span>Quizzes</span>
                                    <span style={{ fontWeight: 700 }}>{c.quizzes !== undefined ? `${c.quizzes.toFixed(2)} / 8` : '—'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                                    <span>Assignments</span>
                                    <span style={{ fontWeight: 700 }}>{c.assignments !== undefined ? `${c.assignments.toFixed(2)} / 8` : '—'}</span>
                                </div>
                                {hasLabs && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                                        <span>Labs</span>
                                        <span style={{ fontWeight: 700 }}>{c.practicalTotal !== undefined ? `${c.practicalTotal.toFixed(2)} / 25` : '—'}</span>
                                    </div>
                                )}
                                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '13px' }}>
                                    <span style={{ color: '#f8fafc' }}>Total CIE</span>
                                    <span style={{ color: '#a78bfa' }}>{sub.totalEnteredCount === 0 ? '—' : `${sub.totalCie.toFixed(2)} / ${sub.maxCie}`}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Subject Detail Drawer */}
            <CieDetailDrawer
                isOpen={!!selectedDrawerSubject}
                onClose={() => setSelectedDrawerSubject(null)}
                subject={selectedDrawerSubject}
            />
        </div>
    );
};

export default CieSummaryView;
