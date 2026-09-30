import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { basicInformationConfig } from '../config/basicInformation';
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import SectionChangeModal from './SectionChangeModal';

const BasicInformation = ({ student, isAnonymous = false }) => {
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

    const labelColor = isDark ? '#A1A1AA' : '#6B7280';
    const valColor = isDark ? '#F3F4F6' : '#111827';
    const rowBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)';
    const iconColor = isDark ? '#60A5FA' : '#2563EB';

    const handleEditAction = () => {
        if (isAnonymous) {
            navigate('/login', { state: { from: '/profile/edit/basic' } });
        } else {
            navigate('/profile/edit/basic');
        }
    };

    const renderValue = (key) => {
        switch (key) {
            case 'usn': {
                const usnVal = student.usn || '';
                const isVerified = Boolean(student.usnVerified);

                if (isAnonymous) {
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                            <span style={{ color: valColor, fontWeight: 600, letterSpacing: '0.02em', fontFamily: 'monospace', fontSize: '13px' }}>
                                {usnVal || '1SI23IS000'}
                            </span>
                            <span style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                                color: isDark ? '#93C5FD' : '#2563EB',
                                border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #DBEAFE'
                            }}>
                                Demo
                            </span>
                        </div>
                    );
                }

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <span style={{ color: valColor, fontWeight: 600, letterSpacing: '0.02em', fontFamily: 'monospace', fontSize: '13px' }}>
                            {usnVal || 'Not Set'}
                        </span>
                        {usnVal && isVerified ? (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                color: isDark ? '#34d399' : '#059669',
                                border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)'}`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <CheckCircle2 size={11} /> Verified
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleEditAction}
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    background: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                                    color: isDark ? '#fbbf24' : '#d97706',
                                    border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.2)'}`,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                <AlertCircle size={11} /> {usnVal ? 'Temp' : 'Add'}
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
                        style={{ color: valColor, fontWeight: 500, fontSize: '13px', textAlign: 'right', maxWidth: '230px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} 
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
                    <span style={{ color: valColor, fontWeight: 600, fontSize: '13px' }}>
                        {branchStr}
                    </span>
                );
            }
            case 'section': {
                const secName = (typeof student.academicSection === 'object' && student.academicSection?.name)
                    ? student.academicSection.name
                    : (student.section || (typeof student.academicSection === 'string' && student.academicSection.length <= 2 ? student.academicSection : ''));
                const isLocked = Boolean(student.sectionLocked);
                const displaySecName = secName ? (secName.toLowerCase().startsWith('section') ? secName : `Section ${secName}`) : (isAnonymous ? 'Section A' : 'Not Selected');

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <span style={{ color: valColor, fontWeight: 600, fontSize: '13px' }}>
                            {displaySecName}
                        </span>
                        {!isAnonymous && (
                            isLocked ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span title="Section locked" style={{ color: labelColor, display: 'inline-flex', alignItems: 'center' }}>
                                        <Lock size={12} />
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setShowSectionModal(true)}
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            padding: '2px 7px',
                                            borderRadius: '4px',
                                            background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                                            color: isDark ? '#93C5FD' : '#2563EB',
                                            border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.25)' : '#DBEAFE'}`,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleEditAction}
                                    style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        padding: '2px 7px',
                                        borderRadius: '4px',
                                        background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                                        color: isDark ? '#93C5FD' : '#2563EB',
                                        border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.25)' : '#DBEAFE'}`,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Set
                                </button>
                            )
                        )}
                    </div>
                );
            }
            case 'labBatch': {
                const labBatchVal = student.labBatch || (isAnonymous ? '1' : null);
                if (!labBatchVal) return null;
                const isLocked = Boolean(student.labBatchLocked);

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                        <span style={{ color: valColor, fontWeight: 600, fontSize: '13px' }}>
                            Batch {labBatchVal}
                        </span>
                        {isLocked && (
                            <span title="Lab batch locked" style={{ color: labelColor, display: 'inline-flex', alignItems: 'center' }}>
                                <Lock size={12} />
                            </span>
                        )}
                    </div>
                );
            }
            case 'scheme': {
                const schemeName = typeof student.scheme === 'object' && student.scheme
                    ? student.scheme.name
                    : (student.scheme || (isAnonymous ? '2022' : '2022'));
                return (
                    <span style={{ color: valColor, fontWeight: 500, fontSize: '13px' }}>
                        {schemeName} Scheme
                    </span>
                );
            }
            case 'yearOfStudy': {
                const sem = student.semester || (isAnonymous ? 4 : 1);
                const yearLabel = getYearOfStudy(sem);
                return (
                    <span style={{ color: valColor, fontWeight: 500, fontSize: '13px' }}>
                        {yearLabel} · Sem {sem}
                    </span>
                );
            }
            case 'graduationYear':
                return (
                    <span style={{ color: valColor, fontWeight: 500, fontSize: '13px' }}>
                        {student.graduationYear || (isAnonymous ? '2027' : '2027')}
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
            gap: '8px',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            <h3 style={{
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: labelColor,
                margin: '0 0 4px 0'
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
                                gap: '12px',
                                minHeight: '38px',
                                padding: '6px 0',
                                borderBottom: `1px solid ${rowBorder}`,
                                boxSizing: 'border-box',
                                minWidth: 0
                            }}
                        >
                            {/* Label column */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '135px',
                                flexShrink: 0
                            }}>
                                <Icon size={15} color={iconColor} strokeWidth={2} style={{ flexShrink: 0 }} />
                                <span style={{
                                    fontSize: '13px',
                                    color: labelColor,
                                    fontWeight: 500,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {item.label}
                                </span>
                            </div>

                            {/* Value column */}
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

            {!isAnonymous && (
                <SectionChangeModal
                    isOpen={showSectionModal}
                    onClose={() => setShowSectionModal(false)}
                    student={student}
                    onSubmitted={() => {
                        setShowSectionModal(false);
                    }}
                />
            )}
        </div>
    );
};

export default BasicInformation;
