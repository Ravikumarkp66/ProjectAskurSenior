import React from 'react';
import { Coffee, Plus, Trash2 } from 'lucide-react';

const BreakConfigurationCard = ({ breaks, onChange }) => {
    
    const minutesToTimeString = (mins) => {
        if (mins === undefined || mins === null) return '12:00';
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const timeStringToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(':').map(Number);
        return (hours * 60) + minutes;
    };

    const handleAddBreak = () => {
        const newBreak = {
            name: `Break ${breaks.length + 1}`,
            startMinute: 600, // 10:00 AM
            duration: 15
        };
        onChange('breaks', [...breaks, newBreak]);
    };

    const handleRemoveBreak = (idxToRemove) => {
        const filtered = breaks.filter((_, idx) => idx !== idxToRemove);
        onChange('breaks', filtered);
    };

    const handleFieldChange = (idxToUpdate, field, value) => {
        const updated = breaks.map((item, idx) => {
            if (idx === idxToUpdate) {
                return { ...item, [field]: value };
            }
            return item;
        });
        onChange('breaks', updated);
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxSizing: 'border-box'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Coffee size={16} style={{ color: '#a78bfa' }} />
                    Break Configuration
                </h3>
                <button
                    type="button"
                    onClick={handleAddBreak}
                    style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        color: '#a78bfa',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}
                >
                    <Plus size={12} />
                    Add Break
                </button>
            </div>

            {breaks.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'rgba(148, 163, 184, 0.45)', textAlign: 'center', padding: '12px 0' }}>
                    No breaks configured. Click Add Break above to configure intervals.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {breaks.map((item, idx) => (
                        <div 
                            key={idx}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: 'rgba(255, 255, 255, 0.01)',
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                borderRadius: '8px',
                                padding: '8px 12px'
                            }}
                            className="break-row"
                        >
                            {/* Break Name */}
                            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>Break Name</label>
                                <input
                                    type="text"
                                    required
                                    value={item.name}
                                    placeholder="Lunch/Tea Break"
                                    onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: 'rgba(255,255,255,0.02)',
                                        color: '#fff',
                                        fontSize: '12px',
                                        outline: 'none',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Start Time */}
                            <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>Starts At</label>
                                <input
                                    type="time"
                                    required
                                    value={minutesToTimeString(item.startMinute)}
                                    onChange={(e) => handleFieldChange(idx, 'startMinute', timeStringToMinutes(e.target.value))}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: 'rgba(255,255,255,0.02)',
                                        color: '#fff',
                                        fontSize: '12px',
                                        outline: 'none',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Duration (Minutes) */}
                            <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '11px', color: 'rgba(148, 163, 184, 0.5)' }}>Duration (Mins)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={item.duration}
                                    placeholder="20"
                                    onChange={(e) => handleFieldChange(idx, 'duration', parseInt(e.target.value, 10) || 0)}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: 'rgba(255,255,255,0.02)',
                                        color: '#fff',
                                        fontSize: '12px',
                                        outline: 'none',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Delete Button */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end', paddingBottom: '3px' }}>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveBreak(idx)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '4px',
                                        padding: '7px',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 576px) {
                    .break-row {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 8px !important;
                    }
                }
            `}} />
        </div>
    );
};

export default BreakConfigurationCard;
