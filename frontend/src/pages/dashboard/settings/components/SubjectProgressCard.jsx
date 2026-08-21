import React from 'react';
import { Flame, Edit2, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

const SubjectProgressCard = ({ subject, onEditClick }) => {
    const {
        name,
        code,
        credits,
        category,
        attendancePercentage,
        attendedClasses,
        totalClasses,
        currentStreak,
        longestStreak,
        canMiss,
        needToAttend,
        status
    } = subject;

    // Get color theme based on status
    const getTheme = () => {
        if (status === 'Red') {
            return {
                primary: '#ef4444',
                bg: 'rgba(239, 68, 68, 0.05)',
                border: 'rgba(239, 68, 68, 0.15)',
                barBg: 'rgba(239, 68, 68, 0.1)'
            };
        } else if (status === 'Yellow') {
            return {
                primary: '#fbbf24',
                bg: 'rgba(251, 191, 36, 0.05)',
                border: 'rgba(251, 191, 36, 0.15)',
                barBg: 'rgba(251, 191, 36, 0.1)'
            };
        } else {
            return {
                primary: '#10b981',
                bg: 'rgba(16, 185, 129, 0.04)',
                border: 'rgba(16, 185, 129, 0.12)',
                barBg: 'rgba(16, 185, 129, 0.08)'
            };
        }
    };

    const theme = getTheme();

    return (
        <div style={{
            background: '#13111A',
            border: `1px solid ${theme.border}`,
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            boxSizing: 'border-box',
            width: '100%',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
        }}>
            {/* Top row: Subject Metadata */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#fff', margin: 0 }}>
                        {name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>
                        <span>{code}</span>
                        <span>•</span>
                        <span>{category}</span>
                        <span>•</span>
                        <span>{credits} Credits</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onEditClick}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: 'rgba(255,255,255,0.7)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)';
                        e.currentTarget.style.color = '#c4b5fd';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                    }}
                >
                    <Edit2 size={12} />
                    Edit
                </button>
            </div>

            {/* Metrics Info Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                    {attendedClasses} / {totalClasses} Classes
                </span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: theme.primary }}>
                    {attendancePercentage}%
                </span>
            </div>

            {/* Premium Progress Bar */}
            <div style={{
                height: '6px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '3px',
                width: '100%',
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${attendancePercentage}%`,
                    background: theme.primary,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease-out'
                }} />
            </div>

            {/* Bottom highlights (Streak + Can Miss / Need Attend info) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', paddingTop: '2px' }}>
                {/* Streak flame badge */}
                {currentStreak > 0 ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(249, 115, 22, 0.08)',
                        border: '1px solid rgba(249, 115, 22, 0.2)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        color: '#fdba74',
                        fontWeight: 700
                    }}>
                        <Flame size={12} fill="#f97316" style={{ color: '#f97316' }} />
                        <span>Streak: {currentStreak}</span>
                    </div>
                ) : (
                    <div style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.35)' }}>
                        No current streak
                    </div>
                )}

                {/* Can Miss / Need Attend badge */}
                {attendancePercentage >= 85 ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.15)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        color: '#a7f3d0',
                        fontWeight: 600
                    }}>
                        <CheckCircle size={11} style={{ color: '#10b981' }} />
                        <span>Can Miss: {canMiss} class{canMiss !== 1 && 'es'}</span>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        color: '#fca5a5',
                        fontWeight: 600
                    }}>
                        <ShieldAlert size={11} style={{ color: '#ef4444' }} />
                        <span>Need Attend: {needToAttend} session{needToAttend !== 1 && 's'}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectProgressCard;
