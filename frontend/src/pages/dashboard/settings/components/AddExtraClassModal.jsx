import React, { useState } from 'react';
import { Calendar, Clock, X, BookOpen, FlaskConical } from 'lucide-react';

const AddExtraClassModal = ({ isOpen, onClose, onAdd }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('');
    const [status, setStatus] = useState('Present');
    const [lectureType, setLectureType] = useState('Lecture'); // 'Lecture' -> Theory, 'Lab' -> Lab
    const [remarks, setRemarks] = useState('');

    if (!isOpen) return null;

    const statuses = [
        { label: 'Present', value: 'Present', color: '#10b981' },
        { label: 'Absent', value: 'Absent', color: '#ef4444' },
        { label: 'Medical Leave', value: 'Medical Leave', color: '#3b82f6' },
        { label: 'On Duty', value: 'On Duty', color: '#8b5cf6' },
        { label: 'Cancelled', value: 'Cancelled', color: '#64748b' }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!date || !status) return;

        // Convert 24h input format to 12h display time format if provided
        let formattedTime = '';
        if (time) {
            const [hours, minutes] = time.split(':');
            const h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const displayHours = h % 12 || 12;
            formattedTime = `${displayHours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
        }

        onAdd({
            date,
            time: formattedTime,
            status,
            lectureType,
            remarks
        });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(9, 8, 14, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px'
        }}>
            <div style={{
                background: '#13111A',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '420px',
                padding: '24px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                boxSizing: 'border-box',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#fff', margin: 0 }}>
                        Add Extra Class
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.4)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Date Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.7)', textTransform: 'uppercase' }}>
                            Date *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: '#09080E',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '10px 12px 10px 36px',
                                    fontSize: '13px',
                                    color: '#fff',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Time Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.7)', textTransform: 'uppercase' }}>
                            Time (Optional)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Clock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: '#09080E',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    padding: '10px 12px 10px 36px',
                                    fontSize: '13px',
                                    color: '#fff',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Lecture Type Segmented Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.7)', textTransform: 'uppercase' }}>
                            Lecture Type
                        </label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            background: '#09080E',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            padding: '3px'
                        }}>
                            <button
                                type="button"
                                onClick={() => setLectureType('Lecture')}
                                style={{
                                    background: lectureType === 'Lecture' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                                    border: lectureType === 'Lecture' ? '1px solid rgba(167, 139, 250, 0.3)' : '1px solid transparent',
                                    color: lectureType === 'Lecture' ? '#fff' : 'rgba(255,255,255,0.4)',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <BookOpen size={12} />
                                Theory
                            </button>
                            <button
                                type="button"
                                onClick={() => setLectureType('Lab')}
                                style={{
                                    background: lectureType === 'Lab' ? 'rgba(167, 139, 250, 0.15)' : 'transparent',
                                    border: lectureType === 'Lab' ? '1px solid rgba(167, 139, 250, 0.3)' : '1px solid transparent',
                                    color: lectureType === 'Lab' ? '#fff' : 'rgba(255,255,255,0.4)',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    transition: 'all 0.15s'
                                }}
                            >
                                <FlaskConical size={12} />
                                Lab
                            </button>
                        </div>
                    </div>

                    {/* Attendance Status Radios/Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.7)', textTransform: 'uppercase' }}>
                            Attendance Status *
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {statuses.map(st => (
                                <button
                                    key={st.value}
                                    type="button"
                                    onClick={() => setStatus(st.value)}
                                    style={{
                                        background: status === st.value ? 'rgba(255,255,255,0.03)' : 'transparent',
                                        border: status === st.value ? `1px solid ${st.color}` : '1px solid rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        padding: '10px 14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        width: '100%',
                                        textAlign: 'left',
                                        color: status === st.value ? '#fff' : 'rgba(255,255,255,0.6)',
                                        fontSize: '13px',
                                        fontWeight: status === st.value ? 600 : 500,
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: st.color,
                                        boxShadow: `0 0 8px ${st.color}`
                                    }} />
                                    {st.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Remarks Input */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.7)', textTransform: 'uppercase' }}>
                            Remarks
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Extra class makeup"
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            style={{
                                width: '100%',
                                background: '#09080E',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                fontSize: '13px',
                                color: '#fff',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.8)',
                                borderRadius: '8px',
                                padding: '12px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                                border: 'none',
                                color: '#fff',
                                borderRadius: '8px',
                                padding: '12px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'transform 0.15s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            Add Class
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddExtraClassModal;
