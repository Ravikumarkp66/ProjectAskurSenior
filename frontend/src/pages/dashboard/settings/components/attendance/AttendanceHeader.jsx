import React from 'react';
import { 
    Sparkles, ChevronDown, Download, RefreshCw, CheckCircle2, 
    Calendar, BarChart2, AlertCircle, FileText, BookOpen
} from 'lucide-react';

const AttendanceHeader = ({
    activeTab,
    onTabChange,
    selectedSemester,
    onSemesterChange,
    semestersList = [],
    currentStudentSemester,
    readOnly,
    loading,
    onPromoteSemester,
    onRecalculate,
    onExport,
    isExportDropdownOpen,
    setIsExportDropdownOpen
}) => {
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

                    {/* Promote Semester (only visible for current active semester) */}
                    {selectedSemester === currentStudentSemester && !loading && (
                        <button
                            type="button"
                            onClick={onPromoteSemester}
                            style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                color: '#6ee7b7',
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
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'; }}
                        >
                            <CheckCircle2 size={13} />
                            Finish Semester
                        </button>
                    )}

                    {/* Semester Report Exports Dropdown */}
                    <div style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
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
                                gap: '6px'
                            }}
                        >
                            <Download size={13} />
                            Report
                            <ChevronDown size={12} />
                        </button>

                        {isExportDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '38px',
                                right: 0,
                                background: '#13111A',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                zIndex: 10,
                                minWidth: '120px',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '4px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => onExport('csv')}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <FileText size={12} />
                                    CSV Report
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onExport('pdf')}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <FileText size={12} />
                                    PDF Report
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sync / Recalculate */}
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={onRecalculate}
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                color: 'rgba(255,255,255,0.8)',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <RefreshCw size={13} />
                            Sync
                        </button>
                    )}
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

            {/* Global Attendance Tabs */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '2px'
            }}>
                <button
                    type="button"
                    onClick={() => onTabChange('daily')}
                    style={{
                        background: activeTab === 'daily' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'daily' ? '2px solid #a78bfa' : '2px solid transparent',
                        color: activeTab === 'daily' ? '#ffffff' : '#94a3b8',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: activeTab === 'daily' ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '8px 8px 0 0',
                        transition: 'all 0.15s'
                    }}
                >
                    <Calendar size={15} />
                    Daily Attendance
                </button>



                <button
                    type="button"
                    onClick={() => onTabChange('subject-summary')}
                    style={{
                        background: activeTab === 'subject-summary' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'subject-summary' ? '2px solid #a78bfa' : '2px solid transparent',
                        color: activeTab === 'subject-summary' ? '#ffffff' : '#94a3b8',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: activeTab === 'subject-summary' ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '8px 8px 0 0',
                        transition: 'all 0.15s'
                    }}
                >
                    <BookOpen size={15} />
                    Subject Summary
                </button>

                <button
                    type="button"
                    onClick={() => onTabChange('summary')}
                    style={{
                        background: activeTab === 'summary' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'summary' ? '2px solid #a78bfa' : '2px solid transparent',
                        color: activeTab === 'summary' ? '#ffffff' : '#94a3b8',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: activeTab === 'summary' ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '8px 8px 0 0',
                        transition: 'all 0.15s'
                    }}
                >
                    <BarChart2 size={15} />
                    Semester Summary
                </button>
            </div>
        </div>
    );
};

export default AttendanceHeader;
