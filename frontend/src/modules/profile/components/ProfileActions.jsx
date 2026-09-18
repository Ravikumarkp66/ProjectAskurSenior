import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Share2 } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const ProfileActions = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'AskUrSenior Student Profile',
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard?.writeText(window.location.href);
            alert('Profile link copied to clipboard!');
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif"
        }}>
            {/* Edit Profile Button */}
            <button 
                onClick={() => navigate('/profile/edit/basic')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: isDark ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid rgba(139, 92, 246, 0.25)',
                    background: isDark ? 'rgba(124, 58, 237, 0.18)' : 'rgba(124, 58, 237, 0.06)',
                    color: isDark ? '#DDD6FE' : '#6D28D9',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(124, 58, 237, 0.28)' : 'rgba(124, 58, 237, 0.12)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(124, 58, 237, 0.18)' : 'rgba(124, 58, 237, 0.06)';
                }}
            >
                <Edit2 size={11} />
                Edit Profile
            </button>

            {/* Share Profile Button */}
            <button 
                onClick={handleShare}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    flex: 1,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.10)',
                    background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                    color: isDark ? '#CBD5E1' : '#334155',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9';
                    e.currentTarget.style.color = isDark ? '#FFFFFF' : '#0F172A';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC';
                    e.currentTarget.style.color = isDark ? '#CBD5E1' : '#334155';
                }}
            >
                <Share2 size={11} />
                Share
            </button>
        </div>
    );
};

export default ProfileActions;
