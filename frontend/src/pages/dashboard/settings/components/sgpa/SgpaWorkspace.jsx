import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, CheckCircle2, AlertTriangle, AlertCircle, Info, Calculator, Check, ArrowRight } from 'lucide-react';

const SgpaWorkspace = ({
    subject,
    selectedSemester,
    onRawSeeChange,
    onSeeMaxToggle,
    isSaving = false
}) => {
    const navigate = useNavigate();

    const [seeInput, setSeeInput] = useState('');
    const [seeMax, setSeeMax] = useState(100);
    const [inputError, setInputError] = useState(null);

    useEffect(() => {
        if (subject) {
            setSeeInput(subject.seeRawMarks !== null && subject.seeRawMarks !== undefined ? String(subject.seeRawMarks) : '');
            setSeeMax(subject.seeRawMaximum || 100);
            setInputError(null);
        }
    }, [subject]);

    if (!subject) {
        return (
            <div style={{
                padding: 40,
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: 16,
                border: '1px solid rgba(148, 163, 184, 0.15)',
                color: '#94a3b8'
            }}>
                No registered subject selected.
            </div>
        );
    }

    const handleInputChange = (val) => {
        setSeeInput(val);
        setInputError(null);

        if (val === '') {
            onRawSeeChange(null, seeMax);
            return;
        }

        const num = Number(val);
        if (isNaN(num)) {
            setInputError('Invalid numeric input');
            return;
        }

        if (num < 0) {
            setInputError('Marks cannot be negative');
            return;
        }

        if (num > seeMax) {
            setInputError(`Maximum allowed mark is ${seeMax}`);
            return;
        }

        onRawSeeChange(num, seeMax);
    };

    const handleMaxToggle = (newMax) => {
        setSeeMax(newMax);
        setInputError(null);
        if (seeInput !== '') {
            const num = Number(seeInput);
            if (!isNaN(num)) {
                if (num > newMax) {
                    setInputError(`Maximum allowed mark is ${newMax}`);
                } else {
                    onRawSeeChange(num, newMax);
                }
            }
        } else {
            onSeeMaxToggle(newMax);
        }
    };

    const getGradeColor = (grade, status) => {
        if (grade === 'NE' || status === 'NE') return { text: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
        if (grade === 'F' || status === 'FAILED') return { text: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
        if (grade === 'PENDING' || status === 'PENDING') return { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' };
        return { text: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
    };

    const gradeStyle = getGradeColor(subject.grade, subject.status);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            flex: 1
        }}>
            {/* Subject Header Banner */}
            <div style={{
                padding: '20px 24px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.7), rgba(15, 23, 42, 0.9))',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(139, 92, 246, 0.2)',
                            color: '#c4b5fd',
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.04em'
                        }}>
                            {subject.subjectCode}
                        </span>
                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                            {subject.category || 'Theory'}
                        </span>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                        {subject.subjectName}
                    </h2>
                </div>

                <div style={{
                    padding: '8px 16px',
                    borderRadius: 12,
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                        Subject Weightage
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#a78bfa' }}>
                        {subject.credits} Credits
                    </div>
                </div>
            </div>

            {/* 2-Column Grid: Left CIE & SEE Input | Right Result Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* Left Section: CIE Import + SEE Input (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-5">

                    {/* CARD 1: Imported CIE Card */}
                    <div style={{
                        padding: 20,
                        borderRadius: 16,
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    background: 'rgba(139, 92, 246, 0.2)',
                                    color: '#a78bfa',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <CheckCircle2 size={16} />
                                </div>
                                <div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                                        Continuous Internal Evaluation (CIE)
                                    </span>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                        {subject.hasCie ? '✓ Auto-imported from CIE Analyzer' : 'CIE results not yet completed'}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/home/cie')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '6px 12px',
                                    borderRadius: 8,
                                    background: 'rgba(139, 92, 246, 0.15)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    color: '#c4b5fd',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                <span>{subject.hasCie ? 'View CIE' : 'Complete CIE'}</span>
                                <ExternalLink size={13} />
                            </button>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 18px',
                            borderRadius: 12,
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(148, 163, 184, 0.12)'
                        }}>
                            <div>
                                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                                    Imported CIE Marks
                                </span>
                                <div style={{ fontSize: 20, fontWeight: 800, color: subject.hasCie ? '#38bdf8' : '#f59e0b' }}>
                                    {subject.hasCie ? `${subject.cieMarks} / 50` : 'Not Available'}
                                </div>
                            </div>

                            {/* CIE Eligibility Badge */}
                            {subject.hasCie && (
                                <div style={{
                                    padding: '6px 12px',
                                    borderRadius: 8,
                                    background: subject.cieStatus === 'NOT_ELIGIBLE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    border: subject.cieStatus === 'NOT_ELIGIBLE' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                                    color: subject.cieStatus === 'NOT_ELIGIBLE' ? '#f87171' : '#34d399',
                                    fontSize: 12,
                                    fontWeight: 700
                                }}>
                                    {subject.cieStatus === 'NOT_ELIGIBLE' ? '✕ NE (Not Eligible)' : '✓ Eligible'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CARD 2: SEE Raw Marks Entry Card */}
                    <div style={{
                        padding: 20,
                        borderRadius: 16,
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <div>
                                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                                    Semester End Exam (SEE) Marks
                                </h3>
                                <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
                                    Enter student raw SEE marks out of 100 or 50
                                </p>
                            </div>

                            {/* Raw Max Switcher [100] [50] */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                background: 'rgba(30, 41, 59, 0.8)',
                                padding: 3,
                                borderRadius: 10,
                                border: '1px solid rgba(148, 163, 184, 0.2)'
                            }}>
                                <button
                                    onClick={() => handleMaxToggle(100)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: 7,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: seeMax === 100 ? '#7c3aed' : 'transparent',
                                        color: seeMax === 100 ? '#ffffff' : '#94a3b8'
                                    }}
                                >
                                    out of 100
                                </button>
                                <button
                                    onClick={() => handleMaxToggle(50)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: 7,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: seeMax === 50 ? '#7c3aed' : 'transparent',
                                        color: seeMax === 50 ? '#ffffff' : '#94a3b8'
                                    }}
                                >
                                    out of 50
                                </button>
                            </div>
                        </div>

                        {/* Input Field */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        type="number"
                                        value={seeInput}
                                        onChange={(e) => handleInputChange(e.target.value)}
                                        placeholder={`Enter SEE marks (0 - ${seeMax})`}
                                        min={0}
                                        max={seeMax}
                                        step="any"
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: 12,
                                            background: 'rgba(30, 41, 59, 0.7)',
                                            border: inputError ? '1.5px solid #ef4444' : '1px solid rgba(139, 92, 246, 0.3)',
                                            color: '#f8fafc',
                                            fontSize: 16,
                                            fontWeight: 700,
                                            outline: 'none',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                                        }}
                                    />
                                </div>
                                <span style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>
                                    / {seeMax}
                                </span>
                            </div>

                            {/* Error Warning Banner */}
                            {inputError && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    color: '#f87171',
                                    fontSize: 12,
                                    fontWeight: 600
                                }}>
                                    <AlertCircle size={14} />
                                    <span>{inputError}</span>
                                </div>
                            )}

                            {/* SEE Scaled Output Display */}
                            {subject.seeScaledMarks !== null && !inputError && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    background: 'rgba(30, 41, 59, 0.4)',
                                    border: '1px solid rgba(148, 163, 184, 0.1)'
                                }}>
                                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                        Normalized SEE Contribution
                                    </span>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#818cf8' }}>
                                        {subject.seeScaledMarks} / 50
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Section: Subject Results Card (5 cols) */}
                <div className="lg:col-span-5">
                    <div style={{
                        padding: 24,
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
                        border: `1.5px solid ${gradeStyle.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                        height: '100%',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}>
                        <div style={{
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#94a3b8'
                        }}>
                            Subject Result Overview
                        </div>

                        {/* Total Marks Banner */}
                        <div style={{
                            padding: '16px 20px',
                            borderRadius: 14,
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(148, 163, 184, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div>
                                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                                    Total Marks (CIE + SEE)
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc' }}>
                                    {subject.totalMarks !== null ? `${subject.totalMarks} / 100` : '—'}
                                </div>
                            </div>
                            <div style={{
                                padding: '8px 14px',
                                borderRadius: 10,
                                background: gradeStyle.bg,
                                border: `1px solid ${gradeStyle.border}`,
                                color: gradeStyle.text,
                                fontSize: 18,
                                fontWeight: 800
                            }}>
                                {subject.grade}
                            </div>
                        </div>

                        {/* Failure Callout Banner if NE or F */}
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
                                alignItems: 'flex-start',
                                gap: 8
                            }}>
                                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                                <span>{subject.failureReason}</span>
                            </div>
                        )}

                        {/* Score Breakdown Table */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            padding: '14px 16px',
                            borderRadius: 12,
                            background: 'rgba(15, 23, 42, 0.5)',
                            border: '1px solid rgba(148, 163, 184, 0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#94a3b8' }}>Grade Point</span>
                                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{subject.gradePoint}</span>
                            </div>
                            <div style={{ height: 1, background: 'rgba(148, 163, 184, 0.1)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#94a3b8' }}>Subject Credits</span>
                                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{subject.credits}</span>
                            </div>
                            <div style={{ height: 1, background: 'rgba(148, 163, 184, 0.1)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
                                <span style={{ color: '#a78bfa' }}>Credit Points</span>
                                <span style={{ color: '#38bdf8' }}>{subject.creditPoints}</span>
                            </div>
                        </div>

                        {/* Status Note */}
                        <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 'auto' }}>
                            {subject.status === 'COMPLETED' ? '✓ Result completed & calculated' : '◐ Pending complete SEE marks'}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SgpaWorkspace;
