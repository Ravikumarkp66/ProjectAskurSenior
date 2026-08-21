import React from 'react';
import { Flame, Edit2 } from 'lucide-react';

const SubjectProgressList = ({ subjects = [], onEditClick }) => {
    
    // Get colors based on percentage
    const getProgressColor = (pct) => {
        if (pct < 85) return '#ef4444'; // Red
        if (pct < 90) return '#fbbf24'; // Yellow
        return '#10b981'; // Green
    };

    if (subjects.length === 0) return null;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#13111A',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '8px 24px 16px 24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            boxSizing: 'border-box',
            width: '100%'
        }}>
            {subjects.map(subj => {
                const pct = subj.attendancePercentage ?? 100;
                const primaryColor = getProgressColor(pct);
                const conducted = subj.analytics?.conducted ?? 0;
                const present = subj.analytics?.present ?? 0;
                const expected = subj.analytics?.expected ?? 0;
                const streak = subj.analytics?.streak?.current ?? 0;

                return (
                    <div 
                        key={`${subj.subjectId}_${subj.category}`} 
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            padding: '16px 0',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                    >
                        {/* Info & controls row */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%'
                        }}>
                            {/* Left: Subject name and code */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                                <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff' }}>
                                    {subj.name}
                                </span>
                                <span style={{ 
                                    fontSize: '11px', 
                                    color: 'rgba(148, 163, 184, 0.4)', 
                                    background: 'rgba(255,255,255,0.02)', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px', 
                                    border: '1px solid rgba(255,255,255,0.04)' 
                                }}>
                                    {subj.code || 'N/A'}
                                </span>
                                <span style={{
                                    fontSize: '10px',
                                    color: 'rgba(148, 163, 184, 0.4)',
                                    background: 'rgba(124, 58, 237, 0.08)',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(124, 58, 237, 0.15)'
                                }}>
                                    {subj.category}
                                </span>
                            </div>

                            {/* Right: Numbers, streaks, percent, edit */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                {/* Present / Conducted / Expected */}
                                <span style={{ fontSize: '13px', color: 'rgba(148, 163, 184, 0.8)', fontWeight: 500 }}>
                                    {present} / {conducted} / {expected}
                                </span>

                                {/* Attendance Percentage */}
                                <span style={{ fontSize: '14.5px', fontWeight: 800, color: primaryColor, width: '48px', textAlign: 'right' }}>
                                    {pct}%
                                </span>

                                {/* Streak flame badge */}
                                {streak > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'rgba(249, 115, 22, 0.06)',
                                        border: '1px solid rgba(249, 115, 22, 0.15)',
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        color: '#fdba74',
                                        fontWeight: 700,
                                        fontSize: '11.5px'
                                    }}>
                                        <Flame size={12} fill="#f97316" style={{ color: '#f97316' }} />
                                        <span>{streak}</span>
                                    </div>
                                )}

                                {/* Edit Button */}
                                <button
                                    type="button"
                                    onClick={() => onEditClick(subj)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'rgba(167, 139, 250, 0.85)',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        outline: 'none',
                                        transition: 'color 0.15s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#c4b5fd'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(167, 139, 250, 0.85)'; }}
                                >
                                    <Edit2 size={12} />
                                    Edit
                                </button>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div style={{
                            height: '5px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '2.5px',
                            width: '100%',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(pct, 100)}%`,
                                background: primaryColor,
                                borderRadius: '2.5px',
                                transition: 'width 0.3s ease-out'
                            }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SubjectProgressList;
