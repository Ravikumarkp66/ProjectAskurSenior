import React from 'react';
import { Flame, Edit2 } from 'lucide-react';

const SubjectProgressRow = ({
    subject,
    attendancePercentage,
    classesAttended,
    classesTaken,
    currentStreak,
    statusColor,
    onEditClick
}) => {
    // Determine CSS colors based on statusColor prop
    const getColors = () => {
        if (statusColor === 'Red') {
            return {
                primary: '#ef4444',
                barBg: 'rgba(239, 68, 68, 0.1)',
                textMuted: 'rgba(239, 68, 68, 0.7)'
            };
        } else if (statusColor === 'Yellow') {
            return {
                primary: '#fbbf24',
                barBg: 'rgba(251, 191, 36, 0.1)',
                textMuted: 'rgba(251, 191, 36, 0.7)'
            };
        } else {
            return {
                primary: '#10b981',
                barBg: 'rgba(16, 185, 129, 0.08)',
                textMuted: 'rgba(16, 185, 129, 0.7)'
            };
        }
    };

    const colors = getColors();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '16px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Top row: Info & controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%'
            }}>
                {/* Left: Name and Code */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff' }}>
                        {subject.name}
                    </span>
                    <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.4)', background: 'rgba(255,255,255,0.02)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        {subject.code || 'N/A'}
                    </span>
                </div>

                {/* Right: Streak, Numbers, Percentage, Edit */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    {/* Numbers: Attended / Taken (Percentage) */}
                    <span style={{ fontSize: '13px', color: 'rgba(148, 163, 184, 0.8)', fontWeight: 500 }}>
                        {classesAttended}/{classesTaken}{' '}
                        <span style={{ color: colors.primary, fontWeight: 700, marginLeft: '4px' }}>
                            ({attendancePercentage}%)
                        </span>
                    </span>

                    {/* Streak (Flame Badge) */}
                    {currentStreak > 0 && (
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
                            <span>{currentStreak}</span>
                        </div>
                    )}

                    {/* Edit Trigger */}
                    <button
                        type="button"
                        onClick={onEditClick}
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

            {/* Bottom row: Progress bar */}
            <div style={{
                height: '5px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '2.5px',
                width: '100%',
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${Math.min(attendancePercentage, 100)}%`,
                    background: colors.primary,
                    borderRadius: '2.5px',
                    transition: 'width 0.3s ease-out'
                }} />
            </div>
        </div>
    );
};

export default SubjectProgressRow;
