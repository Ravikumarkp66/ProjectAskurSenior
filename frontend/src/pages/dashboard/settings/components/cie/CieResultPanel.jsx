import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Clock, Info } from 'lucide-react';

const CieResultPanel = ({ subject }) => {
    if (!subject) return null;

    const {
        totalCie = 0,
        maxCie = 50,
        status = 'NOT_STARTED',
        isEligible = false,
        contributions = {},
        failedRequirements = [],
        evaluationType,
        totalEnteredCount = 0
    } = subject;

    const percentage = Math.min(100, Math.max(0, (totalCie / maxCie) * 100));

    const renderStatusBadge = () => {
        if (status === 'ELIGIBLE') {
            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    fontSize: '12px',
                    fontWeight: 700
                }}>
                    <CheckCircle2 size={15} />
                    <span>✓ Eligible for SEE</span>
                </div>
            );
        }
        if (status === 'NOT_ELIGIBLE') {
            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '12px',
                    fontWeight: 700
                }}>
                    <AlertTriangle size={15} />
                    <span>! Not Eligible</span>
                </div>
            );
        }
        if (status === 'PARTIAL') {
            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#f59e0b',
                    fontSize: '12px',
                    fontWeight: 700
                }}>
                    <Clock size={15} />
                    <span>◐ In Progress</span>
                </div>
            );
        }
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 600
            }}>
                <span>○ Not Started</span>
            </div>
        );
    };

    return (
        <div style={{
            background: 'linear-gradient(145deg, rgba(26, 22, 40, 0.8) 0%, rgba(15, 13, 24, 0.9) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
            {/* Header / Score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                        CIE Score
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>
                            {totalEnteredCount === 0 ? '—' : totalCie.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>
                            / {maxCie}
                        </span>
                    </div>
                </div>

                {renderStatusBadge()}
            </div>

            {/* Score Progress Bar */}
            <div style={{
                height: '8px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: status === 'NOT_ELIGIBLE'
                        ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                        : 'linear-gradient(90deg, #7c3aed 0%, #10b981 100%)',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease'
                }} />
            </div>

            {/* Failed Requirement Callouts (If Any) */}
            {failedRequirements.length > 0 && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '12px', fontWeight: 700 }}>
                        <AlertTriangle size={15} />
                        <span>Requirement Not Satisfied</span>
                    </div>
                    {failedRequirements.map((reqMsg, idx) => (
                        <div key={idx} style={{ fontSize: '11px', color: '#fca5a5', paddingLeft: '23px', lineHeight: 1.4 }}>
                            {reqMsg}
                        </div>
                    ))}
                </div>
            )}

            {/* Contribution Breakdown */}
            <div style={{
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                paddingTop: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
                    CIE Contribution Breakdown
                </span>

                {evaluationType === 'IPCC' ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                            <span>Theory (Scaled /25)</span>
                            <span style={{ fontWeight: 700 }}>{contributions.theoryTotal?.toFixed(2) || '0.00'} / 25</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                            <span>Practical (Scaled /25)</span>
                            <span style={{ fontWeight: 700 }}>{contributions.practicalTotal?.toFixed(2) || '0.00'} / 25</span>
                        </div>
                    </>
                ) : evaluationType === 'THEORY_ONLY' ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                            <span>Tests</span>
                            <span style={{ fontWeight: 700 }}>{contributions.tests?.toFixed(2) || '0.00'} / 34</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                            <span>Quizzes</span>
                            <span style={{ fontWeight: 700 }}>{contributions.quizzes?.toFixed(2) || '0.00'} / 8</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                            <span>Assignments</span>
                            <span style={{ fontWeight: 700 }}>{contributions.assignments?.toFixed(2) || '0.00'} / 8</span>
                        </div>
                    </>
                ) : evaluationType === 'LAB_ONLY' ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                            <span>Lab Record</span>
                            <span style={{ fontWeight: 700 }}>{contributions.labRecord?.toFixed(2) || '0.00'} / 35</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                            <span>Lab Test</span>
                            <span style={{ fontWeight: 700 }}>{contributions.labTest?.toFixed(2) || '0.00'} / 15</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                            <span>Tests</span>
                            <span style={{ fontWeight: 700 }}>{contributions.tests?.toFixed(2) || '0.00'} / 34</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1' }}>
                            <span>Internal Assessment</span>
                            <span style={{ fontWeight: 700 }}>{contributions.internalAssessment?.toFixed(2) || '0.00'} / 16</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CieResultPanel;
