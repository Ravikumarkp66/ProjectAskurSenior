import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Info, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiV2 } from '../../../../../services/authService';

const BaselineSetupModal = ({
    isOpen,
    onClose,
    semester,
    registeredSubjects = [],
    onBaselineSaved
}) => {
    const [baselineData, setBaselineData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (registeredSubjects && registeredSubjects.length > 0) {
            const initial = {};
            registeredSubjects.forEach(reg => {
                initial[reg._id] = {
                    present: reg.baseline?.present || 0,
                    conducted: reg.baseline?.conducted || 0
                };
            });
            setBaselineData(initial);
        }
    }, [registeredSubjects, isOpen]);

    if (!isOpen) return null;

    const handlePresentChange = (id, val) => {
        const num = Math.max(0, parseInt(val, 10) || 0);
        setBaselineData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { conducted: 0 }),
                present: num
            }
        }));
    };

    const handleConductedChange = (id, val) => {
        const num = Math.max(0, parseInt(val, 10) || 0);
        setBaselineData(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || { present: 0 }),
                conducted: num
            }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const baselinesPayload = registeredSubjects.map(reg => ({
                registeredSubjectId: reg._id,
                present: baselineData[reg._id]?.present || 0,
                conducted: baselineData[reg._id]?.conducted || 0
            }));

            const res = await apiV2.saveBaselineAttendance({
                semester,
                baselines: baselinesPayload
            });

            if (res.data?.success) {
                toast.success('Baseline attendance saved successfully!');
                if (onBaselineSaved) onBaselineSaved();
                onClose();
            } else {
                toast.error(res.data?.message || 'Failed to save baseline');
            }
        } catch (err) {
            console.error('Error saving baseline attendance:', err);
            toast.error('Failed to save baseline attendance. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                background: '#13111C',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                overflow: 'hidden',
                color: '#fff'
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                            Mid-Semester Baseline Setup
                        </h3>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                            Semester {semester} · Enter past aggregate classes attended before starting on AskUrSenior.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            color: '#94a3b8',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Info Alert */}
                <div style={{ padding: '16px 24px 0 24px' }}>
                    <div style={{
                        background: 'rgba(124, 58, 237, 0.08)',
                        border: '1px solid rgba(124, 58, 237, 0.2)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'flex',
                        gap: '10px',
                        fontSize: '12px',
                        color: '#c4b5fd'
                    }}>
                        <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>
                            These baseline numbers will be added to your daily tracked classes for overall percentage calculation without generating fake calendar dates.
                        </span>
                    </div>
                </div>

                {/* Subject List Form */}
                <div style={{
                    padding: '20px 24px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    flex: 1
                }}>
                    {registeredSubjects.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8', fontSize: '13px' }}>
                            No registered subjects found for Semester {semester}.
                        </div>
                    ) : (
                        registeredSubjects.map(reg => {
                            const id = reg._id;
                            const name = reg.customName || reg.subject?.name || 'Subject';
                            const code = reg.customCode || reg.subject?.code || '';
                            const presentVal = baselineData[id]?.present ?? 0;
                            const conductedVal = baselineData[id]?.conducted ?? 0;

                            return (
                                <div key={id} style={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid rgba(255, 255, 255, 0.06)',
                                    borderRadius: '12px',
                                    padding: '14px 16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '16px',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ flex: 1, minWidth: '180px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                                            {name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            {code ? `${code} · ` : ''}{reg.category || 'Theory'} · {reg.registeredCredits || 0} Credits
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                                                Present
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={presentVal}
                                                onChange={(e) => handlePresentChange(id, e.target.value)}
                                                style={{
                                                    background: '#0F0D16',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '6px',
                                                    color: '#6ee7b7',
                                                    padding: '6px 10px',
                                                    fontSize: '13px',
                                                    fontWeight: 700,
                                                    width: '60px',
                                                    textAlign: 'center',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', marginTop: '16px' }}>/</span>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>
                                                Conducted
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={conductedVal}
                                                onChange={(e) => handleConductedChange(id, e.target.value)}
                                                style={{
                                                    background: '#0F0D16',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '6px',
                                                    color: '#f8fafc',
                                                    padding: '6px 10px',
                                                    fontSize: '13px',
                                                    fontWeight: 700,
                                                    width: '60px',
                                                    textAlign: 'center',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Modal Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#94a3b8',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            background: '#7c3aed',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '8px 20px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: isSaving ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Save size={14} />
                        {isSaving ? 'Saving...' : 'Save Baseline'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BaselineSetupModal;
