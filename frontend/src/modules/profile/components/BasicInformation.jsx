import React from 'react';
import { basicInformationConfig } from '../config/basicInformation';

const BasicInformation = ({ student }) => {
    if (!student) return null;

    const getYearOfStudy = (semester) => {
        if (!semester) return '1st Year';
        const year = Math.ceil(semester / 2);
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const val = year % 10;
        const suffix = (val >= 1 && val <= 3 && (year % 100 < 11 || year % 100 > 13)) ? suffixes[val] : suffixes[0];
        return `${year}${suffix} Year`;
    };

    const renderRowContent = (key) => {
        switch (key) {
            case 'usn': {
                const usnVal = student.usn || 'N/A';
                return (
                    <span style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
                        USN: <span style={{ color: '#f8fafc', fontWeight: 600, letterSpacing: '0.03em' }}>{usnVal}</span>
                    </span>
                );
            }
            case 'college': {
                const collegeVal = typeof student.college === 'object' 
                    ? (student.college?.name || student.collegeName) 
                    : (student.college || student.collegeName || 'Siddaganga Institute of Technology');
                return (
                    <span style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
                        College: <span style={{ color: '#f8fafc', fontWeight: 500 }}>{collegeVal}</span>
                    </span>
                );
            }
            case 'branch': {
                let branchStr = 'Information Science and Engineering (ISE)';
                if (typeof student.branch === 'object' && student.branch) {
                    if (student.branch.name && student.branch.shortName) {
                        branchStr = `${student.branch.name} (${student.branch.shortName})`;
                    } else {
                        branchStr = student.branch.name || student.branch.shortName || branchStr;
                    }
                } else if (typeof student.branch === 'string' && student.branch.trim()) {
                    branchStr = student.branch;
                }
                return (
                    <span style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
                        Branch: <span style={{ color: '#f8fafc', fontWeight: 500 }}>{branchStr}</span>
                    </span>
                );
            }
            case 'scheme': {
                const schemeName = typeof student.scheme === 'object' && student.scheme
                    ? student.scheme.name
                    : (student.scheme || '2022');
                return (
                    <span style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
                        Scheme: <span style={{ color: '#f8fafc', fontWeight: 500 }}>{schemeName} Scheme</span>
                    </span>
                );
            }
            case 'yearOfStudy': {
                const sem = student.semester || 1;
                const yearLabel = getYearOfStudy(sem);
                return (
                    <span style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
                        Year & Sem: <span style={{ color: '#f8fafc', fontWeight: 500 }}>{yearLabel} · Semester {sem}</span>
                    </span>
                );
            }
            case 'graduationYear':
                return (
                    <span style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>
                        Expected Graduation: <span style={{ color: '#f8fafc', fontWeight: 500 }}>{student.graduationYear || '2027'}</span>
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
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            <h3 style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#94a3b8',
                margin: '0 0 4px 0'
            }}>
                Basic Information
            </h3>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                paddingLeft: '2px'
            }}>
                {basicInformationConfig.map((item) => {
                    const Icon = item.icon;
                    
                    return (
                        <div 
                            key={item.key}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                minHeight: '32px',
                                padding: '3px 0',
                                boxSizing: 'border-box',
                                minWidth: 0
                            }}
                        >
                            {/* Icon wrapper */}
                            <div style={{
                                color: '#a78bfa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                paddingTop: '2px'
                            }}>
                                <Icon size={14} strokeWidth={2.2} />
                            </div>

                            {/* Value Display */}
                            <div style={{
                                minWidth: 0,
                                flex: 1
                            }}>
                                {renderRowContent(item.key)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default BasicInformation;
