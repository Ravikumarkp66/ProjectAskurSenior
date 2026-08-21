import React from 'react';

const UserProfileCard = ({ user, isCollapsed }) => {
    const initials = (user?.usn || 'U')[0].toUpperCase();
    
    if (isCollapsed) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '6px 0',
                width: '100%',
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                    boxShadow: '0 0 10px rgba(139,92,246,0.15)',
                }} title={user?.usn || 'Student'}>
                    {initials}
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
                boxShadow: '0 0 10px rgba(139,92,246,0.15)',
            }}>
                {initials}
            </div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.usn || 'Student'}
                </div>
            </div>
        </div>
    );
};

export default UserProfileCard;
