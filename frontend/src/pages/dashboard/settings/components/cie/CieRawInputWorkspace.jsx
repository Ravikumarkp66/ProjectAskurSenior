import React, { useState, useEffect } from 'react';
import { BookOpen, Layers, Award, AlertCircle, FileCheck } from 'lucide-react';

const CieRawInputWorkspace = ({
    subject,
    onMarksChange,
    isSaving
}) => {
    if (!subject) return null;

    const { evalConfig, rawMarks = {}, evaluationType, subjectName, subjectCode, credits } = subject;
    const [localMarks, setLocalMarks] = useState({ ...rawMarks });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setLocalMarks({ ...(subject.rawMarks || {}) });
        setErrors({});
    }, [subject.registeredSubjectId, subject.rawMarks]);

    const handleInputChange = (fieldId, valueStr, maxRaw) => {
        let val = valueStr === '' ? null : Number(valueStr);
        let errorMsg = null;

        if (val !== null) {
            if (isNaN(val)) {
                errorMsg = 'Invalid number';
            } else if (val < 0) {
                errorMsg = 'Cannot be negative';
            } else if (val > maxRaw) {
                errorMsg = `Maximum allowed: ${maxRaw}`;
            }
        }

        setErrors(prev => ({
            ...prev,
            [fieldId]: errorMsg
        }));

        const updatedMarks = {
            ...localMarks,
            [fieldId]: val
        };

        setLocalMarks(updatedMarks);

        if (!errorMsg) {
            onMarksChange(updatedMarks);
        }
    };

    if (!evalConfig || !evalConfig.components) {
        return (
            <div style={{ padding: '20px', color: '#94a3b8', textAlign: 'center' }}>
                No evaluation configuration found for this subject.
            </div>
        );
    }

    const components = evalConfig.components;

    const renderInputGroup = (groupKey, groupConfig) => {
        return (
            <div key={groupKey} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '14px',
                padding: '16px 18px',
                marginBottom: '14px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                }}>
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#a78bfa'
                    }}>
                        {groupConfig.name}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Min Req: {groupConfig.minRawRequired} / {groupConfig.maxRaw}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groupConfig.subComponents.map(sub => {
                        const val = localMarks[sub.id] !== null && localMarks[sub.id] !== undefined ? localMarks[sub.id] : '';
                        const err = errors[sub.id];

                        return (
                            <div key={sub.id} style={{
                                background: 'rgba(15, 13, 24, 0.6)',
                                border: err ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                            }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
                                    {sub.name}
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        max={sub.maxRaw}
                                        step="any"
                                        value={val}
                                        onChange={(e) => handleInputChange(sub.id, e.target.value, sub.maxRaw)}
                                        placeholder="—"
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            color: '#fff',
                                            fontSize: '15px',
                                            fontWeight: 700,
                                            outline: 'none'
                                        }}
                                    />
                                    <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>
                                        / {sub.maxRaw}
                                    </span>
                                </div>
                                {err && (
                                    <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                                        {err}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Subject Header Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(30, 27, 46, 0.5) 0%, rgba(18, 15, 29, 0.6) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                            {subjectName}
                        </h2>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            color: '#a5b4fc',
                            border: '1px solid rgba(99, 102, 241, 0.3)'
                        }}>
                            {evalConfig.userFacingName || evaluationType}
                        </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '8px' }}>
                        <span>{subjectCode}</span>
                        <span>·</span>
                        <span>{credits} Credits</span>
                    </div>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isSaving ? (
                        <span style={{ color: '#a78bfa', fontWeight: 600 }}>Saving...</span>
                    ) : (
                        <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Auto-saved</span>
                    )}
                </div>
            </div>

            {/* Input Component Groups */}
            <div>
                {Object.entries(components).map(([compKey, compConfig]) => renderInputGroup(compKey, compConfig))}
            </div>
        </div>
    );
};

export default CieRawInputWorkspace;
