import React from 'react';
import { BookOpen, CheckCircle, Clock, Award } from 'lucide-react';

const AcademicSummaryCard = ({ currentSemester, recordedCount, currentCgpa }) => {
    const totalSemesters = 8;
    const remainingCount = Math.max(0, totalSemesters - recordedCount);

    const stats = [
        {
            label: 'Current Semester',
            value: `Semester ${currentSemester}`,
            icon: BookOpen,
            color: '#a78bfa'
        },
        {
            label: 'Recorded Semesters',
            value: `${recordedCount} / ${totalSemesters}`,
            icon: CheckCircle,
            color: '#34d399'
        },
        {
            label: 'Remaining Semesters',
            value: `${remainingCount} / ${totalSemesters}`,
            icon: Clock,
            color: '#fb7185'
        },
        {
            label: 'Current CGPA',
            value: currentCgpa !== null && currentCgpa !== undefined ? currentCgpa.toFixed(2) : 'N/A',
            icon: Award,
            color: '#fbbf24'
        }
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
                Academic Summary
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px'
            }} className="summary-grid">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
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
                                minWidth: 0
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                background: `${stat.color}15`,
                                color: stat.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Icon size={16} />
                            </div>
                            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {stat.label}
                                </span>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                                    {stat.value}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 992px) {
                    .summary-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 576px) {
                    .summary-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}} />
        </div>
    );
};

export default AcademicSummaryCard;
