import React from 'react';
import { Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SemesterProgressCard = ({ currentSemester, semestersList, onChange }) => {
    const navigate = useNavigate();
    const totalSemesters = 8;

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxSizing: 'border-box'
        }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                Semester Progress
            </h3>

            {/* Semester Rows Table Container - Horizontal scroll row on mobile */}
            <div className="semester-cards-container">
                {/* Header (hidden on mobile card row view) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '10px 16px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'rgba(148, 163, 184, 0.7)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }} className="semester-table-header hidden sm:grid">
                    <div>Semester</div>
                    <div>SGPA *</div>
                    <div>Credits</div>
                    <div>Status</div>
                </div>

                {/* Rows */}
                {Array.from({ length: totalSemesters }, (_, i) => {
                    const semNum = i + 1;
                    const record = semestersList.find(s => s.semester === semNum) || {
                        semester: semNum,
                        sgpa: '',
                        credits: 20
                    };
                    const isCurrent = semNum === currentSemester;

                    return (
                        <div 
                            key={semNum}
                            className="semester-card-item"
                        >
                            {/* Semester Label */}
                            <div className="sem-card-title">
                                Semester {semNum}
                            </div>

                            {/* SGPA Input */}
                            <div className="sem-card-input-box">
                                <span className="sm:hidden text-[10px] text-slate-400 font-bold uppercase block mb-1">SGPA</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    placeholder="0.00"
                                    value={record.sgpa ?? ''}
                                    onChange={(e) => onChange(semNum, 'sgpa', e.target.value)}
                                    style={{
                                        width: '70px',
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: 'rgba(255,255,255,0.01)',
                                        color: '#fff',
                                        fontSize: '12px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Credits Input */}
                            <div className="sem-card-input-box">
                                <span className="sm:hidden text-[10px] text-slate-400 font-bold uppercase block mb-1">Credits</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="20"
                                    value={record.credits ?? ''}
                                    onChange={(e) => onChange(semNum, 'credits', e.target.value)}
                                    style={{
                                        width: '60px',
                                        padding: '6px 8px',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: 'rgba(255,255,255,0.01)',
                                        color: '#fff',
                                        fontSize: '12px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Status label */}
                            <div style={{ fontSize: '12px' }}>
                                {isCurrent ? (
                                    <span style={{ 
                                        color: '#a78bfa', 
                                        fontWeight: 600,
                                        background: 'rgba(139,92,246,0.12)',
                                        padding: '2px 8px',
                                        borderRadius: '4px'
                                    }}>
                                        Current
                                    </span>
                                ) : record.sgpa ? (
                                    <span style={{ 
                                        color: '#34d399', 
                                        fontWeight: 500,
                                        background: 'rgba(52,211,153,0.1)',
                                        padding: '2px 8px',
                                        borderRadius: '4px'
                                    }}>
                                        Completed
                                    </span>
                                ) : (
                                    <span style={{ color: 'rgba(148, 163, 184, 0.45)' }}>
                                        Not filled
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Note about Credits */}
            <div style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.45)', paddingLeft: '4px' }}>
                * Credits are stored for credit-weighted CGPA calculation.
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .semester-cards-container {
                    display: flex;
                    flex-direction: column;
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 8px;
                    overflow: hidden;
                }
                .semester-card-item {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                    padding: 12px 16px;
                    align-items: center;
                }
                @media (max-width: 640px) {
                    .semester-cards-container {
                        flex-direction: row !important;
                        overflow-x: auto !important;
                        white-space: nowrap !important;
                        padding: 8px 4px !important;
                        gap: 12px !important;
                        border: none !important;
                        border-radius: 0 !important;
                        scroll-snap-type: x mandatory;
                    }
                    .semester-card-item {
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        min-w: 220px !important;
                        width: 220px !important;
                        flex-shrink: 0 !important;
                        background: rgba(255, 255, 255, 0.03) !important;
                        border: 1px solid rgba(255, 255, 255, 0.1) !important;
                        border-radius: 16px !important;
                        padding: 14px !important;
                        gap: 10px !important;
                        scroll-snap-align: center;
                    }
                    .sem-card-title {
                        font-weight: 700 !important;
                        font-size: 14px !important;
                        color: #c4b5fd !important;
                    }
                }
            `}} />
        </div>
    );
};

export default SemesterProgressCard;
