import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';

const SgpaSubjectSelector = ({
    subjects = [],
    selectedIndex = 0,
    onSelectSubject
}) => {
    if (subjects.length === 0) return null;

    const currentSub = subjects[selectedIndex] || subjects[0];

    const getGradeBadge = (grade, status) => {
        if (status === 'PENDING' || grade === 'PENDING') {
            return {
                text: 'Pending',
                bg: 'rgba(245, 158, 11, 0.12)',
                color: '#f59e0b',
                border: 'rgba(245, 158, 11, 0.25)',
                icon: Clock
            };
        }
        if (grade === 'NE' || status === 'NE') {
            return {
                text: 'NE',
                bg: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: 'rgba(239, 68, 68, 0.3)',
                icon: AlertCircle
            };
        }
        if (grade === 'F' || status === 'FAILED') {
            return {
                text: 'F',
                bg: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: 'rgba(239, 68, 68, 0.3)',
                icon: XCircle
            };
        }
        return {
            text: grade,
            bg: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: 'rgba(16, 185, 129, 0.3)',
            icon: CheckCircle2
        };
    };

    return (
        <div>
            {/* Desktop Vertical Subject List */}
            <div className="hidden md:flex flex-col gap-2 w-72 flex-shrink-0">
                <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#64748b',
                    paddingLeft: 4,
                    marginBottom: 4
                }}>
                    Registered Subjects ({subjects.length})
                </div>

                {subjects.map((sub, idx) => {
                    const isSelected = idx === selectedIndex;
                    const badge = getGradeBadge(sub.grade, sub.status);
                    const BadgeIcon = badge.icon;

                    return (
                        <button
                            key={sub.registeredSubjectId || idx}
                            onClick={() => onSelectSubject(idx)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                padding: '12px 14px',
                                borderRadius: 12,
                                background: isSelected
                                    ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(79, 70, 229, 0.15))'
                                    : 'rgba(15, 23, 42, 0.6)',
                                border: isSelected
                                    ? '1.5px solid rgba(139, 92, 246, 0.5)'
                                    : '1px solid rgba(148, 163, 184, 0.12)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                boxShadow: isSelected ? '0 4px 16px rgba(124, 58, 237, 0.18)' : 'none'
                            }}
                        >
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <div style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: isSelected ? '#f8fafc' : '#cbd5e1',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {sub.subjectName}
                                </div>
                                <div style={{
                                    fontSize: 11,
                                    color: '#64748b',
                                    margin: '2px 0 0',
                                    fontWeight: 500
                                }}>
                                    {sub.subjectCode} • {sub.credits} Credits
                                </div>
                            </div>

                            {/* Grade Badge */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 8px',
                                borderRadius: 8,
                                background: badge.bg,
                                border: `1px solid ${badge.border}`,
                                color: badge.color,
                                fontSize: 11,
                                fontWeight: 700,
                                flexShrink: 0
                            }}>
                                <BadgeIcon size={12} />
                                <span>{badge.text}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Mobile Header Navigator (‹ Mathematics 1 / 6 ›) */}
            <div className="flex md:hidden items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-purple-500/20 mb-4">
                <button
                    onClick={() => onSelectSubject(Math.max(0, selectedIndex - 1))}
                    disabled={selectedIndex === 0}
                    style={{
                        padding: 8,
                        borderRadius: 8,
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        color: selectedIndex === 0 ? '#475569' : '#e2e8f0',
                        cursor: selectedIndex === 0 ? 'default' : 'pointer'
                    }}
                >
                    <ChevronLeft size={18} />
                </button>

                <div style={{ textAlign: 'center', flex: 1, overflow: 'hidden' }}>
                    <div style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {currentSub.subjectName}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                        {currentSub.subjectCode} • {selectedIndex + 1} / {subjects.length}
                    </div>
                </div>

                <button
                    onClick={() => onSelectSubject(Math.min(subjects.length - 1, selectedIndex + 1))}
                    disabled={selectedIndex === subjects.length - 1}
                    style={{
                        padding: 8,
                        borderRadius: 8,
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        color: selectedIndex === subjects.length - 1 ? '#475569' : '#e2e8f0',
                        cursor: selectedIndex === subjects.length - 1 ? 'default' : 'pointer'
                    }}
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default SgpaSubjectSelector;
