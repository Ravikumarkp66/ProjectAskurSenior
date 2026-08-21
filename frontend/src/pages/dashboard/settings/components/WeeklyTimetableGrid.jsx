import React, { useMemo } from 'react';
import { 
    CalendarRange, 
    ArrowRight, 
    Info, 
    Coffee, 
    Utensils, 
    CalendarOff, 
    BookOpen, 
    FlaskConical, 
    GraduationCap, 
    Presentation 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WeeklyTimetableGrid = ({ slots, config, subjects, onCellClick, user, registeredSubjects = [] }) => {
    const navigate = useNavigate();

    const daysMap = {
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday',
        7: 'Sunday'
    };

    // Format minutes from midnight to 12-hour format: 480 -> 08:00 AM
    const formatTime = (mins) => {
        if (mins === undefined || mins === null) return '';
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    // Calculate live progress for each registered subject
    const planningProgress = useMemo(() => {
        return registeredSubjects.map(reg => {
            const subjId = reg.subject?._id?.toString() || reg.subject?.toString();
            const customName = reg.customName || reg.subject?.name || 'Unknown';
            const customCode = reg.customCode || reg.subject?.code || '';
            
            // Count Theory slots assigned to this subject
            const theorySlotsCount = slots.filter(s => {
                const slotSubjId = s.subject?._id?.toString() || s.subject?.toString();
                return slotSubjId === subjId && s.lectureType !== 'Lab' && s.lectureType !== 'Break';
            }).length;

            // Count Lab slots assigned to this subject
            const labSlotsCount = slots.filter(s => {
                const slotSubjId = s.subject?._id?.toString() || s.subject?.toString();
                return slotSubjId === subjId && s.lectureType === 'Lab';
            }).length;

            const labSessionsCount = Math.floor(labSlotsCount / 2);

            return {
                _id: reg._id,
                name: customName,
                code: customCode,
                category: reg.category,
                theoryRequired: reg.weeklyPlan?.theory?.required ?? 0,
                theoryAssigned: theorySlotsCount,
                labRequired: reg.weeklyPlan?.lab?.required ?? 0,
                labAssigned: labSessionsCount
            };
        });
    }, [registeredSubjects, slots]);

    // Filter out subjects that are fully complete
    const incompleteProgress = useMemo(() => {
        return planningProgress.filter(prog => {
            const hasTheory = prog.theoryRequired > 0;
            const hasLab = prog.labRequired > 0;
            
            const isTheoryComplete = !hasTheory || prog.theoryAssigned >= prog.theoryRequired;
            const isLabComplete = !hasLab || prog.labAssigned >= prog.labRequired;
            
            return !(isTheoryComplete && isLabComplete);
        });
    }, [planningProgress]);

    // Day number to string key map for safe lookup
    const dayNumToKey = useMemo(() => ({
        1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 7: 'sun'
    }), []);

    const getDayStatus = (workingDaysMap, day) => {
        if (!workingDaysMap) return day <= 5 ? 'Full Day' : day === 6 ? 'Half Day' : 'Holiday';
        return workingDaysMap[day.toString()] || 
               workingDaysMap[day] || 
               workingDaysMap[dayNumToKey[day]] || 
               (day <= 5 ? 'Full Day' : day === 6 ? 'Half Day' : 'Holiday');
    };

    // 1. Resolve unique time intervals across all slots AND config breaks
    const uniqueIntervals = useMemo(() => {
        const list = [];
        const configBreaks = (config?.breaks || []).map(b => ({
            startMinute: Number(b.startMinute),
            endMinute: Number(b.startMinute) + Number(b.duration || 15),
            lectureType: 'Break',
            breakName: b.name
        }));

        if (slots && slots.length > 0) {
            slots.forEach(s => {
                const sStart = Number(s.startMinute);
                const sEnd = Number(s.endMinute);
                const isBreak = s.lectureType === 'Break' || configBreaks.some(b => b.startMinute === sStart && b.endMinute === sEnd);
                
                const exists = list.some(u => u.startMinute === sStart && u.endMinute === sEnd);
                if (!exists) {
                    list.push({
                        startMinute: sStart,
                        endMinute: sEnd,
                        lectureType: isBreak ? 'Break' : (s.lectureType || 'Lecture'),
                        breakName: s.breakName || s.room
                    });
                }
            });

            // Ensure all config breaks are present in uniqueIntervals
            configBreaks.forEach(b => {
                const exists = list.some(u => u.startMinute === b.startMinute && u.endMinute === b.endMinute);
                if (!exists) {
                    list.push(b);
                }
            });

            list.sort((a, b) => a.startMinute - b.startMinute);
            if (list.length > 0) return list;
        }

        // Fallback: Generate time intervals from config
        const start = Number(config.collegeStartMinute ?? 480);
        const end = Number(config.collegeEndMinute ?? 1020);
        const duration = Number(config.classDuration ?? 50);
        const breaks = (config.breaks || []).map(b => ({
            startMinute: Number(b.startMinute),
            duration: Number(b.duration || 15),
            name: b.name
        }));

        let current = start;
        while (current < end) {
            const breakItem = breaks.find(b => b.startMinute === current);
            if (breakItem) {
                const bEnd = Math.min(current + breakItem.duration, end);
                list.push({
                    startMinute: current,
                    endMinute: bEnd,
                    lectureType: 'Break',
                    breakName: breakItem.name
                });
                current = bEnd;
            } else {
                let next = current + duration;
                const upcomingBreak = breaks.find(b => b.startMinute > current && b.startMinute < next);
                if (upcomingBreak) {
                    next = upcomingBreak.startMinute;
                }
                next = Math.min(next, end);
                if (next > current) {
                    list.push({
                        startMinute: current,
                        endMinute: next,
                        lectureType: 'Lecture'
                    });
                }
                current = next;
            }
        }
        return list;
    }, [slots, config]);

    // 2. Resolve rowSpans for break columns to render them as single merged vertical columns
    const breakRowSpans = useMemo(() => {
        const spans = {};
        
        uniqueIntervals.forEach(interval => {
            if (interval.lectureType === 'Break') {
                let count = 0;
                let firstDay = null;
                
                for (let day = 1; day <= 7; day++) {
                    const dayType = getDayStatus(config.workingDays, day);
                    
                    if (dayType !== 'Holiday') {
                        count++;
                        if (firstDay === null) {
                            firstDay = day;
                        }
                    }
                }
                
                spans[`${interval.startMinute}_${interval.endMinute}`] = { firstDay, count };
            }
        });
        
        return spans;
    }, [uniqueIntervals, config, dayNumToKey]);

    // Resolve lecture badge icon
    const getTypeIcon = (type) => {
        switch (type) {
            case 'Lecture':
                return <BookOpen size={10} style={{ marginRight: '3px' }} />;
            case 'Lab':
                return <FlaskConical size={10} style={{ marginRight: '3px' }} />;
            case 'Tutorial':
                return <GraduationCap size={10} style={{ marginRight: '3px' }} />;
            case 'Seminar':
                return <Presentation size={10} style={{ marginRight: '3px' }} />;
            default:
                return null;
        }
    };

    // Resolve break icon
    const getBreakIcon = (name = '') => {
        const isLunch = name.toLowerCase().includes('lunch');
        if (isLunch) {
            return <Utensils size={13} style={{ marginBottom: '3px' }} />;
        }
        return <Coffee size={13} style={{ marginBottom: '3px' }} />;
    };

    // Subject request URL
    const requestSubjectUrl = useMemo(() => {
        const branchName = encodeURIComponent(user?.branch?.name || user?.branchName || '');
        const sem = user?.semester || 1;
        const schemeName = encodeURIComponent(user?.scheme?.name || user?.schemeName || '');
        return `/profile/request-subject?branch=${branchName}&semester=${sem}&scheme=${schemeName}`;
    }, [user]);

    // Check if minimum basic setup requirements are complete
    const isBasicSetupComplete = useMemo(() => {
        return Boolean(
            config?.semesterStartDate && 
            config?.lastWorkingDate && 
            config?.collegeStartMinute !== undefined && 
            config?.collegeEndMinute !== undefined
        );
    }, [config]);

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxSizing: 'border-box',
            width: '100%',
            overflow: 'visible'
        }}>
            {/* Basic Setup Incomplete Banner */}
            {!isBasicSetupComplete && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#fbbf24',
                    fontSize: '12px',
                    fontWeight: 600
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Info size={16} />
                        <span>Complete <strong>Basic Setup</strong> (Semester Dates, College Timings & Working Days) to enable adding subjects.</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/home/academic-register')}
                        style={{
                            background: 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: '#fbbf24',
                            borderRadius: '6px',
                            padding: '5px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        Go to Basic Setup →
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarRange size={16} style={{ color: '#a78bfa' }} />
                    Weekly Timetable Grid
                </h3>

                {/* Subject missing alert links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>Subject missing?</span>
                    <button
                        type="button"
                        onClick={() => navigate(requestSubjectUrl)}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            color: '#a78bfa',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: 0
                        }}
                    >
                        Request Subject
                        <ArrowRight size={10} />
                    </button>
                    <span style={{ fontSize: '11.5px', color: 'rgba(148, 163, 184, 0.3)' }}>•</span>
                    <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>Or add Custom Course in settings drawer</span>
                </div>
            </div>

            {/* Weekly Planning Progress Panel */}
            {incompleteProgress.length > 0 && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 700, color: '#a78bfa' }}>
                        <Info size={12} />
                        Planning Progress Checklist
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {incompleteProgress.map((prog) => {
                            const hasTheory = prog.theoryRequired > 0;
                            const hasLab = prog.labRequired > 0;
                            
                            const isTheoryComplete = !hasTheory || prog.theoryAssigned >= prog.theoryRequired;
                            const isLabComplete = !hasLab || prog.labAssigned >= prog.labRequired;
                            
                            const isComplete = isTheoryComplete && isLabComplete;

                            return (
                                <div 
                                    key={prog._id} 
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: isComplete ? 'rgba(16, 185, 129, 0.03)' : 'rgba(245, 158, 11, 0.03)',
                                        border: isComplete ? '1px solid rgba(16, 185, 129, 0.12)' : '1px solid rgba(245, 158, 11, 0.12)',
                                        borderRadius: '6px',
                                        padding: '5px 8px',
                                        fontSize: '11px',
                                        alignSelf: 'center'
                                    }}
                                >
                                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{prog.code || prog.name}</span>
                                    <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                                    
                                    {hasTheory && (
                                        <span style={{ color: isTheoryComplete ? '#10b981' : '#fbbf24', fontWeight: 500 }}>
                                            Theory: {prog.theoryAssigned}/{prog.theoryRequired}
                                        </span>
                                    )}
                                    {hasTheory && hasLab && <span style={{ color: 'rgba(255,255,255,0.1)' }}>•</span>}
                                    {hasLab && (
                                        <span style={{ color: isLabComplete ? '#10b981' : '#fbbf24', fontWeight: 500 }}>
                                            Lab: {prog.labAssigned}/{prog.labRequired}
                                        </span>
                                    )}

                                    <span style={{
                                        fontSize: '8.5px',
                                        fontWeight: 700,
                                        padding: '1px 3px',
                                        borderRadius: '3px',
                                        marginLeft: '4px',
                                        background: isComplete ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                        color: isComplete ? '#10b981' : '#fbbf24',
                                        textTransform: 'uppercase'
                                    }}>
                                        {isComplete ? 'Complete' : 'Pending'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Timetable Grid Table Container */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'center',
                    fontSize: '11.5px',
                    color: '#fff',
                    minWidth: '760px'
                }}>
                    <thead>
                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <th style={{
                                padding: '10px 12px',
                                fontWeight: 700,
                                color: '#a78bfa',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                                width: '80px',
                                minWidth: '80px',
                                maxWidth: '80px',
                                boxSizing: 'border-box'
                            }}>
                                Day
                            </th>
                            {uniqueIntervals.map((interval, idx) => {
                                const isBreak = interval.lectureType === 'Break';
                                return (
                                    <th 
                                        key={idx} 
                                        style={{
                                            padding: '12px 10px',
                                            fontWeight: 700,
                                            fontSize: '11px',
                                            color: isBreak ? '#f59e0b' : '#f8fafc',
                                            whiteSpace: 'nowrap',
                                            borderRight: idx < uniqueIntervals.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                                            width: '150px',
                                            minWidth: '150px',
                                            textAlign: 'center',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        {formatTime(interval.startMinute)} – {formatTime(interval.endMinute)}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                            const workingDaysMap = config.workingDays || {};
                            const dayType = workingDaysMap[dayNum.toString()] || workingDaysMap[dayNum] || 'Holiday';
                            
                            // 1. Holiday Row
                            if (dayType === 'Holiday') {
                                return (
                                    <tr key={dayNum} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                        <td style={{
                                            padding: '14px 12px',
                                            fontWeight: 700,
                                            color: 'rgba(148, 163, 184, 0.45)',
                                            background: 'rgba(255, 255, 255, 0.01)',
                                            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                                            textAlign: 'left',
                                            width: '80px',
                                            minWidth: '80px',
                                            maxWidth: '80px'
                                        }}>
                                            {daysMap[dayNum]}
                                        </td>
                                        <td 
                                            colSpan={uniqueIntervals.length}
                                            style={{
                                                padding: '14px 12px',
                                                color: 'rgba(148, 163, 184, 0.35)',
                                                fontWeight: 600,
                                                letterSpacing: '0.05em',
                                                fontStyle: 'italic',
                                                background: 'rgba(239, 68, 68, 0.01)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                                <CalendarOff size={14} style={{ color: 'rgba(148, 163, 184, 0.3)' }} />
                                                <span>Holiday</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }

                            // 2. Active Day Row
                            const daySlots = slots.filter(s => s.dayOfWeek === dayNum);
                            
                            // Keep track of indices we skip rendering due to horizontal colspan merges (Labs)
                            const skippedHorizontalIndices = new Set();

                            return (
                                <tr key={dayNum} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                    <td style={{
                                        padding: '14px 12px',
                                        fontWeight: 700,
                                        color: '#a78bfa',
                                        background: 'rgba(255, 255, 255, 0.01)',
                                        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                                        textAlign: 'left',
                                        width: '80px',
                                        minWidth: '80px',
                                        maxWidth: '80px'
                                    }}>
                                        {daysMap[dayNum]}
                                    </td>
                                    {uniqueIntervals.map((interval, iIdx) => {
                                        if (skippedHorizontalIndices.has(iIdx)) {
                                            return null;
                                        }

                                        // Find matching slot for this day and time interval
                                        const slot = daySlots.find(s => s.startMinute === interval.startMinute && s.endMinute === interval.endMinute);

                                        if (!slot) {
                                            if (interval.lectureType === 'Break') {
                                                const spanKey = `${interval.startMinute}_${interval.endMinute}`;
                                                const spanInfo = breakRowSpans[spanKey];
                                                
                                                if (spanInfo) {
                                                    if (dayNum === spanInfo.firstDay) {
                                                        return (
                                                            <td
                                                                key={iIdx}
                                                                rowSpan={spanInfo.count}
                                                                style={{
                                                                    background: '#0b090f',
                                                                    color: 'rgba(251, 191, 36, 0.45)',
                                                                    fontWeight: 600,
                                                                    borderRight: iIdx < uniqueIntervals.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                                                                    verticalAlign: 'middle',
                                                                    cursor: 'not-allowed',
                                                                    width: '150px',
                                                                    minWidth: '150px',
                                                                    padding: '12px 4px',
                                                                    boxSizing: 'border-box'
                                                                }}
                                                            >
                                                                <div style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '6px'
                                                                }}>
                                                                    {getBreakIcon(interval.breakName || 'Break')}
                                                                    <span style={{ 
                                                                        writingMode: 'vertical-rl', 
                                                                        textTransform: 'uppercase', 
                                                                        letterSpacing: '0.08em', 
                                                                        fontSize: '9.5px',
                                                                        transform: 'rotate(180deg)',
                                                                        fontWeight: 700
                                                                    }}>
                                                                        {interval.breakName || 'Break'}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        );
                                                    } else {
                                                        return null;
                                                    }
                                                }
                                            }

                                            return (
                                                <td 
                                                    key={iIdx}
                                                    onClick={() => {
                                                        if (isBasicSetupComplete && onCellClick) {
                                                            onCellClick(dayNum, interval.startMinute, interval.endMinute);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '14px 12px',
                                                        textAlign: 'center',
                                                        background: 'rgba(255, 255, 255, 0.01)',
                                                        borderRight: iIdx < uniqueIntervals.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                                                        cursor: isBasicSetupComplete ? 'pointer' : 'not-allowed'
                                                    }}
                                                    className={isBasicSetupComplete ? "hover:bg-white/[0.04] transition-all" : ""}
                                                >
                                                    <div style={{ display: 'flex', items: 'center', justifyContent: 'center' }}>
                                                        {isBasicSetupComplete ? (
                                                            <span style={{
                                                                padding: '4px 10px',
                                                                borderRadius: '6px',
                                                                background: 'rgba(139, 92, 246, 0.12)',
                                                                border: '1px solid rgba(139, 92, 246, 0.25)',
                                                                color: '#a78bfa',
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '2px'
                                                            }}>
                                                                + Add
                                                            </span>
                                                        ) : (
                                                            <span style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.2)' }}>
                                                                –
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        }

                                        // Check if Break -> Vertical rowSpan merge logic
                                        if (slot.lectureType === 'Break') {
                                            const spanKey = `${interval.startMinute}_${interval.endMinute}`;
                                            const spanInfo = breakRowSpans[spanKey];
                                            
                                            if (spanInfo) {
                                                if (dayNum === spanInfo.firstDay) {
                                                    return (
                                                        <td
                                                            key={iIdx}
                                                            rowSpan={spanInfo.count}
                                                            style={{
                                                                background: '#0b090f',
                                                                color: 'rgba(251, 191, 36, 0.45)',
                                                                fontWeight: 600,
                                                                borderRight: iIdx < uniqueIntervals.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                                                                verticalAlign: 'middle',
                                                                cursor: 'not-allowed',
                                                                width: '150px',
                                                                minWidth: '150px',
                                                                padding: '12px 4px',
                                                                boxSizing: 'border-box'
                                                            }}
                                                            className="break-merged-column"
                                                        >
                                                            <div style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                {getBreakIcon(slot.room)}
                                                                <span style={{ 
                                                                    writingMode: 'vertical-rl', 
                                                                    textTransform: 'uppercase', 
                                                                    letterSpacing: '0.08em', 
                                                                    fontSize: '9.5px',
                                                                    transform: 'rotate(180deg)'
                                                                }}>
                                                                    {slot.room || 'Break'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    );
                                                } else {
                                                    // Skip rendering since it is vertically merged into the first day cell
                                                    return null;
                                                }
                                            }
                                        }

                                        // Lab merging check (Horizontal colSpan)
                                        let colSpan = 1;
                                        const isLab = slot.lectureType === 'Lab';
                                        
                                        if (isLab) {
                                            const nextInterval = uniqueIntervals[iIdx + 1];
                                            if (nextInterval) {
                                                const nextSlot = daySlots.find(s => s.startMinute === nextInterval.startMinute && s.endMinute === nextInterval.endMinute);
                                                
                                                const slotSubjId = slot.subject?._id || slot.subject || '';
                                                const nextSlotSubjId = nextSlot?.subject?._id || nextSlot?.subject || '';
                                                
                                                if (nextSlot && nextSlot.lectureType === 'Lab' && slotSubjId && slotSubjId === nextSlotSubjId) {
                                                    colSpan = 2;
                                                    skippedHorizontalIndices.add(iIdx + 1);
                                                }
                                            }
                                        }

                                        // Class cell details
                                        const subjectObj = subjects.find(subj => subj._id === (slot.subject?._id || slot.subject));
                                        const isAssigned = !!subjectObj;

                                        return (
                                            <td
                                                key={iIdx}
                                                colSpan={colSpan}
                                                style={{
                                                    padding: '12px 10px',
                                                    background: isAssigned 
                                                        ? (isLab ? 'rgba(99, 102, 241, 0.06)' : 'rgba(124, 58, 237, 0.04)')
                                                        : 'transparent',
                                                    border: isAssigned 
                                                        ? (isLab ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid rgba(124, 58, 237, 0.2)')
                                                        : '1px dashed rgba(255, 255, 255, 0.08)',
                                                    borderRadius: isAssigned ? '6px' : '0px',
                                                    transition: 'all 0.15s',
                                                    borderRight: iIdx < uniqueIntervals.length - 1 && colSpan === 1 ? '1px solid rgba(255, 255, 255, 0.04)' : undefined,
                                                    verticalAlign: 'middle'
                                                }}
                                            >
                                                {isAssigned ? (
                                                    <div 
                                                        onClick={() => onCellClick(slot)}
                                                        style={{ 
                                                            display: 'flex', 
                                                            flexDirection: 'column', 
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '4px',
                                                            cursor: 'pointer',
                                                            width: '100%',
                                                            height: '100%'
                                                        }}
                                                    >
                                                        <span style={{ fontSize: '12px', color: '#fff', fontWeight: 600, textAlign: 'center' }}>
                                                            {subjectObj.name}
                                                        </span>
                                                        
                                                        {/* Badge showing type with lucide icon */}
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            background: isLab ? 'rgba(99, 102, 241, 0.12)' : 'rgba(124, 58, 237, 0.1)',
                                                            color: isLab ? '#818cf8' : '#a78bfa',
                                                            borderRadius: '4px',
                                                            padding: '2px 6px',
                                                            fontSize: '9.5px',
                                                            fontWeight: 600
                                                        }}>
                                                            {getTypeIcon(slot.lectureType)}
                                                            <span>{slot.lectureType}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => onCellClick(slot)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: '1px solid rgba(167, 139, 250, 0.25)',
                                                            color: '#a78bfa',
                                                            borderRadius: '4px',
                                                            padding: '4px 12px',
                                                            fontSize: '10px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            outline: 'none',
                                                            transition: 'all 0.15s'
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.background = 'rgba(167, 139, 250, 0.08)';
                                                            e.currentTarget.style.border = '1px solid rgba(167, 139, 250, 0.45)';
                                                            e.currentTarget.style.color = '#fff';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.border = '1px solid rgba(167, 139, 250, 0.25)';
                                                            e.currentTarget.style.color = '#a78bfa';
                                                        }}
                                                    >
                                                        + Add
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Quick Helper Note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(148, 163, 184, 0.45)', fontSize: '11px', marginTop: '6px' }}>
                <Info size={12} />
                <span>Click on assigned subjects or use the "+ Add" buttons to customize your timetable schedule.</span>
            </div>

        </div>
    );
};

export default WeeklyTimetableGrid;
