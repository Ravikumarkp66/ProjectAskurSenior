import React, { useState } from 'react';
import { 
    Check, X, PauseCircle, Edit2, Clock, Calendar, 
    BookOpen, Sparkles, AlertCircle, ChevronDown, ChevronUp, Sliders, ArrowRightLeft
} from 'lucide-react';
import SubjectProgressList from '../SubjectProgressList';
import AttendanceSummaryCard from '../AttendanceSummaryCard';

const DailyAttendanceWorkspace = ({
    selectedDate,
    dayClasses = [],
    isLoading,
    onMarkAttendance,
    readOnly,
    overallMetrics,
    progressList,
    onEditSubjectHistory,
    onOpenBaselineModal,
    onOpenSwapModal
}) => {
    // Local state for editing previously marked cards
    const [editingSlotId, setEditingSlotId] = useState(null);
    const [isHistoricalSectionOpen, setIsHistoricalSectionOpen] = useState(true);

    const formatDateHeading = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const isPastDate = selectedDate < todayStr;
    const isTodayDate = selectedDate === todayStr;
    const isFutureDate = selectedDate > todayStr;

    // Header Status Message
    let statusBannerText = 'Scheduled classes for selected date.';
    let statusBannerColor = '#94a3b8';

    if (isPastDate) {
        statusBannerText = 'Past attendance · You can edit recorded classes.';
        statusBannerColor = '#c4b5fd';
    } else if (isTodayDate) {
        statusBannerText = 'Today · Mark classes as they occur.';
        statusBannerColor = '#6ee7b7';
    } else if (isFutureDate) {
        statusBannerText = 'Upcoming schedule · Attendance cannot be marked yet.';
        statusBannerColor = '#38bdf8';
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            color: '#fff',
            width: '100%'
        }}>
            {/* Selected Date Header & Banner */}
            <div style={{
                background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}>
                <div>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 700,
                        margin: 0,
                        letterSpacing: '-0.02em',
                        color: '#f8fafc'
                    }}>
                        {formatDateHeading(selectedDate)}
                    </h2>
                    <div style={{
                        fontSize: '12px',
                        color: statusBannerColor,
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span>{statusBannerText}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        background: 'rgba(124, 58, 237, 0.1)',
                        border: '1px solid rgba(124, 58, 237, 0.25)',
                        color: '#c4b5fd',
                        padding: '4px 12px',
                        borderRadius: '20px'
                    }}>
                        {dayClasses.length} {dayClasses.length === 1 ? 'class scheduled' : 'classes scheduled'}
                    </span>

                    {/* Mid-semester baseline setup shortcut button */}
                    {onOpenBaselineModal && !readOnly && (
                        <button
                            type="button"
                            onClick={onOpenBaselineModal}
                            title="Configure aggregate attendance prior to using AskUrSenior"
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#94a3b8',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                            <Sliders size={12} />
                            Edit Baseline
                        </button>
                    )}
                </div>
            </div>

            {/* Class Cards Section */}
            {isLoading ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    Loading schedule for {selectedDate}...
                </div>
            ) : dayClasses.length === 0 ? (
                <div style={{
                    padding: '60px 24px',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px dashed rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: '#94a3b8',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <BookOpen size={32} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>No classes scheduled for this date.</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                        Enjoy your day off or review your overall attendance summary below.
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dayClasses.map((item, idx) => {
                        const slotId = item._id || `${item.subjectId}_${item.timeSlot}`;
                        const isMarked = item.status && item.status !== 'Yet To Be Taken' && item.status !== 'NOT_MARKED';
                        const isEditingThis = editingSlotId === slotId;
                        const isNonMarkableFuture = isFutureDate || item.isFuture;
                        const isSwapped = item.isSubjectChanged || (item.scheduledSubjectName && item.scheduledSubjectName !== item.subjectName);

                        return (
                            <div
                                key={slotId || idx}
                                style={{
                                    background: 'linear-gradient(145deg, #13111C 0%, #0F0D16 100%)',
                                    border: isSwapped 
                                        ? '1px solid rgba(168, 85, 247, 0.3)' 
                                        : (item.status === 'Suspended'
                                            ? '1px solid rgba(245, 158, 11, 0.25)'
                                            : '1px solid rgba(255, 255, 255, 0.07)'),
                                    borderRadius: '14px',
                                    padding: '16px 20px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '16px',
                                    flexWrap: 'wrap',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {/* Time & Main Content */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '240px' }}>
                                    {/* Prominent Time Display */}
                                    <div style={{
                                        minWidth: '100px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start'
                                    }}>
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: 700,
                                            color: '#f8fafc',
                                            letterSpacing: '-0.01em',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <Clock size={13} style={{ color: '#a78bfa' }} />
                                            {item.timeSlot}
                                        </div>
                                        {item.room && (
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                                {item.room}
                                            </div>
                                        )}
                                    </div>

                                    {/* Subject Title & Details */}
                                    <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '16px' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                                            {item.subjectName}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            {item.subjectCode && (
                                                <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{item.subjectCode}</span>
                                            )}
                                            <span>•</span>
                                            <span>{item.lectureType || 'Theory'}</span>
                                            {item.credits > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span>{item.credits} {item.credits === 1 ? 'Credit' : 'Credits'}</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Subject Swapped / Changed Badge */}
                                        {isSwapped && (
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                background: 'rgba(168, 85, 247, 0.12)',
                                                border: '1px solid rgba(168, 85, 247, 0.3)',
                                                color: '#c084fc',
                                                borderRadius: '6px',
                                                padding: '2px 8px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                marginTop: '6px'
                                            }}>
                                                <ArrowRightLeft size={11} />
                                                Changed from {item.scheduledSubjectName}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Attendance Actions / Status Display */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {isNonMarkableFuture ? (
                                        <div style={{
                                            background: 'rgba(56, 189, 248, 0.06)',
                                            border: '1px solid rgba(56, 189, 248, 0.2)',
                                            borderRadius: '10px',
                                            padding: '8px 14px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end',
                                            gap: '2px'
                                        }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em' }}>
                                                UPCOMING
                                            </span>
                                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                                Starts at {item.timeSlot ? item.timeSlot.split('-')[0] : 'scheduled time'}
                                            </span>
                                        </div>
                                    ) : isMarked && !isEditingThis ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                background: item.status === 'Present' || item.status === 'On Duty'
                                                    ? 'rgba(16, 185, 129, 0.1)'
                                                    : (item.status === 'Absent' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                                                border: item.status === 'Present' || item.status === 'On Duty'
                                                    ? '1px solid rgba(16, 185, 129, 0.3)'
                                                    : (item.status === 'Absent' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'),
                                                color: item.status === 'Present' || item.status === 'On Duty'
                                                    ? '#6ee7b7'
                                                    : (item.status === 'Absent' ? '#fca5a5' : '#fcd34d'),
                                                borderRadius: '10px',
                                                padding: '8px 14px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                gap: '2px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.03em' }}>
                                                    {item.status === 'Present' || item.status === 'On Duty' ? (
                                                        <Check size={14} />
                                                    ) : item.status === 'Absent' ? (
                                                        <X size={14} />
                                                    ) : (
                                                        <PauseCircle size={14} />
                                                    )}
                                                    <span>{item.status === 'Suspended' ? '⊘ SUSPENDED' : item.status.toUpperCase()}</span>
                                                </div>
                                                {item.status === 'Suspended' && (
                                                    <span style={{ fontSize: '9px', fontWeight: 500, opacity: 0.8, color: '#fef08a' }}>
                                                        Not counted in attendance
                                                    </span>
                                                )}
                                            </div>

                                            {!readOnly && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingSlotId(slotId)}
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.04)',
                                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                                            color: '#94a3b8',
                                                            borderRadius: '8px',
                                                            padding: '8px 12px',
                                                            fontSize: '12px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            transition: 'all 0.15s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                                    >
                                                        <Edit2 size={12} />
                                                        Edit
                                                    </button>

                                                    {onOpenSwapModal && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onOpenSwapModal(item)}
                                                            title="Change subject for this class occurrence"
                                                            style={{
                                                                background: 'rgba(168, 85, 247, 0.08)',
                                                                border: '1px solid rgba(168, 85, 247, 0.2)',
                                                                color: '#c084fc',
                                                                borderRadius: '8px',
                                                                padding: '8px 10px',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                transition: 'all 0.15s'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.18)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)'; }}
                                                        >
                                                            <ArrowRightLeft size={12} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                type="button"
                                                onClick={() => { onMarkAttendance(item, 'Present'); setEditingSlotId(null); }}
                                                style={{
                                                    background: 'rgba(16, 185, 129, 0.08)',
                                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                                    color: '#6ee7b7',
                                                    borderRadius: '10px',
                                                    padding: '9px 14px',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.15s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'; }}
                                            >
                                                <Check size={14} />
                                                Present
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { onMarkAttendance(item, 'Absent'); setEditingSlotId(null); }}
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.08)',
                                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                                    color: '#fca5a5',
                                                    borderRadius: '10px',
                                                    padding: '9px 14px',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.15s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                                            >
                                                <X size={14} />
                                                Absent
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { onMarkAttendance(item, 'Suspended'); setEditingSlotId(null); }}
                                                style={{
                                                    background: 'rgba(245, 158, 11, 0.08)',
                                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                                    color: '#fcd34d',
                                                    borderRadius: '10px',
                                                    padding: '9px 14px',
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.15s'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)'; }}
                                            >
                                                <PauseCircle size={14} />
                                                Suspended
                                            </button>

                                            {onOpenSwapModal && !readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenSwapModal(item)}
                                                    title="Change subject for this class occurrence"
                                                    style={{
                                                        background: 'rgba(168, 85, 247, 0.08)',
                                                        border: '1px solid rgba(168, 85, 247, 0.2)',
                                                        color: '#c084fc',
                                                        borderRadius: '10px',
                                                        padding: '9px 10px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.18)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.08)'; }}
                                                >
                                                    <ArrowRightLeft size={13} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DailyAttendanceWorkspace;
