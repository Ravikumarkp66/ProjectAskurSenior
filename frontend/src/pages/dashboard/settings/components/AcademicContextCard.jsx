import React from 'react';
import { Shield, BookOpen, GraduationCap, Calendar, Award } from 'lucide-react';

const AcademicContextCard = ({ user }) => {
    // Resolve study year
    const studyYearVal = user?.semester ? Math.ceil(user.semester / 2) : 1;
    let yearStr = '1st Year';
    if (studyYearVal === 2) yearStr = '2nd Year';
    else if (studyYearVal === 3) yearStr = '3rd Year';
    else if (studyYearVal === 4) yearStr = '4th Year';

    const infoItems = [
        { label: 'College', value: user?.collegeName || 'N/A', icon: GraduationCap },
        { label: 'Branch', value: user?.branch?.name || user?.branchName || 'N/A', icon: Shield },
        { label: 'Semester & Year', value: `Semester ${user?.semester || 1} (${yearStr})`, icon: BookOpen },
        { label: 'Scheme', value: user?.scheme?.name || user?.schemeName || '2022', icon: Award },
        { label: 'Academic Year', value: user?.admissionYear ? `${user.admissionYear}-${(parseInt(user.admissionYear, 10) + 1).toString().slice(-2)}` : 'N/A', icon: Calendar }
    ];

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
                Academic Context
            </h3>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
            }} className="academic-context-grid">
                {infoItems.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <div 
                            key={i}
                            style={{
                                background: 'rgba(255, 255, 255, 0.01)',
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                borderRadius: '8px',
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                minWidth: 0,
                                gridColumn: i === 0 ? 'span 3' : 'auto'
                            }}
                            className={`context-item-${i}`}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: 'rgba(167, 139, 250, 0.1)',
                                color: '#a78bfa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Icon size={16} />
                            </div>
                            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {item.label}
                                </span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.value}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 768px) {
                    .academic-context-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                    .context-item-0 {
                        grid-column: span 2 !important;
                    }
                }
                @media (max-width: 576px) {
                    .academic-context-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .context-item-0 {
                        grid-column: span 1 !important;
                    }
                }
            `}} />
        </div>
    );
};

export default AcademicContextCard;
