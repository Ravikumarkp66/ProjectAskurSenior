import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Sparkles, ChevronDown, 
    Calendar, BarChart2, AlertCircle, BookOpen
} from 'lucide-react';

const SettingsSvgIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const AttendanceHeader = ({
    activeTab,
    onTabChange,
    selectedSemester,
    onSemesterChange,
    semestersList = [],
    currentStudentSemester,
    readOnly,
    loading,
    onOpenSettings,
}) => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            color: '#fff',
            width: '100%'
        }}>
            {/* Top Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ textAlign: 'left' }}>
                    <h2 style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        margin: '0 0 4px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        letterSpacing: '-0.02em'
                    }}>
                        <Sparkles size={22} style={{ color: '#a78bfa' }} />
                        Attendance & Daily Tracker
                    </h2>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                        Semester {selectedSemester} · Daily class occurrences, attendance logging, and threshold summary.
                    </p>
                </div>

                {/* Top Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {/* Semester Selector Dropdown */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <select
                            value={selectedSemester}
                            onChange={(e) => onSemesterChange(parseInt(e.target.value, 10))}
                            style={{
                                background: '#13111A',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#fff',
                                borderRadius: '8px',
                                padding: '8px 32px 8px 14px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                outline: 'none',
                                appearance: 'none',
                                WebkitAppearance: 'none'
                            }}
                        >
                            {semestersList.map(sem => (
                                <option key={sem} value={sem}>
                                    Semester {sem} {sem === currentStudentSemester ? '(Active)' : '(Archived)'}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: '12px', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
                    </div>

                    {/* Settings Button with clean SVG gear icon */}
                    <button
                        type="button"
                        onClick={() => {
                            if (onOpenSettings) onOpenSettings();
                            else navigate('/home/timetable');
                        }}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.85)',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.12)';
                            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                            e.currentTarget.style.color = '#c4b5fd';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                        }}
                    >
                        <SettingsSvgIcon />
                        Settings
                    </button>
                </div>
            </div>

            {/* Read-Only Semester Alert */}
            {readOnly && (
                <div style={{
                    background: 'rgba(124,58,237,0.06)',
                    border: '1px solid rgba(124,58,237,0.15)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#c4b5fd',
                    fontSize: '13px'
                }}>
                    <AlertCircle size={16} />
                    <span>
                        Viewing archived <strong>Semester {selectedSemester}</strong> records. Attendance is read-only.
                    </span>
                </div>
            )}

            {/* Global Attendance Tabs (4 Clean Primary Views) */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '2px',
                overflowX: 'auto'
            }}>
                {(() => {
                    const isSchedule = activeTab === 'schedule' || activeTab === 'timetable';
                    const isToday = activeTab === 'today' || activeTab === 'daily';
                    const isSubjects = activeTab === 'subjects' || activeTab === 'subject-summary';
                    const isOverview = activeTab === 'overview' || activeTab === 'summary';

                    return (
                        <>
                            <button
                                type="button"
                                onClick={() => onTabChange('schedule')}
                                style={{
                                    background: isSchedule ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                                    border: 'none',
                                    borderBottom: isSchedule ? '2px solid #a78bfa' : '2px solid transparent',
                                    color: isSchedule ? '#ffffff' : '#94a3b8',
                                    padding: '10px 18px',
                                    fontSize: '13.5px',
                                    fontWeight: isSchedule ? 700 : 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderRadius: '8px 8px 0 0',
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Calendar size={15} />
                                Schedule
                            </button>

                            <button
                                type="button"
                                onClick={() => onTabChange('today')}
                                style={{
                                    background: isToday ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                                    border: 'none',
                                    borderBottom: isToday ? '2px solid #a78bfa' : '2px solid transparent',
                                    color: isToday ? '#ffffff' : '#94a3b8',
                                    padding: '10px 18px',
                                    fontSize: '13.5px',
                                    fontWeight: isToday ? 700 : 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderRadius: '8px 8px 0 0',
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Calendar size={15} />
                                Today
                            </button>

                            <button
                                type="button"
                                onClick={() => onTabChange('subjects')}
                                style={{
                                    background: isSubjects ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                                    border: 'none',
                                    borderBottom: isSubjects ? '2px solid #a78bfa' : '2px solid transparent',
                                    color: isSubjects ? '#ffffff' : '#94a3b8',
                                    padding: '10px 18px',
                                    fontSize: '13.5px',
                                    fontWeight: isSubjects ? 700 : 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderRadius: '8px 8px 0 0',
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <BookOpen size={15} />
                                Subjects
                            </button>

                            <button
                                type="button"
                                onClick={() => onTabChange('overview')}
                                style={{
                                    background: isOverview ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                                    border: 'none',
                                    borderBottom: isOverview ? '2px solid #a78bfa' : '2px solid transparent',
                                    color: isOverview ? '#ffffff' : '#94a3b8',
                                    padding: '10px 18px',
                                    fontSize: '13.5px',
                                    fontWeight: isOverview ? 700 : 500,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    borderRadius: '8px 8px 0 0',
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <BarChart2 size={15} />
                                Overview
                            </button>
                        </>
                    );
                })()}
            </div>
        </div>
    );
};

export default AttendanceHeader;
