import React from 'react';

const CgpaPreviewCard = ({ calculatedCgpa }) => {
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
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                CGPA Preview
            </h3>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '8px 0'
            }}>
                
                {/* Calculated CGPA */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(99,102,241,0.03))',
                    border: '1px solid rgba(139,92,246,0.15)',
                    borderRadius: '8px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    width: '100%',
                    maxWidth: '280px',
                    boxShadow: '0 4px 20px rgba(124, 58, 237, 0.05)'
                }}>
                    <span style={{ fontSize: '11px', color: '#c4b5fd', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Current CGPA
                    </span>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: '#a78bfa' }}>
                        {calculatedCgpa !== null && calculatedCgpa !== undefined && calculatedCgpa > 0 
                            ? calculatedCgpa.toFixed(2) 
                            : '0.00'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CgpaPreviewCard;
