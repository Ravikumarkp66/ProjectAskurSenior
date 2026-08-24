import React, { useState } from 'react';
import { 
    Check, X, PauseCircle, Edit2, Clock, Calendar, 
    BookOpen, Sparkles, AlertCircle, ChevronDown, ChevronUp, Sliders, ArrowRightLeft,
    CheckCheck, AlertTriangle, Info, Zap, RotateCcw
} from 'lucide-react';

const DailyAttendanceWorkspace = ({
    selectedDate,
    dayClasses = [],
    isLoading,
    onMarkAttendance,
    onMarkAllPresent,
    onResetDayAttendance,
    unconfirmedPastCount = 0,
    onQuickMarkPast,
    readOnly,
    overallMetrics,
    progressList = [],
    onEditSubjectHistory,
    onOpenBaselineModal,
    onOpenSwapModal
}) => {
    // Local state for editing previously marked cards
    const [editingSlotId, setEditingSlotId] = useState(null);

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

    const normStatus = (s) => (s ? String(s).trim().toUpperCase() : '');
    const isPresentStatus = (s) => ['PRESENT', 'ON DUTY', 'ON_DUTY'].includes(normStatus(s));
    const isAbsentStatus = (s) => ['ABSENT', 'MEDICAL LEAVE', 'MEDICAL_LEAVE'].includes(normStatus(s));
    const isSuspendedStatus = (s) => ['SUSPENDED', 'CANCELLED'].includes(normStatus(s));
    const isMarkedStatus = (s) => {
        const sn = normStatus(s);
        return sn !== '' && sn !== 'YET TO BE TAKEN' && sn !== 'NOT_MARKED' && sn !== 'PENDING' && sn !== 'NULL' && sn !== 'UNDEFINED';
    };

    const unrecordedCount = dayClasses.filter(c => !isMarkedStatus(c.status)).length;
    const markedCount = dayClasses.filter(c => isMarkedStatus(c.status)).length;

    // Helper to calculate "Can I Bunk Today?"
    const getBunkPrediction = (item) => {
        const subj = progressList.find(s => 
            String(s.subjectId) === String(item.subjectId) || 
            s.name?.toLowerCase() === item.subjectName?.toLowerCase()
        );

        const present = subj?.analytics?.present ?? 0;
        const conducted = subj?.analytics?.conducted ?? 0;
        const cThresh = subj?.collegeThreshold || overallMetrics?.collegeThreshold || 85;
        const uThresh = subj?.userThreshold || overallMetrics?.userThreshold || cThresh;

        // If this class were to be missed (bunked):
        const pctIfBunk = conducted > 0 || present > 0
            ? ((present) / (conducted + 1)) * 100
            : 0;

        if (pctIfBunk >= uThresh) {
            return {
                status: 'SAFE',
                badgeText: '🟢 Safe to bunk',
                detailText: `Will be ${pctIfBunk.toFixed(1)}% (≥ ${uThresh}%)`,
                color: '#10b981',
                bg: 'rgba(16, 185, 129, 0.08)',
                border: 'rgba(16, 185, 129, 0.25)'
            };
        }

        if (pctIfBunk >= cThresh) {
            return {
                status: 'CAUTION',
                badgeText: '🟡 Caution',
                detailText: `Will drop to ${pctIfBunk.toFixed(1)}% (< ${uThresh}%)`,
                color: '#f59e0b',
                bg: 'rgba(245, 158, 11, 0.08)',
                border: 'rgba(245, 158, 11, 0.25)'
            };
        }

        return {
            status: 'CRITICAL',
            badgeText: '🔴 Cannot bunk',
            detailText: `Will drop to ${pctIfBunk.toFixed(1)}% (< ${cThresh}%)`,
            color: '#ef4444',
            bg: 'rgba(239, 68, 68, 0.08)',
            border: 'rgba(239, 68, 68, 0.25)'
        };
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            color: '#fff',
            width: '100%'
        }}>
            {/* ════════════════════════════════════════════════════════════════
                UNCONFIRMED PAST CLASSES ALERT BANNER
            ════════════════════════════════════════════════════════════════ */}
            {unconfirmedPastCount > 0 && !readOnly && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.06) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertCircle size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
                        <div style={{ fontSize: '13px', color: '#fef3c7', fontWeight: 500 }}>
                            You have <strong style={{ color: '#f59e0b' }}>{unconfirmedPastCount} unconfirmed {unconfirmedPastCount === 1 ? 'class' : 'classes'}</strong> from past days.
                        </div>
                    </div>

                    {onQuickMarkPast && (
                        <button
                            type="button"
                            onClick={onQuickMarkPast}
                            style={{
                                background: 'rgba(245, 158, 11, 0.2)',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                color: '#fef08a',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.2)'; }}
                        >
                            <CheckCheck size={13} />
                            Quick-Confirm All as Present
                        </button>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                SELECTED DATE HEADER & BATCH ACTIONS
            ════════════════════════════════════════════════════════════════ */}
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        background: 'rgba(124, 58, 237, 0.1)',
                        border: '1px solid rgba(124, 58, 237, 0.25)',
                        color: '#c4b5fd',
                        padding: '5px 12px',
                        borderRadius: '20px'
                    }}>
                        {dayClasses.length} {dayClasses.length === 1 ? 'class scheduled' : 'classes scheduled'}
                    </span>

                    {/* One-Tap Mark All Present Today */}
                    {onMarkAllPresent && !readOnly && !isFutureDate && unrecordedCount > 0 && (
                        <button
                            type="button"
                            onClick={onMarkAllPresent}
                            title="Mark all unrecorded classes for this date as Present"
                            style={{
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: '#6ee7b7',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; }}
                        >
                            <CheckCheck size={14} />
                            Mark All Present Today
                        </button>
                    )}

                    {/* Reset / Restore Today's Attendance */}
                    {onResetDayAttendance && !readOnly && markedCount > 0 && (
                        <button
                            type="button"
                            onClick={onResetDayAttendance}
                            title="Reset all recorded attendance for this date back to original unmarked state"
                            style={{
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#cbd5e1',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
                        >
                            <RotateCcw size={13} />
                            Reset Day
                        </button>
                    )}

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

            {/* ════════════════════════════════════════════════════════════════
                CLASS CARDS SECTION WITH "CAN I BUNK TODAY?" SIMULATOR
            ════════════════════════════════════════════════════════════════ */}
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

                        // Bunk prediction calculation
                        const bunk = getBunkPrediction(item);

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
                                    <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                                            {item.subjectName}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

                                        {/* "Can I Bunk Today?" Live Simulator Chip */}
                                        {!isMarked && !isNonMarkableFuture && (
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                background: bunk.bg,
                                                border: `1px solid ${bunk.border}`,
                                                borderRadius: '6px',
                                                padding: '2px 8px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: bunk.color,
                                                marginTop: '3px',
                                                width: 'fit-content'
                                            }} title="Real-time safe bunk status for this class">
                                                <span>{bunk.badgeText}</span>
                                                <span style={{ opacity: 0.6 }}>·</span>
                                                <span style={{ fontWeight: 500 }}>{bunk.detailText}</span>
                                            </div>
                                        )}

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
                                                marginTop: '2px',
                                                width: 'fit-content'
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
                                            {(() => {
                                                const sNorm = normStatus(item.status);
                                                const isPres = isPresentStatus(sNorm);
                                                const isAbs = isAbsentStatus(sNorm);
                                                const isSusp = isSuspendedStatus(sNorm);

                                                return (
                                                    <div style={{
                                                        background: isPres
                                                            ? 'rgba(16, 185, 129, 0.1)'
                                                            : (isAbs ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                                                        border: isPres
                                                            ? '1px solid rgba(16, 185, 129, 0.3)'
                                                            : (isAbs ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'),
                                                        color: isPres
                                                            ? '#6ee7b7'
                                                            : (isAbs ? '#fca5a5' : '#fcd34d'),
                                                        borderRadius: '10px',
                                                        padding: '8px 14px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'flex-start',
                                                        gap: '2px'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.03em' }}>
                                                            {isPres ? (
                                                                <Check size={14} />
                                                            ) : isAbs ? (
                                                                <X size={14} />
                                                            ) : (
                                                                <PauseCircle size={14} />
                                                            )}
                                                            <span>{isSusp ? '⊘ SUSPENDED' : (isPres ? 'PRESENT' : (isAbs ? 'ABSENT' : sNorm))}</span>
                                                        </div>
                                                        {isSusp && (
                                                            <span style={{ fontSize: '9px', fontWeight: 500, opacity: 0.8, color: '#fef08a' }}>
                                                                Not counted in attendance
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}

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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

                                            {/* Reset Slot Option (when editing previously recorded slot) */}
                                            {isEditingThis && isMarked && (
                                                <button
                                                    type="button"
                                                    onClick={() => { onMarkAttendance(item, 'RESET'); setEditingSlotId(null); }}
                                                    title="Clear attendance for this class back to unmarked"
                                                    style={{
                                                        background: 'rgba(255, 255, 255, 0.04)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        color: '#94a3b8',
                                                        borderRadius: '10px',
                                                        padding: '9px 12px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        transition: 'all 0.15s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.color = '#fca5a5'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; }}
                                                >
                                                    <RotateCcw size={12} />
                                                    Reset
                                                </button>
                                            )}

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
