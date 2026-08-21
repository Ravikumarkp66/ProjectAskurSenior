import React, { useState, useEffect } from 'react';

const ProfileIdentity = ({ student }) => {
    if (!student) return null;

    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setImgError(false);
    }, [student.profilePicture]);

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
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${pic}`;
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* Rounded Square Avatar */}
            <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '10px',
                border: '1.5px solid rgba(139, 92, 246, 0.3)',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(99, 102, 241, 0.15))',
                color: '#c4b5fd',
                fontSize: '16px',
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

            {/* Name + Orange Username */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
            }}>
                <h2 style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#fff',
                    margin: 0,
                    letterSpacing: '-0.01em',
                    lineHeight: '1.2'
                }}>
                    {student.name}
                </h2>
                <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#f97316', // Orange theme highlight from the screenshot
                    letterSpacing: '0.01em'
                }}>
                    {student.username || student.usn || 'mr_kp66'}
                </span>
            </div>
        </div>
    );
};

export default ProfileIdentity;
