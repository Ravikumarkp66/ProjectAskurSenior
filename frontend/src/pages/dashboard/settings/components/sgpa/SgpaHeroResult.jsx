import React from 'react';
import { Award, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const SgpaHeroResult = ({
    summaryStats = {},
    selectedSemester
}) => {
    const {
        sgpa,
        totalCredits = 0,
        totalCreditPoints = 0,
        completedCount = 0,
        totalSubjectsCount = 0,
        hasPending = false,
        status = 'PENDING'
    } = summaryStats;

    const isComplete = !hasPending && sgpa !== null;

    return (
        <div style={{
            padding: '22px 26px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.85), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 10px 32px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            marginBottom: 24
        }}>
            {/* Left SGPA Score Hero */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{
                    width: 68,
                    height: 68,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(79, 70, 229, 0.2))',
                    border: '1.5px solid rgba(139, 92, 246, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c4b5fd',
                    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.25)'
                }}>
                    <Award size={34} />
                </div>

                <div>
                    <div style={{
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#a78bfa'
                    }}>
                        SEMESTER {selectedSemester} SGPA
                    </div>
                    <div style={{
                        fontSize: 36,
                        fontWeight: 900,
                        color: isComplete ? '#38bdf8' : '#f59e0b',
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em'
                    }}>
                        {isComplete ? sgpa.toFixed(2) : (sgpa !== null ? `${sgpa.toFixed(2)} (Partial)` : 'Pending')}
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0', fontWeight: 500 }}>
                        {completedCount} / {totalSubjectsCount} subjects completed
                    </div>
                </div>
            </div>

            {/* Right Summary Stats */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap'
            }}>
                {/* Total Credits */}
                <div style={{
                    padding: '10px 18px',
                    borderRadius: 14,
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    textAlign: 'center',
                    minWidth: 105
                }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                        Total Credits
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
                        {totalCredits}
                    </div>
                </div>

                {/* Total Credit Points */}
                <div style={{
                    padding: '10px 18px',
                    borderRadius: 14,
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    textAlign: 'center',
                    minWidth: 115
                }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                        Credit Points
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa', marginTop: 2 }}>
                        {totalCreditPoints}
                    </div>
                </div>

                {/* Status Badge */}
                <div style={{
                    padding: '9px 16px',
                    borderRadius: 14,
                    background: isComplete ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    border: isComplete ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                    color: isComplete ? '#34d399' : '#f59e0b',
                    fontSize: 13,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                }}>
                    {isComplete ? <CheckCircle size={16} /> : <Clock size={16} />}
                    <span>{isComplete ? 'Result Completed' : 'In Progress'}</span>
                </div>
            </div>
        </div>
    );
};

export default SgpaHeroResult;
