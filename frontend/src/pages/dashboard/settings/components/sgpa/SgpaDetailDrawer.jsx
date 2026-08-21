import React from 'react';
import { X, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SgpaDetailDrawer = ({
    subject,
    isOpen,
    onClose
}) => {
    const navigate = useNavigate();
    if (!isOpen || !subject) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
            background: 'rgba(7, 5, 18, 0.7)',
            backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: 440,
                height: '100%',
                background: '#0f172a',
                borderLeft: '1px solid rgba(139, 92, 246, 0.3)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
                overflowY: 'auto',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.5)'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(139, 92, 246, 0.2)',
                            color: '#c4b5fd',
                            fontSize: 11,
                            fontWeight: 700
                        }}>
                            {subject.subjectCode}
                        </span>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '4px 0 0' }}>
                            {subject.subjectName}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: 8,
                            borderRadius: 8,
                            background: 'rgba(30, 41, 59, 0.8)',
                            border: '1px solid rgba(148, 163, 184, 0.2)',
                            color: '#94a3b8',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Subject Details Grid */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    padding: 16,
                    borderRadius: 14,
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(148, 163, 184, 0.12)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#94a3b8' }}>Subject Credits</span>
                        <span style={{ fontWeight: 700, color: '#f8fafc' }}>{subject.credits} Credits</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#94a3b8' }}>Category</span>
                        <span style={{ fontWeight: 700, color: '#f8fafc' }}>{subject.category || 'Theory'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#94a3b8' }}>CIE Marks</span>
                        <span style={{ fontWeight: 700, color: '#38bdf8' }}>{subject.cieMarks !== null ? `${subject.cieMarks} / 50` : 'Pending'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#94a3b8' }}>Raw SEE Marks</span>
                        <span style={{ fontWeight: 700, color: '#f8fafc' }}>{subject.seeRawMarks !== null ? `${subject.seeRawMarks} / ${subject.seeRawMaximum}` : 'Pending'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#94a3b8' }}>Scaled SEE Marks</span>
                        <span style={{ fontWeight: 700, color: '#818cf8' }}>{subject.seeScaledMarks !== null ? `${subject.seeScaledMarks} / 50` : 'Pending'}</span>
                    </div>
                    <div style={{ height: 1, background: 'rgba(148, 163, 184, 0.12)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                        <span style={{ color: '#f8fafc' }}>Total Marks</span>
                        <span style={{ color: '#a78bfa' }}>{subject.totalMarks !== null ? `${subject.totalMarks} / 100` : '—'}</span>
                    </div>
                </div>

                {/* Grade & Credit Point Summary Card */}
                <div style={{
                    padding: 20,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.6), rgba(15, 23, 42, 0.8))',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Final Grade</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#38bdf8' }}>{subject.grade}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Credit Points</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: '#a78bfa' }}>{subject.creditPoints}</div>
                    </div>
                </div>

                {subject.failureReason && (
                    <div style={{
                        padding: 12,
                        borderRadius: 10,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        gap: 8
                    }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{subject.failureReason}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SgpaDetailDrawer;
