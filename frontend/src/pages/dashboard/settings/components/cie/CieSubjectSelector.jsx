import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Clock, Circle } from 'lucide-react';

const CieSubjectSelector = ({
    subjects = [],
    selectedIndex = 0,
    onSelectSubject
}) => {
    if (!subjects || subjects.length === 0) return null;

    const selectedSubject = subjects[selectedIndex] || subjects[0];
    const totalCount = subjects.length;

    const renderStatusBadge = (status) => {
        if (status === 'ELIGIBLE') {
            return (
                <span title="Eligible" style={{ display: 'inline-flex', alignItems: 'center', color: '#10b981' }}>
                    <CheckCircle2 size={15} />
                </span>
            );
        }
        if (status === 'NOT_ELIGIBLE') {
            return (
                <span title="Not Eligible" style={{ display: 'inline-flex', alignItems: 'center', color: '#ef4444' }}>
                    <AlertTriangle size={15} />
                </span>
            );
        }
        if (status === 'PARTIAL') {
            return (
                <span title="In Progress" style={{ display: 'inline-flex', alignItems: 'center', color: '#f59e0b' }}>
                    <Clock size={15} />
                </span>
            );
        }
        return (
            <span title="Not Started" style={{ display: 'inline-flex', alignItems: 'center', color: '#64748b' }}>
                <Circle size={15} />
            </span>
        );
    };

    const handlePrev = () => {
        if (selectedIndex > 0) {
            onSelectSubject(selectedIndex - 1);
        }
    };

    const handleNext = () => {
        if (selectedIndex < totalCount - 1) {
            onSelectSubject(selectedIndex + 1);
        }
    };

    return (
        <div>
            {/* Mobile View Navigator: Compact Header Selector */}
            <div className="block md:hidden" style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={handlePrev}
                        disabled={selectedIndex === 0}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: selectedIndex === 0 ? '#475569' : '#fff',
                            cursor: selectedIndex === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <select
                            value={selectedIndex}
                            onChange={(e) => onSelectSubject(Number(e.target.value))}
                            style={{
                                background: '#120f1d',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                color: '#fff',
                                fontSize: '13px',
                                fontWeight: 700,
                                outline: 'none',
                                maxWidth: '220px',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {subjects.map((sub, idx) => (
                                <option key={sub.registeredSubjectId} value={idx}>
                                    {sub.subjectName} ({idx + 1}/{totalCount})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={selectedIndex === totalCount - 1}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: selectedIndex === totalCount - 1 ? '#475569' : '#fff',
                            cursor: selectedIndex === totalCount - 1 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Desktop View Sidebar: Vertical Subject List */}
            <div className="hidden md:flex" style={{
                flexDirection: 'column',
                gap: '8px',
                width: '260px',
                flexShrink: 0
            }}>
                <div style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#64748b',
                    padding: '0 8px 4px 8px'
                }}>
                    Registered Subjects ({totalCount})
                </div>

                {subjects.map((sub, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                        <div
                            key={sub.registeredSubjectId}
                            onClick={() => onSelectSubject(idx)}
                            style={{
                                padding: '12px 14px',
                                borderRadius: '12px',
                                background: isSelected
                                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)'
                                    : 'rgba(255, 255, 255, 0.02)',
                                border: isSelected
                                    ? '1px solid rgba(124, 58, 237, 0.4)'
                                    : '1px solid rgba(255, 255, 255, 0.05)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px'
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: isSelected ? 700 : 600,
                                    color: isSelected ? '#f8fafc' : '#cbd5e1',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {sub.subjectName}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                                    <span>{sub.subjectCode}</span>
                                    <span>·</span>
                                    <span>{sub.credits} Credits</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {renderStatusBadge(sub.status)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CieSubjectSelector;
