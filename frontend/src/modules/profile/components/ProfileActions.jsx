import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Share2 } from 'lucide-react';

const ProfileActions = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* Edit Profile Button (Placeholder) */}
            <button 
                onClick={() => navigate('/profile/edit/basic')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    color: '#94a3b8',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.color = '#94a3b8';
                }}
            >
                <Edit2 size={11} />
                Edit Profile
            </button>

            {/* Share Profile Button (Placeholder) */}
            <button 
                onClick={() => {}}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    color: '#94a3b8',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.color = '#94a3b8';
                }}
            >
                <Share2 size={11} />
                Share Profile
            </button>
        </div>
    );
};

export default ProfileActions;
