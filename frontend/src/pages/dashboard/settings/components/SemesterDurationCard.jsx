import React from 'react';
import { Calendar } from 'lucide-react';

const SemesterDurationCard = ({ startDate, lastWorkingDate, onChange }) => {
    // Format Date object to YYYY-MM-DD for input element
    const formatDateForInput = (dateVal) => {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().split('T')[0];
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxSizing: 'border-box'
        }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} style={{ color: '#a78bfa' }} />
                Semester Duration
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
            }} className="duration-grid">
                
                {/* Semester Start Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                        Semester Start Date *
                    </label>
                    <input
                        type="date"
                        required
                        value={formatDateForInput(startDate)}
                        onChange={(e) => onChange('semesterStartDate', e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.02)',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Last Working Day */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.7)', fontWeight: 500 }}>
                        Last Working Day *
                    </label>
                    <input
                        type="date"
                        required
                        value={formatDateForInput(lastWorkingDate)}
                        onChange={(e) => onChange('lastWorkingDate', e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.02)',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 576px) {
                    .duration-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}} />
        </div>
    );
};

export default SemesterDurationCard;
