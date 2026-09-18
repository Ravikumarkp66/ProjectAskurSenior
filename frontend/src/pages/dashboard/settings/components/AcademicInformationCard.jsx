import React, { useEffect, useState } from 'react';
import { lookupAPI } from '../../../../services/api';
import { Lock, Building, Calendar, Award } from 'lucide-react';

const AcademicInformationCard = ({ formData = {} }) => {
    const [schemes, setSchemes] = useState([]);

    useEffect(() => {
        const loadSchemes = async () => {
            try {
                const res = await lookupAPI.getSchemes();
                setSchemes(res.data || []);
            } catch (err) {
                console.error('[AcademicInformationCard] Error loading schemes:', err);
            }
        };
        loadSchemes();
    }, []);

    // Resolve scheme name
    const schemeObj = schemes.find(s => s._id === formData.scheme || s.id === formData.scheme || s.name === formData.scheme);
    const schemeName = schemeObj ? `${schemeObj.name} Scheme` : (formData.scheme ? `${formData.scheme} Scheme` : '2022 Scheme');

    const collegeName = formData.college || 'Siddaganga Institute of Technology';
    const graduationYear = formData.graduationYear || '2027';

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: 0 }}>
                    Academic Information
                </h3>
                <span style={{ fontSize: '11.5px', color: 'rgba(148, 163, 184, 0.65)' }}>
                    Authoritative institutional records managed by college administration (read-only).
                </span>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px'
            }} className="academic-info-grid">
                
                {/* College (Read-only / Locked) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.85)', margin: 0 }}>
                            College
                        </label>
                        <span title="College record is locked" style={{ color: 'rgba(148, 163, 184, 0.5)', display: 'flex', alignItems: 'center' }}>
                            <Lock size={12} />
                        </span>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            value={collegeName}
                            readOnly
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                background: 'rgba(255, 255, 255, 0.02)',
                                color: 'rgba(255, 255, 255, 0.65)',
                                cursor: 'not-allowed',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Scheme (Read-only / Locked) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.85)', margin: 0 }}>
                            Scheme
                        </label>
                        <span title="Academic scheme is locked" style={{ color: 'rgba(148, 163, 184, 0.5)', display: 'flex', alignItems: 'center' }}>
                            <Lock size={12} />
                        </span>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            value={schemeName}
                            readOnly
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                background: 'rgba(255, 255, 255, 0.02)',
                                color: 'rgba(255, 255, 255, 0.65)',
                                cursor: 'not-allowed',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Graduation Year (Read-only / Locked) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(148, 163, 184, 0.85)', margin: 0 }}>
                            Graduation Year
                        </label>
                        <span title="Graduation year is locked" style={{ color: 'rgba(148, 163, 184, 0.5)', display: 'flex', alignItems: 'center' }}>
                            <Lock size={12} />
                        </span>
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            value={graduationYear}
                            readOnly
                            style={{
                                width: '100%',
                                padding: '9px 12px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                background: 'rgba(255, 255, 255, 0.02)',
                                color: 'rgba(255, 255, 255, 0.65)',
                                cursor: 'not-allowed',
                                fontSize: '13px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @media (max-width: 768px) {
                    .academic-info-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}} />
        </div>
    );
};

export default AcademicInformationCard;
