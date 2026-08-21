import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Flame, Calendar, Clock, Download, Plus, Search, 
    FileText, Trash2, BookOpen, FlaskConical, Award, AlertTriangle, Play 
} from 'lucide-react';
import AddExtraClassModal from './AddExtraClassModal';

const isFutureClass = (item) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    if (item.date > todayStr) {
        return true;
    }
    if (item.date === todayStr) {
        if (item.timeSlot) {
            const parts = item.timeSlot.split('-');
            const endStr = parts[1] || '';
            const endParts = endStr.split(':');
            const endHr = parseInt(endParts[0], 10) || 0;
            const endMin = parseInt(endParts[1], 10) || 0;
            
            const currentMinutes = today.getHours() * 60 + today.getMinutes();
            const classEndMinutes = endHr * 60 + endMin;
            
            return currentMinutes < classEndMinutes;
        }
    }
    return false;
};

const AttendanceHistoryDrawer = ({
    isOpen,
    onClose,
    subject,
    history = [],
    forecast = null,
    onUpdateStatus,
    onAddExtra,
    onDeleteExtra,
    onExportReport, // Triggered when export is clicked
    readOnly = false // Lock status for old semesters
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    // Filter logic
    const filteredHistory = useMemo(() => {
        return history.filter(item => {
            // Filter by search query
            const dateObj = new Date(item.date);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
            const matchesSearch = dateStr.includes(searchQuery.toLowerCase()) || item.remarks?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            // Filter by segmented button
            if (activeFilter === 'All') return true;
            if (activeFilter === 'Present') return item.status === 'Present' || item.status === 'On Duty';
            if (activeFilter === 'Absent') return item.status === 'Absent' || item.status === 'Medical Leave';
            if (activeFilter === 'Manual Entry') return item.isExtraClass === true;
            return true;
        });
    }, [history, searchQuery, activeFilter]);

    if (!isOpen || !subject) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return '#10b981'; // Green
            case 'Absent': return '#ef4444'; // Red
            case 'Medical Leave': return '#3b82f6'; // Blue
            case 'On Duty': return '#8b5cf6'; // Purple
            case 'Cancelled': return '#64748b'; // Slate
            default: return 'rgba(255,255,255,0.4)';
        }
    };

    const renderStatusIndicator = (status) => {
        const color = getStatusColor(status);
        return (
            <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: color,
                display: 'inline-block',
                boxShadow: `0 0 6px ${color}`
            }} />
        );
    };

    const pct = subject.attendancePercentage ?? 100;

    return createPortal(
        <div 
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                zIndex: 99999,
                display: 'flex',
                justifyContent: 'flex-end',
                boxSizing: 'border-box'
            }}
        >
            <div 
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    height: '100%',
                    background: '#13111A',
                    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxSizing: 'border-box'
                }}
            >
                {/* Header */}
                <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0', color: '#fff' }}>
                        {subject.name}
                    </h3>
                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>
                        {subject.code || 'NO CODE'} &bull; {subject.category || 'Theory'}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '50%'
                    }}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Scrollable Contents */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Stats Grid */}
                <div style={{
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px 12px',
                    textAlign: 'left'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.4)', textTransform: 'uppercase', fontWeight: 600 }}>Attendance Rate</span>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: pct >= 85 ? '#10b981' : '#ef4444' }}>
                            {pct}%
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.4)', textTransform: 'uppercase', fontWeight: 600 }}>Classes Logged</span>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fff' }}>
                            {subject.analytics?.present ?? 0} present / {subject.analytics?.conducted ?? 0} cond
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.4)', textTransform: 'uppercase', fontWeight: 600 }}>Expected Classes</span>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fff' }}>
                            {subject.analytics?.expected ?? 0} total expected
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(148, 163, 184, 0.4)', textTransform: 'uppercase', fontWeight: 600 }}>Current / Max Streak</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fdba74', fontWeight: 700, fontSize: '12.5px' }}>
                            <Flame size={14} fill="#f97316" style={{ color: '#f97316' }} />
                            <span>{subject.analytics?.streak?.current ?? 0} / {subject.analytics?.streak?.longest ?? 0}</span>
                        </div>
                    </div>
                    {/* Can Miss / Need to Attend Plan */}
                    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '6px' }}>
                        {pct >= 85 ? (
                            <div style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 500 }}>
                                ✅ Safe! You can miss <strong style={{ fontSize: '12px', color: '#10b981' }}>{subject.canMiss ?? 0}</strong> more class{subject.canMiss !== 1 ? 'es' : ''} to maintain &gt;= 85% attendance.
                            </div>
                        ) : (
                            <div style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 500 }}>
                                ⚠️ Critical! You must attend <strong style={{ fontSize: '12px', color: '#ef4444' }}>{subject.needToAttend ?? 0}</strong> consecutive class{subject.needToAttend !== 1 ? 'es' : ''} to reach 85% attendance.
                            </div>
                        )}
                    </div>
                </div>

                {/* Prediction Engine Forecast Panel */}
                {forecast && (
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.04) 0%, rgba(0, 0, 0, 0) 100%)',
                        border: '1px solid rgba(124, 58, 237, 0.1)',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        <h4 style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                            Prediction Forecasts
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '9.5px', color: 'rgba(148, 163, 184, 0.5)' }}>If you miss next class</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: (forecast.finalIfMissNext >= 85 ? '#6ee7b7' : '#fca5a5') }}>
                                    {forecast.finalIfMissNext}% {forecast.finalIfMissNext < 85 && '⚠️'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '9.5px', color: 'rgba(148, 163, 184, 0.5)' }}>If you attend next 8 classes</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#6ee7b7' }}>
                                    {forecast.finalIfAttendNext8}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search & Actions Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)' }} />
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: '#13111A',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '8px 12px 8px 36px',
                                    fontSize: '12px',
                                    color: '#fff',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        
                        {!readOnly && (
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(true)}
                                style={{
                                    background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    padding: '8px 14px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Plus size={14} />
                                Extra
                            </button>
                        )}
                    </div>

                    {/* Segmented Filter */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        background: '#13111A',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        padding: '3px'
                    }}>
                        {['All', 'Present', 'Absent', 'Manual Entry'].map(filter => (
                            <button
                                key={filter}
                                type="button"
                                onClick={() => setActiveFilter(filter)}
                                style={{
                                    background: activeFilter === filter ? 'rgba(167, 139, 250, 0.12)' : 'transparent',
                                    border: 'none',
                                    color: activeFilter === filter ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                                    padding: '6px 0',
                                    borderRadius: '5px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Timeline History List */}
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', marginTop: '4px' }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.4)', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>
                        Timeline History
                    </h4>

                    {filteredHistory.length === 0 ? (
                        <div style={{ padding: '30px 0', color: 'rgba(148, 163, 184, 0.4)', fontSize: '12px', textAlign: 'center' }}>
                            No attendance records match the filters.
                        </div>
                    ) : (
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            paddingLeft: '16px'
                        }}>
                            {/* Timeline Track */}
                            <div style={{
                                position: 'absolute',
                                left: '3.5px',
                                top: '8px',
                                bottom: '8px',
                                width: '1px',
                                background: 'rgba(255,255,255,0.06)'
                            }} />

                            {filteredHistory.map((item) => (
                                <div 
                                    key={item._id || `${item.date}_${item.timeSlot}`} 
                                    style={{
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '6px',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    {/* Node */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '-16px',
                                        top: '6px',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#09080E',
                                        border: `1.5px solid ${getStatusColor(item.status)}`,
                                        zIndex: 2,
                                        boxSizing: 'border-box'
                                    }} />

                                    {/* Top Row: Date, Time slot, lecture type */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#fff', fontWeight: 600 }}>
                                            <Calendar size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
                                            <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>&bull;</span>
                                            {item.timeSlot && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'rgba(148, 163, 184, 0.45)' }}>
                                                    <Clock size={10} />
                                                    {item.timeSlot}
                                                </span>
                                            )}
                                        </div>

                                        {/* Badges / Action */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                fontSize: '9px',
                                                fontWeight: 600,
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                background: item.isExtraClass ? 'rgba(167, 139, 250, 0.08)' : 'rgba(255,255,255,0.03)',
                                                border: item.isExtraClass ? '1px solid rgba(167, 139, 250, 0.2)' : '1px solid rgba(255,255,255,0.05)',
                                                color: item.isExtraClass ? '#c4b5fd' : 'rgba(255,255,255,0.45)'
                                            }}>
                                                {item.isExtraClass ? 'Extra Class' : (item.lectureType || 'Lecture')}
                                            </span>

                                            {item.isExtraClass && !readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteExtra(item._id)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'rgba(239, 68, 68, 0.65)',
                                                        cursor: 'pointer',
                                                        padding: '2px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        borderRadius: '4px'
                                                    }}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom Row: Selector & Remarks */}
                                    {(() => {
                                        const isRowReadOnly = readOnly || isFutureClass(item);
                                        let displayStatus = isFutureClass(item) ? 'Yet To Be Taken' : item.status;
                                        if (displayStatus === 'Cancelled') {
                                            displayStatus = 'Suspended';
                                        }
                                        return (
                                            <div style={{
                                                background: '#13111A',
                                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                                borderRadius: '8px',
                                                padding: '8px 12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {renderStatusIndicator(displayStatus)}
                                                        {isRowReadOnly ? (
                                                            <span style={{ fontSize: '12px', fontWeight: 600, color: isFutureClass(item) ? 'rgba(255,255,255,0.3)' : '#fff' }}>{displayStatus}</span>
                                                        ) : (
                                                            <select
                                                                value={item.status}
                                                                onChange={e => onUpdateStatus(item, e.target.value, item.remarks)}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: '#fff',
                                                                    fontSize: '12px',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    outline: 'none'
                                                                }}
                                                            >
                                                                <option value="Yet To Be Taken" style={{ background: '#13111A' }}>Yet To Be Taken</option>
                                                                <option value="Present" style={{ background: '#13111A' }}>Present</option>
                                                                <option value="Absent" style={{ background: '#13111A' }}>Absent</option>
                                                                <option value="Cancelled" style={{ background: '#13111A' }}>Suspended</option>
                                                            </select>
                                                        )}
                                                    </div>

                                                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
                                                        By {isFutureClass(item) ? 'System' : (item.createdBy || 'System')}
                                                    </span>
                                                </div>

                                                {/* Remarks */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <FileText size={10} style={{ color: 'rgba(255,255,255,0.25)' }} />
                                                    {isRowReadOnly ? (
                                                        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>
                                                            {isFutureClass(item) ? '' : (item.remarks || 'No notes')}
                                                        </span>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            placeholder="Add note/remarks..."
                                                            defaultValue={item.remarks || ''}
                                                            onBlur={e => {
                                                                if (e.target.value !== (item.remarks || '')) {
                                                                    onUpdateStatus(item, item.status, e.target.value);
                                                                }
                                                            }}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                color: 'rgba(255, 255, 255, 0.5)',
                                                                fontSize: '11px',
                                                                outline: 'none',
                                                                width: '100%',
                                                                padding: 0
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            </div>

            {/* Extra Class Modal */}
            <AddExtraClassModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={(data) => {
                    onAddExtra(data);
                    setIsAddModalOpen(false);
                }}
            />
        </div>,
        document.body
    );
};

export default AttendanceHistoryDrawer;
