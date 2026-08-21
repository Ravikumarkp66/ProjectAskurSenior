import React from 'react';
import { Flame, CheckCircle, HelpCircle, Calendar, Sparkles, AlertTriangle } from 'lucide-react';

const AttendanceSummaryCard = ({ overall }) => {
    if (!overall) return null;

    const { 
        attendance = 100, 
        expected = 0, 
        conducted = 0, 
        present = 0, 
        streak = { current: 0, longest: 0 },
        canMiss = 0,
        needToAttend = 0
    } = overall;

    const getAttendanceColor = (val) => {
        if (val < 85) return '#ef4444'; // Red
        if (val < 90) return '#fbbf24'; // Yellow
        return '#10b981'; // Green
    };

    const attendanceColor = getAttendanceColor(attendance);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Grid of stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                width: '100%',
                boxSizing: 'border-box'
            }} className="attendance-summary-grid">
                
                {/* Overall Streak */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(26, 21, 44, 0.45) 0%, rgba(13, 11, 23, 0.45) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    textAlign: 'left'
                }}>
                    <div style={{
                        background: 'rgba(249, 115, 22, 0.08)',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(249, 115, 22, 0.15)'
                    }}>
                        <Flame size={20} fill="#f97316" style={{ color: '#f97316' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Current Streak</span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#fdba74' }}>
                            🔥 {streak?.current || 0}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AttendanceSummaryCard;
