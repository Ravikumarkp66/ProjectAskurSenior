import React from 'react';
import { X, CheckCircle2, AlertTriangle, Clock, Layers, BookOpen } from 'lucide-react';

const CieDetailDrawer = ({
    isOpen,
    onClose,
    subject
}) => {
    if (!isOpen || !subject) return null;

    const {
        subjectName,
        subjectCode,
        credits,
        evaluationType,
        evalConfig,
        rawMarks = {},
        contributions = {},
        totalCie = 0,
        maxCie = 50,
        status = 'NOT_STARTED',
        failedRequirements = [],
        totalEnteredCount = 0
    } = subject;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'flex-end'
        }}>
            <div style={{
                background: 'linear-gradient(145deg, #181524 0%, #120F1D 100%)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%',
                maxWidth: '460px',
                height: '100%',
                overflowY: 'auto',
                padding: '24px',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'rgba(124, 58, 237, 0.15)',
                            border: '1px solid rgba(124, 58, 237, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#c4b5fd'
                        }}>
                            <BookOpen size={18} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                                {subjectName}
                            </h3>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                {subjectCode} · {credits} Credits
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Status & CIE Total Card */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '14px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>
                            Total CIE Score
                        </span>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                            {totalEnteredCount === 0 ? '—' : totalCie.toFixed(2)} <span style={{ fontSize: '13px', color: '#64748b' }}>/ {maxCie}</span>
                        </div>
                    </div>

                    <div style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: status === 'ELIGIBLE' ? 'rgba(16, 185, 129, 0.15)' : status === 'NOT_ELIGIBLE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: status === 'ELIGIBLE' ? '#10b981' : status === 'NOT_ELIGIBLE' ? '#ef4444' : '#f59e0b',
                        border: status === 'ELIGIBLE' ? '1px solid rgba(16, 185, 129, 0.3)' : status === 'NOT_ELIGIBLE' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                    }}>
                        {status === 'ELIGIBLE' ? '✓ Eligible' : status === 'NOT_ELIGIBLE' ? '! Not Eligible' : '◐ In Progress'}
                    </div>
                </div>

                {/* Failed Requirements Callout */}
                {failedRequirements.length > 0 && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '12px',
                        padding: '12px 14px'
                    }}>
                        <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                            Failed Requirements
                        </div>
                        {failedRequirements.map((r, i) => (
                            <div key={i} style={{ fontSize: '11px', color: '#fca5a5', lineHeight: 1.4 }}>
                                • {r}
                            </div>
                        ))}
                    </div>
                )}

                {/* Raw Marks Entered Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a78bfa' }}>
                        Raw Marks Entered
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Test 01:</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginLeft: '6px' }}>
                                {rawMarks.test1 !== null && rawMarks.test1 !== undefined ? `${rawMarks.test1} / 50` : '—'}
                            </span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Test 02:</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginLeft: '6px' }}>
                                {rawMarks.test2 !== null && rawMarks.test2 !== undefined ? `${rawMarks.test2} / 50` : '—'}
                            </span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Quiz 01:</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginLeft: '6px' }}>
                                {rawMarks.quiz1 !== null && rawMarks.quiz1 !== undefined ? `${rawMarks.quiz1} / 20` : '—'}
                            </span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Quiz 02:</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginLeft: '6px' }}>
                                {rawMarks.quiz2 !== null && rawMarks.quiz2 !== undefined ? `${rawMarks.quiz2} / 20` : '—'}
                            </span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Assignment 01:</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginLeft: '6px' }}>
                                {rawMarks.assignment1 !== null && rawMarks.assignment1 !== undefined ? `${rawMarks.assignment1} / 20` : '—'}
                            </span>
                        </div>
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Assignment 02:</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginLeft: '6px' }}>
                                {rawMarks.assignment2 !== null && rawMarks.assignment2 !== undefined ? `${rawMarks.assignment2} / 20` : '—'}
                            </span>
                        </div>
                        {(evaluationType === 'IPCC' || evaluationType === 'LAB_ONLY') && (
                            <>
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Lab Record:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginLeft: '6px' }}>
                                        {rawMarks.labRecord !== null && rawMarks.labRecord !== undefined ? `${rawMarks.labRecord} / 350` : '—'}
                                    </span>
                                </div>
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Lab Test:</span>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginLeft: '6px' }}>
                                        {rawMarks.labTest !== null && rawMarks.labTest !== undefined ? `${rawMarks.labTest} / 15` : '—'}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* CIE Contribution Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a78bfa' }}>
                        CIE Contributions
                    </span>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#cbd5e1' }}>Tests</span>
                            <span style={{ fontWeight: 700, color: '#fff' }}>{contributions.tests?.toFixed(2) || '0.00'} / 34</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#cbd5e1' }}>Quizzes</span>
                            <span style={{ fontWeight: 700, color: '#fff' }}>{contributions.quizzes?.toFixed(2) || '0.00'} / 8</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#cbd5e1' }}>Assignments</span>
                            <span style={{ fontWeight: 700, color: '#fff' }}>{contributions.assignments?.toFixed(2) || '0.00'} / 8</span>
                        </div>
                        {(evaluationType === 'IPCC' || evaluationType === 'LAB_ONLY') && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                <span style={{ color: '#cbd5e1' }}>Practical / Labs</span>
                                <span style={{ fontWeight: 700, color: '#fff' }}>{contributions.practicalTotal?.toFixed(2) || '0.00'} / 25</span>
                            </div>
                        )}
                        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800 }}>
                            <span style={{ color: '#f8fafc' }}>Total CIE</span>
                            <span style={{ color: '#a78bfa' }}>{totalCie.toFixed(2)} / {maxCie}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CieDetailDrawer;
