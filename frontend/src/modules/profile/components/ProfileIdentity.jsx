import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';

const ProfileIdentity = ({ student, isAnonymous = false }) => {
    const { isDark } = useTheme();
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [student?.profilePicture]);

    if (!student) return null;

    const initials = student.name
        ? student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : student.email?.[0]?.toUpperCase() || '?';

    const getProfilePicUrl = (pic) => {
        if (!pic) return '';
        if (pic.includes('amazonaws.com') && pic.includes('/profiles/')) {
            const key = pic.split('/profiles/')[1];
            return `https://d2mh2rnmjqdkgx.cloudfront.net/profiles/${key}`;
        }
        if (pic.startsWith('http')) return pic;
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${baseUrl}${pic.startsWith('/') ? '' : '/'}${pic}`;
    };

    const nameColor = isDark ? '#FFFFFF' : '#0F172A';
    const usernameStr = student.username
        ? (student.username.startsWith('@') ? student.username : `@${student.username}`)
        : (student.usn ? `@${student.usn.toLowerCase()}` : '@student');

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
            {/* Rounded Avatar Box (Expanded) */}
            <div style={{
                width: '62px',
                height: '62px',
                borderRadius: '8px',
                border: isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(37, 99, 235, 0.25)',
                background: isDark 
                    ? 'rgba(30, 58, 138, 0.25)'
                    : 'rgba(239, 246, 255, 0.9)',
                color: isDark ? '#93C5FD' : '#2563EB',
                fontSize: '18px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
            }}>
                {student.profilePicture && !imgError ? (
                    <img 
                        src={getProfilePicUrl(student.profilePicture)} 
                        alt={student.name} 
                        onError={() => setImgError(true)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                ) : (
                    initials
                )}
            </div>

            {/* Name + Username Row */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
                minWidth: 0,
                flex: 1
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: nameColor,
                        margin: 0,
                        letterSpacing: '-0.015em',
                        lineHeight: '1.25',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {student.name || 'AskUrSenior Student'}
                    </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#EA580C',
                        letterSpacing: '0.01em',
                        whiteSpace: 'nowrap'
                    }}>
                        {usernameStr}
                    </span>
                    {isAnonymous && (
                        <span style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1.5px 6px',
                            borderRadius: '4px',
                            background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                            color: isDark ? '#93C5FD' : '#2563EB',
                            border: isDark ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid #DBEAFE',
                            textTransform: 'uppercase'
                        }}>
                            Demo
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileIdentity;
