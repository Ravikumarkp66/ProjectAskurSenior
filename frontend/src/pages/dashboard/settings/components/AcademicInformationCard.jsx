import React, { useEffect, useState, useRef } from 'react';
import { branchAPI, lookupAPI } from '../../../../services/api';

const AcademicInformationCard = ({ formData, onChange }) => {
    const [branches, setBranches] = useState([]);
    const [schemes, setSchemes] = useState([]);
    const [schemeTooltip, setSchemeTooltip] = useState(false);
    const [usnEditing, setUsnEditing] = useState(false);

    useEffect(() => {
        const loadAcademicLookups = async () => {
            try {
                const [bRes, sRes] = await Promise.all([
                    branchAPI.getPublic(),
                    lookupAPI.getSchemes()
                ]);
                // Exclude branch containing "common"
                const filteredBranches = (bRes.data || []).filter(
                    b => !b.name?.toLowerCase().includes('common')
                );
                // Keep only "2022" or "2025" schemes
                const filteredSchemes = (sRes.data || []).filter(
                    s => s.name === '2022' || s.name === '2025'
                );
                setBranches(filteredBranches);
                setSchemes(filteredSchemes);
            } catch (err) {
                console.error('[AcademicInformationCard] Failed to load lookup options:', err);
            }
        };
        loadAcademicLookups();
    }, []);

    // Generate expected graduation years (admissionYear + 3 to admissionYear + 6)
    const admissionYear = formData.admissionYear || new Date().getFullYear() - 3;
    const graduationYears = Array.from({ length: 5 }, (_, i) => admissionYear + 3 + i);

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxSizing: 'border-box'
        }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '0 0 -4px 0' }}>
                Academic Information
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
            }} className="academic-info-grid">
                
                {/* College (Read-only) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="college" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                        College
                    </label>
                    <input
                        type="text"
                        id="college"
                        name="college"
                        value={formData.college || 'Siddaganga Institute of Technology'}
                        readOnly
                        style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.02)',
                            color: 'rgba(255,255,255,0.45)',
                            cursor: 'not-allowed',
                            fontSize: '13px',
                            outline: 'none'
                        }}
                    />
                </div>

                {/* USN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label htmlFor="usn" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)', margin: 0 }}>
                            USN
                        </label>
                        <button
                            type="button"
                            onClick={() => setUsnEditing(prev => !prev)}
                            style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: usnEditing ? 'rgba(248,113,113,0.85)' : '#a78bfa',
                                background: usnEditing ? 'rgba(248,113,113,0.08)' : 'rgba(139,92,246,0.08)',
                                border: `1px solid ${usnEditing ? 'rgba(248,113,113,0.25)' : 'rgba(139,92,246,0.25)'}`,
                                borderRadius: '5px',
                                padding: '2px 9px',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                outline: 'none'
                            }}
                        >
                            {usnEditing ? '✕ Cancel' : '✏ Edit'}
                        </button>
                    </div>
                    <input
                        type="text"
                        id="usn"
                        name="usn"
                        value={formData.usn || ''}
                        readOnly={!usnEditing}
                        onChange={usnEditing ? onChange : undefined}
                        style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: usnEditing
                                ? '1px solid rgba(139,92,246,0.5)'
                                : '1px solid rgba(255,255,255,0.08)',
                            background: usnEditing
                                ? 'rgba(139,92,246,0.05)'
                                : 'rgba(255,255,255,0.02)',
                            color: usnEditing ? '#fff' : 'rgba(255,255,255,0.45)',
                            cursor: usnEditing ? 'text' : 'not-allowed',
                            fontSize: '13px',
                            outline: 'none',
                            textTransform: 'uppercase',
                            letterSpacing: usnEditing ? '0.08em' : 'normal',
                            transition: 'all 0.2s'
                        }}
                    />
                    {usnEditing && (
                        <p style={{ fontSize: '11px', color: 'rgba(167,139,250,0.7)', margin: '2px 0 0 0' }}>
                            ⚠ USN is permanent. Enter carefully — changes are saved with your profile.
                        </p>
                    )}
                </div>

                {/* Branch (Select Dropdown) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="branch" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                        Branch *
                    </label>
                    <select
                        id="branch"
                        name="branch"
                        value={formData.branch || ''}
                        onChange={onChange}
                        required
                        style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(19,18,26,0.95)',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s'
                        }}
                        onFocus={e => {
                            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                        }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        }}
                    >
                        <option value="" disabled>Select Branch</option>
                        {branches.map(b => (
                            <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                {/* Scheme (Select Dropdown) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label htmlFor="scheme" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)', margin: 0 }}>
                            Scheme *
                        </label>
                        {/* Info tooltip button */}
                        <div style={{ position: 'relative', display: 'inline-flex' }}>
                            <button
                                type="button"
                                onMouseEnter={() => setSchemeTooltip(true)}
                                onMouseLeave={() => setSchemeTooltip(false)}
                                onFocus={() => setSchemeTooltip(true)}
                                onBlur={() => setSchemeTooltip(false)}
                                style={{
                                    width: '15px',
                                    height: '15px',
                                    borderRadius: '50%',
                                    border: '1.5px solid rgba(139, 92, 246, 0.5)',
                                    background: 'rgba(139, 92, 246, 0.08)',
                                    color: '#a78bfa',
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    outline: 'none',
                                    transition: 'background 0.15s, border-color 0.15s',
                                    flexShrink: 0
                                }}
                                onMouseEnterCapture={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.18)'; }}
                            >
                                i
                            </button>
                            {schemeTooltip && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '22px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#1E1B2E',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    zIndex: 50,
                                    width: '220px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                    pointerEvents: 'none'
                                }}>
                                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#c4b5fd', marginBottom: '8px' }}>
                                        Which scheme should I select?
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>2022 Scheme</span>
                                            <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.75)', background: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: '4px' }}>Joined 2022 – 2024</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>2025 Scheme</span>
                                            <span style={{ fontSize: '11px', color: 'rgba(148,163,184,0.75)', background: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: '4px' }}>Joined 2025+</span>
                                        </div>
                                    </div>
                                    {/* Arrow */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '-5px',
                                        left: '50%',
                                        transform: 'translateX(-50%) rotate(45deg)',
                                        width: '8px',
                                        height: '8px',
                                        background: '#1E1B2E',
                                        borderRight: '1px solid rgba(139,92,246,0.3)',
                                        borderBottom: '1px solid rgba(139,92,246,0.3)'
                                    }} />
                                </div>
                            )}
                        </div>
                    </div>
                    <select
                        id="scheme"
                        name="scheme"
                        value={formData.scheme || ''}
                        onChange={onChange}
                        required
                        style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(19,18,26,0.95)',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s'
                        }}
                        onFocus={e => {
                            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                        }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        }}
                    >
                        <option value="" disabled>Select Scheme</option>
                        {schemes.map(s => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {/* Current Semester (Select Dropdown) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="semester" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                        Current Semester *
                    </label>
                    <select
                        id="semester"
                        name="semester"
                        value={formData.semester || ''}
                        onChange={onChange}
                        required
                        style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(19,18,26,0.95)',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s'
                        }}
                        onFocus={e => {
                            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                        }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        }}
                    >
                        <option value="" disabled>Select Semester</option>
                        {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                        ))}
                    </select>
                </div>

                {/* Expected Graduation Year (Dropdown) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label htmlFor="graduationYear" style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.8)' }}>
                        Expected Graduation *
                    </label>
                    <select
                        id="graduationYear"
                        name="graduationYear"
                        value={formData.graduationYear || ''}
                        onChange={onChange}
                        required
                        style={{
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(19,18,26,0.95)',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s'
                        }}
                        onFocus={e => {
                            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)';
                        }}
                        onBlur={e => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        }}
                    >
                        {graduationYears.map(yr => (
                            <option key={yr} value={yr}>{yr}</option>
                        ))}
                    </select>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 576px) {
                    .academic-info-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}} />
        </div>
    );
};

export default AcademicInformationCard;
