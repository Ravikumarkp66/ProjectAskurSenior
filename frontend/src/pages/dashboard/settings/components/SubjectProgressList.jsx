import React from 'react';
import { Lock, Target, Flame, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

/* ── 3-State Color Helpers ── */
export const getAttendanceState = (pct, collegeThreshold = 85, userThreshold = 85) => {
    if (pct === null || pct === undefined) {
        return {
            color: '#94a3b8',
            stateKey: 'NOT_STARTED'
        };
    }
    const val = Number(pct);
    const cThresh = Number(collegeThreshold) || 85;
    const uThresh = Number(userThreshold) || cThresh;

    if (val < cThresh) {
        return {
            color: '#ef4444',
            stateKey: 'CRITICAL'
        };
    }

    if (cThresh !== uThresh && val < uThresh) {
        return {
            color: '#f59e0b',
            stateKey: 'ATTENTION'
        };
    }

    return {
        color: '#10b981',
        stateKey: 'SAFE'
    };
};

const SubjectProgressList = ({ subjects = [], collegeDefaultThreshold = 85, userDefaultThreshold = 85 }) => {
    if (subjects.length === 0) return null;

    return (
        <div style={{ width: '100%' }}>
            {/* ════════════════════════════════════════════════════════════════
                DESKTOP VIEW: SUBJECT SUMMARY TABLE
                Columns: SL NO | SUBJECT NAME | COLLEGE THRESHOLD | MY THRESHOLD | ATTENDANCE | STREAK
            ════════════════════════════════════════════════════════════════ */}
            <div className="hidden md:block overflow-x-auto" style={{ width: '100%' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: '0 8px',
                    textAlign: 'left'
                }}>
                    <thead>
                        <tr style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                            <th style={{ padding: '8px 12px 8px 16px', width: '55px' }}>SL NO</th>
                            <th style={{ padding: '8px 16px' }}>SUBJECT NAME</th>
                            <th style={{ padding: '8px 14px', width: '140px' }}>COLLEGE THRESHOLD</th>
                            <th style={{ padding: '8px 14px', width: '130px' }}>MY THRESHOLD</th>
                            <th style={{ padding: '8px 16px', width: '130px' }}>ATTENDANCE</th>
                            <th style={{ padding: '8px 16px 8px 14px', width: '90px', textAlign: 'right' }}>STREAK</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map((subj, idx) => {
                            const pct = subj.attendancePercentage ?? null;
                            const collegeThresh = subj.collegeThreshold || subj.analytics?.collegeThreshold || collegeDefaultThreshold;
                            const userThresh = subj.userThreshold || subj.analytics?.userThreshold || userDefaultThreshold;
                            const state = getAttendanceState(pct, collegeThresh, userThresh);

                            const credits = subj.credits ?? 0;
                            const classesPerWeek = subj.classesPerWeek ?? (subj.category === 'Lab' ? 0 : (subj.weeklyPlan?.theory?.required || 0));
                            const labSessions = subj.labSessionsPerWeek ?? (subj.category === 'Lab' ? (subj.weeklyPlan?.lab?.required || 0) : (subj.weeklyPlan?.lab?.required || 0));
                            const conducted = subj.analytics?.conducted ?? 0;
                            const present = subj.analytics?.present ?? 0;
                            const streak = subj.analytics?.streak?.current ?? 0;
                            const expected = subj.analytics?.expected ?? 0;
                            const remainingExpected = Math.max(0, expected - conducted);

                            // Point of No Return Calculation
                            const maxReachablePct = (conducted + remainingExpected) > 0 
                                ? parseFloat(((present + remainingExpected) / (conducted + remainingExpected) * 100).toFixed(2)) 
                                : 100;
                            const isPointOfNoReturn = conducted > 0 && remainingExpected > 0 && maxReachablePct < collegeThresh;

                            // Roadmap Advice Calculation
                            let roadmapAdvice = '';
                            if (state.stateKey === 'NOT_STARTED') {
                                roadmapAdvice = 'No classes conducted yet';
                            } else if (state.stateKey === 'SAFE') {
                                const uRatio = (userThresh || 85) / 100;
                                const safeMisses = uRatio > 0 && conducted > 0
                                    ? Math.max(0, Math.floor((present - uRatio * conducted) / uRatio))
                                    : 0;
                                roadmapAdvice = safeMisses > 0 
                                    ? `Can safely miss ${safeMisses} ${safeMisses === 1 ? 'class' : 'classes'}`
                                    : `Target reached`;
                            } else {
                                const uRatio = (userThresh || 85) / 100;
                                if (uRatio >= 1.0) {
                                    roadmapAdvice = `Must attend all remaining classes`;
                                } else {
                                    const needed = Math.max(1, Math.ceil((uRatio * conducted - present) / (1 - uRatio)));
                                    roadmapAdvice = `Attend next ${needed} ${needed === 1 ? 'class' : 'classes'} to reach ${userThresh}%`;
                                }
                            }

                            const rowNumber = String(idx + 1).padStart(2, '0');

                            return (
                                <tr
                                    key={`${subj.subjectId}_${subj.category}_${idx}`}
                                    style={{
                                        background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
                                        border: '1px solid rgba(255, 255, 255, 0.06)',
                                        borderRadius: '12px',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {/* 1. SL NO */}
                                    <td style={{
                                        padding: '16px 12px 16px 16px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#64748b',
                                        borderTopLeftRadius: '12px',
                                        borderBottomLeftRadius: '12px',
                                        borderLeft: `3px solid ${state.color}`
                                    }}>
                                        {rowNumber}
                                    </td>

                                    {/* 2. SUBJECT NAME & ROADMAP ADVICE */}
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    fontSize: '14.5px',
                                                    fontWeight: 700,
                                                    color: '#f8fafc',
                                                    letterSpacing: '-0.01em'
                                                }}>
                                                    {subj.name}
                                                </span>
                                                {subj.code && (
                                                    <span style={{
                                                        fontSize: '10.5px',
                                                        fontWeight: 600,
                                                        color: '#cbd5e1',
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        {subj.code}
                                                    </span>
                                                )}
                                                {subj.category && subj.category !== 'Theory' && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        color: '#c4b5fd',
                                                        background: 'rgba(139, 92, 246, 0.12)',
                                                        border: '1px solid rgba(139, 92, 246, 0.25)',
                                                        padding: '1px 6px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        {subj.category}
                                                    </span>
                                                )}

                                                {/* Point of No Return Alert Chip */}
                                                {isPointOfNoReturn && (
                                                    <span style={{
                                                        fontSize: '10.5px',
                                                        fontWeight: 700,
                                                        color: '#fca5a5',
                                                        background: 'rgba(239, 68, 68, 0.15)',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        padding: '1px 8px',
                                                        borderRadius: '4px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <AlertTriangle size={11} className="text-red-400" />
                                                        Point of No Return: Max {maxReachablePct}%
                                                    </span>
                                                )}
                                            </div>

                                            {/* Subtitle & Recovery Roadmap */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#94a3b8', flexWrap: 'wrap' }}>
                                                <span>{credits} {credits === 1 ? 'Credit' : 'Credits'} · {classesPerWeek}/wk{labSessions > 0 ? ` · ${labSessions} Lab` : ''}</span>
                                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                                                <span>{present} attended of {conducted} conducted</span>
                                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                                                <span style={{
                                                    color: state.stateKey === 'SAFE' ? '#6ee7b7' : state.stateKey === 'ATTENTION' ? '#fcd34d' : '#fca5a5',
                                                    fontWeight: 600
                                                }}>
                                                    {roadmapAdvice}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 3. COLLEGE THRESHOLD */}
                                    <td style={{ padding: '16px 14px' }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: '#cbd5e1',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.07)',
                                            padding: '4px 10px',
                                            borderRadius: '6px'
                                        }} title="Institutional mandatory requirement">
                                            <Lock size={12} style={{ color: '#94a3b8' }} />
                                            <span>{collegeThresh}%</span>
                                        </div>
                                    </td>

                                    {/* 4. MY THRESHOLD */}
                                    <td style={{ padding: '16px 14px' }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            color: '#c4b5fd',
                                            background: 'rgba(139, 92, 246, 0.08)',
                                            border: '1px solid rgba(139, 92, 246, 0.2)',
                                            padding: '4px 10px',
                                            borderRadius: '6px'
                                        }} title="Personal attendance safety target">
                                            <Target size={12} style={{ color: '#a78bfa' }} />
                                            <span>{userThresh}%</span>
                                        </div>
                                    </td>

                                    {/* 5. ATTENDANCE (Clean Number Only) */}
                                    <td style={{ padding: '16px' }}>
                                        <span style={{ fontSize: '15px', fontWeight: 800, color: state.color }}>
                                            {pct !== null && pct !== undefined ? `${pct}%` : 'Not started'}
                                        </span>
                                    </td>

                                    {/* 6. STREAK */}
                                    <td style={{
                                        padding: '16px 16px 16px 14px',
                                        textAlign: 'right',
                                        borderTopRightRadius: '12px',
                                        borderBottomRightRadius: '12px'
                                    }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            background: streak > 0 ? 'rgba(249, 115, 22, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                            border: streak > 0 ? '1px solid rgba(249, 115, 22, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)',
                                            padding: '4px 9px',
                                            borderRadius: '6px',
                                            color: streak > 0 ? '#fdba74' : '#94a3b8',
                                            fontWeight: 700,
                                            fontSize: '12px'
                                        }}>
                                            <Flame size={13} fill={streak > 0 ? '#f97316' : 'none'} color={streak > 0 ? '#f97316' : '#94a3b8'} />
                                            <span>{streak}</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                MOBILE VIEW: RESPONSIVE CARDS
            ════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col gap-3 md:hidden" style={{ width: '100%' }}>
                {subjects.map((subj, idx) => {
                    const pct = subj.attendancePercentage ?? null;
                    const collegeThresh = subj.collegeThreshold || subj.analytics?.collegeThreshold || collegeDefaultThreshold;
                    const userThresh = subj.userThreshold || subj.analytics?.userThreshold || userDefaultThreshold;
                    const state = getAttendanceState(pct, collegeThresh, userThresh);

                    const credits = subj.credits ?? 0;
                    const classesPerWeek = subj.classesPerWeek ?? (subj.category === 'Lab' ? 0 : (subj.weeklyPlan?.theory?.required || 0));
                    const labSessions = subj.labSessionsPerWeek ?? (subj.category === 'Lab' ? (subj.weeklyPlan?.lab?.required || 0) : (subj.weeklyPlan?.lab?.required || 0));
                    const conducted = subj.analytics?.conducted ?? 0;
                    const present = subj.analytics?.present ?? 0;
                    const streak = subj.analytics?.streak?.current ?? 0;
                    const expected = subj.analytics?.expected ?? 0;
                    const remainingExpected = Math.max(0, expected - conducted);

                    const maxReachablePct = (conducted + remainingExpected) > 0 
                        ? parseFloat(((present + remainingExpected) / (conducted + remainingExpected) * 100).toFixed(2)) 
                        : 100;
                    const isPointOfNoReturn = conducted > 0 && remainingExpected > 0 && maxReachablePct < collegeThresh;

                    let roadmapAdvice = '';
                    if (state.stateKey === 'NOT_STARTED') {
                        roadmapAdvice = 'No classes conducted yet';
                    } else if (state.stateKey === 'SAFE') {
                        const uRatio = (userThresh || 85) / 100;
                        const safeMisses = uRatio > 0 && conducted > 0
                            ? Math.max(0, Math.floor((present - uRatio * conducted) / uRatio))
                            : 0;
                        roadmapAdvice = safeMisses > 0 
                            ? `Can safely miss ${safeMisses} ${safeMisses === 1 ? 'class' : 'classes'}`
                            : `Target reached`;
                    } else {
                        const uRatio = (userThresh || 85) / 100;
                        if (uRatio >= 1.0) {
                            roadmapAdvice = `Must attend all remaining classes`;
                        } else {
                            const needed = Math.max(1, Math.ceil((uRatio * conducted - present) / (1 - uRatio)));
                            roadmapAdvice = `Attend next ${needed} ${needed === 1 ? 'class' : 'classes'} to reach ${userThresh}%`;
                        }
                    }

                    return (
                        <div
                            key={`mob_${subj.subjectId}_${subj.category}_${idx}`}
                            style={{
                                background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.07)',
                                borderLeft: `3px solid ${state.color}`,
                                borderRadius: '12px',
                                padding: '14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}
                        >
                            {/* Card Header: Subject Name & Details */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                                        {subj.name}
                                    </div>
                                    <span style={{ fontSize: '16px', fontWeight: 800, color: state.color }}>
                                        {pct !== null && pct !== undefined ? `${pct}%` : 'Not started'}
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                                    {subj.code && (
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: '#cbd5e1',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            padding: '1px 6px',
                                            borderRadius: '4px'
                                        }}>
                                            {subj.code}
                                        </span>
                                    )}
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                        {credits} Cr · {classesPerWeek}/wk{labSessions > 0 ? ` · ${labSessions} Lab` : ''}
                                    </span>
                                </div>
                            </div>

                            {/* Point of No Return Alert */}
                            {isPointOfNoReturn && (
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: '#fca5a5',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
                                    <span>Point of No Return: Maximum reachable is {maxReachablePct}%</span>
                                </div>
                            )}

                            {/* Thresholds & Streak Strip */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '11px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#cbd5e1' }}>
                                    <Lock size={12} style={{ color: '#94a3b8' }} />
                                    <span>College: <strong>{collegeThresh}%</strong></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c4b5fd' }}>
                                    <Target size={12} style={{ color: '#a78bfa' }} />
                                    <span>Target: <strong>{userThresh}%</strong></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: streak > 0 ? '#fdba74' : '#94a3b8', fontWeight: 700 }}>
                                    <Flame size={12} fill={streak > 0 ? '#f97316' : 'none'} color={streak > 0 ? '#f97316' : '#94a3b8'} />
                                    <span>{streak}</span>
                                </div>
                            </div>

                            {/* Attendance Count & Roadmap */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                <span style={{ color: '#94a3b8' }}>
                                    {present} / {conducted} attended
                                </span>
                                <span style={{
                                    color: state.stateKey === 'SAFE' ? '#6ee7b7' : state.stateKey === 'ATTENTION' ? '#fcd34d' : '#fca5a5',
                                    fontWeight: 600
                                }}>
                                    {roadmapAdvice}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SubjectProgressList;
