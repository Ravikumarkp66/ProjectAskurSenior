import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { basicInformationConfig } from '../config/basicInformation';
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import SectionChangeModal from './SectionChangeModal';

const BasicInformation = ({ student }) => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const [showSectionModal, setShowSectionModal] = useState(false);

    if (!student) return null;

    const getYearOfStudy = (semester) => {
        if (!semester) return '1st Year';
        const year = Math.ceil(semester / 2);
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const val = year % 10;
        const suffix = (val >= 1 && val <= 3 && (year % 100 < 11 || year % 100 > 13)) ? suffixes[val] : suffixes[0];
        return `${year}${suffix} Year`;
    };

    const labelColor = isDark ? '#94A3B8' : '#64748B';
    const valColor = isDark ? '#F1F5F9' : '#0F172A';
    const rowBorder = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.05)';
    const iconColor = isDark ? '#A78BFA' : '#7C3AED';

    const renderValue = (key) => {
        switch (key) {
            case 'usn': {
                const usnVal = student.usn || '';
                const isVerified = !!student.usnVerified;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <span style={{ color: valColor, fontWeight: 600, letterSpacing: '0.02em', fontFamily: 'monospace', fontSize: '12px' }}>
                            {usnVal || 'Not Set'}
                        </span>
                        {usnVal && isVerified ? (
                            <span style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                padding: '1.5px 6px',
                                borderRadius: '4px',
                                background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                color: isDark ? '#34d399' : '#059669',
                                border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)'}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                            }}>
                                <CheckCircle2 size={10} /> Verified
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={() => navigate('/profile/edit/basic')}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    padding: '1.5px 6px',
                                    borderRadius: '4px',
                                    background: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                                    color: isDark ? '#fbbf24' : '#d97706',
                                    border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.2)'}`,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                }}
                            >
                                <AlertCircle size={10} /> {usnVal ? 'Temp' : 'Add'}
                            </button>
                        )}
                    </div>
                );
            }
            case 'college': {
                const collegeVal = typeof student.college === 'object' 
                    ? (student.college?.name || student.collegeName) 
                    : (student.college || student.collegeName || 'Siddaganga Institute of Technology');
                return (
                    <span 
                        style={{ color: valColor, fontWeight: 500, fontSize: '12px', textAlign: 'right', maxWidth: '210px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
                        title={collegeVal}
                    >
                        {collegeVal}
                    </span>
                );
            }
            case 'branch': {
                const branchStr = typeof student.branch === 'object' && student.branch
                    ? (student.branch.shortName || student.branch.name || 'ISE')
                    : (student.branch || 'ISE');
                return (
                    <span style={{ color: valColor, fontWeight: 600, fontSize: '12px' }}>
                        {branchStr}
                    </span>
                );
            }
            case 'section': {
                const secName = (typeof student.academicSection === 'object' && student.academicSection?.name)
                    ? student.academicSection.name
                    : (student.section || (typeof student.academicSection === 'string' && student.academicSection.length <= 2 ? student.academicSection : ''));
                const isLocked = Boolean(student.sectionLocked);
                const displaySecName = secName ? (secName.toLowerCase().startsWith('section') ? secName : `Section ${secName}`) : 'Not Selected';

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <span style={{ color: valColor, fontWeight: 600, fontSize: '12px' }}>
                            {displaySecName}
                        </span>
                        {isLocked ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span title="Section locked" style={{ color: labelColor, display: 'inline-flex', alignItems: 'center' }}>
                                    <Lock size={11} />
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowSectionModal(true)}
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        padding: '1.5px 6px',
                                        borderRadius: '4px',
                                        background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                                        color: isDark ? '#c084fc' : '#7c3aed',
                                        border: `1px solid ${isDark ? 'rgba(192, 132, 252, 0.25)' : 'rgba(124, 58, 237, 0.2)'}`,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Change
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => navigate('/profile/edit/basic')}
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    padding: '1.5px 6px',
                                    borderRadius: '4px',
                                    background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                                    color: isDark ? '#c084fc' : '#7c3aed',
                                    border: `1px solid ${isDark ? 'rgba(192, 132, 252, 0.25)' : 'rgba(124, 58, 237, 0.2)'}`,
                                    cursor: 'pointer'
                                }}
                            >
                                Set
                            </button>
                        )}
                    </div>
                );
            }
            case 'labBatch': {
                const labBatchVal = student.labBatch;
                if (!labBatchVal) return null;
                const isLocked = !!student.labBatchLocked;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <span style={{ color: valColor, fontWeight: 600, fontSize: '12px' }}>
                            Batch {labBatchVal}
                        </span>
                        {isLocked && (
                            <span title="Lab batch locked" style={{ color: labelColor, display: 'inline-flex', alignItems: 'center' }}>
                                <Lock size={11} />
                            </span>
                        )}
                    </div>
                );
            }
            case 'scheme': {
                const schemeName = typeof student.scheme === 'object' && student.scheme
                    ? student.scheme.name
                    : (student.scheme || '2022');
                return (
                    <span style={{ color: valColor, fontWeight: 500, fontSize: '12px' }}>
                        {schemeName} Scheme
                    </span>
                );
            }
            case 'yearOfStudy': {
                const sem = student.semester || 1;
                const yearLabel = getYearOfStudy(sem);
                return (
                    <span style={{ color: valColor, fontWeight: 500, fontSize: '12px' }}>
                        {yearLabel} · Sem {sem}
                    </span>
                );
            }
            case 'graduationYear':
                return (
                    <span style={{ color: valColor, fontWeight: 500, fontSize: '12px' }}>
                        {student.graduationYear || '2027'}
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            <h3 style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: labelColor,
                margin: '0 0 2px 0'
            }}>
                Basic Information
            </h3>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
            }}>
                {basicInformationConfig.map((item) => {
                    const valueEl = renderValue(item.key);
                    if (!valueEl) return null;
                    const Icon = item.icon;
                    
                    return (
                        <div 
                            key={item.key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                minHeight: '30px',
                                padding: '4px 0',
                                borderBottom: `1px solid ${rowBorder}`,
                                boxSizing: 'border-box',
                                minWidth: 0
                            }}
                        >
                            {/* Label column (CSES key) */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                width: '105px',
                                flexShrink: 0
                            }}>
                                <Icon size={13} color={iconColor} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                                <span style={{
                                    fontSize: '12px',
                                    color: labelColor,
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {item.label}
                                </span>
                            </div>

                            {/* Value column (CSES value) */}
                            <div style={{
                                minWidth: 0,
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end'
                            }}>
                                {valueEl}
                            </div>
                        </div>
                    );
                })}
            </div>

            <SectionChangeModal
                isOpen={showSectionModal}
                onClose={() => setShowSectionModal(false)}
                student={student}
                onSubmitted={() => {
                    setShowSectionModal(false);
                }}
            />
        </div>
    );
};

export default BasicInformation;
